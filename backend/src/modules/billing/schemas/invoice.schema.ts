import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { InvoiceStatus, PaymentMethod } from '../../../common/enums';

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ _id: false })
export class InvoiceItem {
  @Prop({ required: true }) description: string;
  @Prop({ required: true, min: 1 }) quantity: number;
  @Prop({ required: true, min: 0 }) unitPrice: number;
  @Prop({ required: true, min: 0 }) amount: number;
}

@Schema({ _id: false })
export class Payment {
  @Prop({ required: true, min: 0.01 }) amount: number;
  @Prop({ type: String, enum: Object.values(PaymentMethod), required: true })
  method: PaymentMethod;
  @Prop() reference?: string;
  @Prop({ type: Date, required: true }) paidAt: Date;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) receivedBy: Types.ObjectId;
}

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  invoiceNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Appointment', default: null })
  appointmentId: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], ref: 'Appointment', default: [] })
  appointmentIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'DispensingRecord', default: [] })
  dispensingRecordIds: Types.ObjectId[];

  @Prop({ type: [InvoiceItem], required: true })
  items: InvoiceItem[];

  @Prop({ required: true, min: 0 }) subtotal: number;
  @Prop({ required: true, min: 0, default: 0 }) discount: number;
  @Prop({ required: true, min: 0, default: 0 }) taxRate: number;
  @Prop({ required: true, min: 0, default: 0 }) taxAmount: number;
  @Prop({ required: true, min: 0 }) total: number;
  @Prop({ required: true, min: 0, default: 0 }) amountPaid: number;

  @Prop({ type: String, enum: Object.values(InvoiceStatus), default: InvoiceStatus.ISSUED })
  status: InvoiceStatus;

  @Prop({ type: [Payment], default: [] })
  payments: Payment[];

  @Prop()
  notes?: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
InvoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ tenantId: 1, status: 1 });
InvoiceSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
