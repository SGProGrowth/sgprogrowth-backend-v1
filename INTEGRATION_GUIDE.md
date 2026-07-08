# Admin Module — Integration Guide

This guide is for the developer building the **Admin module** on top of this repository. It explains what already exists, what to reuse, and how to add Admin functionality **without modifying existing Student/Instructor workflows**.

> **Golden rule:** Do not change existing Student or Instructor routes, services, guards, or DTOs. Add Admin functionality as new modules/routes that reuse the existing infrastructure.

---

## 1. Scope of this repository

This repository contains the complete **client-side LMS** implementation:

- **Student frontend** — `/dashboard/*`
- **Instructor frontend** — `/instructor/*`
- **Backend APIs** supporting Student and Instructor modules
- Authentication (JWT access + refresh, email verification)
- Courses, Enrollments, Assignments
- Question Bank, Quiz Engine
- Learning Progress, Certificates
- Batch Management, Analytics, Notifications
- Media Storage (S3/MinIO), SMTP integration

It does **not** include an Admin frontend or a dedicated Admin backend module (beyond a few admin-role hooks noted below).

---

## 2. Modules already completed

### Backend (`backend/src/modules/`)
| Module | Status | Notes |
|--------|--------|-------|
| `auth` | ✅ Production-ready | Register, login, verify, refresh, reset, change password |
| `students` | ✅ | Workspace bootstrap + profile |
| `instructors` | ✅ | Workspace bootstrap + profile |
| `categories` | ✅ | Public catalog taxonomy |
| `courses` | ✅ | Catalog, curriculum, publishing |
| `enrollments` | ✅ | Student enrollment lifecycle |
| `progress` | ✅ | Lesson/module/course progress |
| `assignments` | ✅ | Create, submit, grade |
| `questions` | ✅ | Question bank + import/export |
| `quizzes` | ✅ | Quiz engine + attempts + auto-grade |
| `batches` | ✅ | Cohorts + bulk CSV import |
| `certificates` | ✅ | Issue, revoke, reissue, templates, public verify |
| `analytics` | ✅ | Student/instructor dashboards, reports; **admin org endpoint exists** |
| `media` | ✅ | Uploads, signed URLs |
| `mail` | ✅ | SMTP + notification emails |
| `health` | ✅ | Liveness/readiness/detailed probes |

### Frontend
| Area | Status |
|------|--------|
| Marketing site | ✅ |
| Auth flows | ✅ |
| Student dashboard (11 pages) | ✅ |
| Instructor dashboard (13 pages) | ✅ |

---

## 3. APIs already available and production-ready

See [`docs/API.md`](docs/API.md) for the full reference. Summary of reusable surfaces:

- **Auth:** `/auth/*` — reuse as-is for admin login (admins log in through the same endpoint with an admin role).
- **Catalog:** `/courses`, `/categories` — read models for admin course oversight.
- **Users/profiles:** `/students/me`, `/instructors/me` (self-scoped only — see gaps below).
- **Assessments, batches, certificates, media, analytics, progress** — all role-guarded and production-ready for their respective roles.

---

## 4. Admin integration expectations

### 4.1 Roles are already defined

The `UserRole` enum (`backend/prisma/schema.prisma`) already includes:

```prisma
enum UserRole {
  student
  instructor
  org_admin
  platform_admin
}
```

Guards (`RolesGuard`) and the `@Roles(...)` decorator work with these values today. **No schema change is required to introduce admins.**

### 4.2 APIs that already support admin roles

| Endpoint | Roles accepted | Reuse for |
|----------|----------------|-----------|
| `GET /analytics/admin/org` | `org_admin`, `platform_admin` | Org-wide analytics dashboard |
| `GET /reports/:type` | student, instructor, `org_admin`, `platform_admin` | Org-scoped report exports |
| `/certificates/templates*` | `instructor`, `org_admin` | Certificate template administration |
| `/media/*` (list/url/download/delete) | includes `org_admin`, `platform_admin` | Media oversight |

`AnalyticsService.assertAdminRole()` and `CertificateTemplatesService` already branch on admin roles — use these as reference patterns.

### 4.3 APIs the Admin module should reuse (read-only oversight)

For most read scenarios, reuse existing services rather than duplicating queries:

- Course catalog & detail — `courses` module
- Enrollment counts — `courses`/`enrollments`
- Analytics & reports — `analytics` module (extend admin branch)
- Certificates — `certificates` module (issue/revoke already exist)

### 4.4 New Admin APIs that likely need to be added separately

These do **not** exist yet and are the Admin developer's responsibility. Add them as a **new `admin` module** (e.g. `backend/src/modules/admin/`) with `@Roles(UserRole.org_admin, UserRole.platform_admin)`:

