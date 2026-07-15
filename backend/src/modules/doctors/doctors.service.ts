import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { paginate, Paginated } from '../../common/utils/pagination';
import { requireTenant, tenantFilter } from '../../common/utils/tenant';
import { DepartmentsService } from '../departments/departments.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Doctor, DoctorDocument } from './schemas/doctor.schema';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(Doctor.name) private readonly model: Model<DoctorDocument>,
    private readonly departmentsService: DepartmentsService,
  ) {}

  async create(user: AuthUser, dto: CreateDoctorDto): Promise<Doctor> {
    const tenantId = requireTenant(user);
    await this.departmentsService.findOne(user, dto.departmentId); // must exist in tenant
    this.validateSchedule(dto.schedule);
    return this.model.create({ ...dto, tenantId });
  }

  findAll(
    user: AuthUser,
    query: PaginationQueryDto & { departmentId?: string },
  ): Promise<Paginated<Doctor>> {
    const filter: FilterQuery<DoctorDocument> = { ...tenantFilter(user) };
    if (query.departmentId) filter.departmentId = new Types.ObjectId(query.departmentId);
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { specialization: { $regex: query.search, $options: 'i' } },
      ];
    }
    return paginate(this.model, filter, query, {
      sort: { name: 1 },
      populate: { path: 'departmentId', select: 'name code' },
    });
  }

  async findOne(user: AuthUser, id: string): Promise<Doctor> {
    const doctor = await this.model
      .findOne({ _id: new Types.ObjectId(id), ...tenantFilter(user) })
      .populate('departmentId', 'name code')
      .lean()
      .exec();
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async update(user: AuthUser, id: string, dto: UpdateDoctorDto): Promise<Doctor> {
    if (dto.departmentId) await this.departmentsService.findOne(user, dto.departmentId);
    this.validateSchedule(dto.schedule);
    const doctor = await this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), ...tenantFilter(user) },
        { $set: dto },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  private validateSchedule(schedule?: { startTime: string; endTime: string }[]): void {
    for (const slot of schedule ?? []) {
      if (slot.startTime >= slot.endTime) {
        throw new BadRequestException('Schedule slot startTime must be before endTime');
      }
    }
  }
}
