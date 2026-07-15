import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { RadiologyOrderStatus } from '../../../common/enums';

export type RadiologyOrderDocument = HydratedDocument<RadiologyOrder>;

@Schema({ timestamps: true })
export class RadiologyOrder {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true, index: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  orderedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  appointmentId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  modality: string; // X-Ray, CT, MRI, Ultrasound, PET, etc.

  @Prop({ required: true, trim: true })
  bodyPart: string;

  @Prop()
  clinicalIndication?: string;

  @Prop({
    type: String,
    enum: Object.values(RadiologyOrderStatus),
    default: RadiologyOrderStatus.ORDERED,
  })
  status: RadiologyOrderStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reportedBy?: Types.ObjectId;

  @Prop()
  findings?: string;

  @Prop()
  impression?: string;

  @Prop({ type: Date })
  reportDate?: Date;

  @Prop()
  imageUrl?: string; // PACS link or file ref
}

export const RadiologyOrderSchema = SchemaFactory.createForClass(RadiologyOrder);
RadiologyOrderSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
RadiologyOrderSchema.index({ tenantId: 1, status: 1 });
