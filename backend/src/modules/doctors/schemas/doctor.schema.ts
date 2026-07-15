import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DoctorDocument = HydratedDocument<Doctor>;

@Schema({ _id: false })
export class ScheduleSlot {
  @Prop({ required: true, min: 0, max: 6 })
  dayOfWeek: number;

  @Prop({ required: true })
  startTime: string; // HH:mm

  @Prop({ required: true })
  endTime: string; // HH:mm
}

@Schema({ timestamps: true })
export class Doctor {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  specialization: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  departmentId: Types.ObjectId;

  @Prop({ required: true })
  licenseNumber: string;

  @Prop({ type: [String], default: [] })
  qualifications: string[];

  @Prop({ required: true, min: 0 })
  consultationFee: number;

  @Prop({ type: [ScheduleSlot], default: [] })
  schedule: ScheduleSlot[];

  @Prop({ default: true })
  isActive: boolean;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
DoctorSchema.index({ tenantId: 1, departmentId: 1 });
DoctorSchema.index({ tenantId: 1, licenseNumber: 1 }, { unique: true });
