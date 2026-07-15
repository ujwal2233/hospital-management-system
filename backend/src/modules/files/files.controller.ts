import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { FilesService } from './files.service';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly svc: FilesService) {}

  @Post('upload')
  @Permissions('files:create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload a file' })
  upload(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    return this.svc.createRecord(user, file);
  }

  @Get(':id/download')
  @Permissions('files:read')
  async download(@CurrentUser() user: AuthUser, @Param('id') id: string, @Res() res: Response) {
    const record = await this.svc.findOne(user, id);
    const fullPath = join(process.cwd(), record.storagePath);
    if (!existsSync(fullPath)) throw new NotFoundException('File not found on disk');
    res.download(fullPath, record.originalName);
  }

  @Delete(':id')
  @Permissions('files:delete')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.remove(user, id);
  }
}