| Capability | Why it's new |
|------------|--------------|
| User management (list/search/suspend/activate users across roles) | Current `/students/me` & `/instructors/me` are **self-scoped**; no cross-user admin listing exists |
| Instructor approval / role assignment | No endpoint assigns/revokes roles |
| Organization settings management | `Organization` model exists; no admin CRUD endpoints |
| Global course moderation (approve/feature/takedown any instructor's course) | Course mutations are **owner-scoped** to the instructor |
| Cross-instructor / cross-student data views | Existing services scope by `user.sub`; add admin-scoped queries |
| Audit logs, platform-wide notifications/announcements | `Announcement` model exists but no admin API |

**Pattern to follow:**
1. Create `backend/src/modules/admin/admin.module.ts`, `admin.controller.ts`, `admin.service.ts`.
2. Guard every route with `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.org_admin, UserRole.platform_admin)`.
3. Inject existing services (e.g. `PrismaService`, `CoursesService`) — **do not modify** their existing methods; add new admin-specific methods if needed.
4. Register `AdminModule` in `app.module.ts`.

### 4.5 Frontend routes

**Existing routes (do not repurpose):**
- Student: `/dashboard/*`
- Instructor: `/instructor/*`
- Auth: `/login`, `/register`, `/verify-email`, etc.

**Reserved for Admin (not yet implemented — safe to claim):**
- `/admin` and `/admin/*` — **currently unused**; recommended namespace for the Admin SPA area.

**Suggested approach:**
1. Add an `/admin` route tree in `src/App.tsx` guarded by a new `ProtectedRoute requiredRole="org_admin"` (extend `ProtectedRoute` to accept admin roles — additive change).
2. Create `src/pages/dashboard/admin/` for admin pages.
3. Add `src/lib/api/admin.ts` for admin API calls, mirroring existing `src/lib/api/*` patterns (use the shared `apiRequest` client in `src/lib/api/client.ts`).
4. Reuse existing UI components (`src/components/dashboard/`, `src/components/ui/`).

### 4.6 Creating an admin user for local testing

No admin user is seeded. Create one via Prisma Studio or a script:

```bash
cd backend
npx prisma studio   # open User + UserRoleAssignment tables
```

Or add an entry to `backend/prisma/seed.ts` following the existing `seedUsers` pattern with `role: UserRole.org_admin`, then re-run `npm run db:seed`. Ensure the user is linked to the default organization (`OrganizationMember`).

---

## 5. What NOT to change

To keep Student/Instructor workflows intact:

- ❌ Do not modify existing controller routes, DTOs, or service method signatures.
- ❌ Do not change `RolesGuard`, `JwtAuthGuard`, or `JwtStrategy` behavior.
- ❌ Do not repurpose `/dashboard/*` or `/instructor/*` routes.
- ❌ Do not alter existing Prisma models in breaking ways — add new fields/models via new migrations only.
- ✅ Extend `ProtectedRoute` additively to support admin roles.
- ✅ Add a new `admin` backend module and `/admin` frontend tree.

---

## 6. Known limitations / upcoming features

These are **intentionally deferred** and are **not bugs**. They render a branded "Coming Soon" page and are hidden from sidebar navigation (reachable only by direct URL):

| Feature | Routes |
|---------|--------|
| Messages | `/dashboard/messages`, `/instructor/messages` |
| Live Coaching | `/dashboard/coaching`, `/instructor/coaching` |
| Downloads | `/dashboard/downloads` |
| Earnings / Payouts | `/instructor/earnings` |
| Announcements creation | `/instructor/announcements` |

Some backing tables (`Message`, `MessageThread`, `Announcement`, `CoachingSession`) exist in the schema but have no active UI/API. The Admin developer may build on these if implementing related admin features, but they are out of scope for the current handover.

---

## 7. Quick reference for the Admin developer

| Need | Where |
|------|-------|
| Setup instructions | [`README.md`](README.md) |
| Endpoint reference | [`docs/API.md`](docs/API.md) |
| DB schema & migrations | [`docs/DATABASE.md`](docs/DATABASE.md) |
| Architecture / module map | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Role guards | `backend/src/common/guards/auth.guards.ts` |
| Role decorator | `backend/src/common/decorators/auth.decorator.ts` |
| Existing admin-role example | `backend/src/modules/analytics/analytics.controller.ts` (`getAdminAnalytics`) |
| API client pattern | `src/lib/api/client.ts` |
| Protected route pattern | `src/routes/ProtectedRoute.tsx` |
| Env variables | [`backend/.env.example`](backend/.env.example) |
