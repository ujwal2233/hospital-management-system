import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { ProtectedRoute } from './auth/ProtectedRoute';

// Lazy load all views
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PatientList = lazy(() => import('./pages/patients/PatientList'));
const PatientDetail = lazy(() => import('./pages/patients/PatientDetail'));
const DoctorList = lazy(() => import('./pages/doctors/DoctorList'));
const DepartmentList = lazy(() => import('./pages/departments/DepartmentList'));
const AppointmentList = lazy(() => import('./pages/appointments/AppointmentList'));
const MedicalRecordList = lazy(() => import('./pages/records/MedicalRecordList'));
const PrescriptionList = lazy(() => import('./pages/prescriptions/PrescriptionList'));
const PharmacyDashboard = lazy(() => import('./pages/pharmacy/PharmacyDashboard'));
const LaboratoryDashboard = lazy(() => import('./pages/laboratory/LaboratoryDashboard'));
const RadiologyDashboard = lazy(() => import('./pages/radiology/RadiologyDashboard'));
const InventoryDashboard = lazy(() => import('./pages/inventory/InventoryDashboard'));
const InsuranceDashboard = lazy(() => import('./pages/insurance/InsuranceDashboard'));
const BillingList = lazy(() => import('./pages/billing/BillingList'));
const UserList = lazy(() => import('./pages/users/UserList'));
const RoleList = lazy(() => import('./pages/roles/RoleList'));
const AuditLogList = lazy(() => import('./pages/audit/AuditLogList'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const HospitalList = lazy(() => import('./pages/hospitals/HospitalList'));

const PageLoader = () => (
  <div className="flex h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <Shell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          {
            path: 'dashboard',
            element: (
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            ),
          },
          // Patients
          {
            path: 'patients',
            element: <ProtectedRoute permission="patients:read" />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <PatientList />
                  </Suspense>
                ),
              },
              {
                path: ':id',
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <PatientDetail />
                  </Suspense>
                ),
              },
            ],
          },
          // Doctors
          {
            path: 'doctors',
            element: <ProtectedRoute permission="doctors:read" />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <DoctorList />
                  </Suspense>
                ),
              },
            ],
          },
          // Departments
          {
            path: 'departments',
            element: <ProtectedRoute permission="departments:read" />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <DepartmentList />
                  </Suspense>
                ),
              },
            ],
          },
          // Appointments
          {
            path: 'appointments',
            element: <ProtectedRoute permission="appointments:read" />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <AppointmentList />
                  </Suspense>
                ),
              },
            ],
          },
          // Records
          {
            path: 'records',
            element: <ProtectedRoute permission="medical-records:read" />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <MedicalRecordList />
                  </Suspense>
                ),
              },
            ],
          },
          // Prescriptions
          {
            path: 'prescriptions',
            element: <ProtectedRoute permission="prescriptions:read" />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <PrescriptionList />
                  </Suspense>
                ),
              },
            ],
          },
          // Pharmacy
          {
            path: 'pharmacy',
            element: <ProtectedRoute permission="pharmacy:read" />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <PharmacyDashboard />
                  </Suspense>
                ),
              },
            ],
          },
          // Laboratory
          {
            path: 'laboratory',
            element: <ProtectedRoute permission="laboratory:read" />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <LaboratoryDashboard />
                  </Suspense>
                ),
              },
            ],
          },
          // Radiology
          {
            path: 'radiology',
            element: <ProtectedRoute permission="radiology:read" />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <RadiologyDashboard />
                  </Suspense>
                ),
              },
            ],
          },
          // Inventory
          {
            path: 'inventory',
            element: <ProtectedRoute permission="inventory:read" />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <InventoryDashboard />
                  </Suspense>
                ),
              },
            ],
          },
          // Insurance
          {
            path: 'insurance',
            element: <ProtectedRoute permission="insurance:read" />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <InsuranceDashboard />
                  </Suspense>
                ),
              },
            ],
          },
          // Billing
          {
            path: 'billing',
            element: <ProtectedRoute permission="billing:read" />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <BillingList />
                  </Suspense>
                ),
              },
            ],
          },
          // Users
          {
            path: 'users',
            element: <ProtectedRoute permission="users:read" />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <UserList />
                  </Suspense>
                ),
              },
            ],
          },
          // Roles
          {
            path: 'roles',
            element: <ProtectedRoute permission="roles:read" />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <RoleList />
                  </Suspense>
                ),
              },
            ],
          },
          // Audit
          {
            path: 'audit',
            element: <ProtectedRoute permission="audit-logs:read" />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <AuditLogList />
                  </Suspense>
                ),
              },
            ],
          },
          // Settings
          {
            path: 'settings',
            element: <ProtectedRoute permission="settings:read" />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <SettingsPage />
                  </Suspense>
                ),
              },
            ],
          },
          // Hospitals (Super Admin only)
          {
            path: 'hospitals',
            element: <ProtectedRoute superAdminOnly />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <HospitalList />
                  </Suspense>
                ),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
