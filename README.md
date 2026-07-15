# Enterprise Hospital Management System (HMS)

Multi-tenant SaaS Hospital Management System — NestJS + MongoDB backend, React + Vite frontend,
Docker Compose infrastructure. India-compliance oriented (ABDM-ready, DPDP-aware, GST invoicing).

## Documentation
- [docs/01-SRS.md](docs/01-SRS.md) — requirements specification
- [docs/02-ARCHITECTURE.md](docs/02-ARCHITECTURE.md) — system design (tenancy, security, DB, API)
- [docs/03-ROADMAP.md](docs/03-ROADMAP.md) — milestones, standards, git strategy
- Live API reference: Swagger at `http://localhost:3000/api/docs` when the backend is running

## Stack
React 18 · TypeScript · Vite · Tailwind · React Router · TanStack Query · React Hook Form · Zod ·
NestJS 10 · Mongoose 8 · JWT + refresh rotation · RBAC/permissions · MongoDB 7 · Redis 7 · Docker

## Quick start (Docker)
```bash
docker compose up --build
# frontend  → http://localhost:8080
# backend   → http://localhost:3000/api/v1  (Swagger: /api/docs)
```
Seed demo data (roles, demo hospital, users):
```bash
docker compose exec backend node dist/seed.js
```

## Quick start (local dev)
```bash
# 1. infra
docker compose up -d mongo redis

# 2. backend
cd backend && cp .env.example .env && npm install
npm run seed        # roles + demo hospital + demo users
npm run start:dev   # http://localhost:3000

# 3. frontend
cd ../frontend && npm install
npm run dev         # http://localhost:5173
```

## Demo logins (after seed) — hospital code `CGH`
| Role | Email | Password | Can do |
|---|---|---|---|
| Super Admin | superadmin@hms.local | Admin@123 | Everything **except** tenant-scoped writes (has no hospital context) |
| Hospital Admin | admin@cgh.local | Admin@123 | Register patients/doctors, departments, appointments, billing, users/roles |
| Doctor | dr.asha@cgh.local | Doctor@123 | Consultation notes, prescriptions, lab & radiology orders |
| Receptionist | reception@cgh.local | Front@123 | Patients, appointments, billing |
| Accountant | accounts@cgh.local | Money@123 | Billing, insurance, reports |
| Pharmacist | pharmacy@cgh.local | Pharma@123 | Add medicine, dispense drugs |
| Lab Technician | lab@cgh.local | Lab@123 | Lab orders + results |
| Radiologist | radiology@cgh.local | Radio@123 | Radiology orders + reports |
| Inventory Manager | inventory@cgh.local | Store@123 | Inventory items + stock transactions |

> Actions are permission-gated by role — e.g. only the **Doctor** can save consultation notes, only the **Pharmacist** can dispense. Use the matching login for each module.

## Repository layout
```
backend/    NestJS modular monolith (see docs/02-ARCHITECTURE.md §3)
frontend/   React SPA
docs/       SRS, architecture, roadmap
```

## MVP scope
Auth · tenants · users · roles/permissions · departments · patients (MRN, ABHA field) · doctors ·
appointments + queue tokens · EMR visit records · prescriptions · invoices/payments (GST) ·
audit logs · dashboard. Later releases: lab, radiology, pharmacy, inventory, insurance,
notifications, files, patient portal (see roadmap).
