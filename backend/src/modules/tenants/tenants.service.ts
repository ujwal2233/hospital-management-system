import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { paginate, Paginated } from '../../common/utils/pagination';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant, TenantDocument } from './schemas/tenant.schema';

@Injectable()
export class TenantsService {
  constructor(@InjectModel(Tenant.name) private readonly model: Model<TenantDocument>) {}

  create(dto: CreateTenantDto): Promise<Tenant> {
    return this.model.create({ ...dto, code: dto.code.toUpperCase() });
  }

  findAll(query: PaginationQueryDto): Promise<Paginated<Tenant>> {
    const filter: FilterQuery<TenantDocument> = {};
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { code: { $regex: query.search, $options: 'i' } },
      ];
    }
    return paginate(this.model, filter, query);
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.model.findById(id).lean().exec();
    if (!tenant) throw new NotFoundException('Hospital not found');
    return tenant;
  }

  findByCode(code: string): Promise<TenantDocument | null> {
    return this.model.findOne({ code: code.toUpperCase() }).exec();
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.model
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .lean()
      .exec();
    if (!tenant) throw new NotFoundException('Hospital not found');
    return tenant;
  }
}
