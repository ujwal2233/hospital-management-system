import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { paginate, Paginated } from '../../common/utils/pagination';
import { requireTenant, tenantFilter } from '../../common/utils/tenant';
import { PatientsService } from '../patients/patients.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecord, MedicalRecordDocument } from './schemas/medical-record.schema';

@Injectable()
export class MedicalRecordsService {
  constructor(
    @InjectModel(MedicalRecord.name) private readonly model: Model<MedicalRecordDocument>,
    private readonly patientsService: PatientsService,
  ) {}

  async create(user: AuthUser, dto: CreateMedicalRecordDto): Promise<MedicalRecord> {
    const tenantId = requireTenant(user);
    await this.patientsService.findOne(user, dto.patientId);
    return this.model.create({
      ...dto,
      tenantId,
      patientId: new Types.ObjectId(dto.patientId),
      doctorId: new Types.ObjectId(dto.doctorId),
      appointmentId: dto.appointmentId ? new Types.ObjectId(dto.appointmentId) : null,
      createdBy: new Types.ObjectId(user.userId),
    });
  }

  findAll(
    user: AuthUser,
    query: PaginationQueryDto & { patientId?: string },
  ): Promise<Paginated<MedicalRecord>> {
    const filter: FilterQuery<MedicalRecordDocument> = { ...tenantFilter(user) };
    if (query.patientId) filter.patientId = new Types.ObjectId(query.patientId);
    return paginate(this.model, filter, query, {
      populate: [
        { path: 'patientId', select: 'firstName lastName mrn' },
        { path: 'doctorId', select: 'name specialization' },
      ],
    });
  }

  async findOne(user: AuthUser, id: string): Promise<MedicalRecord> {
    const record = await this.model
      .findOne({ _id: new Types.ObjectId(id), ...tenantFilter(user) })
      .populate([
        { path: 'patientId', select: 'firstName lastName mrn allergies bloodGroup' },
        { path: 'doctorId', select: 'name specialization' },
      ])
      .lean()
      .exec();
    if (!record) throw new NotFoundException('Medical record not found');
    return record;
  }

  async update(user: AuthUser, id: string, dto: UpdateMedicalRecordDto): Promise<MedicalRecord> {
    const record = await this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), ...tenantFilter(user) },
        { $set: dto },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();
    if (!record) throw new NotFoundException('Medical record not found');
    return record;
  }
}
