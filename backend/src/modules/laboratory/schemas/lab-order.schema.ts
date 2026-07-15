import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { LabOrderStatus } from '../../../common/enums';

export type LabOrderDocument = HydratedDocument<LabOrder>;

@Schema({ _id: false })
export class LabResultValue {
  @Prop({ required: true }) parameter: string;
  @Prop({ required: true }) value: string;
  @Prop() unit?: string;
  @Prop() referenceRange?: string;
  @Prop() flag?: string; // H/L/N
}

@Schema({ timestamps: true })
export class LabOrder {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true, index: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  orderedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  appointmentId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  testName: string;

  @Prop()
  testCode?: string;

  @Prop()
  notes?: string;

  @Prop({
    type: String,
    enum: Object.values(LabOrderStatus),
    default: LabOrderStatus.ORDERED,
  })
  status: LabOrderStatus;

  @Prop({ type: [LabResultValue], default: [] })
  results: LabResultValue[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  processedBy?: Types.ObjectId;

  @Prop({ type: Date })
  resultDate?: Date;

  @Prop()
  reportUrl?: string; // file ref after upload
}

export const LabOrderSchema = SchemaFactory.createForClass(LabOrder);
LabOrderSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
LabOrderSchema.index({ tenantId: 1, status: 1 });
