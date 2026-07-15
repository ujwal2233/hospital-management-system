import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PharmacyController } from './pharmacy.controller';
import { PharmacyService } from './pharmacy.service';
import { PharmacyItem, PharmacyItemSchema } from './schemas/pharmacy-item.schema';
import { DispensingRecord, DispensingRecordSchema } from './schemas/dispensing-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PharmacyItem.name, schema: PharmacyItemSchema },
      { name: DispensingRecord.name, schema: DispensingRecordSchema },
    ]),
  ],
  controllers: [PharmacyController],
  providers: [PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule {}
