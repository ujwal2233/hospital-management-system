import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MedicalRecordDocument = HydratedDocument<MedicalRecord>;

@Schema({ _id: false })
export class Vitals {
  @Prop() temperatureC?: number;
  @Prop() pulse?: number;
  @Prop() bpSystolic?: number;
  @Prop() bpDiastolic?: number;
  @Prop() respiratoryRate?: number;
  @Prop() spo2?: number;
  @Prop() weightKg?: number;
  @Prop() heightCm?: number;
}

@Schema({ _id: false })
export class Diagnosis {
  /** ICD-10 code, when coded. */
  @Prop() code?: string;
  @Prop({ required: true }) description: string;
}

@Schema({ timestamps: true, collection: 'medicalrecords' })
export class MedicalRecord {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
  doctorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Appointment', default: null })
  appointmentId: Types.ObjectId | null;

  @Prop({ type: Vitals })
  vitals?: Vitals;

  @Prop()
  chiefComplaint?: string;

  @Prop({ type: [Diagnosis], default: [] })
  diagnoses: Diagnosis[];

  @Prop()
  notes?: string;

  @Prop({ type: Date })
  followUpDate?: Date;

  /** User who authored the record (audit anchor). */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const MedicalRecordSchema = SchemaFactory.createForClass(MedicalRecord);
MedicalRecordSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
