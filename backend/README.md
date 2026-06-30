# SG Pro Growth LMS — API

NestJS + Prisma + PostgreSQL backend for the SG Pro Growth LMS.

## Stack

- **NestJS 11** — modular REST API
- **Prisma 6** — ORM + migrations
- **PostgreSQL 16** — primary database
- **Redis 7** — cache & job queues (Phase 2b)
- **MinIO** — S3-compatible file storage (Phase 2.4+)
- **Argon2** — password hashing
- **JWT** — access + refresh tokens

## Quick start

### 1. Start infrastructure

From the repo root:

```bash
docker compose up -d
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

### 3. Install & migrate

```bash
npm install
npx prisma migrate deploy
npm run db:seed
```

### 4. Run API

```bash
npm run start:dev
```

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/docs`
- Health: `http://localhost:3000/api/v1/health`

## Email & notifications (Phase 2.5)

Configure SMTP in `backend/.env`:

```
MAIL_ENABLED=true
MAIL_NOTIFICATIONS_ENABLED=true
MAIL_QUEUE_ENABLED=false
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="SG Pro Growth <noreply@sgprogrowth.com>"
APP_LOGO_URL=https://your-cdn/logo.png
EMAIL_VERIFICATION_EXPIRES_HOURS=24
PASSWORD_RESET_EXPIRES_HOURS=1
```

When SMTP is not configured, emails are logged to the API console (development).

### Mail module structure

```
backend/src/modules/mail/
├── mail.service.ts              # SMTP transport + sendImmediate()
├── direct-mail-queue.service.ts # Queue-ready adapter (BullMQ hook point)
├── template.service.ts          # Branded HTML templates
├── notification-mail.service.ts # Reusable event notifications
├── mail.utils.ts                # HTML escaping, expiry labels
└── mail-queue.interface.ts      # Future Redis queue contract
```

### Auth emails (automatic)

| Event | Trigger |
|-------|---------|
| Email verification | `POST /auth/register` |
| Welcome | Successful `GET /auth/verify-email` |
| Password reset | `POST /auth/forgot-password` |
| Resend verification | `POST /auth/resend-verification` |

### Notification emails (automatic + reusable API)

| Method | Wired today | Service method |
|--------|-------------|----------------|
| Enrollment confirmation | ✅ On `POST /enrollments` | `sendEnrollmentConfirmation` |
| Course published | ✅ On `POST /courses/:slug/publish` | `sendCoursePublished` |
| Assignment notification | Ready | `sendAssignmentNotification` |
| Quiz notification | Ready | `sendQuizNotification` |
| Coaching reminder | Ready | `sendCoachingReminder` |
| Calendar reminder | Ready | `sendCalendarReminder` |
| Instructor announcement | Ready | `sendInstructorAnnouncement` |
| System announcement | Ready | `sendSystemAnnouncement` |

Notification emails also create in-app `Notification` records when delivered.

## Auth endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Create account + send verification email |
| POST | `/auth/login` | — | Sign in → tokens (requires verified email) |
| GET | `/auth/verify-email?token=` | — | Verify email from link |
| POST | `/auth/resend-verification` | — | Resend verification email |
| POST | `/auth/forgot-password` | — | Send password reset email |
| POST | `/auth/reset-password` | — | Set new password with token |
| POST | `/auth/refresh` | — | Rotate refresh token |
| POST | `/auth/logout` | Bearer | Revoke refresh token |
| GET | `/auth/me` | Bearer | Current user |

## Workspace endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/students/me` | Student | Full student dashboard bootstrap |
| GET | `/instructors/me` | Instructor | Full instructor dashboard bootstrap |

## Categories (Phase 2.4)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | — | List categories with published course counts |

