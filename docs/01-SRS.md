# Software Requirements Specification (SRS)
## Enterprise Hospital Management System (HMS)

**Version:** 1.0 | **Date:** 2026-07-06 | **Status:** Approved for design

---

## 1. Project Overview

A multi-tenant, cloud-hosted SaaS Hospital Management System serving hospitals and healthcare
organizations in India. A single deployment serves many hospitals (tenants) with strict logical
data isolation. The system digitizes the full hospital workflow: registration, appointments,
queueing, clinical documentation (EMR), prescriptions, diagnostics, pharmacy, inventory,
billing, insurance, and administration.

### 1.1 Business Objectives
- Reduce patient registration and check-in time by 70%.
- Provide a single source of truth for patient medical records across departments.
- Automate revenue cycle: billing, payments (incl. GST invoicing), and insurance/TPA claims.
- Give hospital management real-time operational and financial dashboards.
- Comply with India's digital-health ecosystem (ABDM/NDHM) and DPDP Act 2023.

### 1.2 Stakeholders
| Stakeholder | Interest |
|---|---|
| Hospital owners / management | Revenue, utilization, compliance reporting |
| Doctors | Fast access to patient history, low-friction documentation |
| Nurses | Vitals capture, ward tasks, medication administration |
| Receptionists | Registration, appointment booking, queue management |
| Pharmacists / Lab / Radiology staff | Order fulfilment workflows |
| Accountants | Billing, payments, claims reconciliation |
| Patients | Appointments, records access, transparent billing |
| Platform operator (SaaS provider) | Tenant onboarding, uptime, support |
| Regulators (ABDM, DPDP) | Consent, auditability, data protection |

## 2. Compliance Context (India)
- **ABDM/NDHM readiness:** patient records carry an optional **ABHA ID** field; architecture keeps
  a compliance abstraction so ABHA verification, HIP/HIU milestones and NDHM registries can be
  integrated in a later release without schema redesign.
- **DPDP Act 2023:** purpose-limited collection, consent capture, right to correction/erasure
  workflows (erasure = anonymization for clinical records where retention laws apply), breach
  audit trail.
- **GST:** invoices support GST fields and sequential numbering per tenant.
- **Clinical coding:** diagnosis entries are structured to accept ICD-10 codes.

## 3. User Roles
`SUPER_ADMIN` (platform), `HOSPITAL_ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`, `PHARMACIST`,
`LAB_TECHNICIAN`, `RADIOLOGIST`, `ACCOUNTANT`, `INVENTORY_MANAGER`, `PATIENT` (portal, later phase).
Custom roles can be created per tenant from granular permissions.

## 4. Permission Model
Permissions are strings of the form `<resource>:<action>` (e.g. `patients:create`,
`billing:read`). Roles are named bundles of permissions. Authorization = role check OR
permission check; endpoints declare required permissions.

### Permission Matrix (MVP excerpt)
| Resource | SUPER_ADMIN | HOSPITAL_ADMIN | DOCTOR | NURSE | RECEPTIONIST | ACCOUNTANT |
|---|---|---|---|---|---|---|
| tenants | CRUD | R (own) | – | – | – | – |
| users | CRUD | CRUD (own tenant) | R | R | R | – |
| roles | CRUD | CRUD (custom) | – | – | – | – |
| patients | R | CRUD | RU | RU | CRU | R |
| doctors | R | CRUD | R | R | R | – |
| departments | R | CRUD | R | R | R | – |
| appointments | R | CRUD | RU (own) | R | CRUD | – |
| medical-records | – | R | CRUD (own patients) | CRU (vitals) | – | – |
| prescriptions | – | R | CRUD | R | – | – |
| billing | R | CRUD | – | – | CR | CRUD |
| reports | R | R | R (clinical) | – | – | R (financial) |
| audit-logs | R | R (own tenant) | – | – | – | – |

## 5. Functional Requirements (by module)

### FR-1 Authentication & Session
- FR-1.1 Email + password login scoped to a tenant; Argon2/bcrypt hashing.
- FR-1.2 Short-lived JWT access token (15 min) + rotating refresh token (7 days, hashed at rest).
- FR-1.3 Logout invalidates refresh token. FR-1.4 Password-reset and MFA are design-ready (Phase 2 release).
- FR-1.5 Account lockout signal via `isActive` flag; deactivated users cannot authenticate.

### FR-2 Tenant (Hospital) Management
- FR-2.1 SUPER_ADMIN creates/updates hospitals (name, unique code, contact, address, GSTIN).
- FR-2.2 Every business document is stamped with `tenantId`; all queries are tenant-scoped.

### FR-3 User, Role & Permission Management
- FR-3.1 Hospital admins manage staff users within their tenant.
- FR-3.2 System roles are read-only; tenants may define custom roles from the permission catalog.

### FR-4 Patient Management
- FR-4.1 Registration generates a unique per-tenant MRN (`<TENANTCODE>-<seq>`).
- FR-4.2 Demographics, ABHA ID (optional), blood group, allergies, emergency contact.
- FR-4.3 Search by MRN, name, phone; paginated listing; soft deactivation only.

### FR-5 Department & Doctor Management
- FR-5.1 Departments with unique code per tenant, optional head doctor.
- FR-5.2 Doctor profiles: specialization, registration/license number, qualifications,
  consultation fee, weekly availability schedule; optional link to a login user.

### FR-6 Appointments & Queue
- FR-6.1 Book appointment for patient + doctor + slot; reject double-booking of the same doctor slot.
- FR-6.2 Lifecycle: `SCHEDULED → CHECKED_IN → IN_PROGRESS → COMPLETED`, or `CANCELLED` / `NO_SHOW`.
- FR-6.3 Check-in assigns a daily per-doctor queue token number.

