# Database Documentation

The LMS uses **PostgreSQL 16** with **Prisma 6** as the ORM and migration tool.

## Locations

| Item | Path |
|------|------|
| Prisma schema | `backend/prisma/schema.prisma` |
| Migrations | `backend/prisma/migrations/` |
| Seed script (entry) | `backend/prisma/seed.ts` |
| Seed workspace data | `backend/prisma/seed-workspace.ts` |
| Generated client | `@prisma/client` (regenerated on `prisma generate`) |

Connection string is read from `DATABASE_URL`. Local default (from `docker-compose.yml`):

```
postgresql://sgpg:sgpg_dev_password@localhost:5432/sgpg_lms?schema=public
```

---

## Initialization (first-time setup)

```bash
# 1. Start PostgreSQL (from repo root)
docker compose up -d postgres

# 2. Apply all migrations
cd backend
npx prisma migrate deploy

# 3. Generate the Prisma client (usually automatic after install)
npx prisma generate

# 4. Seed demo data (org, categories, users, courses, workspace)
npm run db:seed
```

---

## Commands

| Command | When to use | Description |
|---------|-------------|-------------|
| `npx prisma migrate deploy` | CI / production / fresh dev | Apply existing migrations without generating new ones |
| `npm run prisma:migrate` (`prisma migrate dev`) | Development | Create + apply a new migration after schema edits |
| `npm run db:seed` | After migrations | Populate demo data (idempotent upserts) |
| `npm run prisma:generate` | After schema change | Regenerate the typed client |
| `npm run prisma:studio` | Anytime | Open Prisma Studio DB browser |

### Reset (development only)

```bash
cd backend
npx prisma migrate reset
```

Drops the database, re-applies all migrations, and runs the seed. **Never run against production.**

---

## Migration history

Migrations are timestamped and applied in order. Current set:

| Migration | Purpose |
|-----------|---------|
| `20260327120000_init` | Core: users, roles, orgs, profiles, categories, courses, enrollments |
| `20260327140000_auth_tokens` | Email verification & password reset tokens, refresh tokens |
| `20260327160000_course_catalog_flags` | Catalog flags (featured, trending, forTeams) |
| `20260330120000_assignment_module` | Assignments, submissions, grading |
| `20260330180000_question_bank` | Question bank, options, categories, tags, versions |
| `20260330200000_quiz_engine` | Quizzes, attempts, answers, results |
| `20260330210000_learning_progress` | Lesson/module/course progress, activity history |
| `20260330220000_certificates` | Certificates, verification, completion rules |
| `20260330230000_batch_management` | Batches, enrollments, events, import jobs |
| `20260330240000_media_storage` | Media assets |
| `20260330250000_performance_indexes` | Additional indexes for query performance |
| `20260708120000_certificate_template_versions` | Certificate template versioning + design snapshots |

---

## Schema overview

The schema defines ~60 models. Key groups:

### Identity & tenancy
`User`, `UserRoleAssignment`, `RefreshToken`, `EmailVerificationToken`, `PasswordResetToken`, `Organization`, `OrganizationMember`, `StudentProfile`, `InstructorProfile`

- **Roles** (`UserRole` enum): `student`, `instructor`, `org_admin`, `platform_admin`
- **Tenancy:** most records carry an `organizationId`. The app resolves a single default org via `DEFAULT_ORGANIZATION_SLUG` (effectively single-tenant today; schema supports multi-org).

### Catalog & learning
`Category`, `Course`, `CourseOutcome`, `CourseRequirement`, `CourseModule`, `CourseLesson`, `LessonAsset`, `Enrollment`, `EnrollmentMilestone`, `LessonProgress`, `ModuleProgress`, `CourseProgress`, `LearningActivity`, `ProgressHistory`

### Assessments
`Question`, `QuestionOption`, `QuestionCategory`, `QuestionTag`, `QuestionTagLink`, `QuestionAttachment`, `QuestionVersion`, `Quiz`, `QuizQuestion`, `QuizAttempt`, `QuizAnswer`, `QuizResult`, `Assignment`, `AssignmentAttachment`, `AssignmentSubmission`, `SubmissionAttachment`, `AssignmentGrade`

### Cohorts
`Batch`, `BatchInstructor`, `BatchEnrollment`, `BatchEvent`, `BatchImportJob`, `BatchImportRow`

### Communication & scheduling
`Announcement`, `MessageThread`, `ThreadParticipant`, `Message`, `Notification`, `CalendarEvent`, `CoachingSession`

> `Announcement`, `MessageThread`, `Message`, `CoachingSession` back the **Coming Soon** features. The tables exist but the corresponding UI/APIs are intentionally deferred.

### Certificates
`CertificateTemplate`, `CertificateTemplateVersion`, `CertificateCompletionRule`, `Certificate`, `CertificateVerification`

### Misc
`DemoLead`, `MediaAsset`

---

## Notes for future developers

- **Default organization must exist.** Registration upserts it, and `npm run db:seed` creates it. If seeding is skipped, ensure an `Organization` row matches `DEFAULT_ORGANIZATION_SLUG`.
- **Seed is idempotent.** It uses upserts; re-running won't duplicate the org/categories/users.
- **No admin user is seeded.** To test admin-role endpoints, create a user with role `org_admin` (see [`../INTEGRATION_GUIDE.md`](../INTEGRATION_GUIDE.md)).
- **Course slug** is the public identifier used across API and frontend routes.
- **Migrations are additive.** Add a new migration (`prisma migrate dev`) for schema changes rather than editing existing migration files.
- **`migration_lock.toml`** is gitignored per repo policy; the provider is PostgreSQL.
- **Historical integrity:** certificates store a `designSnapshot` and `templateVersionId` so reissued/old certificates retain the template design used at issue time.
