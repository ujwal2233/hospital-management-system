import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { LabOrderStatus } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { paginate, Paginated } from '../../common/utils/pagination';
import { requireTenant, tenantFilter } from '../../common/utils/tenant';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  AddLabResultsDto,
  CreateLabOrderDto,
  UpdateLabOrderDto,
} from './dto/laboratory.dto';
import { LabOrder, LabOrderDocument } from './schemas/lab-order.schema';

@Injectable()
export class LaboratoryService {
  constructor(
    @InjectModel(LabOrder.name) private readonly model: Model<LabOrderDocument>,
  ) {}

  create(user: AuthUser, dto: CreateLabOrderDto): Promise<LabOrder> {
    const tenantId = requireTenant(user);
    return this.model.create({
      tenantId,
      orderedBy: new Types.ObjectId(user.userId),
      patientId: new Types.ObjectId(dto.patientId),
      appointmentId: dto.appointmentId ? new Types.ObjectId(dto.appointmentId) : undefined,
      testName: dto.testName,
      testCode: dto.testCode,
      notes: dto.notes,
    });
  }

  findAll(user: AuthUser, query: PaginationQueryDto & { patientId?: string; status?: LabOrderStatus }): Promise<Paginated<LabOrder>> {
    const filter: FilterQuery<LabOrderDocument> = { ...tenantFilter(user) };
    if (query.patientId) filter.patientId = new Types.ObjectId(query.patientId);
    if (query.status) filter.status = query.status;
    return paginate(this.model, filter, query, {
      sort: { createdAt: -1 },
      populate: [
        { path: 'patientId', select: 'firstName lastName mrn' },
        { path: 'orderedBy', select: 'firstName lastName' },
      ],
    });
  }

  async findOne(user: AuthUser, id: string): Promise<LabOrder> {
    const order = await this.model
      .findOne({ _id: new Types.ObjectId(id), ...tenantFilter(user) })
      .populate([
        { path: 'patientId', select: 'firstName lastName mrn phone' },
        { path: 'orderedBy', select: 'firstName lastName' },
        { path: 'processedBy', select: 'firstName lastName' },
      ])
      .lean()
      .exec();
    if (!order) throw new NotFoundException('Lab order not found');
    return order;
  }

  async update(user: AuthUser, id: string, dto: UpdateLabOrderDto): Promise<LabOrder> {
    const order = await this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), ...tenantFilter(user) },
        { $set: dto },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();
    if (!order) throw new NotFoundException('Lab order not found');
    return order;
  }

  async addResults(user: AuthUser, id: string, dto: AddLabResultsDto): Promise<LabOrder> {
    const order = await this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), ...tenantFilter(user) },
        {
          $set: {
            results: dto.results,
            reportUrl: dto.reportUrl,
            status: LabOrderStatus.COMPLETED,
            processedBy: new Types.ObjectId(user.userId),
            resultDate: new Date(),
          },
        },
        { new: true },
      )
      .lean()
      .exec();
    if (!order) throw new NotFoundException('Lab order not found');
    return order;
  }
}
