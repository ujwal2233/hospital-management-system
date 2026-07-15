import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileRecord, FileRecordSchema } from './schemas/file-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: FileRecord.name, schema: FileRecordSchema }]),
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: diskStorage({
          destination: (req, file, cb) => {
            const uploadDir = config.get<string>('uploadDir') ?? './uploads';
            // store under uploads/{tenantId}/
            const tenantId = (req as { user?: { tenantId?: string } }).user?.tenantId ?? 'unknown';
            const dir = `${uploadDir}/${tenantId}`;
            const { mkdirSync } = require('fs');
            mkdirSync(dir, { recursive: true });
            cb(null, dir);
          },
          filename: (_req, file, cb) => {
            cb(null, `${uuid()}${extname(file.originalname)}`);
          },
        }),
        limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
      }),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
