import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppointmentStatus, InvoiceStatus } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { tenantFilter } from '../../common/utils/tenant';
import { Appointment, AppointmentDocument } from '../appointments/schemas/appointment.schema';
import { Invoice, InvoiceDocument } from '../billing/schemas/invoice.schema';
import { Doctor, DoctorDocument } from '../doctors/schemas/doctor.schema';
import { Patient, PatientDocument } from '../patients/schemas/patient.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Appointment.name) private readonly appointments: Model<AppointmentDocument>,
    @InjectModel(Doctor.name) private readonly doctors: Model<DoctorDocument>,
    @InjectModel(Invoice.name) private readonly invoices: Model<InvoiceDocument>,
    @InjectModel(Patient.name) private readonly patients: Model<PatientDocument>,
  ) {}

  async dashboard(user: AuthUser) {
    const scope = tenantFilter(user);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrow = new Date(todayStart.getTime() + 24 * 60 * 60_000);
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    const [
      todaysAppointments,
      activeDoctors,
      activePatients,
      monthlyRevenue,
      appointmentStatus,
    ] = await Promise.all([
      this.appointments.countDocuments({
        ...scope,
        scheduledAt: { $gte: todayStart, $lt: tomorrow },
      }),
      this.doctors.countDocuments({ ...scope, isActive: true }),
      this.patients.countDocuments({ ...scope, isActive: true }),
      this.invoices
        .aggregate<{ total: number }>([
          {
            $match: {
              ...scope,
              createdAt: { $gte: monthStart },
              status: { $ne: InvoiceStatus.CANCELLED },
            },
          },
          { $group: { _id: null, total: { $sum: '$amountPaid' } } },
        ])
        .exec(),
      this.appointments
        .aggregate<{ _id: AppointmentStatus; count: number }>([
          {
            $match: {
              ...scope,
              scheduledAt: { $gte: todayStart, $lt: tomorrow },
            },
          },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ])
        .exec(),
    ]);

    return {
      todaysAppointments,
      activeDoctors,
      activePatients,
      monthlyRevenue: monthlyRevenue[0]?.total ?? 0,
      appointmentStatus: appointmentStatus.reduce<Record<string, number>>((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };
  }
}
