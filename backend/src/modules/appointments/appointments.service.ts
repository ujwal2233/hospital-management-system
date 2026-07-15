import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { AppointmentStatus } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { paginate, Paginated } from '../../common/utils/pagination';
import { requireTenant, tenantFilter } from '../../common/utils/tenant';
import { CountersService } from '../counters/counters.service';
import { Doctor } from '../doctors/schemas/doctor.schema';
import { DoctorsService } from '../doctors/doctors.service';
import { PatientsService } from '../patients/patients.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { UpdateAppointmentDto, UpdateAppointmentStatusDto } from './dto/update-appointment.dto';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';

/** Allowed status transitions (BR: enforce appointment lifecycle). */
const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.SCHEDULED]: [
    AppointmentStatus.POSTPONED,
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.POSTPONED]: [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.CHECKED_IN]: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED],
  [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

const ACTIVE_STATUSES = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.POSTPONED,
  AppointmentStatus.CHECKED_IN,
  AppointmentStatus.IN_PROGRESS,
];

/** Populate options reused across read methods. */
const POPULATE_OPTIONS = [
  { path: 'patientId', select: 'firstName lastName mrn phone allergies' },
  { path: 'doctorId', select: 'name specialization consultationFee' },
  { path: 'departmentId', select: 'name code' },
];

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private readonly model: Model<AppointmentDocument>,
    private readonly patientsService: PatientsService,
    private readonly doctorsService: DoctorsService,
    private readonly countersService: CountersService,
  ) {}

  async create(user: AuthUser, dto: CreateAppointmentDto): Promise<Appointment> {
    const tenantId = requireTenant(user);
    const [, doctor] = await Promise.all([
      this.patientsService.findOne(user, dto.patientId),
      this.doctorsService.findOne(user, dto.doctorId),
    ]);

    const scheduledAt = dto.scheduledAt;
    // BR-1: allow a 60-second grace window so bookings right at "now" don't fail.
    if (scheduledAt.getTime() < Date.now() - 60_000) {
      throw new BadRequestException('Appointments cannot be booked in the past');
    }
    const durationMinutes = dto.durationMinutes ?? 15;
    const endsAt = new Date(scheduledAt.getTime() + durationMinutes * 60_000);

    await this.assertNoConflict(tenantId, dto.doctorId, scheduledAt, endsAt);

    const created = await this.model.create({
      tenantId,
      patientId: new Types.ObjectId(dto.patientId),
      doctorId: new Types.ObjectId(dto.doctorId),
      departmentId: (doctor as Doctor & { departmentId: { _id?: Types.ObjectId } }).departmentId?._id ?? null,
      scheduledAt,
      durationMinutes,
      endsAt,
      type: dto.type,
      reason: dto.reason,
    });

    // Return populated so frontend receives names immediately after booking.
    return (await this.model
      .findById(created._id)
      .populate(POPULATE_OPTIONS)
      .lean()
      .exec()) as Appointment;
  }

  findAll(user: AuthUser, query: QueryAppointmentDto): Promise<Paginated<Appointment>> {
    const filter: FilterQuery<AppointmentDocument> = { ...tenantFilter(user) };
    if (query.doctorId) filter.doctorId = new Types.ObjectId(query.doctorId);
    if (query.patientId) filter.patientId = new Types.ObjectId(query.patientId);
    if (query.status) filter.status = query.status;
    if (query.date) {
      const start = new Date(`${query.date}T00:00:00`);
      const end = new Date(start.getTime() + 24 * 60 * 60_000);
      filter.scheduledAt = { $gte: start, $lt: end };
    }
    return paginate(this.model, filter, query, {
      sort: { scheduledAt: 1 },
      populate: [
        { path: 'patientId', select: 'firstName lastName mrn phone' },
        { path: 'doctorId', select: 'name specialization' },
        { path: 'departmentId', select: 'name code' },
      ],
    });
  }

  async findOne(user: AuthUser, id: string): Promise<Appointment> {
    const appointment = await this.model
      .findOne({ _id: new Types.ObjectId(id), ...tenantFilter(user) })
      .populate(POPULATE_OPTIONS)
      .lean()
      .exec();
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async update(user: AuthUser, id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.getOwned(user, id);
    if (!ACTIVE_STATUSES.includes(appointment.status)) {
      throw new BadRequestException(`Cannot edit a ${appointment.status} appointment`);
    }

    if (dto.scheduledAt || dto.durationMinutes) {
      const scheduledAt = dto.scheduledAt ?? appointment.scheduledAt;
      const durationMinutes = dto.durationMinutes ?? appointment.durationMinutes;

      // Grace window: allow rescheduling to "right now"
      if (scheduledAt.getTime() < Date.now() - 60_000) {
        throw new BadRequestException('Rescheduled time cannot be in the past');
      }

      const endsAt = new Date(scheduledAt.getTime() + durationMinutes * 60_000);
      await this.assertNoConflict(
        appointment.tenantId,
        appointment.doctorId.toString(),
        scheduledAt,
        endsAt,
        appointment._id as Types.ObjectId,
      );
      appointment.scheduledAt = scheduledAt;
      appointment.durationMinutes = durationMinutes;
      appointment.endsAt = endsAt;

      // When explicitly rescheduling, set status back to SCHEDULED if currently POSTPONED.
      // The status itself only changes via /status; this just normalises on reschedule.
    }
    if (dto.type) appointment.type = dto.type;
    if (dto.reason !== undefined) appointment.reason = dto.reason;
    if (dto.notes !== undefined) appointment.notes = dto.notes;
    if (dto.postponeReason !== undefined) appointment.postponeReason = dto.postponeReason;

    await appointment.save();

    // Re-populate so the response contains full patient/doctor objects.
    return (await this.model
      .findById(appointment._id)
      .populate(POPULATE_OPTIONS)
      .lean()
      .exec()) as Appointment;
  }

  async updateStatus(user: AuthUser, id: string, dto: UpdateAppointmentStatusDto): Promise<Appointment> {
    const { status, cancelReason } = dto;
    const appointment = await this.getOwned(user, id);
    if (!TRANSITIONS[appointment.status].includes(status)) {
      throw new BadRequestException(
        `Invalid status transition ${appointment.status} → ${status}`,
      );
    }

    if (status === AppointmentStatus.CHECKED_IN && appointment.tokenNumber === null) {
      const day = appointment.scheduledAt.toISOString().slice(0, 10);
      appointment.tokenNumber = await this.countersService.next(
        appointment.tenantId.toString(),
        `queue:${appointment.doctorId.toString()}:${day}`,
      );
    }

    if (status === AppointmentStatus.CANCELLED && cancelReason) {
      appointment.cancelReason = cancelReason;
    }

    // When transitioning SCHEDULED → POSTPONED, just mark status; time change goes via update().
    appointment.status = status;
    await appointment.save();
    return appointment.toObject();
  }

  /** Today's queue for a doctor, ordered by token. */
  queue(user: AuthUser, doctorId: string): Promise<Appointment[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 24 * 60 * 60_000);
    return this.model
      .find({
        ...tenantFilter(user),
        doctorId: new Types.ObjectId(doctorId),
        scheduledAt: { $gte: start, $lt: end },
        status: { $in: ACTIVE_STATUSES },
      })
      .sort({ tokenNumber: 1, scheduledAt: 1 })
      .populate('patientId', 'firstName lastName mrn')
      .lean()
      .exec();
  }

  // ── internals ───────────────────────────────────────────────────

  private async getOwned(user: AuthUser, id: string): Promise<AppointmentDocument> {
    const appointment = await this.model
      .findOne({ _id: new Types.ObjectId(id), ...tenantFilter(user) })
      .exec();
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  /** BR-2: a doctor cannot have two active appointments overlapping in time. */
  private async assertNoConflict(
    tenantId: Types.ObjectId,
    doctorId: string,
    scheduledAt: Date,
    endsAt: Date,
    excludeId?: Types.ObjectId,
  ): Promise<void> {
    const conflict = await this.model.exists({
      tenantId,
      doctorId: new Types.ObjectId(doctorId),
      status: { $in: ACTIVE_STATUSES },
      scheduledAt: { $lt: endsAt },
      endsAt: { $gt: scheduledAt },
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (conflict) {
      throw new ConflictException('The doctor already has an appointment in this time slot');
    }
  }
}