## Courses (Phase 2.4)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/courses` | — | Public catalog — search, filter, paginate, sort |
| GET | `/courses/mine` | Instructor | Paginated list of owned courses |
| POST | `/courses` | Instructor | Create draft course |
| GET | `/courses/:slug` | Optional | Public detail, owner draft, or enrolled access |
| PATCH | `/courses/:slug` | Instructor (owner) | Update metadata, outcomes, requirements |
| DELETE | `/courses/:slug` | Instructor (owner) | Delete draft course (no enrollments) |
| POST | `/courses/:slug/publish` | Instructor (owner) | Publish course |
| POST | `/courses/:slug/unpublish` | Instructor (owner) | Revert to draft |
| POST | `/courses/:slug/archive` | Instructor (owner) | Archive course |
| GET | `/courses/:slug/curriculum` | Instructor (owner) | Get modules & lessons |
| PUT | `/courses/:slug/curriculum` | Instructor (owner) | Replace full curriculum |
| PATCH | `/courses/:slug/curriculum/reorder` | Instructor (owner) | Reorder modules/lessons |
| GET | `/courses/:slug/enrollments` | Instructor (owner) | List enrolled students |

**Catalog query params:** `page`, `pageSize`, `q`, `category` (slug), `instructorId`, `level`, `sort` (`relevance`|`rating`|`newest`|`title`|`duration`), `featured`, `trending`, `forTeams`

**ID convention:** Course `slug` is used as the public `id` in API responses (matches frontend routes).

## Enrollments (Phase 2.4)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/enrollments` | Student | Enroll in a published course |
| GET | `/enrollments/me` | Student | Paginated enrolled courses |
| GET | `/enrollments/courses/:courseSlug/progress` | Student | Progress summary for one course |

## Authorization rules

- **Instructors** — create, edit, publish, unpublish, archive, delete (draft only), manage curriculum for **owned** courses only
- **Students** — view published public catalog; access enrolled course detail; enroll in published courses; view own progress only
- **Public** — browse published + public catalog and course detail

### Seed accounts (password: `Password123!`)

| Email | Role |
|-------|------|
| neha.sharma@example.com | student |
| ankit.verma@example.com | student |
| cloud.lead@example.com | instructor |
| pm.coach@example.com | instructor |
| data.trainer@example.com | instructor |

Seeded courses: `aws-solutions-architect`, `it-project-management`, `data-analytics-pro`

## Project structure

```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   ├── seed-workspace.ts
│   └── migrations/
│       ├── 20260327120000_init/
│       ├── 20260327140000_auth_tokens/
│       └── 20260327160000_course_catalog_flags/
└── src/
    ├── common/
    │   ├── dto/           # pagination, course DTOs
    │   ├── guards/        # JWT, roles, optional JWT
    │   └── utils/         # slug, price formatting
    └── modules/
        ├── auth/
        ├── students/
        ├── instructors/
        ├── categories/    # ✅ Phase 2.4
        ├── courses/       # ✅ Phase 2.4
        ├── enrollments/   # ✅ Phase 2.4
        ├── mail/          # ✅ Phase 2.5 — SMTP, templates, notifications
        ├── users/
        ├── organizations/
        └── health/
```

## Next modules (Phase 2.6+)

1. BullMQ mail worker (`MAIL_QUEUE_ENABLED=true` + Redis)
2. Media uploads (thumbnails, lesson assets) via MinIO
2. Batches CRUD + bulk import
3. Assignments + grades + submissions API
4. Question bank + quizzes + attempts API
5. Communications (messages, announcements)
6. Progress tracking (lesson completion events)
7. Certificates generation

## Frontend integration

Set in frontend `.env`:

```
VITE_API_URL=http://localhost:3000/api/v1
```

| Frontend | API |
|----------|-----|
| `CoursesPage`, `CourseDetail`, `FeaturedCoursesSection` | `GET /courses`, `GET /categories` |
| `InstructorCourseEditorPage` | `POST/PATCH /courses`, curriculum, publish |
| `DashboardWorkspaceContext` | `GET /students/me`, `GET /instructors/me` |
| `StudentCoursesPage` (recommended) | `GET /courses?sort=rating` |
