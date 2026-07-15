import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { paginate, Paginated } from '../../common/utils/pagination';
import { requireTenant, tenantFilter } from '../../common/utils/tenant';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  CreatePharmacyItemDto,
  DispenseDto,
  UpdatePharmacyItemDto,
} from './dto/pharmacy.dto';
import { QueryDispensingDto } from './dto/query-dispensing.dto';
import {
  PharmacyItem,
  PharmacyItemDocument,
} from './schemas/pharmacy-item.schema';
import {
  DispensingRecord,
  DispensingRecordDocument,
} from './schemas/dispensing-record.schema';

@Injectable()
export class PharmacyService {
  constructor(
    @InjectModel(PharmacyItem.name)
    private readonly itemModel: Model<PharmacyItemDocument>,
    @InjectModel(DispensingRecord.name)
    private readonly dispenseModel: Model<DispensingRecordDocument>,
  ) {}

  // ── Drug Catalog ──────────────────────────────────────────────────

  createItem(user: AuthUser, dto: CreatePharmacyItemDto): Promise<PharmacyItem> {
    const tenantId = requireTenant(user);
    return this.itemModel.create({ ...dto, tenantId });
  }

  findAllItems(user: AuthUser, query: PaginationQueryDto): Promise<Paginated<PharmacyItem>> {
    const filter: Record<string, unknown> = { ...tenantFilter(user) };
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { genericName: { $regex: query.search, $options: 'i' } },
        { category: { $regex: query.search, $options: 'i' } },
      ];
    }
    return paginate<PharmacyItem>(this.itemModel, filter, query);
  }

  async findOneItem(user: AuthUser, id: string): Promise<PharmacyItem> {
    const item = await this.itemModel
      .findOne({ _id: new Types.ObjectId(id), ...tenantFilter(user) })
      .lean()
      .exec();
    if (!item) throw new NotFoundException('Pharmacy item not found');
    return item;
  }

  async updateItem(user: AuthUser, id: string, dto: UpdatePharmacyItemDto): Promise<PharmacyItem> {
    const item = await this.itemModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), ...tenantFilter(user) },
        { $set: dto },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();
    if (!item) throw new NotFoundException('Pharmacy item not found');
    return item;
  }

  async getLowStock(user: AuthUser): Promise<PharmacyItem[]> {
    return this.itemModel
      .find({
        ...tenantFilter(user),
        $expr: { $lte: ['$stockQty', '$reorderLevel'] },
        isActive: true,
      })
      .lean()
      .exec();
  }

  // ── Dispensing ────────────────────────────────────────────────────

  async dispense(user: AuthUser, dto: DispenseDto): Promise<DispensingRecord> {
    const tenantId = requireTenant(user);

    // Validate each item and deduct stock atomically
    for (const line of dto.items) {
      const item = await this.itemModel
        .findOne({ _id: new Types.ObjectId(line.itemId), ...tenantFilter(user) })
        .exec();
      if (!item) throw new NotFoundException(`Pharmacy item ${line.itemId} not found`);
      if (item.stockQty < line.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.name}: available ${item.stockQty}, requested ${line.quantity}`,
        );
      }
      await this.itemModel
        .updateOne({ _id: item._id }, { $inc: { stockQty: -line.quantity } })
        .exec();
    }

    // Fetch prices for record
    const itemsWithPrice = await Promise.all(
      dto.items.map(async (line) => {
        const item = await this.itemModel
          .findById(line.itemId)
          .lean()
          .exec();
        return {
          itemId: new Types.ObjectId(line.itemId),
          quantity: line.quantity,
          unitPrice: item?.unitPrice ?? 0,
        };
      }),
    );

    return this.dispenseModel.create({
      tenantId,
      patientId: new Types.ObjectId(dto.patientId),
      prescriptionId: dto.prescriptionId ? new Types.ObjectId(dto.prescriptionId) : undefined,
      dispensedBy: new Types.ObjectId(user.userId),
      items: itemsWithPrice,
      notes: dto.notes,
    });
  }

  findDispensing(user: AuthUser, query: QueryDispensingDto): Promise<Paginated<DispensingRecord>> {
    const filter: Record<string, unknown> = { ...tenantFilter(user) };
    if (query.patientId) {
      filter.patientId = new Types.ObjectId(query.patientId);
    }
    return paginate<DispensingRecord>(this.dispenseModel, filter, query, {
      sort: { createdAt: -1 },
      populate: [
        { path: 'patientId', select: 'firstName lastName mrn' },
        { path: 'items.itemId', select: 'name unit' },
        { path: 'invoiceId', select: 'invoiceNumber total status' },
      ],
    });
  }
}
