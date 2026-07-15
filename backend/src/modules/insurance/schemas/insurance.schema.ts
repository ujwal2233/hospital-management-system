import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ClaimStatus } from '../../../common/enums';

export type InsuranceProviderDocument = HydratedDocument<InsuranceProvider>;
export type InsuranceClaimDocument = HydratedDocument<InsuranceClaim>;

@Schema({ timestamps: true })
export class InsuranceProvider {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  tpaCode?: string;

  @Prop()
  contactPerson?: string;

  @Prop()
  contactPhone?: string;

  @Prop()
  contactEmail?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const InsuranceProviderSchema = SchemaFactory.createForClass(InsuranceProvider);
InsuranceProviderSchema.index({ tenantId: 1, name: 1 }, { unique: true });

@Schema({ _id: false })
export class ClaimDocument {
  @Prop({ required: true }) type: string;
  @Prop({ required: true }) fileUrl: string;
}

@Schema({ timestamps: true })
export class InsuranceClaim {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true, index: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Invoice', required: true })
  invoiceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'InsuranceProvider', required: true })
  providerId: Types.ObjectId;

  @Prop({ required: true })
  policyNumber: string;

  @Prop({ default: 0 })
  claimedAmount: number;

  @Prop({ default: 0 })
  approvedAmount: number;

  @Prop({
    type: String,
    enum: Object.values(ClaimStatus),
    default: ClaimStatus.SUBMITTED,
  })
  status: ClaimStatus;

  @Prop()
  remarks?: string;

  @Prop({ type: [ClaimDocument], default: [] })
  documents: ClaimDocument[];

  @Prop({ type: Date })
  settledAt?: Date;
}

export const InsuranceClaimSchema = SchemaFactory.createForClass(InsuranceClaim);
InsuranceClaimSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
InsuranceClaimSchema.index({ tenantId: 1, status: 1 });
