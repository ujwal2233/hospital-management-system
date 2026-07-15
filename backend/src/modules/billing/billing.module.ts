import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentsModule } from '../appointments/appointments.module';
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';
import { Doctor, DoctorSchema } from '../doctors/schemas/doctor.schema';
import { PatientsModule } from '../patients/patients.module';
import { DispensingRecord, DispensingRecordSchema } from '../pharmacy/schemas/dispensing-record.schema';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: DispensingRecord.name, schema: DispensingRecordSchema },
    ]),
    PatientsModule,
    AppointmentsModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
