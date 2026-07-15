import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiTags } from '@nestjs/swagger';
import { Connection } from 'mongoose';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly db: Connection) {}

  @Public()
  @Get('liveness')
  liveness() {
    return { status: 'ok', ts: new Date().toISOString() };
  }

  @Public()
  @Get('readiness')
  async readiness() {
    const mongoOk = this.db.readyState === 1;
    const status = mongoOk ? 'ok' : 'degraded';
    return {
      status,
      ts: new Date().toISOString(),
      services: { mongo: mongoOk ? 'up' : 'down' },
    };
  }
}
