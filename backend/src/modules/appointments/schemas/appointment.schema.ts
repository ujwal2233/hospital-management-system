import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AppointmentStatus, AppointmentType } from '../../../common/enums';

export type AppointmentDocument = HydratedDocument<Appointment>;

@Schema({ timestamps: true })
export class Appointment {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
  doctorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department', default: null })
  departmentId: Types.ObjectId | null;

  @Prop({ type: Date, required: true })
  scheduledAt: Date;

  @Prop({ required: true, min: 5, max: 240, default: 15 })
  durationMinutes: number;

  @Prop({ type: Date, required: true })
  endsAt: Date;

  @Prop({ type: String, enum: Object.values(AppointmentType), default: AppointmentType.OPD })
  type: AppointmentType;

  @Prop({
    type: String,
    enum: Object.values(AppointmentStatus),
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Prop()
  reason?: string;

  @Prop()
  notes?: string;

  /** Reason recorded when cancelling the appointment. */
  @Prop()
  cancelReason?: string;

  /** Reason recorded when postponing the appointment. */
  @Prop()
  postponeReason?: string;

  /** Daily per-doctor queue token, assigned at check-in. */
  @Prop({ type: Number, default: null })
  tokenNumber: number | null;

  @Prop({ type: Types.ObjectId, ref: 'Invoice', default: null })
  invoiceId: Types.ObjectId | null;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
AppointmentSchema.index({ tenantId: 1, doctorId: 1, scheduledAt: 1 });
AppointmentSchema.index({ tenantId: 1, patientId: 1, scheduledAt: -1 });
AppointmentSchema.index({ tenantId: 1, status: 1, scheduledAt: 1 });
