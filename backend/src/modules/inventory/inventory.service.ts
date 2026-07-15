import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TransactionType } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { paginate, Paginated } from '../../common/utils/pagination';
import { requireTenant, tenantFilter } from '../../common/utils/tenant';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  CreateInventoryItemDto,
  RecordTransactionDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto';
import { InventoryItem, InventoryItemDocument } from './schemas/inventory-item.schema';
import { InventoryTransaction, InventoryTransactionDocument } from './schemas/inventory-transaction.schema';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryItem.name) private readonly itemModel: Model<InventoryItemDocument>,
    @InjectModel(InventoryTransaction.name)
    private readonly txModel: Model<InventoryTransactionDocument>,
  ) {}

  createItem(user: AuthUser, dto: CreateInventoryItemDto): Promise<InventoryItem> {
    const tenantId = requireTenant(user);
    return this.itemModel.create({ ...dto, tenantId });
  }

  findAllItems(user: AuthUser, query: PaginationQueryDto): Promise<Paginated<InventoryItem>> {
    const filter: Record<string, unknown> = { ...tenantFilter(user) };
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { sku: { $regex: query.search, $options: 'i' } },
        { category: { $regex: query.search, $options: 'i' } },
      ];
    }
    return paginate<InventoryItem>(this.itemModel, filter, query);
  }

  async findOneItem(user: AuthUser, id: string): Promise<InventoryItem> {
    const item = await this.itemModel
      .findOne({ _id: new Types.ObjectId(id), ...tenantFilter(user) })
      .lean()
      .exec();
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async updateItem(user: AuthUser, id: string, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
    const item = await this.itemModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), ...tenantFilter(user) },
        { $set: dto },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async getLowStock(user: AuthUser): Promise<InventoryItem[]> {
    return this.itemModel
      .find({
        ...tenantFilter(user),
        $expr: { $lte: ['$currentQty', '$reorderLevel'] },
        isActive: true,
      })
      .lean()
      .exec();
  }

  async recordTransaction(user: AuthUser, dto: RecordTransactionDto): Promise<InventoryTransaction> {
    const tenantId = requireTenant(user);
    const item = await this.itemModel
      .findOne({ _id: new Types.ObjectId(dto.itemId), ...tenantFilter(user) })
      .exec();
    if (!item) throw new NotFoundException('Inventory item not found');

    // Compute new quantity
    let delta = dto.quantity;
    if (dto.type === TransactionType.OUT) delta = -dto.quantity;
    if (dto.type === TransactionType.ADJUSTMENT) delta = dto.quantity - item.currentQty; // set to value

    const newQty = item.currentQty + delta;
    if (newQty < 0) {
      throw new BadRequestException(
        `Cannot reduce stock below zero. Current: ${item.currentQty}, Requested reduction: ${dto.quantity}`,
      );
    }
    await this.itemModel.updateOne({ _id: item._id }, { currentQty: newQty }).exec();

    return this.txModel.create({
      tenantId,
      itemId: item._id,
      type: dto.type,
      quantity: dto.quantity,
      reference: dto.reference,
      performedBy: new Types.ObjectId(user.userId),
    });
  }

  findTransactions(user: AuthUser, query: PaginationQueryDto & { itemId?: string }): Promise<Paginated<InventoryTransaction>> {
    const filter: Record<string, unknown> = { ...tenantFilter(user) };
    if (query.itemId) filter.itemId = new Types.ObjectId(query.itemId);
    return paginate<InventoryTransaction>(this.txModel, filter, query, {
      sort: { createdAt: -1 },
      populate: [
        { path: 'itemId', select: 'name unit sku' },
        { path: 'performedBy', select: 'firstName lastName' },
      ],
    });
  }
}
