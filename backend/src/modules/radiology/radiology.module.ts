import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RadiologyController } from './radiology.controller';
import { RadiologyService } from './radiology.service';
import { RadiologyOrder, RadiologyOrderSchema } from './schemas/radiology-order.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: RadiologyOrder.name, schema: RadiologyOrderSchema }])],
  controllers: [RadiologyController],
  providers: [RadiologyService],
  exports: [RadiologyService],
})
export class RadiologyModule {}
