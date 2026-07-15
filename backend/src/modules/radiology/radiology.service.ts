import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { RadiologyOrderStatus } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { paginate, Paginated } from '../../common/utils/pagination';
import { requireTenant, tenantFilter } from '../../common/utils/tenant';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AddRadiologyReportDto, CreateRadiologyOrderDto, UpdateRadiologyOrderDto } from './dto/radiology.dto';
import { RadiologyOrder, RadiologyOrderDocument } from './schemas/radiology-order.schema';

@Injectable()
export class RadiologyService {
  constructor(
    @InjectModel(RadiologyOrder.name) private readonly model: Model<RadiologyOrderDocument>,
  ) {}

  create(user: AuthUser, dto: CreateRadiologyOrderDto): Promise<RadiologyOrder> {
    const tenantId = requireTenant(user);
    return this.model.create({
      tenantId,
      orderedBy: new Types.ObjectId(user.userId),
      patientId: new Types.ObjectId(dto.patientId),
      appointmentId: dto.appointmentId ? new Types.ObjectId(dto.appointmentId) : undefined,
      modality: dto.modality,
      bodyPart: dto.bodyPart,
      clinicalIndication: dto.clinicalIndication,
    });
  }

  findAll(user: AuthUser, query: PaginationQueryDto & { patientId?: string; status?: RadiologyOrderStatus }): Promise<Paginated<RadiologyOrder>> {
    const filter: FilterQuery<RadiologyOrderDocument> = { ...tenantFilter(user) };
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

  async findOne(user: AuthUser, id: string): Promise<RadiologyOrder> {
    const order = await this.model
      .findOne({ _id: new Types.ObjectId(id), ...tenantFilter(user) })
      .populate([
        { path: 'patientId', select: 'firstName lastName mrn phone' },
        { path: 'orderedBy', select: 'firstName lastName' },
        { path: 'reportedBy', select: 'firstName lastName' },
      ])
      .lean()
      .exec();
    if (!order) throw new NotFoundException('Radiology order not found');
    return order;
  }

  async update(user: AuthUser, id: string, dto: UpdateRadiologyOrderDto): Promise<RadiologyOrder> {
    const order = await this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), ...tenantFilter(user) },
        { $set: dto },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();
    if (!order) throw new NotFoundException('Radiology order not found');
    return order;
  }

  async addReport(user: AuthUser, id: string, dto: AddRadiologyReportDto): Promise<RadiologyOrder> {
    const order = await this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), ...tenantFilter(user) },
        {
          $set: {
            findings: dto.findings,
            impression: dto.impression,
            imageUrl: dto.imageUrl,
            status: RadiologyOrderStatus.COMPLETED,
            reportedBy: new Types.ObjectId(user.userId),
            reportDate: new Date(),
          },
        },
        { new: true },
      )
      .lean()
      .exec();
    if (!order) throw new NotFoundException('Radiology order not found');
    return order;
  }
}
