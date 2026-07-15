import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PrescriptionDocument = HydratedDocument<Prescription>;

export enum PrescriptionStatus {
  ACTIVE = 'ACTIVE',
  DISPENSED = 'DISPENSED',
  CANCELLED = 'CANCELLED',
}

@Schema({ _id: false })
export class PrescriptionItem {
  @Prop({ required: true }) medicine: string;
  @Prop({ required: true }) dosage: string; // e.g. 500mg
  @Prop({ required: true }) frequency: string; // e.g. 1-0-1
  @Prop({ required: true }) durationDays: number;
  @Prop() instructions?: string;
}

@Schema({ timestamps: true })
export class Prescription {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
  doctorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'MedicalRecord', default: null })
  recordId: Types.ObjectId | null;

  @Prop({ type: [PrescriptionItem], required: true })
  items: PrescriptionItem[];

  @Prop()
  notes?: string;

  @Prop({
    type: String,
    enum: Object.values(PrescriptionStatus),
    default: PrescriptionStatus.ACTIVE,
  })
  status: PrescriptionStatus;
}

export const PrescriptionSchema = SchemaFactory.createForClass(Prescription);
PrescriptionSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
