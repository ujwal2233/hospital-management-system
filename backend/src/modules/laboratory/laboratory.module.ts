import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LaboratoryController } from './laboratory.controller';
import { LaboratoryService } from './laboratory.service';
import { LabOrder, LabOrderSchema } from './schemas/lab-order.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: LabOrder.name, schema: LabOrderSchema }])],
  controllers: [LaboratoryController],
  providers: [LaboratoryService],
  exports: [LaboratoryService],
})
export class LaboratoryModule {}
