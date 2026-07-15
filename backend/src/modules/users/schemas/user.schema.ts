import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', default: null, index: true })
  tenantId: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: true })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, default: null, select: false })
  refreshTokenHash: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
