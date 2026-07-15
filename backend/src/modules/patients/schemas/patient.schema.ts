import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BloodGroup, Gender } from '../../../common/enums';

export type PatientDocument = HydratedDocument<Patient>;

@Schema({ _id: false })
export class EmergencyContact {
  @Prop() name?: string;
  @Prop() phone?: string;
  @Prop() relation?: string;
}

@Schema({ timestamps: true })
export class Patient {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  mrn: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ type: Date })
  dob?: Date;

  @Prop({ type: String, enum: Object.values(Gender), required: true })
  gender: Gender;

  @Prop({ required: true })
  phone: string;

  @Prop({ lowercase: true, trim: true })
  email?: string;

  @Prop({ type: String, enum: Object.values(BloodGroup) })
  bloodGroup?: BloodGroup;

  /** ABDM Ayushman Bharat Health Account number. */
  @Prop()
  abhaId?: string;

  @Prop()
  address?: string;

  @Prop({ type: [String], default: [] })
  allergies: string[];

  @Prop({ type: EmergencyContact })
  emergencyContact?: EmergencyContact;

  @Prop({ default: true })
  isActive: boolean;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
PatientSchema.index({ tenantId: 1, mrn: 1 }, { unique: true });
PatientSchema.index({ tenantId: 1, phone: 1 });
PatientSchema.index({ firstName: 'text', lastName: 'text' });
