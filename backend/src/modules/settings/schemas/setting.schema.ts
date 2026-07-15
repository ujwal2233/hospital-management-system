import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SettingDocument = HydratedDocument<Setting>;

@Schema({ timestamps: true })
export class Setting {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  key: string;

  @Prop({ type: Object, required: true })
  value: unknown;

  @Prop({ trim: true })
  description?: string;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
SettingSchema.index({ tenantId: 1, key: 1 }, { unique: true });
