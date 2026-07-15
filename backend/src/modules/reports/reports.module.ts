import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';
import { Invoice, InvoiceSchema } from '../billing/schemas/invoice.schema';
import { Doctor, DoctorSchema } from '../doctors/schemas/doctor.schema';
import { Patient, PatientSchema } from '../patients/schemas/patient.schema';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Patient.name, schema: PatientSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
