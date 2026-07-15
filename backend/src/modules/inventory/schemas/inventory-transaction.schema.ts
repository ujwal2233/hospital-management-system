import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TransactionType } from '../../../common/enums';

export type InventoryTransactionDocument = HydratedDocument<InventoryTransaction>;

@Schema({ timestamps: true })
export class InventoryTransaction {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'InventoryItem', required: true, index: true })
  itemId: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(TransactionType), required: true })
  type: TransactionType;

  @Prop({ required: true })
  quantity: number; // always positive; type determines direction

  @Prop()
  reference?: string; // PO number / invoice / note

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  performedBy: Types.ObjectId;
}

export const InventoryTransactionSchema = SchemaFactory.createForClass(InventoryTransaction);
InventoryTransactionSchema.index({ tenantId: 1, itemId: 1, createdAt: -1 });
