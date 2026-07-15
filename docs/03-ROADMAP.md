# Development Plan & Roadmap

## Milestones
| # | Milestone | Content | Target |
|---|---|---|---|
| M1 | Foundation | Repo, Docker, CI-ready scripts, config, common layer, health | Sprint 1 |
| M2 | Identity | Auth (JWT+refresh), tenants, users, roles/permissions, seed | Sprint 1–2 |
| M3 | Clinical core | Departments, patients, doctors, appointments+queue | Sprint 2–3 |
| M4 | Care & revenue | EMR, prescriptions, billing/payments, audit, dashboard | Sprint 3–4 |
| M5 | Frontend MVP | All MVP screens wired, role-based UX | Sprint 4–5 |
| **MVP release** | E2E flow green (SRS §12) | | End Sprint 5 |
| M6 | Diagnostics | Laboratory, radiology orders/results | R2 |
| M7 | Pharmacy & inventory | Dispensing, stock, purchase orders | R2 |
| M8 | Insurance & claims | TPA workflows, claim lifecycle | R3 |
| M9 | Notifications & files | BullMQ workers, SMS/email, S3 uploads | R3 |
| M10 | ABDM & portal | ABHA verification, patient portal, MFA | R4 |

## Module dependency order (backend)
config/common → tenants → roles → users → auth → departments → doctors → patients →
appointments → medical-records → prescriptions → billing → audit/reports.

## Git strategy
`main` (protected) ← `develop` ← `feature/<module>`; conventional commits
(`feat(patients): …`); PR + review + green build to merge; release tags `v0.x`.

## Standards
- **TypeScript strict** both apps; ESLint + Prettier.
- **Naming:** kebab-case files (`create-patient.dto.ts`), PascalCase classes, camelCase members,
  SCREAMING_SNAKE enums/env, plural REST resources.
- **API:** versioned `/api/v1`, permission-guarded, DTO-validated, paginated lists, error envelope.
- **Env:** all config via validated `.env` (see `.env.example` files); no secrets in git.
- **Reuse:** shared pagination DTO/helper, base schema options, UI kit components, axios client,
  zod schemas per feature.
- **Testing:** unit tests for services with business rules (auth, appointments conflict, billing
  math); e2e smoke per module before release.

*Phase 3 review: order optimized so every sprint ends demoable; billing pulled into MVP because
revenue cycle is the primary buyer requirement; notifications deferred as they need external
providers.*
