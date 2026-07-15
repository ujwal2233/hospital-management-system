import { apiClient } from './client';
import * as T from '../types/api';

// Utility envelopes
interface ResponseEnvelope<R> {
  success: boolean;
  data: R;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

// 1. Auth
export const authApi = {
  login: (data: any): Promise<any> => apiClient.post('/auth/login', data),
  logout: (): Promise<any> => apiClient.post('/auth/logout'),
  me: (): Promise<T.User> => apiClient.get('/auth/me'),
};

// 2. Tenants
export const tenantsApi = {
  create: (data: any): Promise<T.Tenant> => apiClient.post('/tenants', data),
  findAll: (): Promise<T.Tenant[]> => apiClient.get('/tenants'),
  findOne: (id: string): Promise<T.Tenant> => apiClient.get(`/tenants/${id}`),
  update: (id: string, data: any): Promise<T.Tenant> => apiClient.patch(`/tenants/${id}`, data),
};

// 3. Users
export const usersApi = {
  create: (data: any): Promise<T.User> => apiClient.post('/users', data),
  findAll: (params?: any): Promise<any> => apiClient.get('/users', { params }),
  findOne: (id: string): Promise<T.User> => apiClient.get(`/users/${id}`),
  update: (id: string, data: any): Promise<T.User> => apiClient.patch(`/users/${id}`, data),
};

// 4. Roles
export const rolesApi = {
  create: (data: any): Promise<T.Role> => apiClient.post('/roles', data),
  findAll: (): Promise<T.Role[]> => apiClient.get('/roles'),
  permissions: (): Promise<string[]> => apiClient.get('/roles/permissions'),
  findOne: (id: string): Promise<T.Role> => apiClient.get(`/roles/${id}`),
  update: (id: string, data: any): Promise<T.Role> => apiClient.patch(`/roles/${id}`, data),
};

// 5. Patients
export const patientsApi = {
  create: (data: any): Promise<T.Patient> => apiClient.post('/patients', data),
  findAll: (params?: any): Promise<any> => apiClient.get('/patients', { params }),
  findOne: (id: string): Promise<T.Patient> => apiClient.get(`/patients/${id}`),
  update: (id: string, data: any): Promise<T.Patient> => apiClient.patch(`/patients/${id}`, data),
};

// 6. Doctors
export const doctorsApi = {
  create: (data: any): Promise<T.Doctor> => apiClient.post('/doctors', data),
  findAll: (params?: any): Promise<any> => apiClient.get('/doctors', { params }),
  findOne: (id: string): Promise<T.Doctor> => apiClient.get(`/doctors/${id}`),
  update: (id: string, data: any): Promise<T.Doctor> => apiClient.patch(`/doctors/${id}`, data),
};

// 7. Departments
export const departmentsApi = {
  create: (data: any): Promise<T.Department> => apiClient.post('/departments', data),
  findAll: (params?: any): Promise<any> => apiClient.get('/departments', { params }),
  findOne: (id: string): Promise<T.Department> => apiClient.get(`/departments/${id}`),
  update: (id: string, data: any): Promise<T.Department> => apiClient.patch(`/departments/${id}`, data),
};

// 8. Appointments
export const appointmentsApi = {
  create: (data: any): Promise<T.Appointment> => apiClient.post('/appointments', data),
  findAll: (params?: any): Promise<any> => apiClient.get('/appointments', { params }),
  findOne: (id: string): Promise<T.Appointment> => apiClient.get(`/appointments/${id}`),
  update: (id: string, data: any): Promise<T.Appointment> => apiClient.patch(`/appointments/${id}`, data),
  updateStatus: (id: string, status: string, cancelReason?: string): Promise<T.Appointment> =>
    apiClient.patch(`/appointments/${id}/status`, { status, ...(cancelReason ? { cancelReason } : {}) }),
  cancel: (id: string, cancelReason?: string): Promise<T.Appointment> =>
    apiClient.patch(`/appointments/${id}/status`, { status: 'CANCELLED', ...(cancelReason ? { cancelReason } : {}) }),
  queue: (doctorId: string): Promise<T.Appointment[]> => apiClient.get(`/appointments/queue/${doctorId}`),
};

// 9. Medical Records
export const medicalRecordsApi = {
  create: (data: any): Promise<T.MedicalRecord> => apiClient.post('/medical-records', data),
  findAll: (params?: any): Promise<any> => apiClient.get('/medical-records', { params }),
  findOne: (id: string): Promise<T.MedicalRecord> => apiClient.get(`/medical-records/${id}`),
};

// 10. Prescriptions
export const prescriptionsApi = {
  create: (data: any): Promise<T.Prescription> => apiClient.post('/prescriptions', data),
  findAll: (params?: any): Promise<any> => apiClient.get('/prescriptions', { params }),
  findOne: (id: string): Promise<T.Prescription> => apiClient.get(`/prescriptions/${id}`),
};

// 11. Pharmacy
export const pharmacyApi = {
  createItem: (data: any): Promise<T.PharmacyItem> => apiClient.post('/pharmacy/items', data),
  findAllItems: (params?: any): Promise<any> => apiClient.get('/pharmacy/items', { params }),
  findOneItem: (id: string): Promise<T.PharmacyItem> => apiClient.get(`/pharmacy/items/${id}`),
  updateItem: (id: string, data: any): Promise<T.PharmacyItem> => apiClient.patch(`/pharmacy/items/${id}`, data),
  getLowStock: (): Promise<T.PharmacyItem[]> => apiClient.get('/pharmacy/items/low-stock'),
  dispense: (data: any): Promise<T.DispensingRecord> => apiClient.post('/pharmacy/dispense', data),
  findDispensing: (params?: any): Promise<any> => apiClient.get('/pharmacy/dispensing', { params }),
};

// 12. Laboratory
export const laboratoryApi = {
  create: (data: any): Promise<T.LabOrder> => apiClient.post('/laboratory', data),
  findAll: (params?: any): Promise<any> => apiClient.get('/laboratory', { params }),
  findOne: (id: string): Promise<T.LabOrder> => apiClient.get(`/laboratory/${id}`),
  update: (id: string, data: any): Promise<T.LabOrder> => apiClient.patch(`/laboratory/${id}`, data),
  addResults: (id: string, data: any): Promise<T.LabOrder> => apiClient.post(`/laboratory/${id}/results`, data),
};

// 13. Radiology
export const radiologyApi = {
  create: (data: any): Promise<T.RadiologyOrder> => apiClient.post('/radiology', data),
  findAll: (params?: any): Promise<any> => apiClient.get('/radiology', { params }),
  findOne: (id: string): Promise<T.RadiologyOrder> => apiClient.get(`/radiology/${id}`),
  update: (id: string, data: any): Promise<T.RadiologyOrder> => apiClient.patch(`/radiology/${id}`, data),
  addReport: (id: string, data: any): Promise<T.RadiologyOrder> => apiClient.post(`/radiology/${id}/report`, data),
};

// 14. Inventory
export const inventoryApi = {
  createItem: (data: any): Promise<T.InventoryItem> => apiClient.post('/inventory/items', data),
  findAllItems: (params?: any): Promise<any> => apiClient.get('/inventory/items', { params }),
  findOneItem: (id: string): Promise<T.InventoryItem> => apiClient.get(`/inventory/items/${id}`),
  updateItem: (id: string, data: any): Promise<T.InventoryItem> => apiClient.patch(`/inventory/items/${id}`, data),
  getLowStock: (): Promise<T.InventoryItem[]> => apiClient.get('/inventory/items/low-stock'),
  recordTransaction: (data: any): Promise<T.InventoryTransaction> => apiClient.post('/inventory/transactions', data),
  findTransactions: (params?: any): Promise<any> => apiClient.get('/inventory/transactions', { params }),
};

// 15. Insurance
export const insuranceApi = {
  createProvider: (data: any): Promise<T.InsuranceProvider> => apiClient.post('/insurance/providers', data),
  findAllProviders: (params?: any): Promise<any> => apiClient.get('/insurance/providers', { params }),
  updateProvider: (id: string, data: any): Promise<T.InsuranceProvider> => apiClient.patch(`/insurance/providers/${id}`, data),
  createClaim: (data: any): Promise<T.InsuranceClaim> => apiClient.post('/insurance/claims', data),
  findAllClaims: (params?: any): Promise<any> => apiClient.get('/insurance/claims', { params }),
  findOneClaim: (id: string): Promise<T.InsuranceClaim> => apiClient.get(`/insurance/claims/${id}`),
  updateClaim: (id: string, data: any): Promise<T.InsuranceClaim> => apiClient.patch(`/insurance/claims/${id}`, data),
};

// 16. Billing
export const billingApi = {
  createInvoice: (data: any): Promise<T.Invoice> => apiClient.post('/billing/invoices', data),
  findAllInvoices: (params?: any): Promise<any> => apiClient.get('/billing/invoices', { params }),
  findOneInvoice: (id: string): Promise<T.Invoice> => apiClient.get(`/billing/invoices/${id}`),
  addPayment: (id: string, data: any): Promise<T.Invoice> => apiClient.post(`/billing/invoices/${id}/payments`, data),
  cancelInvoice: (id: string): Promise<T.Invoice> => apiClient.patch(`/billing/invoices/${id}/cancel`),
};

// 17. Audit Logs
export const auditApi = {
  findAll: (params?: any): Promise<any> => apiClient.get('/audit-logs', { params }),
};

// 18. Settings
export const settingsApi = {
  findAll: (): Promise<Record<string, any>> => apiClient.get('/settings'),
  upsert: (data: Record<string, any>): Promise<Record<string, any>> => apiClient.patch('/settings', data),
};

// 19. Reports
export const reportsApi = {
  dashboard: (): Promise<T.DashboardData> => apiClient.get('/reports/dashboard'),
};

// 20. Files
export const filesApi = {
  upload: (formData: FormData): Promise<any> => apiClient.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadUrl: (id: string) => `${apiClient.defaults.baseURL}/files/${id}/download`,
  delete: (id: string): Promise<any> => apiClient.delete(`/files/${id}`),
};
