import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DispensingRecordDocument = HydratedDocument<DispensingRecord>;

@Schema({ _id: false })
export class DispensedItem {
  @Prop({ type: Types.ObjectId, ref: 'PharmacyItem', required: true })
  itemId: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;

  @Prop({ default: 0 })
  unitPrice: number;
}

@Schema({ timestamps: true })
export class DispensingRecord {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true, index: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Prescription' })
  prescriptionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  dispensedBy: Types.ObjectId;

  @Prop({ type: [DispensedItem], required: true })
  items: DispensedItem[];

  @Prop()
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'Invoice', default: null })
  invoiceId?: Types.ObjectId | null;
}

export const DispensingRecordSchema = SchemaFactory.createForClass(DispensingRecord);
DispensingRecordSchema.index({ tenantId: 1, patientId: 1 });
DispensingRecordSchema.index({ tenantId: 1, createdAt: -1 });
