import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InventoryItemDocument = HydratedDocument<InventoryItem>;

@Schema({ timestamps: true })
export class InventoryItem {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  sku?: string;

  @Prop({ trim: true })
  category?: string;

  @Prop({ required: true })
  unit: string;

  @Prop({ default: 0 })
  currentQty: number;

  @Prop({ default: 0 })
  reorderLevel: number;

  @Prop({ default: 0 })
  unitCost: number;

  @Prop()
  location?: string; // ward/store

  @Prop({ default: true })
  isActive: boolean;
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItem);
InventoryItemSchema.index({ tenantId: 1, sku: 1 }, { sparse: true });
InventoryItemSchema.index({ tenantId: 1, category: 1 });
