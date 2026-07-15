import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FileRecordDocument = HydratedDocument<FileRecord>;

@Schema({ timestamps: true })
export class FileRecord {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  storagePath: string; // relative path under uploadDir

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  sizeBytes: number;

  @Prop()
  resourceType?: string; // 'lab-report', 'radiology-image', 'invoice', 'other'

  @Prop({ type: Types.ObjectId })
  resourceId?: Types.ObjectId;
}

export const FileRecordSchema = SchemaFactory.createForClass(FileRecord);
FileRecordSchema.index({ tenantId: 1, createdAt: -1 });
FileRecordSchema.index({ tenantId: 1, resourceType: 1, resourceId: 1 });
