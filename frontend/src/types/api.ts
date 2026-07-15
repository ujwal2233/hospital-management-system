export interface Tenant {
  _id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  gstin?: string;
  isActive: boolean;
}

export interface User {
  _id: string;
  tenantId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface Role {
  _id: string;
  tenantId: string | null;
  name: string;
  permissions: string[];
  isSystem: boolean;
}

export interface Patient {
  _id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dob?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email?: string;
  bloodGroup?: string;
  abhaId?: string;
  address?: string;
  allergies: string[];
  emergencyContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  isActive: boolean;
}

export interface Doctor {
  _id: string;
  userId?: string | User;
  name: string;
  specialization: string;
  departmentId: string | { _id: string; name: string; code: string };
  licenseNumber: string;
  consultationFee: number;
  qualifications?: string[];
  isActive: boolean;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  headDoctorId?: string;
}

export interface Appointment {
  _id: string;
  patientId: string | { _id: string; firstName: string; lastName: string; mrn: string; phone: string; allergies?: string[] };
  doctorId: string | { _id: string; name: string; specialization: string; consultationFee?: number };
  departmentId: string | { _id: string; name: string; code: string };
  scheduledAt: string;
  durationMinutes: number;
  endsAt: string;
  status: 'SCHEDULED' | 'POSTPONED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  type: 'OPD' | 'FOLLOW_UP' | 'EMERGENCY';
  reason?: string;
  notes?: string;
  cancelReason?: string;
  postponeReason?: string;
  tokenNumber?: number | null;
}

export interface MedicalRecord {
  _id: string;
  patientId: string | { _id: string; firstName: string; lastName: string; mrn: string; allergies?: string[]; bloodGroup?: string };
  doctorId: string | { _id: string; name: string };
  appointmentId?: string;
  vitals?: {
    temperatureC?: number;
    bpSystolic?: number;
    bpDiastolic?: number;
    pulse?: number;
    respiratoryRate?: number;
    spo2?: number;
    weightKg?: number;
    heightCm?: number;
  };
  chiefComplaint?: string;
  diagnoses: Array<string | { code?: string; description: string }>;
  notes?: string;
  followUpDate?: string;
  createdAt: string;
}

export interface Prescription {
  _id: string;
  patientId: string;
  doctorId: string | { _id: string; name: string };
  recordId?: string;
  items: Array<{
    medicine: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  createdAt: string;
}

export interface PharmacyItem {
  _id: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  unit: string;
  stockQty: number;
  reorderLevel: number;
  unitPrice: number;
  batchNumber?: string;
  expiryDate?: string;
  isActive: boolean;
}

export interface DispensingRecord {
  _id: string;
  patientId: { _id: string; firstName: string; lastName: string; mrn: string };
  prescriptionId?: string;
  dispensedBy: { _id: string; firstName: string; lastName: string };
  items: Array<{
    itemId: { _id: string; name: string; unit: string };
    quantity: number;
    unitPrice: number;
  }>;
  notes?: string;
  invoiceId?: { _id: string; invoiceNumber: string; total: number; status: string } | null;
  createdAt: string;
}

export interface LabOrder {
  _id: string;
  patientId: { _id: string; firstName: string; lastName: string; mrn: string; phone?: string };
  orderedBy: { _id: string; firstName: string; lastName: string };
  appointmentId?: string;
  testName: string;
  testCode?: string;
  notes?: string;
  status: 'ORDERED' | 'SAMPLE_COLLECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  results: Array<{
    parameter: string;
    value: string;
    unit?: string;
    referenceRange?: string;
    flag?: string;
  }>;
  processedBy?: { _id: string; firstName: string; lastName: string };
  resultDate?: string;
  reportUrl?: string;
  createdAt: string;
}

export interface RadiologyOrder {
  _id: string;
  patientId: { _id: string; firstName: string; lastName: string; mrn: string; phone?: string };
  orderedBy: { _id: string; firstName: string; lastName: string };
  appointmentId?: string;
  modality: string;
  bodyPart: string;
  clinicalIndication?: string;
  status: 'ORDERED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  reportedBy?: { _id: string; firstName: string; lastName: string };
  findings?: string;
  impression?: string;
  reportDate?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface InventoryItem {
  _id: string;
  name: string;
  sku?: string;
  category?: string;
  unit: string;
  currentQty: number;
  reorderLevel: number;
  unitCost: number;
  location?: string;
  isActive: boolean;
}

export interface InventoryTransaction {
  _id: string;
  itemId: { _id: string; name: string; unit: string; sku?: string };
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  reference?: string;
  performedBy: { _id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface InsuranceProvider {
  _id: string;
  name: string;
  tpaCode?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
}

export interface InsuranceClaim {
  _id: string;
  patientId: { _id: string; firstName: string; lastName: string; mrn: string };
  invoiceId: { _id: string; invoiceNumber: string; total: number };
  providerId: { _id: string; name: string; tpaCode?: string };
  policyNumber: string;
  claimedAmount: number;
  approvedAmount: number;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' | 'PAID';
  remarks?: string;
  settledAt?: string;
  createdAt: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  patientId: { _id: string; firstName: string; lastName: string; mrn: string; phone?: string; email?: string };
  appointmentId?: { _id: string; scheduledAt: string; status: string; doctorId?: string };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  status: 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  payments: Array<{
    amount: number;
    method: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'INSURANCE';
    reference?: string;
    paidAt: string;
    receivedBy?: string | User;
  }>;
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  userId?: { _id: string; firstName: string; lastName: string; email: string } | null;
  action: string;
  resource: string;
  resourceId?: string;
  ip?: string;
  statusCode: number;
  createdAt: string;
}

export interface DashboardData {
  todaysAppointments: number;
  activeDoctors: number;
  activePatients: number;
  monthlyRevenue: number;
  appointmentStatus: Record<string, number>;
}
