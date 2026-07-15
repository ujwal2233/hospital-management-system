import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { join } from 'path';
import { unlinkSync, mkdirSync } from 'fs';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { requireTenant, tenantFilter } from '../../common/utils/tenant';
import { FileRecord, FileRecordDocument } from './schemas/file-record.schema';

@Injectable()
export class FilesService {
  private readonly uploadDir: string;

  constructor(
    @InjectModel(FileRecord.name) private readonly model: Model<FileRecordDocument>,
    private readonly config: ConfigService,
  ) {
    this.uploadDir = config.get<string>('uploadDir') ?? './uploads';
  }

  async createRecord(user: AuthUser, file: Express.Multer.File): Promise<FileRecord> {
    const tenantId = requireTenant(user);
    // multer already wrote the file — just record the metadata
    const storagePath = file.path;
    return this.model.create({
      tenantId,
      uploadedBy: new Types.ObjectId(user.userId),
      originalName: file.originalname,
      storagePath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });
  }

  async findOne(user: AuthUser, id: string): Promise<FileRecord> {
    const record = await this.model
      .findOne({ _id: new Types.ObjectId(id), ...tenantFilter(user) })
      .lean()
      .exec();
    if (!record) throw new NotFoundException('File not found');
    return record;
  }

  async remove(user: AuthUser, id: string): Promise<{ deleted: boolean }> {
    const record = await this.findOne(user, id);
    try { unlinkSync(join(process.cwd(), record.storagePath)); } catch { /* file may already be gone */ }
    await this.model.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    return { deleted: true };
  }

  /** Return the multer disk-storage destination for this tenant */
  getTenantUploadDir(tenantId: string): string {
    const dir = join(this.uploadDir, tenantId);
    mkdirSync(dir, { recursive: true });
    return dir;
  }
}
