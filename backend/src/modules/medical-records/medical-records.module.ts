import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientsModule } from '../patients/patients.module';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecord, MedicalRecordSchema } from './schemas/medical-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MedicalRecord.name, schema: MedicalRecordSchema }]),
    PatientsModule,
  ],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService],
  exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}