### FR-7 Electronic Medical Records
- FR-7.1 Visit record per encounter: vitals, chief complaint, ICD-10-ready diagnoses, clinical notes.
- FR-7.2 Records are append-oriented; edits are audit-logged; doctors see full patient history.

### FR-8 Prescriptions
- FR-8.1 Structured line items: medicine, dosage, frequency, duration, instructions.
- FR-8.2 Linked to patient, doctor and (optionally) a visit record.

### FR-9 Billing & Payments
- FR-9.1 Invoices with line items, GST rate, discount, sequential per-tenant invoice numbers.
- FR-9.2 Partial payments (cash/card/UPI/bank/insurance); status derives from amount paid.
- FR-9.3 Cancelled invoices retained for audit.

### FR-10 Audit Logs
- FR-10.1 Every mutating API call records actor, tenant, action, resource, id, IP, outcome, timestamp.
- FR-10.2 Logs are immutable and queryable by admins.

### FR-11 Reports & Dashboard
- FR-11.1 Operational dashboard: today's appointments, patient counts, active doctors, monthly revenue.

### FR-12..FR-24 (Later releases — specified, not built in MVP)
Nurse stations, laboratory (orders/results), radiology (orders/PACS pointers), pharmacy dispensing,
inventory & procurement, insurance/TPA claims, notifications (SMS/email via BullMQ), file management
(S3-compatible), patient portal, system configuration UI, ABDM integration.

## 6. Non-Functional Requirements
| Category | Requirement |
|---|---|
| Security | OWASP ASVS-aligned; helmet, CORS allow-list, rate limiting, input validation on every DTO, encryption in transit (TLS) and at rest (disk/KMS), least-privilege RBAC |
| Privacy | DPDP: purpose limitation, audit trail, tenant data isolation enforced at the query layer |
| Performance | p95 API < 300 ms at 200 concurrent users/tenant; all list endpoints paginated |
| Scalability | Stateless API pods; horizontal scale; Redis-backed queues for async work |
| Availability | 99.5% MVP target; health endpoints; graceful shutdown |
| Maintainability | Modular NestJS architecture, >80% unit-test target on services, lint + strict TS |
| Auditability | Immutable audit collection; 7-year retention for clinical/financial data |
| Usability | Responsive UI (desktop-first, tablet-capable), WCAG 2.1 AA intent |

## 7. Business & Validation Rules (selected)
- BR-1 An appointment cannot be booked in the past or outside the doctor's schedule (schedule check phase 2; past-date check MVP).
- BR-2 A doctor cannot have two non-cancelled appointments overlapping in time.
- BR-3 Invoice totals: `total = subtotal − discount + tax`; payments may never exceed `total`.
- BR-4 MRN, invoice numbers and employee codes are unique per tenant, never reused.
- BR-5 Email is unique per tenant; phone numbers validated as 10-digit Indian numbers (`[6-9]\d{9}`).
- BR-6 Clinical records may be created only by users holding `medical-records:create` (doctors).
- BR-7 Deleting business entities = soft deactivation; hard delete reserved for SUPER_ADMIN tooling.

## 8. User Stories & Acceptance Criteria (MVP excerpt)
- **US-01** As a receptionist, I register a patient in under 1 minute. *AC:* required fields only
  name/gender/phone; MRN auto-generated; duplicate phone warning.
- **US-02** As a receptionist, I book an appointment. *AC:* conflicting slot rejected with a clear
  409 error; confirmation shows token-eligible status.
- **US-03** As a doctor, I open today's queue and complete a consultation. *AC:* status transitions
  enforced; EMR entry + prescription creatable from the appointment.
- **US-04** As an accountant, I invoice a visit and record a UPI payment. *AC:* GST computed;
  partial payment moves status to PARTIALLY_PAID.
- **US-05** As a hospital admin, I create a custom role "Front Desk Lead". *AC:* only permissions
  from the catalog; takes effect on next login.
- **US-06** As a super admin, I onboard a new hospital. *AC:* tenant code unique; admin user issued.

## 9. Scope
**MVP (this build):** auth, tenants, users, roles/permissions, departments, patients, doctors,
appointments + queue tokens, EMR (visit records), prescriptions, billing/payments, audit logs,
dashboard reports, seed data, Docker Compose.
**Out of scope (MVP):** ABDM live integration, lab/radiology/pharmacy/inventory execution modules,
insurance claims, notifications, file uploads, patient portal, MFA, Kubernetes.

## 10. Assumptions & Constraints
- Single region deployment; INR currency; English UI (i18n-ready keys later).
- MongoDB replica set in production (transactions available); standalone acceptable in dev.
- Constraint: stack fixed to React/Vite/Tailwind + NestJS/Mongoose + MongoDB + Redis + Docker.

## 11. Risks
| Risk | Mitigation |
|---|---|
| Tenant data leakage | Tenant filter injected centrally in services; integration tests per module |
| Scope creep across 24 modules | Phased roadmap (docs/03-ROADMAP.md); module contracts frozen per sprint |
| Regulatory change (ABDM/DPDP) | Compliance abstraction layer; config-driven retention |
| MongoDB schema drift | Versioned schemas, seed/migration scripts |

## 12. Success Criteria
MVP passes end-to-end flow: onboard hospital → register staff → register patient → book
appointment → consult (EMR + prescription) → invoice → pay → all actions visible in audit log
and dashboard — with all builds green and tenancy isolation verified.

---
*Phase 1 review: requirements above were reviewed against the master prompt's 24 functional
areas; all are captured either in MVP FRs or FR-12..24 later-release specifications. Open
questions resolved with the product owner: compliance = India/ABDM, tenancy = shared-DB SaaS,
delivery = MVP-first.*
