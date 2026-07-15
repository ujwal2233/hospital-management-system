import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { paginate, Paginated } from '../../common/utils/pagination';
import { requireTenant, tenantFilter } from '../../common/utils/tenant';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department, DepartmentDocument } from './schemas/department.schema';

@Injectable()
export class DepartmentsService {
  constructor(@InjectModel(Department.name) private readonly model: Model<DepartmentDocument>) {}

  create(user: AuthUser, dto: CreateDepartmentDto): Promise<Department> {
    return this.model.create({
      ...dto,
      code: dto.code.toUpperCase(),
      tenantId: requireTenant(user),
    });
  }

  findAll(user: AuthUser, query: PaginationQueryDto): Promise<Paginated<Department>> {
    const filter: FilterQuery<DepartmentDocument> = { ...tenantFilter(user) };
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { code: { $regex: query.search, $options: 'i' } },
      ];
    }
    return paginate(this.model, filter, query, { sort: { name: 1 } });
  }

  async findOne(user: AuthUser, id: string): Promise<Department> {
    const department = await this.model
      .findOne({ _id: new Types.ObjectId(id), ...tenantFilter(user) })
      .lean()
      .exec();
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async update(user: AuthUser, id: string, dto: UpdateDepartmentDto): Promise<Department> {
    const department = await this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), ...tenantFilter(user) },
        { $set: dto },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }
}
