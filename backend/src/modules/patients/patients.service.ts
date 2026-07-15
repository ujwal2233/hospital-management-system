import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { paginate, Paginated } from '../../common/utils/pagination';
import { requireTenant, tenantFilter } from '../../common/utils/tenant';
import { CountersService } from '../counters/counters.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Patient, PatientDocument } from './schemas/patient.schema';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private readonly model: Model<PatientDocument>,
    private readonly countersService: CountersService,
    private readonly tenantsService: TenantsService,
  ) {}

  async create(user: AuthUser, dto: CreatePatientDto): Promise<Patient> {
    const tenantId = requireTenant(user);
    const mrn = await this.nextMrn(tenantId.toString());
    return this.model.create({ ...dto, mrn, tenantId });
  }

  findAll(user: AuthUser, query: PaginationQueryDto): Promise<Paginated<Patient>> {
    const filter: FilterQuery<PatientDocument> = { ...tenantFilter(user) };
    if (query.search) {
      filter.$or = [
        { firstName: { $regex: query.search, $options: 'i' } },
        { lastName: { $regex: query.search, $options: 'i' } },
        { mrn: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
      ];
    }
    return paginate(this.model, filter, query);
  }

  async findOne(user: AuthUser, id: string): Promise<Patient> {
    const patient = await this.model
      .findOne({ _id: new Types.ObjectId(id), ...tenantFilter(user) })
      .lean()
      .exec();
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async update(user: AuthUser, id: string, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), ...tenantFilter(user) },
        { $set: dto },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  private async nextMrn(tenantId: string): Promise<string> {
    const [tenant, seq] = await Promise.all([
      this.tenantsService.findOne(tenantId),
      this.countersService.next(tenantId, 'mrn'),
    ]);
    return `${tenant.code}-${String(seq).padStart(6, '0')}`;
  }
}
