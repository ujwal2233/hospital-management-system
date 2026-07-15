import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { paginate, Paginated } from '../../common/utils/pagination';
import { requireTenant, tenantFilter } from '../../common/utils/tenant';
import { PatientsService } from '../patients/patients.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { Prescription, PrescriptionDocument } from './schemas/prescription.schema';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectModel(Prescription.name) private readonly model: Model<PrescriptionDocument>,
    private readonly patientsService: PatientsService,
  ) {}

  async create(user: AuthUser, dto: CreatePrescriptionDto): Promise<Prescription> {
    const tenantId = requireTenant(user);
    await this.patientsService.findOne(user, dto.patientId);
    return this.model.create({
      ...dto,
      tenantId,
      patientId: new Types.ObjectId(dto.patientId),
      doctorId: new Types.ObjectId(dto.doctorId),
      recordId: dto.recordId ? new Types.ObjectId(dto.recordId) : null,
    });
  }

  findAll(
    user: AuthUser,
    query: PaginationQueryDto & { patientId?: string },
  ): Promise<Paginated<Prescription>> {
    const filter: FilterQuery<PrescriptionDocument> = { ...tenantFilter(user) };
    if (query.patientId) filter.patientId = new Types.ObjectId(query.patientId);
    return paginate(this.model, filter, query, {
      populate: [
        { path: 'patientId', select: 'firstName lastName mrn' },
        { path: 'doctorId', select: 'name specialization' },
      ],
    });
  }

  async findOne(user: AuthUser, id: string): Promise<Prescription> {
    const prescription = await this.model
      .findOne({ _id: new Types.ObjectId(id), ...tenantFilter(user) })
      .populate([
        { path: 'patientId', select: 'firstName lastName mrn allergies' },
        { path: 'doctorId', select: 'name specialization' },
      ])
      .lean()
      .exec();
    if (!prescription) throw new NotFoundException('Prescription not found');
    return prescription;
  }

  async update(user: AuthUser, id: string, dto: UpdatePrescriptionDto): Promise<Prescription> {
    const prescription = await this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), ...tenantFilter(user) },
        { $set: dto },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();
    if (!prescription) throw new NotFoundException('Prescription not found');
    return prescription;
  }
}
