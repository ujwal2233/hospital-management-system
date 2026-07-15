import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TenantDocument = HydratedDocument<Tenant>;

@Schema({ _id: false })
export class Address {
  @Prop() line1?: string;
  @Prop() city?: string;
  @Prop() state?: string;
  @Prop() pincode?: string;
}

@Schema({ timestamps: true })
export class Tenant {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, uppercase: true, trim: true, unique: true })
  code: string;

  @Prop({ type: Address })
  address?: Address;

  @Prop() phone?: string;
  @Prop({ lowercase: true, trim: true }) email?: string;
  @Prop() gstin?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
