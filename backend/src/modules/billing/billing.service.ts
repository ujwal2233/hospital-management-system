import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { AppointmentStatus, InvoiceStatus } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { paginate, Paginated } from '../../common/utils/pagination';
import { requireTenant, tenantFilter } from '../../common/utils/tenant';
import { Appointment, AppointmentDocument } from '../appointments/schemas/appointment.schema';
import { AppointmentsService } from '../appointments/appointments.service';
import { CountersService } from '../counters/counters.service';
import { Doctor, DoctorDocument } from '../doctors/schemas/doctor.schema';
import { PatientsService } from '../patients/patients.service';
import { DispensingRecord, DispensingRecordDocument } from '../pharmacy/schemas/dispensing-record.schema';
import { AddPaymentDto } from './dto/add-payment.dto';
import { CreateInvoiceDto, InvoiceItemDto } from './dto/create-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { computeTotals, deriveStatus } from './invoice.util';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Invoice.name) private readonly model: Model<InvoiceDocument>,
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<DoctorDocument>,
    @InjectModel(DispensingRecord.name) private readonly dispensingModel: Model<DispensingRecordDocument>,
    private readonly patientsService: PatientsService,
    private readonly appointmentsService: AppointmentsService,
    private readonly countersService: CountersService,
  ) {}

  async create(user: AuthUser, dto: CreateInvoiceDto): Promise<Invoice> {
    const tenantId = requireTenant(user);
    await this.patientsService.findOne(user, dto.patientId);
    if (dto.appointmentId) {
      await this.appointmentsService.findOne(user, dto.appointmentId);
    }

    const bundle = await this.buildInvoiceBundle(user, dto);
    const totals = this.safeTotals(bundle.items, dto.taxRate ?? 0, dto.discount ?? 0);
    const sequence = await this.countersService.next(tenantId.toString(), 'invoice');
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(sequence).padStart(6, '0')}`;

    const invoice = await this.model.create({
      ...totals,
      tenantId,
      invoiceNumber,
      patientId: new Types.ObjectId(dto.patientId),
      appointmentId: bundle.appointmentIds.length === 1 ? bundle.appointmentIds[0] : null,
      appointmentIds: bundle.appointmentIds,
      dispensingRecordIds: bundle.dispensingRecordIds,
      amountPaid: 0,
      status: InvoiceStatus.ISSUED,
      notes: dto.notes,
    });

    await Promise.all([
      bundle.appointmentIds.length
        ? this.appointmentModel.updateMany(
            { _id: { $in: bundle.appointmentIds } },
            { $set: { invoiceId: invoice._id } },
          ).exec()
        : Promise.resolve(),
      bundle.dispensingRecordIds.length
        ? this.dispensingModel.updateMany(
            { _id: { $in: bundle.dispensingRecordIds } },
            { $set: { invoiceId: invoice._id } },
          ).exec()
        : Promise.resolve(),
    ]);

    return invoice;
  }

  findAll(user: AuthUser, query: QueryInvoiceDto): Promise<Paginated<Invoice>> {
    const filter: FilterQuery<InvoiceDocument> = { ...tenantFilter(user) };
    if (query.patientId) filter.patientId = new Types.ObjectId(query.patientId);
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { invoiceNumber: { $regex: query.search, $options: 'i' } },
        { notes: { $regex: query.search, $options: 'i' } },
      ];
    }
    return paginate(this.model, filter, query, {
      populate: [
        { path: 'patientId', select: 'firstName lastName mrn phone' },
        { path: 'appointmentId', select: 'scheduledAt status' },
      ],
    });
  }

  async findOne(user: AuthUser, id: string): Promise<Invoice> {
    const invoice = await this.model
      .findOne({ _id: new Types.ObjectId(id), ...tenantFilter(user) })
      .populate([
        { path: 'patientId', select: 'firstName lastName mrn phone email' },
        { path: 'appointmentId', select: 'scheduledAt status doctorId' },
        { path: 'payments.receivedBy', select: 'firstName lastName email' },
      ])
      .lean()
      .exec();
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async addPayment(user: AuthUser, id: string, dto: AddPaymentDto): Promise<Invoice> {
    const invoice = await this.getOwned(user, id);
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cancelled invoices cannot receive payments');
    }
    const paidCents = Math.round(invoice.amountPaid * 100);
    const totalCents = Math.round(invoice.total * 100);
    if (invoice.status === InvoiceStatus.PAID || paidCents >= totalCents) {
      throw new BadRequestException('Invoice is already fully paid and cannot accept further payments');
    }
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }
    const dtoCents = Math.round(dto.amount * 100);
    const remainingCents = totalCents - paidCents;
    if (dtoCents > remainingCents) {
      const remainingBalance = remainingCents / 100;
      throw new BadRequestException(`Payment amount (Rs ${dto.amount}) exceeds outstanding invoice balance (Rs ${remainingBalance})`);
    }

    const nextPaid = Math.round((paidCents + dtoCents)) / 100;
    invoice.payments.push({
      amount: dto.amount,
      method: dto.method,
      reference: dto.reference,
      paidAt: new Date(),
      receivedBy: new Types.ObjectId(user.userId),
    });
    invoice.amountPaid = nextPaid;
    invoice.status = deriveStatus(invoice.total, nextPaid);
    await invoice.save();
    return invoice.toObject();
  }

  async cancel(user: AuthUser, id: string): Promise<Invoice> {
    const invoice = await this.getOwned(user, id);
    if (invoice.amountPaid > 0) {
      throw new BadRequestException('Paid invoices cannot be cancelled');
    }
    invoice.status = InvoiceStatus.CANCELLED;
    await invoice.save();
    await Promise.all([
      invoice.appointmentIds?.length
        ? this.appointmentModel.updateMany(
            { _id: { $in: invoice.appointmentIds } },
            { $set: { invoiceId: null } },
          ).exec()
        : Promise.resolve(),
      invoice.dispensingRecordIds?.length
        ? this.dispensingModel.updateMany(
            { _id: { $in: invoice.dispensingRecordIds } },
            { $set: { invoiceId: null } },
          ).exec()
        : Promise.resolve(),
    ]);
    return invoice.toObject();
  }

  private async getOwned(user: AuthUser, id: string): Promise<InvoiceDocument> {
    const invoice = await this.model
      .findOne({ _id: new Types.ObjectId(id), ...tenantFilter(user) })
      .exec();
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  private async buildInvoiceBundle(user: AuthUser, dto: CreateInvoiceDto): Promise<{
    items: InvoiceItemDto[];
    appointmentIds: Types.ObjectId[];
    dispensingRecordIds: Types.ObjectId[];
  }> {
    if (dto.items?.length) {
      return {
        items: dto.items,
        appointmentIds: [],
        dispensingRecordIds: [],
      };
    }

    const patientObjectId = new Types.ObjectId(dto.patientId);
    const appointmentFilter: FilterQuery<AppointmentDocument> = {
      ...tenantFilter(user),
      patientId: patientObjectId,
      invoiceId: null,
      status: { $in: [AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED] },
    };
    if (dto.appointmentId) {
      appointmentFilter._id = new Types.ObjectId(dto.appointmentId);
    }

    const [appointments, dispensingRecords] = await Promise.all([
      this.appointmentModel
        .find(appointmentFilter)
        .sort({ scheduledAt: 1 })
        .lean()
        .exec(),
      this.dispensingModel
        .find({ ...tenantFilter(user), patientId: patientObjectId, invoiceId: null })
        .sort({ createdAt: 1 })
        .populate('items.itemId', 'name unit')
        .lean()
        .exec(),
    ]);

    const doctorIds = Array.from(new Set(appointments.map((appointment) => appointment.doctorId.toString())));
    const doctors = doctorIds.length
      ? await this.doctorModel.find({ _id: { $in: doctorIds } }).lean().exec()
      : [];
    const doctorsById = new Map(doctors.map((doctor) => [doctor._id.toString(), doctor]));

    const consultationItems = appointments.map((appointment) => {
      const doctor = doctorsById.get(appointment.doctorId.toString());
      return {
        description: doctor ? `Consultation Fee - ${doctor.name}` : 'Consultation Fee',
        quantity: 1,
        unitPrice: doctor?.consultationFee ?? 0,
      };
    });

    const medicineItems = dispensingRecords.flatMap((record) =>
      record.items.map((item) => {
        const catalogItem = item.itemId as { name?: string; unit?: string } | undefined;
        const name = catalogItem?.name ?? 'Dispensed Medicine';
        const unitSuffix = catalogItem?.unit ? ` / ${catalogItem.unit}` : '';
        return {
          description: `Medicine - ${name}${unitSuffix}`,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        };
      }),
    );

    const items = [...consultationItems, ...medicineItems];
    if (!items.length) {
      throw new BadRequestException('No pending consultation or medicine charges found for this patient');
    }

    return {
      items,
      appointmentIds: appointments.map((appointment) => appointment._id),
      dispensingRecordIds: dispensingRecords.map((record) => record._id),
    };
  }

  private safeTotals(items: InvoiceItemDto[], taxRate: number, discount: number) {
    try {
      return computeTotals(items, taxRate, discount);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
  }
}
