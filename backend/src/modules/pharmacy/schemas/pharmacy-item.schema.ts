import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PharmacyItemDocument = HydratedDocument<PharmacyItem>;

@Schema({ timestamps: true })
export class PharmacyItem {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  genericName?: string;

  @Prop({ trim: true })
  manufacturer?: string;

  @Prop({ trim: true })
  category?: string;

  @Prop({ required: true })
  unit: string; // tablet, ml, mg, vial

  @Prop({ default: 0 })
  stockQty: number;

  @Prop({ default: 0 })
  reorderLevel: number;

  @Prop({ default: 0 })
  unitPrice: number;

  @Prop()
  batchNumber?: string;

  @Prop({ type: Date })
  expiryDate?: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const PharmacyItemSchema = SchemaFactory.createForClass(PharmacyItem);
PharmacyItemSchema.index({ tenantId: 1, name: 1 }, { unique: true });
PharmacyItemSchema.index({ tenantId: 1, stockQty: 1 });
