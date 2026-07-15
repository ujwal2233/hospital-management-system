import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class AppController {
  @Public()
  @Get()
  health() {
    return { status: 'ok', uptime: process.uptime() };
  }
}
