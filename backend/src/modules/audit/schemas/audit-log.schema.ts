import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'auditlogs' })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true, default: null })
  tenantId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId: Types.ObjectId | null;

  @Prop()
  userEmail?: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  resource: string;

  @Prop()
  resourceId?: string;

  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  path: string;

  @Prop()
  ip?: string;

  @Prop({ required: true })
  statusCode: number;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
