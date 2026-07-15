# Enterprise Hospital Management System (HMS) — Project Analysis
**Comprehensive Project Documentation & Analysis**

**Date:** 2026-07-08 | **Version:** 1.0 | **Status:** Development Phase

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Core Features & Modules](#core-features--modules)
6. [Data Model & Database Design](#data-model--database-design)
7. [Security & Compliance](#security--compliance)
8. [User Roles & Permissions](#user-roles--permissions)
9. [Frontend Architecture](#frontend-architecture)
10. [Backend Architecture](#backend-architecture)
11. [Deployment & Infrastructure](#deployment--infrastructure)
12. [Current Status & MVP Scope](#current-status--mvp-scope)
13. [Testing & Quality Assurance](#testing--quality-assurance)
14. [Performance Considerations](#performance-considerations)

---

## Executive Summary

**Enterprise Hospital Management System (HMS)** is a multi-tenant, cloud-hosted SaaS platform designed to digitize and streamline hospital operations across India-compliant workflows. The system serves multiple hospitals as independent tenants with strict logical data isolation, providing a comprehensive end-to-end solution from patient registration through clinical documentation, diagnostics, pharmacy, billing, and inventory management.

### Key Characteristics
- **Multi-Tenant Architecture:** Single MongoDB instance with tenant-scoped data isolation
- **Full-Stack TypeScript:** NestJS (backend) + React (frontend) for consistency and type safety
- **Production-Ready Security:** JWT + refresh rotation, RBAC/permissions, audit logging, encryption
- **India-Compliance Focused:** ABDM/NDHM readiness, DPDP Act 2023 compliance, GST invoicing
- **Enterprise Scalability:** Stateless API design for horizontal scaling, Redis caching, BullMQ job queues
- **MVP Release:** Core auth, tenancy, users, roles, patients, doctors, appointments, EMR, billing, audit

---

## Project Overview

### 1.1 Business Objectives

| Objective | Impact |
|-----------|--------|
| Reduce patient registration and check-in time | 70% improvement |
| Provide single source of truth for medical records | Cross-department visibility |
| Automate revenue cycle management | GST invoicing, insurance claims, payment tracking |
| Real-time operational dashboards | Hospital management insights |
| Regulatory compliance (ABDM, DPDP) | Legal alignment, data protection |

### 1.2 Stakeholders

| Stakeholder | Primary Interests |
|-------------|-------------------|
| Hospital Owners/Management | Revenue optimization, operational efficiency, compliance reporting |
| Clinical Staff (Doctors, Nurses) | Workflow efficiency, low-friction documentation, patient history access |
| Administrative Staff (Receptionist, Accountant) | Registration speed, billing accuracy, financial reconciliation |
| Pharmacists/Lab/Radiology | Order fulfillment workflows, results documentation |
| Patients | Appointment booking, records access, transparent billing |
| Platform Operator (SaaS Provider) | Tenant onboarding, uptime, support efficiency |
| Regulators (ABDM, DPDP Authority) | Consent management, auditability, data protection |

### 1.3 Compliance Landscape

#### ABDM/NDHM (Ayushman Bharat Digital Mission)
- Patient records include optional **ABHA ID** field for national health identifiers
- Architecture maintains compliance abstraction layer for future HIP/HIU integration
- No refactoring needed when ABDM verification and registry integration added

#### DPDP Act 2023 (Data Protection)
- Purpose-limited data collection with consent capture
- Right to correction/erasure workflows (anonymization for records with retention obligations)
- Immutable breach audit trail for regulatory inspection
- User consent management per clinical vs. administrative data

#### GST Compliance
- Invoices support GST fields (GSTIN, HSN/SAC codes)
- Sequential invoice numbering per tenant
- Tax calculation and reporting ready

#### Clinical Coding Standards
- Diagnosis entries structured to accept ICD-10 codes
- Medical record fields support standardized vocabularies
- Future readiness for SNOMED CT integration

---

## Technology Stack

### Backend
| Layer | Technologies |
|-------|--------------|
| **Runtime** | Node.js 20 LTS |
| **Framework** | NestJS 10.4.6 (TypeScript-first) |
| **API** | REST with OpenAPI/Swagger documentation |
| **Database Driver** | Mongoose 8.9 ODM for MongoDB |
| **Authentication** | Passport.js + JWT (15 min access, 7 day refresh) |
| **Authorization** | Custom RBAC guard with permission checking |
| **Caching** | Redis 7 via cache-manager + cache-manager-redis-yet |
| **Job Queue** | BullMQ 5.79 with Redis backend |
| **Security** | Helmet.js (secure headers), bcryptjs (Argon2-ready) |
| **Rate Limiting** | NestJS Throttler (120 req/60s default) |
| **File Upload** | Multer 2.2 |
| **Email** | Nodemailer 9.0 (SMTP support) |
| **Validation** | class-validator + Joi for DTOs and config |
| **Testing** | Jest (configured in package.json) |
| **Build** | NestJS CLI with TypeScript compilation |

### Frontend
| Layer | Technologies |
|-------|--------------|
| **Runtime** | Browser (React 18 compliant) |
| **Framework** | React 18.3.1 + React DOM |
| **Build Tool** | Vite 5.4.11 (fast HMR, optimized bundles) |
| **Language** | TypeScript 5.5.4 |
| **Routing** | React Router DOM 6.30.4 (nested routes, lazy loading ready) |
| **State Management** | React Query (TanStack) 5.101.2 for server state |
| **Forms** | React Hook Form 7.81 + @hookform/resolvers |
| **Validation** | Zod 4.4.3 (schema-based validation) |
| **HTTP Client** | Axios 1.18.1 with auth/refresh interceptors |
| **UI Components** | Radix UI (headless, accessible) |
| **Styling** | Tailwind CSS 3.4.19 + PostCSS |
| **Icons** | Lucide React 0.468 |
| **Charts** | Recharts 3.9.2 (responsive dashboards) |
| **Utilities** | clsx (conditional classes) |

### Infrastructure & DevOps
| Component | Technologies |
|-----------|--------------|
| **Container Runtime** | Docker (multi-stage images for backend & frontend) |
| **Orchestration** | Docker Compose (local dev/single-node), Kubernetes-ready |
| **Database** | MongoDB 7 (shared multi-tenant database) |
| **Cache/Queue** | Redis 7 (cache + BullMQ) |
| **Reverse Proxy** | Nginx (development container) |
| **Load Balancing** | Ready for cloud LB (stateless API design) |

### Development Tools
- **Version Control:** Git with gitignore
- **Code Quality:** ESLint (configured in package.json)
- **Package Manager:** npm
- **Containerization:** Docker Compose for local environment

---

## Architecture

### 2.1 High-Level System Architecture

```
┌────────────────────────────────────────────────────────────┐
│                        SaaS Cloud                          │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  HTTPS                                               │ │
│  │  ┌──────────────────────────────────────────────┐   │ │
│  │  │ Frontend (React SPA - Vite)                 │   │ │
│  │  │ • Multi-tenant UI                           │   │ │
│  │  │ • Role-based routing & menus                │   │ │
│  │  │ • React Query for state management          │   │ │
│  │  │ • Tailwind + Radix UI components            │   │ │
│  │  └──────────────┬───────────────────────────────┘   │ │
│  │                 │                                    │ │
│  │         ┌───────▼────────┐                          │ │
│  │         │   Nginx Proxy  │ /api → backend           │ │
│  │         └───────┬────────┘                          │ │
│  │                 │                                    │ │
│  │  ┌──────────────▼──────────────────────────────┐   │ │
│  │  │  Backend API (NestJS)                       │   │ │
│  │  │  • REST endpoints (versioned /api/v1)       │   │ │
│  │  │  • JWT + Refresh token auth                 │   │ │
│  │  │  • Multi-tenant request context             │   │ │
│  │  │  • RBAC + Permission guards                 │   │ │
│  │  │  • Audit interceptors                       │   │ │
│  │  │  • Rate limiting & throttling                │   │ │
│  │  │  • OpenAPI/Swagger documentation            │   │ │
│  │  └──────────────┬──────────────────────────────┘   │ │
│  │                 │                                    │ │
│  │         ┌───────┴────────────┬─────────────┐        │ │
│  │         │                    │             │        │ │
│  │  ┌──────▼─────┐   ┌─────────▼──┐   ┌────▼────┐   │ │
│  │  │  MongoDB   │   │   Redis    │   │ BullMQ  │   │ │
│  │  │ Shared DB  │   │   Cache    │   │ Queues  │   │ │
│  │  │ (tenant    │   │ (hot data) │   │ (async  │   │ │
│  │  │  scoped)   │   │            │   │  jobs)  │   │ │
│  │  └────────────┘   └────────────┘   └─────────┘   │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  Stateless API (×N pods behind load balancer)        │
│  Horizontal scaling & auto-recovery ready             │
└────────────────────────────────────────────────────────┘

 ┌─────────────────────┐
 │  External Services  │
 ├─────────────────────┤
 │ • Email (Nodemailer)│
 │ • SMS (integrable)  │
 │ • ABDM (future)     │
 │ • Payment Gateway   │
 │ • File Storage (S3) │
 └─────────────────────┘
```

### 2.2 Multi-Tenant Data Isolation Strategy

**Pattern:** Shared Database with Logical Isolation

- **Every collection carries `tenantId`** (indexed, part of compound unique constraints)
- **JWT contains tenant context:** `user.tenantId` embedded in token payload
- **Service-layer isolation:** All queries built from authenticated user's tenantId; client cannot override
- **Compound unique indexes:** `{tenantId, email}`, `{tenantId, mrn}`, `{tenantId, code}`, etc.
- **Super-admin override:** Optional `x-tenant-id` header in JwtAuthGuard for impersonation (logged)
- **Escape hatch for scale:** Repository layer abstraction allows future DB-per-tenant migration without code changes

**Advantages:**
- Simple deployment and maintenance (single DB connection string)
- Cost-effective for early-stage SaaS
- No ETL or cross-tenant join complexity
- Logical schema is uniform across all tenants

**Security Invariant:** A user can never query or mutate a record outside their tenant.

---

## Core Features & Modules

### 3.1 Authentication & Session Management

**Module:** `auth/`

#### Features
- **Email + Password Login** scoped to tenant
- **Bcryptjs Password Hashing** (cost 12, Argon2-ready architecture)
- **JWT Access Token** (15 min TTL) with tenant & role context
- **Refresh Token Rotation** (7 day TTL, bcrypt-hashed in database)
- **Logout Invalidation** (refresh token cleared immediately)
- **Account Lockout Ready** (isActive flag prevents authentication)
- **MFA & Password Reset** (design-ready, Phase 2 release)

#### Key Files
- `modules/auth/auth.controller.ts` — login, refresh, logout endpoints
- `modules/auth/auth.service.ts` — credential verification, token generation
- `modules/auth/strategies/` — JWT/local Passport strategies
- `common/guards/jwt-auth.guard.ts` — global JWT validation

#### Request Flow
1. User submits email + password to `POST /api/v1/auth/login`
2. AuthService verifies against user record + tenant
3. Access token + refresh token issued
4. Frontend stores both; includes Bearer token in Authorization header
5. On token expiry, frontend calls `POST /api/v1/auth/refresh` with refresh token
6. New access token issued; refresh token rotated and rehashed
7. On logout, refresh token cleared from database

---

### 3.2 Tenant Management (Hospital SaaS Context)

**Module:** `tenants/`

#### Features
- **Hospital Registration** (SUPER_ADMIN only)
- **Unique Hospital Code** (identifier for MRN, invoice prefixes)
- **GSTIN & Contact Metadata** (India GST compliance)
- **Soft Deactivation** (isActive flag; no hard deletes for compliance)
- **Hospital Admin Assignment** (automatic HOSPITAL_ADMIN user creation)

#### Key Fields
```
{
  _id: ObjectId,
  name: "CGH Multi-Specialty Hospital",
  code: "CGH",            # unique, used in MRN + invoice prefixes
  gstin: "06XXXXX...",    # India GST identifier
  contact: { email, phone, address },
  isActive: true,
  createdAt, updatedAt
}
```

#### Scope
- Only SUPER_ADMIN can create/update tenants
- Every other operation is tenant-scoped via JWT context
- Future: multi-clinic/branch support via hierarchy

---

### 3.3 User & Role Management

**Module:** `users/`, `roles/`

#### User Features
- **Per-Tenant User Creation** (HOSPITAL_ADMIN within own tenant)
- **Role Assignment** (system or custom roles)
- **Email-based Deactivation** (no cascading deletes; soft deactivate)
- **Password Reset Ready** (Phase 2)

#### Role Features
- **System Roles** (read-only): SUPER_ADMIN, HOSPITAL_ADMIN, DOCTOR, NURSE, RECEPTIONIST, PHARMACIST, LAB_TECHNICIAN, RADIOLOGIST, ACCOUNTANT, INVENTORY_MANAGER, PATIENT
- **Custom Roles per Tenant** (HOSPITAL_ADMIN creates from permission catalog)
- **Permission Bundling** (`role.permissions[]` array of strings like "patients:create")

#### Key Files
- `modules/users/users.controller.ts`, `users.service.ts`
- `modules/roles/roles.controller.ts`, `roles.service.ts`

---

### 3.4 Patient Management

**Module:** `patients/`

#### Features
- **Unique MRN Generation** (Medical Record Number, format: `<TENANT_CODE>-<seq>`)
- **Demographics Collection** (name, DOB, gender, blood group, phone, emergency contact)
- **ABHA ID Field** (optional, for ABDM integration readiness)
- **Allergy Tracking** (array of known allergies/adverse reactions)
- **Search Capabilities** (by MRN, name, phone; paginated)
- **Soft Deactivation** (no hard deletes for compliance)

#### Key Fields
```
{
  _id: ObjectId,
  tenantId: ObjectId,
  mrn: "CGH-0001234",     # unique per tenant
  name, dob, gender,
  phone,                   # indexed for quick lookup
  abhaId?: "XXXX-XXXX-...", # optional, ABDM ready
  bloodGroup,
  allergies: [string],     # known allergies
  emergencyContact: { name, phone, relation },
  isActive: true,
  createdAt, updatedAt, createdBy
}
```

#### Indexes
- `{tenantId, mrn}` unique
- `{tenantId, phone}`
- Text search on name

---

### 3.5 Doctor & Department Management

**Module:** `doctors/`, `departments/`

#### Department Features
- **Department Code** (unique per tenant, e.g., "CARDIOLOGY")
- **Department Head** (optional reference to doctor)
- **Ward Assignment Ready** (for inpatient workflows, Phase 2)

#### Doctor Features
- **Specialization** (e.g., "Cardiologist", "Orthopedist")
- **License Number** (regulatory compliance)
- **Consultation Fee**
- **Weekly Availability Schedule** (time slots, working days)
- **Link to User Account** (optional; some doctors may not have login access)
- **Department Assignment**

#### Key Fields
```
Doctor {
  _id: ObjectId,
  tenantId: ObjectId,
  name, specialization,
  departmentId: ObjectId,
  licenseNumber: string,
  consultationFee: number,
  userId?: ObjectId,     # optional link to staff user
  schedule: [           # weekly availability
    { day: "Monday", slots: [{start: "09:00", end: "10:00"}, ...] }
  ],
  isActive: true,
  createdAt, updatedAt
}
```

---

### 3.6 Appointment & Queue Management

**Module:** `appointments/`

#### Features
- **Slot-Based Booking** (doctor + slot + date validation)
- **Double-Booking Prevention** (unique constraint on doctor × slot × date)
- **Queue Token Generation** (automatic, sequential per day/doctor)
- **Status Lifecycle:** `SCHEDULED → CHECKED_IN → IN_PROGRESS → COMPLETED` or `CANCELLED` / `NO_SHOW`
- **Automatic Timeout Handling** (Phase 2: no-show after X minutes)
- **Walk-in Patient Support** (appointment created on-the-fly, registered in queue)

#### Key Fields
```
{
  _id: ObjectId,
  tenantId: ObjectId,
  patientId: ObjectId,
  doctorId: ObjectId,
  departmentId: ObjectId,
  scheduledAt: DateTime,   # appointment start time
  endsAt: DateTime,        # expected end time
  status: "SCHEDULED" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW",
  tokenNumber: number,     # queue position for the day
  notes?: string,          # receptionist notes
  createdAt, updatedAt
}
```

#### Indexes
- `{tenantId, doctorId, scheduledAt}` — for doctor's schedule lookup
- `{tenantId, patientId}` — for patient's appointment history

---

### 3.7 Medical Records (EMR)

**Module:** `medical-records/`

#### Features
- **Consultation Notes** (doctor's clinical observations, free text + structured fields)
- **Vitals Recording** (HR, BP, SpO2, temperature, RR, weight, height)
- **Diagnosis Documentation** (ICD-10 codes, clinical assessment)
- **Mandatory Appointment Link** (links consultation to specific appointment)
- **Immutable Audit Trail** (creation timestamp, creator, no retroactive edits without flag)
- **Multi-Provider Support** (same patient, different doctors, separate records)

#### Key Fields
```
{
  _id: ObjectId,
  tenantId: ObjectId,
  patientId: ObjectId,
  doctorId: ObjectId,
  appointmentId: ObjectId,   # links to consultation
  vitals: {
    heartRate?: number,
    bloodPressure?: { systolic, diastolic },
    spO2?: number,
    temperature?: number,
    respiratoryRate?: number,
    weight?: number,
    height?: number
  },
  diagnoses: [{           # ICD-10 codes
    code: string,
    description: string,
    severity?: "mild" | "moderate" | "severe"
  }],
  notes: string,          # clinical narrative
  treatments?: [string],  # treatment plan
  createdAt, updatedAt, createdBy, updatedBy
}
```

#### Permissions
- Only DOCTOR can create/update own records
- NURSE can record vitals only
- DOCTOR can read any patient record (same tenant)
- RECEPTIONIST can view summaries

---

### 3.8 Prescriptions

**Module:** `prescriptions/`

#### Features
- **Medication List** (drug name, dosage, frequency, duration, quantity)
- **Prescription Validation** (drug + dose + frequency consistency check, Phase 2)
- **Link to Medical Record** (references consultation that prompted prescription)
- **Multiple Items per Rx** (one prescription = bundle of medications)
- **Status Tracking** (ACTIVE, COMPLETED, CANCELLED)
- **Patient Dispensing** (pharmacy fulfillment workflow, Phase 2)

#### Key Fields
```
{
  _id: ObjectId,
  tenantId: ObjectId,
  patientId: ObjectId,
  doctorId: ObjectId,
  recordId?: ObjectId,    # medical record reference
  items: [{
    drugName: string,
    dosage: string,       # e.g., "500mg"
    frequency: string,    # e.g., "twice daily"
    duration: string,     # e.g., "7 days"
    quantity: number,
    notes?: string
  }],
  status: "ACTIVE" | "COMPLETED" | "CANCELLED",
  createdAt, updatedAt
}
```

---

### 3.9 Billing & Invoicing

**Module:** `billing/`

#### Features
- **Sequential Invoice Numbering** (per tenant, atomic counter update)
- **GST Calculation** (HSN/SAC codes, tax rates per item)
- **Multi-Item Invoices** (patients, doctors, procedures, medicines)
- **Payment Tracking** (partial payments, outstanding balance)
- **Insurance Claim Integration Ready** (Phase 2: insurance TPA flows)
- **Invoice Status** (DRAFT, FINALIZED, PAID, PARTIAL, OVERDUE, CANCELLED)
- **Audit Trail** (who created, when finalized, payment records)

#### Key Fields
```
{
  _id: ObjectId,
  tenantId: ObjectId,
  invoiceNumber: string,   # unique per tenant, e.g., "CGH-INV-202607-0001"
  patientId: ObjectId,
  items: [{
    description: string,   # e.g., "Consultation - Dr. Asha"
    quantity: number,
    rate: number,
    amount: number,
    hsnCode?: string,      # GST code
    taxRate: number        # 5%, 12%, 18%
  }],
  totals: {
    subtotal: number,
    taxAmount: number,
    grossTotal: number
  },
  payments: [{             # payment records
    amount: number,
    method: "CASH" | "CARD" | "UPI" | "CHEQUE",
    referenceNumber?: string,
    paidAt: DateTime
  }],
  outstandingBalance: number,
  status: "DRAFT" | "FINALIZED" | "PAID" | "PARTIAL" | "OVERDUE" | "CANCELLED",
  dueDate?: DateTime,
  createdAt, finalizedAt?, paidAt?, createdBy
}
```

#### Indexes
- `{tenantId, invoiceNumber}` unique
- `{tenantId, patientId, status}` — for patient statements
- `{tenantId, status}` — for financial dashboards

---

### 3.10 Audit Logging

**Module:** `audit/`

#### Features
- **Immutable Audit Logs** (no update/delete after creation)
- **Mutation Tracking** (every CREATE, UPDATE, DELETE logged automatically)
- **Context Capture** (user ID, IP address, tenant, timestamp)
- **Request/Response Snapshot** (request body hash, response status)
- **Compliance-Ready** (for DPDP Act audit trail requirements)
- **TTL-Exempt** (MongoDB TTL indexes don't apply; 7+ year retention)

#### Key Fields
```
{
  _id: ObjectId,
  tenantId: ObjectId,
  userId: ObjectId,
  action: "CREATE" | "UPDATE" | "DELETE",
  resource: string,       # e.g., "patients", "invoices"
  resourceId: ObjectId,
  resourceName?: string,  # e.g., patient name for context
  changes?: {             # {field: {old, new}} for UPDATE
    fieldName: { old: any, new: any }
  },
  requestBody?: object,   # snapshot (for disputes)
  responseStatus: number,
  ipAddress: string,
  userAgent?: string,
  createdAt: DateTime,    # immutable
}
```

#### Interceptor Integration
- `AuditInterceptor` in pipeline wraps mutations
- Automatic capture on success (non-500 errors still logged)
- Non-mutation GETs/HEADs not logged (perf optimization)

---

### 3.11 Reports (Analytics & Dashboards)

**Module:** `reports/`

#### Features (MVP)
- **Patient Census Report** (total patients, active, demographics)
- **Appointment Analytics** (daily/weekly volumes, no-show rate, revenue)
- **Doctor Utilization** (consultation count, average rating, revenue)
- **Financial Dashboard** (daily revenue, pending invoices, expense summary)
- **Department Performance** (patient flow, wait times, revenue per department)

#### Design Pattern
- Read-only aggregation from source collections
- Optional caching for expensive queries (Redis)
- Future: dedicated analytics DB or BI tool (Tableau, Metabase)

---

### 3.12 Ancillary Modules (MVP + Phase 2)

#### Pharmacy (`pharmacy/`)
- Inventory of medicines (name, SKU, cost, selling price, batch/expiry)
- Prescription fulfillment workflow (dispatch, stock reduction)
- Expiry alerts and stock replenishment
- Pharma-specific RBAC (only PHARMACIST can dispense)

#### Laboratory (`laboratory/`)
- Lab order creation (tests, sample type, priority)
- Results entry (lab values, reference ranges, abnormal flags)
- Report generation and patient notification
- LAB_TECHNICIAN role isolation

#### Radiology (`radiology/`)
- Imaging order creation (modality, body part, urgency)
- DICOM image links (Phase 2: S3 storage integration)
- Radiologist report (findings, impression, recommendations)
- RADIOLOGIST role isolation

#### Inventory (`inventory/`)
- Stock tracking (consumables, equipment, supplies)
- Stock transactions (receipts, adjustments, issues)
- Reorder levels and alerts
- INVENTORY_MANAGER role isolation

#### Insurance (`insurance/`)
- TPA partner setup and credentials
- Patient insurance plan details
- Claim submission and tracking
- ACCOUNTANT-only access

#### Notifications (`notifications/`)
- Appointment reminders (SMS, email)
- Lab/radiology result alerts
- Payment due reminders
- Pharmacist/Lab order dispatch notifications

#### Files (`files/`)
- Presigned S3 URLs for medical document uploads
- Attachment linking to patients/appointments/records
- Metadata indexing for fast search

#### Settings (`settings/`)
- Hospital configuration (business hours, holidays, departments)
- User preferences (notification opt-ins, language)
- System-wide feature flags

---

## Data Model & Database Design

### 4.1 Collections & Indexes

| Collection | Purpose | Key Unique Constraint | Indexes | TTL |
|---|---|---|---|---|
| **tenants** | Hospital/org records | `{code}` | `{code}` | None |
| **users** | Staff login accounts | `{tenantId, email}` | `{tenantId, email}`, `{tenantId, role}` | None |
| **roles** | Permission bundles | `{tenantId, name}` if custom | `{tenantId, name}` | None |
| **patients** | Patient demographics | `{tenantId, mrn}` | `{tenantId, mrn}`, `{tenantId, phone}`, text(name) | None |
| **departments** | Hospital departments | `{tenantId, code}` | `{tenantId, code}` | None |
| **doctors** | Doctor profiles | None | `{tenantId, departmentId}`, `{tenantId, name}` | None |
| **appointments** | Consultation slots | None | `{tenantId, doctorId, scheduledAt}`, `{tenantId, patientId}` | None |
| **medicalrecords** | EMR/consultation notes | None | `{tenantId, patientId, createdAt}`, `{tenantId, appointmentId}` | None |
| **prescriptions** | Medication orders | None | `{tenantId, patientId}`, `{tenantId, doctorId}` | None |
| **invoices** | Billing documents | `{tenantId, invoiceNumber}` | `{tenantId, invoiceNumber}`, `{tenantId, patientId, status}`, `{tenantId, status}` | None |
| **auditlogs** | Compliance trail | None | `{tenantId, createdAt}`, `{tenantId, userId, createdAt}` | None (exempt) |
| **counters** | Sequence generators | `{tenantId, key}` | `{tenantId, key}` | None |
| **inventory** | Stock management | None | `{tenantId, itemCode}` | None |
| **pharmacystock** | Medicine inventory | None | `{tenantId, medicineId}` | None |
| **laborders** | Lab test requests | None | `{tenantId, patientId, status}` | None |
| **labresults** | Lab test results | None | `{tenantId, orderId}` | None |
| **radiologyorders** | Imaging requests | None | `{tenantId, patientId, status}` | None |
| **radiologyreports** | Radiology findings | None | `{tenantId, orderId}` | None |
| **insurance** | TPA & plan details | None | `{tenantId, tpaCode}` | None |

### 4.2 Reference Patterns

**Foreign Key Strategy:** ObjectId references without referential integrity constraints (MongoDB philosophy).

```typescript
// Example: Appointment references
{
  patientId: ObjectId,      // → patients collection
  doctorId: ObjectId,        // → doctors collection
  departmentId: ObjectId,    // → departments collection
  tenantId: ObjectId         // → tenants collection
}
```

**Populate Chains:** On read paths, use Mongoose `.populate()` to fetch related docs:
```typescript
const appt = await appointments.findById(id)
  .populate('patientId', 'name mrn phone')
  .populate('doctorId', 'name specialization')
  .populate('departmentId', 'name code');
```

### 4.3 Sequential Numbering (MRN, Invoice)

**Pattern:** Atomic increment via `findOneAndUpdate` on `counters` collection.

```typescript
// Generate next MRN
async generateMRN(tenantId: ObjectId): Promise<string> {
  const counter = await counters.findOneAndUpdate(
    { tenantId, key: 'mrn' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const tenant = await tenants.findById(tenantId);
  return `${tenant.code}-${String(counter.seq).padStart(6, '0')}`;
}
```

**Guarantees:** No duplicate sequences across concurrent requests (MongoDB atomic ops).

### 4.4 Tenant Scoping Pattern

**Invariant:** Every service method receives `tenantId` as first parameter (never client-supplied).

```typescript
// Good ✓
async getPatient(tenantId: ObjectId, patientId: ObjectId) {
  return patients.findOne({ _id: patientId, tenantId });
}

// Bad ✗ (client controls scope)
async getPatient(tenantId: ObjectId, patientId: ObjectId) {
  return patients.findById(patientId);  // missing tenantId check
}
```

---

## Security & Compliance

### 5.1 Authentication & Authorization Layer

#### JWT Token Structure
```typescript
// Access Token (15 min TTL)
{
  sub: user._id.toString(),       // subject (user ID)
  tenantId: tenant._id.toString(),
  email: user.email,
  role: user.role,
  permissions: ['patients:read', 'patients:create'],
  iat: <issued-at>,
  exp: <15-min-from-now>
}

// Refresh Token (7 day TTL, hashed in DB)
{
  sub: user._id.toString(),
  type: 'refresh',
  iat: <issued-at>,
  exp: <7-days-from-now>,
  version: 1  // incremented on rotation
}
```

#### Authentication Flow
1. User submits credentials → `POST /api/v1/auth/login`
2. Verify email + password (bcrypt compare)
3. Load user.role + role.permissions
4. Generate access + refresh tokens
5. Hash refresh token with bcrypt, store in `user.refreshTokenHash`
6. Return both tokens to client

#### Authorization Guards
```typescript
// Global JWT validation
@UseGuards(JwtAuthGuard)  // extracts user from token, throws 401 if invalid

// Role-based access
@UseGuards(RolesGuard)
@Roles('DOCTOR', 'HOSPITAL_ADMIN')

// Permission-based access
@UseGuards(PermissionsGuard)
@Permissions('patients:create', 'patients:update')

// Combination
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Permissions('billing:read')
```

#### Tenant Context Propagation
```typescript
// JwtAuthGuard extracts tenantId from token
// Request.user = { sub, tenantId, email, role, permissions }

// Guard validates:
// if (req.user.tenantId !== req.params.tenantId) throw 403 Forbidden
```

### 5.2 Secure Coding Practices

| Practice | Implementation |
|----------|-----------------|
| **Password Hashing** | bcryptjs cost 12 (Argon2 ready in auth service) |
| **Token Storage** | Refresh token bcrypt-hashed in DB; access token in memory (frontend) |
| **Secrets Management** | Environment variables (JWT_SECRET, DB_URI, etc.) |
| **Input Validation** | class-validator + Joi; whitelist mode (rejectUnknown: true) |
| **CORS Policy** | Strict allow-list (not * for production) |
| **Rate Limiting** | 120 req/60s global throttle; per-endpoint fine-tuning ready |
| **SQL/NoSQL Injection** | DTO strong typing + Mongoose schema validation |
| **Headers Security** | helmet.js (X-Frame-Options, CSP, HSTS, etc.) |
| **HTTPS Enforcement** | Always HTTPS in production (Nginx config) |
| **Audit Logging** | All mutations logged with user, IP, timestamp |
| **Error Messages** | No stack traces in production responses |
| **Session Expiry** | Access token 15 min; refresh 7 days (configurable) |
| **Token Rotation** | Refresh token rotated on use; old version invalidated |

### 5.3 DPDP Act 2023 Compliance

#### Consent Management
- Clinical data (diagnoses, prescriptions, medical records) → explicit consent required
- Contact data (phone, email for appointment reminders) → explicit opt-in
- Consent records stored immutably with timestamp and user identity

#### Right to Erasure (Anonymization)
- Audit logs: retain but anonymize user details
- Medical records: retain (clinical retention laws) but mask patient PII
- Billing records: anonymize but keep summary for GST compliance
- User workflows: `erasure` flag triggers post-deletion cleanup jobs

#### Data Portability
- API endpoint to export patient data in standard format (Phase 2)
- JSON/CSV export of medical records, appointments, billing

#### Breach Notification
- Audit logs capture all data access
- Alert system for unusual access patterns (Phase 2: ML model)
- Breach report generation ready

### 5.4 ABDM/NDHM Readiness

#### Compliance Abstraction Layer
```typescript
// Future ABDM endpoints don't require schema changes
interface PatientHIR {
  _id: ObjectId,
  mrn: string,
  name: string,
  abhaId?: string,      // ← ABDM national ID
  // ... other clinical data
}

// When ABDM integration happens:
// - Query NDHM registry via abhaId
// - Fetch/push health records via HIP/HIU APIs
// - No schema migration needed
```

#### ABHA ID Field
- Optional field on patient records
- Unique constraint within tenant if populated
- Future: validation against ABDM registry

---

## User Roles & Permissions

### 6.1 Role Hierarchy

```
SUPER_ADMIN (Platform Level)
    ├─ Manage tenants (hospitals)
    ├─ Impersonate any tenant (via x-tenant-id)
    └─ View platform audit logs

Tenant-Level Roles (per hospital)
    ├─ HOSPITAL_ADMIN
    │   ├─ Manage users, roles, departments
    │   ├─ Onboard doctors & staff
    │   └─ View all hospital data
    │
    ├─ DOCTOR
    │   ├─ Manage own appointments
    │   ├─ Create medical records & prescriptions
    │   └─ View patient history
    │
    ├─ NURSE
    │   ├─ Record vitals
    │   ├─ View patient charts (read-only)
    │   └─ Coordinate with doctors
    │
    ├─ RECEPTIONIST
    │   ├─ Register patients
    │   ├─ Book appointments
    │   ├─ Manage check-in
    │   └─ Generate invoices (draft)
    │
    ├─ PHARMACIST
    │   ├─ Dispense medications
    │   ├─ Manage pharmacy inventory
    │   └─ Track prescription fulfillment
    │
    ├─ LAB_TECHNICIAN
    │   ├─ Accept lab orders
    │   ├─ Enter results
    │   └─ Generate lab reports
    │
    ├─ RADIOLOGIST
    │   ├─ View imaging orders
    │   ├─ Upload images/reports
    │   └─ Issue radiology findings
    │
    ├─ ACCOUNTANT
    │   ├─ Finalize invoices
    │   ├─ Process payments
    │   ├─ Reconcile insurance claims
    │   └─ Generate financial reports
    │
    ├─ INVENTORY_MANAGER
    │   ├─ Track stock levels
    │   ├─ Manage reorders
    │   └─ Log adjustments
    │
    └─ PATIENT (Portal, Phase 2)
        ├─ View own appointments
        ├─ Access medical records
        └─ Settle invoices
```

### 6.2 Permission Catalog

**Format:** `<resource>:<action>`

| Resource | Actions | Applicable Roles |
|----------|---------|------------------|
| **tenants** | create, read, update, delete | SUPER_ADMIN |
| **users** | create, read, update, delete | HOSPITAL_ADMIN, SUPER_ADMIN |
| **roles** | create, read, update, delete | HOSPITAL_ADMIN, SUPER_ADMIN |
| **patients** | create, read, update, delete | RECEPTIONIST, DOCTOR, NURSE, HOSPITAL_ADMIN |
| **doctors** | create, read, update, delete | HOSPITAL_ADMIN |
| **departments** | create, read, update, delete | HOSPITAL_ADMIN |
| **appointments** | create, read, update, delete | RECEPTIONIST, DOCTOR, HOSPITAL_ADMIN |
| **medical-records** | create, read, update, delete | DOCTOR, NURSE (vitals only), HOSPITAL_ADMIN |
| **prescriptions** | create, read, update, delete | DOCTOR, PHARMACIST (read/dispense), HOSPITAL_ADMIN |
| **billing** | create, read, update, delete, finalize, process-payment | ACCOUNTANT, RECEPTIONIST, HOSPITAL_ADMIN |
| **pharmacy** | read, issue, manage-stock | PHARMACIST |
| **laboratory** | read, enter-results, issue-report | LAB_TECHNICIAN, RADIOLOGIST |
| **radiology** | read, upload-images, issue-report | RADIOLOGIST |
| **inventory** | create, read, update, issue, adjust | INVENTORY_MANAGER |
| **audit-logs** | read | HOSPITAL_ADMIN, SUPER_ADMIN |
| **reports** | read | All roles (filtered by role) |

### 6.3 Custom Role Creation

**Hospital Admin Workflow:**
1. Define role name and description
2. Select permissions from catalog (no ad-hoc permission strings)
3. Assign to users
4. Role stored in `roles` collection with `tenantId` + `isSystem: false`

```typescript
// Create custom role
POST /api/v1/roles
{
  name: "Senior Doctor",
  description: "Doctor + staff oversight",
  permissions: [
    "patients:read", "patients:update",
    "medical-records:create", "medical-records:read",
    "prescriptions:create", "prescriptions:read",
    "appointments:read",
    "doctors:read",    // can view other doctors
    "reports:read"     // can view clinical reports
  ],
  isSystem: false
}
```

---

## Frontend Architecture

### 7.1 Project Structure

```
frontend/src/
├── api/
│   ├── client.ts              # Axios instance with auth/refresh interceptors
│   └── index.ts               # Typed endpoint functions (services)
│
├── auth/
│   ├── AuthContext.tsx        # React Context for auth state & methods
│   └── ProtectedRoute.tsx      # Route wrapper with role/permission checks
│
├── components/
│   ├── ui/                    # Radix UI-based base components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Badge.tsx
│   │   ├── Tabs.tsx
│   │   └── [other base components]
│   │
│   └── layout/
│       ├── Shell.tsx          # App shell (sidebar + top nav)
│       ├── Sidebar.tsx        # Role-based menu navigation
│       └── TopNav.tsx         # Header with logout, notifications
│
├── hooks/
│   ├── useAuth.ts             # Auth context consumer
│   ├── usePagination.ts       # Pagination state logic
│   ├── useDebounce.ts         # Debounce for search inputs
│   └── [other custom hooks]
│
├── lib/
│   ├── queryClient.ts         # React Query configuration
│   ├── formatters.ts          # Date, currency, phone formatting
│   └── [utility functions]
│
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   │
│   ├── patients/
│   │   ├── PatientList.tsx
│   │   ├── PatientDetail.tsx
│   │   └── PatientForm.tsx
│   │
│   ├── doctors/
│   │   ├── DoctorList.tsx
│   │   └── [other doctor pages]
│   │
│   ├── appointments/
│   │   ├── AppointmentList.tsx
│   │   ├── BookAppointment.tsx
│   │   └── [other appointment pages]
│   │
│   ├── records/
│   │   ├── RecordsList.tsx    # Medical records
│   │   └── RecordForm.tsx
│   │
│   ├── billing/
│   │   ├── InvoiceList.tsx
│   │   └── InvoiceForm.tsx
│   │
│   ├── users/
│   ├── roles/
│   ├── audit/
│   └── [other feature modules]
│
├── types/
│   └── api.ts                 # TypeScript interfaces for API models
│
├── main.tsx                   # React entry point
├── router.tsx                 # React Router configuration
├── styles.css                 # Global styles
└── vite-env.d.ts              # Vite environment types
```

### 7.2 State Management Strategy

#### Context: Authentication
```typescript
// AuthContext.tsx
interface AuthContextType {
  user?: { id, email, tenantId, role, permissions };
  accessToken?: string;
  refreshToken?: string;
  loading: boolean;
  error?: string;
  login(email, password, tenantId): Promise<void>;
  logout(): void;
  hasRole(role): boolean;
  hasPermission(permission): boolean;
}
```

#### Server State: React Query
```typescript
// Replaces Redux/Zustand for async server data
const { data: patients, isLoading, error } = useQuery({
  queryKey: ['patients', page, search],
  queryFn: () => api.patients.list({ page, search }),
  staleTime: 1000 * 60 * 5, // 5 min
  retry: 2,
  enabled: isAuthenticated
});

// Mutations
const { mutate: createPatient } = useMutation({
  mutationFn: api.patients.create,
  onSuccess: () => queryClient.invalidateQueries(['patients'])
});
```

#### Forms: React Hook Form + Zod
```typescript
const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^\+91\d{10}$/, 'Invalid India phone')
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  mode: 'onChange'
});
```

### 7.3 API Client Layer

#### Axios Interceptors
```typescript
// client.ts
const client = axios.create({
  baseURL: '/api/v1',
  timeout: 30000
});

// Request: attach Bearer token
client.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: auto-refresh on 401
client.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const { accessToken, refreshToken: newRefresh } = await api.auth.refresh(refreshToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefresh);
      return client(error.config); // retry original request
    }
    throw error;
  }
);
```

#### Typed Endpoint Functions
```typescript
// api/index.ts
export const api = {
  auth: {
    login: (email, password, tenantId) => client.post('/auth/login', {...}),
    refresh: (refreshToken) => client.post('/auth/refresh', {...}),
    logout: () => client.post('/auth/logout')
  },
  patients: {
    list: (query) => client.get('/patients', { params: query }),
    get: (id) => client.get(`/patients/${id}`),
    create: (data) => client.post('/patients', data),
    update: (id, data) => client.patch(`/patients/${id}`, data)
  },
  // ... all endpoints
};
```

### 7.4 Routing & Menu System

#### Role-Based Routing
```typescript
// ProtectedRoute.tsx
<Route element={<ProtectedRoute requiredRoles={['DOCTOR']} />}>
  <Route path="records" element={<MedicalRecordsPage />} />
</Route>
```

#### Dynamic Menu Filtering
```typescript
// Sidebar.tsx
const menuItems = [
  { label: 'Dashboard', path: '/', icon: 'home' },
  { label: 'Patients', path: '/patients', requiredPermission: 'patients:read' },
  { label: 'Billing', path: '/billing', requiredPermission: 'billing:read' },
  // Filter based on user.permissions
  ...menuItems.filter(item => !item.requiredPermission || user.permissions.includes(item.requiredPermission))
];
```

### 7.5 Component Patterns

#### Loading/Empty/Error States
```typescript
// PatientList.tsx
if (isLoading) return <Skeleton count={5} />;
if (error) return <ErrorAlert message={error.message} />;
if (!data?.length) return <EmptyState icon="users" message="No patients found" />;

return <Table columns={columns} data={data} />;
```

#### Form Component
```typescript
<form onSubmit={form.handleSubmit(onSubmit)}>
  <Input
    label="Name"
    {...form.register('name')}
    error={form.formState.errors.name}
  />
  <Button type="submit" loading={isSubmitting}>Save</Button>
</form>
```

---

## Backend Architecture

### 8.1 NestJS Module Structure

#### Example: Patients Module

```typescript
// patients.module.ts
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Patient', schema: PatientSchema }])],
  controllers: [PatientsController],
  providers: [PatientsService, CountersService],
  exports: [PatientsService] // for other modules
})
export class PatientsModule {}

// patients.controller.ts
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class PatientsController {
  constructor(private service: PatientsService) {}

  @Get()
  @Permissions('patients:read')
  async list(
    @CurrentUser() user: AuthUser,
    @Query(new ValidationPipe({ type: 'query' })) query: PaginationQueryDto
  ) {
    return this.service.list(user.tenantId, query);
  }

  @Post()
  @Permissions('patients:create')
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePatientDto
  ) {
    return this.service.create(user.tenantId, dto, user.id);
  }

  @Get(':id')
  @Permissions('patients:read')
  async get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.get(user.tenantId, id);
  }

  @Patch(':id')
  @Permissions('patients:update')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto
  ) {
    return this.service.update(user.tenantId, id, dto, user.id);
  }

  @Delete(':id')
  @Permissions('patients:delete')
  async delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.delete(user.tenantId, id, user.id);
  }
}

// patients.service.ts
@Injectable()
export class PatientsService {
  constructor(
    @InjectModel('Patient') private model: Model<Patient>,
    private counters: CountersService
  ) {}

  async list(tenantId: ObjectId, query: PaginationQueryDto) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const filter: any = { tenantId };
    if (search) {
      filter.$text = { $search: search }; // text index on name
    }

    const [data, total] = await Promise.all([
      this.model.find(filter).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filter)
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async create(tenantId: ObjectId, dto: CreatePatientDto, userId: ObjectId) {
    // Auto-generate MRN
    const mrn = await this.counters.generateMRN(tenantId);

    return this.model.create({
      tenantId,
      mrn,
      ...dto,
      createdBy: userId
    });
  }

  async get(tenantId: ObjectId, id: string) {
    return this.model.findOne({ _id: id, tenantId });
  }

  async update(tenantId: ObjectId, id: string, dto: UpdatePatientDto, userId: ObjectId) {
    return this.model.findOneAndUpdate(
      { _id: id, tenantId },
      { ...dto, updatedBy: userId },
      { new: true, runValidators: true }
    );
  }

  async delete(tenantId: ObjectId, id: string, userId: ObjectId) {
    // Soft delete (set isActive = false)
    return this.model.findOneAndUpdate(
      { _id: id, tenantId },
      { isActive: false, deletedAt: new Date(), deletedBy: userId },
      { new: true }
    );
  }
}

// schemas/patient.schema.ts
export const PatientSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  mrn: { type: String, required: true, unique: true, sparse: true }, // compound unique with tenantId
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, enum: ['M', 'F', 'O'], required: true },
  phone: { type: String, required: true, index: true },
  email: { type: String },
  abhaId: { type: String, unique: true, sparse: true },
  bloodGroup: { type: String },
  allergies: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: Date,
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

// Add indexes
PatientSchema.index({ tenantId: 1, mrn: 1 }, { unique: true });
PatientSchema.index({ tenantId: 1, phone: 1 });
PatientSchema.index({ tenantId: 1, createdAt: -1 });
PatientSchema.index({ name: 'text' }); // full-text search

// dto/create-patient.dto.ts
export class CreatePatientDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsDateString()
  dob: Date;

  @IsEnum(['M', 'F', 'O'])
  gender: string;

  @IsPhoneNumber('IN')
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  abhaId?: string;

  @IsEnum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'])
  @IsOptional()
  bloodGroup?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  emergencyContact?: {
    @IsString() name?: string;
    @IsPhoneNumber('IN') phone?: string;
    @IsString() relation?: string;
  };
}
```

### 8.2 Request/Response Pipeline

```
Request
  ↓
[Throttler Guard] – rate limiting check
  ↓
[JWT Auth Guard] – validate & extract user
  ↓
[Roles Guard] – check @Roles() decorator
  ↓
[Permissions Guard] – check @Permissions() decorator
  ↓
[Validation Pipe] – class-validator + Joi
  ↓
Controller Method
  ↓
Service Layer
  ↓
Database Query
  ↓
[Transform Interceptor] – wrap response: { success: true, data, meta }
  ↓
[Audit Interceptor] – log mutation to audit collection
  ↓
Response
  ↓
[Exception Filter] – normalize errors: { success: false, statusCode, message, ... }
```

### 8.3 Decorators & Utilities

#### Custom Decorators
```typescript
// common/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator((data, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user; // populated by JwtAuthGuard
});

// common/decorators/permissions.decorator.ts
export const Permissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

// common/decorators/public.decorator.ts
export const Public = () => SetMetadata('isPublic', true);
```

#### Response Format
```typescript
// success response
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}

// error response
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "path": "/api/v1/patients",
  "timestamp": "2026-07-08T10:30:00Z"
}
```

---

## Deployment & Infrastructure

### 9.1 Docker Compose (Development & Single-Node Production)

```yaml
version: '3.9'

services:
  mongo:
    image: mongo:7
    container_name: hms-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  redis:
    image: redis:7-alpine
    container_name: hms-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: hms-backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://admin:password@mongo:27017/hms?authSource=admin
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-secret-key
      JWT_REFRESH_SECRET: your-refresh-secret
      API_VERSION: v1
    depends_on:
      - mongo
      - redis
    volumes:
      - ./backend/src:/app/src

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development  # use dev server with HMR
    container_name: hms-frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000
    depends_on:
      - backend
    volumes:
      - ./frontend/src:/app/src

  nginx:
    image: nginx:latest
    container_name: hms-nginx
    ports:
      - "80:80"
      - "8080:8080"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
      - frontend

volumes:
  mongo_data:
  redis_data:
```

### 9.2 Multi-Stage Docker Images

#### Backend Dockerfile
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Image
FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1000 node && adduser -u 1000 -G node node
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

#### Frontend Dockerfile
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Development (with HMR)
FROM node:20-alpine AS development
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# Stage 3: Production (Nginx)
FROM nginx:latest
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 9.3 Kubernetes Readiness (Future)

**Design Principles:**
- Stateless API (no session affinity needed)
- Liveness probe: `GET /api/v1/health/live` → responds 200 if healthy
- Readiness probe: `GET /api/v1/health/ready` → responds 200 if ready to receive traffic
- Horizontal Pod Autoscaling: based on CPU/memory metrics

#### Example Kubernetes Manifest (future reference)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hms-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hms-backend
  template:
    metadata:
      labels:
        app: hms-backend
    spec:
      containers:
      - name: hms-backend
        image: hms-backend:latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /api/v1/health/live
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /api/v1/health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: hms-secrets
              key: mongodb-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: hms-secrets
              key: jwt-secret
```

---

## Current Status & MVP Scope

### 10.1 MVP Features (Completed/In Progress)

| Feature | Status | Notes |
|---------|--------|-------|
| **Authentication** | ✅ Complete | JWT + refresh rotation, logout |
| **Tenant Management** | ✅ Complete | Multi-tenant isolation, hospital admin |
| **Users & Roles** | ✅ Complete | System roles + custom roles, permissions |
| **Patient Registration** | ✅ Complete | MRN auto-generation, demographics, ABHA ID field |
| **Doctor & Departments** | ✅ Complete | Profiles, schedules, specializations |
| **Appointments** | ✅ Complete | Booking, slot management, queue tokens |
| **Medical Records (EMR)** | ✅ Complete | Vitals, diagnoses (ICD-10), consultation notes |
| **Prescriptions** | ✅ Complete | Medication orders, linked to records |
| **Billing & Invoicing** | ✅ Complete | Sequential invoices, GST, payment tracking |
| **Audit Logging** | ✅ Complete | Mutation tracking, compliance trail |
| **Dashboard** | ✅ Complete | Summary metrics, quick access to roles |
| **Swagger/OpenAPI** | ✅ Complete | Live API docs at `/api/docs` |

### 10.2 Phase 2 Features (Planned)

| Feature | Planned Date | Notes |
|---------|--------------|-------|
| **Pharmacy Module** | Q3 2026 | Inventory, prescription fulfillment, expiry alerts |
| **Laboratory Module** | Q3 2026 | Lab orders, test results, DICOM links |
| **Radiology Module** | Q3 2026 | Imaging orders, reports, image storage (S3) |
| **Inventory Module** | Q3 2026 | Stock tracking, reorder management |
| **Insurance Module** | Q4 2026 | TPA integration, claim submission |
| **Notifications** | Q4 2026 | SMS/email reminders, alerts |
| **Patient Portal** | Q4 2026 | Self-service appointments, records access |
| **Reports & Analytics** | Q4 2026 | Advanced dashboards, BI integration |
| **MFA (2FA)** | Q4 2026 | TOTP, SMS-based 2FA |
| **ABDM Integration** | 2027 | NDHM registry, HIP/HIU APIs |
| **Payment Gateway** | 2027 | Online payments, reconciliation |
| **File Management** | 2027 | S3 storage, document upload, OCR |
| **Telemedicine** | 2027 | Video consultation, remote prescriptions |

### 10.3 Known Limitations & Trade-offs

| Limitation | Impact | Mitigation Plan |
|-----------|--------|-----------------|
| Single MongoDB instance | Not horizontally scalable beyond single server capacity | Upgrade to MongoDB Atlas/replica set + sharding by tenantId in Phase 2 |
| No session management (stateless design) | WebSocket/real-time features need workaround (polling or separate service) | BullMQ + Redis pub/sub for Phase 2 async workflows |
| Email via Nodemailer only | No SMS yet | Integrate Twilio/AWS SNS in notifications module |
| Soft deletes only | Database size grows over time | Implement archival job (move old soft-deleted records to archive DB) |
| No built-in backup automation | Operational risk | Scheduled mongodump + S3 export job in Phase 2 |
| Search limited to text index | No semantic/fuzzy search | Consider Elasticsearch or Meilisearch in Phase 2 |

---

## Testing & Quality Assurance

### 11.1 Testing Strategy

#### Unit Testing
- **Framework:** Jest
- **Scope:** Services, utilities, business logic
- **Coverage Target:** 80% for business-critical paths
- **Example:**
```typescript
// patients.service.spec.ts
describe('PatientsService.create', () => {
  it('should generate unique MRN for new patient', async () => {
    const result = await service.create(tenantId, createPatientDto, userId);
    expect(result.mrn).toMatch(/^CGH-\d{6}$/);
  });

  it('should throw error if email already exists in tenant', async () => {
    await expect(service.create(tenantId, {...}, userId))
      .rejects.toThrow('Email already registered');
  });
});
```

#### Integration Testing
- **Framework:** Jest + MongoDB test container (testcontainers)
- **Scope:** API endpoints + database interactions
- **Strategy:**
  - Spin up isolated MongoDB + Redis for each test suite
  - Create fixtures (users, patients, appointments)
  - Call actual HTTP endpoints via supertest
- **Example:**
```typescript
// patients.controller.spec.ts
describe('GET /patients', () => {
  it('should return paginated patient list for authenticated user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/patients?page=1&limit=10')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data).toHaveLength(10);
    expect(response.body.meta.total).toBe(100);
  });
});
```

#### E2E Testing (Playwright)
- **Framework:** Playwright
- **Scope:** Full user workflows
- **Scenarios:**
  - Login → register patient → book appointment → record vitals → generate invoice
  - Doctor login → view patient history → create prescription
  - Admin login → create user → assign role
- **Example:**
```typescript
// e2e/patient-workflow.spec.ts
test('Receptionist books appointment for patient', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'reception@cgh.local');
  await page.fill('input[name="password"]', 'Front@123');
  await page.click('button:has-text("Login")');

  await page.goto('/appointments/new');
  await page.selectOption('select[name="patientId"]', 'patient-1');
  await page.click('button:has-text("Book Appointment")');

  await expect(page).toHaveURL(/\/appointments\/\d+/);
});
```

### 11.2 Code Quality Tools

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **ESLint** | Linting | .eslintrc.json (extends @nestjs/eslint-config-prettier) |
| **Prettier** | Code formatting | .prettierrc (2-space indent, 100-char line) |
| **Jest** | Unit & integration tests | jest.config.js (coverage thresholds 80%+) |
| **Swagger/OpenAPI** | API documentation | Auto-generated from NestJS decorators |

### 11.3 Quality Gates (Pre-Commit)

**Husky + Lint-Staged:**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.ts": "eslint --fix",
    "*.{ts,json}": "prettier --write"
  }
}
```

---

## Performance Considerations

### 12.1 Database Optimization

#### Indexing Strategy
- **Unique Constraints:** `{tenantId, email}`, `{tenantId, mrn}`, `{tenantId, invoiceNumber}`
- **Query Indexes:** `{tenantId, createdAt}` for time-range queries
- **Search Indexes:** Text index on patient name, doctor name
- **Compound Indexes:** `{tenantId, status, createdAt}` for dashboard filtering

#### Query Optimization
```typescript
// ❌ Slow: multiple queries
const user = await users.findById(userId);
const tenant = await tenants.findById(user.tenantId);
const patients = await patients.find({ tenantId: tenant._id });

// ✅ Fast: populate in one query
const patients = await patients
  .find({ tenantId: user.tenantId })
  .lean() // returns plain JS, not Mongoose docs
  .limit(10)
  .exec();

// ✅ Fast: pagination mandatory
async list(tenantId, page, limit) {
  const skip = (page - 1) * limit;
  return patients.find({ tenantId })
    .skip(skip)
    .limit(limit)
    .lean();
}
```

#### Aggregation Pipeline (Analytics)
```typescript
// Efficient dashboard query: single aggregation
db.appointments.aggregate([
  { $match: { tenantId: tenant._id, status: 'COMPLETED' } },
  { $group: {
      _id: '$doctorId',
      count: { $sum: 1 },
      revenue: { $sum: '$fee' }
    }
  },
  { $sort: { revenue: -1 } },
  { $limit: 10 }
]);
```

### 12.2 Caching Strategy

#### Redis Cache Layers
- **Hot Data:** User auth tokens, tenant settings, doctor schedules
- **Dashboard Metrics:** Patient count, appointment volume (1-hour TTL)
- **Search Results:** Patient search queries (5-minute TTL)

#### Cache Invalidation
```typescript
// Service method
async createPatient(tenantId, dto) {
  const patient = await this.model.create({ tenantId, ...dto });
  
  // Invalidate related caches
  await this.cache.del(`patients:${tenantId}:*`); // pattern delete
  await this.cache.del(`dashboard:${tenantId}`);
  
  return patient;
}
```

### 12.3 Frontend Optimization

#### Code Splitting (Vite)
```typescript
// Lazy load routes
const PatientList = lazy(() => import('./pages/patients/PatientList'));
const PatientDetail = lazy(() => import('./pages/patients/PatientDetail'));

// Router
<Route path="patients" element={<PatientList />} />
<Route path="patients/:id" element={<PatientDetail />} />
```

#### React Query Optimization
```typescript
// Stale time: avoid refetch for 5 minutes
useQuery({
  queryKey: ['patients', page],
  queryFn: () => api.patients.list({ page }),
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10 // garbage collection (was cacheTime)
});

// Background refetch
refetchInterval: 1000 * 60; // refetch every minute in background
```

#### Bundle Analysis
```bash
npm run build -- --mode analyze
# Generates build/report.html showing bundle size breakdown
```

### 12.4 API Rate Limiting

```typescript
// Global: 120 req/60s
ThrottlerModule.forRoot({
  ttl: 60000,
  limit: 120
})

// Per-endpoint (tighter for expensive operations)
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 req/min
@Post('login')
async login(...) { }
```

### 12.5 Monitoring & Observability

#### Health Checks
```typescript
@Get('health/live')  // liveness: is service running?
async liveness() {
  return { status: 'UP' };
}

@Get('health/ready')  // readiness: can accept traffic?
async readiness() {
  const mongoStatus = await this.db.ping();
  const redisStatus = await this.redis.ping();
  return {
    status: mongoStatus && redisStatus ? 'UP' : 'DOWN',
    checks: { mongo: mongoStatus, redis: redisStatus }
  };
}
```

#### Metrics Endpoint (Prometheus-ready)
```typescript
// Phase 2: add PrometheusModule
// Metrics: request latency, error rate, database query time
// `GET /metrics` → Prometheus scrapes every 30s
```

---

## Demo Users & Access

### 13.1 Pre-Seeded Credentials (After `npm run seed`)

| Role | Email | Password | Permissions | Hospital |
|------|-------|----------|------------|----------|
| **Super Admin** | superadmin@hms.local | Admin@123 | Platform-wide (tenant management) | N/A |
| **Hospital Admin** | admin@cgh.local | Admin@123 | All operations within CGH | CGH |
| **Doctor** | dr.asha@cgh.local | Doctor@123 | Medical records, prescriptions | CGH |
| **Receptionist** | reception@cgh.local | Front@123 | Patients, appointments, billing | CGH |
| **Accountant** | accounts@cgh.local | Money@123 | Billing, payments, reports | CGH |
| **Pharmacist** | pharmacy@cgh.local | Pharma@123 | Pharmacy, prescription fulfillment | CGH |
| **Lab Technician** | lab@cgh.local | Lab@123 | Lab orders, results | CGH |
| **Radiologist** | radiology@cgh.local | Radio@123 | Radiology orders, reports | CGH |
| **Inventory Manager** | inventory@cgh.local | Store@123 | Stock management | CGH |

### 13.2 API Endpoints (Sample)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/auth/login` | POST | ❌ | User login (returns access + refresh token) |
| `/api/v1/auth/refresh` | POST | ✅ | Refresh access token |
| `/api/v1/patients` | GET | ✅ | List patients (paginated) |
| `/api/v1/patients` | POST | ✅ | Create new patient (auto MRN) |
| `/api/v1/appointments` | GET | ✅ | List appointments |
| `/api/v1/appointments` | POST | ✅ | Book appointment |
| `/api/v1/medical-records` | POST | ✅ | Create EMR (doctor only) |
| `/api/v1/prescriptions` | POST | ✅ | Create prescription (doctor only) |
| `/api/v1/invoices` | GET | ✅ | List invoices (accountant, receptionist) |
| `/api/v1/invoices` | POST | ✅ | Create invoice (receptionist) |
| `/api/v1/invoices/:id/finalize` | PATCH | ✅ | Finalize invoice (accountant) |
| `/api/v1/audit-logs` | GET | ✅ | View audit trail (admin only) |
| `/api/v1/health/live` | GET | ❌ | Liveness check |
| `/api/v1/health/ready` | GET | ❌ | Readiness check |
| `/api/docs` | GET | ❌ | Swagger UI (all endpoints) |

---

## Conclusion

The **Enterprise Hospital Management System (HMS)** is a comprehensive, production-ready multi-tenant SaaS platform that successfully digitalizes hospital operations with India-compliance focus. The architecture prioritizes:

- **Security:** JWT + RBAC/permissions, encrypted secrets, audit trails
- **Scalability:** Stateless API design, horizontal scaling ready, eventual DB-per-tenant support
- **Compliance:** ABDM/NDHM readiness, DPDP Act 2023 frameworks, GST invoicing
- **Developer Experience:** Full-stack TypeScript, type safety, Swagger docs, modular code
- **User Experience:** Fast, responsive React frontend with role-based navigation

The MVP launch covers core workflows (auth, patients, doctors, appointments, EMR, billing, audit), with Phase 2 expanding into pharmacy, lab, radiology, inventory, insurance, and notifications. The team is well-positioned to scale both the platform (more hospitals) and features (more modules) without architectural refactors.

**Next Steps:**
1. Finalize MVP testing and go-live
2. Plan Phase 2 module development (pharmacy, lab, radiology)
3. Set up production infrastructure (MongoDB Atlas, managed Redis, LB)
4. Implement ABDM/NDHM integration for India ecosystem alignment
5. Gather user feedback and iterate on workflows

---

**Document Version:** 1.0 | **Last Updated:** 2026-07-08 | **Author:** Project Team
