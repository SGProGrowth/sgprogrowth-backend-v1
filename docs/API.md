# API Reference

Base URL (local): `http://localhost:3000/api/v1`

All paths below are relative to the base URL. Interactive OpenAPI docs (development only): **`http://localhost:3000/docs`**.

## Conventions

- **Auth:** protected routes require header `Authorization: Bearer <access_token>`.
- **Roles:** the JWT carries an `activeRole` chosen at login. Role guards check `activeRole`. A dual-role user must log in per role.
- **Course identifier:** the course `slug` is used as the public `id` in responses and routes.
- **Pagination:** list endpoints accept `page` (default 1) and `pageSize` (default 20, max 100), returning `{ data, meta }`.

### How to test locally

1. Start the backend: `cd backend && npm run start:dev`.
2. Open Swagger at `http://localhost:3000/docs`.
3. Authenticate via `POST /auth/login`, copy `accessToken`.
4. Click **Authorize** in Swagger, paste `Bearer <accessToken>`, and call any endpoint.

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"cloud.lead@example.com","password":"Password123!","role":"instructor"}'
```

---

# 1. Authentication APIs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Create account (`role`: `student` or `instructor`); sends verification email |
| POST | `/auth/login` | — | Sign in → `{ accessToken, refreshToken, user }` |
| GET | `/auth/verify-email?token=` | — | Verify email from link token |
| POST | `/auth/resend-verification` | — | Resend verification email (generic response) |
| POST | `/auth/forgot-password` | — | Send password reset email (generic response) |
| POST | `/auth/reset-password` | — | Reset password with token |
| POST | `/auth/refresh` | — | Rotate refresh token → new access + refresh |
| POST | `/auth/logout` | Bearer | Revoke refresh token |
| POST | `/auth/change-password` | Bearer | Change password (authenticated) |
| GET | `/auth/me` | Bearer | Current authenticated user |
| GET | `/auth/test/token?email=&type=verify\|reset` | — | **Dev-only** helper; requires `E2E_TEST_MODE=true`, blocked in production |

### Request examples

**Register**
```json
POST /auth/register
{ "name": "Neha Sharma", "email": "neha@example.com", "password": "Password123!", "role": "student" }
```

**Login**
```json
POST /auth/login
{ "email": "neha@example.com", "password": "Password123!", "role": "student" }
```

**Reset password**
```json
POST /auth/reset-password
{ "token": "<from-email-link>", "password": "NewPassword123!" }
```

---

# 2. Student APIs

All require an authenticated **student** token unless noted.

### Dashboard / workspace
| Method | Path | Description |
|--------|------|-------------|
| GET | `/students/me` | Full student dashboard payload (profile, courses, assignments, quizzes, certificates, notifications, calendar, batches, summary) |
| PATCH | `/students/me/profile` | Update profile & learning preferences |
| PATCH | `/students/me/notifications/:id/read` | Mark one notification read |
| POST | `/students/me/notifications/read-all` | Mark all notifications read |

### Courses (catalog — public / optional auth)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | — | List categories with course counts |
| GET | `/courses` | — | Public catalog (filter/search/paginate) |
| GET | `/courses/:slug` | Optional | Course detail (public / enrolled / owner view) |

Catalog query params: `page`, `pageSize`, `q`, `category`, `instructorId`, `level`, `sort`, `featured`, `trending`, `forTeams`.

### Enrollments
| Method | Path | Description |
|--------|------|-------------|
| POST | `/enrollments` | Enroll in a published course (`{ courseSlug, batchId? }`) |
| GET | `/enrollments/me` | Paginated enrolled courses |
| GET | `/enrollments/courses/:courseSlug/progress` | Progress summary for one course |

### Progress
| Method | Path | Description |
|--------|------|-------------|
| GET | `/progress/me` | Progress dashboard |
| GET | `/progress/me/continue` | Continue-learning items |
| GET | `/progress/courses/:courseSlug` | Detailed course progress (modules/lessons) |
| GET | `/progress/lessons/:lessonId/courses/:courseSlug` | Single lesson progress |
| PATCH | `/progress/lessons/:lessonId/courses/:courseSlug` | Update video/time progress |
| POST | `/progress/lessons/:lessonId/courses/:courseSlug/complete` | Mark lesson complete |
| POST | `/progress/lessons/:lessonId/courses/:courseSlug/incomplete` | Mark lesson incomplete |

### Assignments
| Method | Path | Description |
|--------|------|-------------|
| GET | `/assignments/me` | Student's assignments |
| GET | `/assignments/:id` | Assignment detail |
| GET | `/assignments/:id/submissions/mine` | Student's own submission |
| POST | `/assignments/:id/submissions` | Submit (multipart: `body`, optional files) |
| PUT | `/assignments/:id/submissions` | Resubmit (when allowed) |
| GET | `/assignments/:id/submissions/mine/files/:fileId/download` | Download own submitted file |

### Quizzes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/quizzes/me` | Available quizzes |
| GET | `/quizzes/me/analytics` | Student quiz analytics |
| GET | `/quizzes/:id` | Quiz detail (student view) |
| POST | `/quizzes/:id/attempts/start` | Start an attempt |
| GET | `/quizzes/:id/attempts/history` | Past attempts |
| GET | `/quizzes/attempts/:attemptId/player` | Player state (answers hidden) |
| PATCH | `/quizzes/attempts/:attemptId/answers` | Auto-save answers |
| POST | `/quizzes/attempts/:attemptId/submit` | Submit attempt |
| GET | `/quizzes/attempts/:attemptId/result` | Attempt result |

### Certificates
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/certificates/me` | student | List earned certificates |
| GET | `/certificates/:id` | bearer | Certificate detail |
| GET | `/certificates/:id/pdf` | bearer | Download PDF |
| GET | `/certificates/verify/:credentialId` | — | **Public** verification |

### Notifications, Calendar, Batches, Profile & Settings
| Method | Path | Description |
|--------|------|-------------|
| — | (notifications) | Delivered in `/students/me`; mark read via `/students/me/notifications/*` |
| — | (calendar) | `calendarEvents` field in `/students/me` |
| GET | `/batches/me` | Student's batches |
| GET | `/batches/:id` | Batch detail |
| GET | `/batches/:id/calendar` | Batch calendar events |
| — | (profile & settings) | Read via `/students/me`; write via `PATCH /students/me/profile`; password via `POST /auth/change-password` |

### Analytics & reports (student)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/student/me` | Student analytics dashboard |
| GET | `/analytics/student/widgets` | Widget summary |
| GET | `/analytics/student/courses/:courseSlug/time` | Time spent per course |
| GET | `/reports/:type?format=csv` | Student-scoped reports (e.g. `student-progress`) |

---

# 3. Instructor APIs

All require an authenticated **instructor** token unless noted.

### Dashboard / workspace
| Method | Path | Description |
|--------|------|-------------|
| GET | `/instructors/me` | Full instructor dashboard payload |
| PATCH | `/instructors/me/profile` | Update profile |
| PATCH | `/instructors/me/notifications/:id/read` | Mark one notification read |
| POST | `/instructors/me/notifications/read-all` | Mark all notifications read |

### My courses & course management
| Method | Path | Description |
|--------|------|-------------|
| GET | `/courses/mine` | Instructor's courses |
| POST | `/courses` | Create draft course |
| PATCH | `/courses/:slug` | Update course metadata |
| DELETE | `/courses/:slug` | Delete draft (no enrollments) |
| POST | `/courses/:slug/publish` | Publish |
| POST | `/courses/:slug/unpublish` | Revert to draft |
| POST | `/courses/:slug/archive` | Archive |
| GET | `/courses/:slug/enrollments` | Enrolled students |

### Curriculum
| Method | Path | Description |
|--------|------|-------------|
| GET | `/courses/:slug/curriculum` | Get modules & lessons |
| PUT | `/courses/:slug/curriculum` | Replace curriculum |
| PATCH | `/courses/:slug/curriculum/reorder` | Reorder modules/lessons |

### Assignments & grading
| Method | Path | Description |
|--------|------|-------------|
| GET | `/assignments/mine` | Instructor's assignments |
| POST | `/assignments` | Create |
| PATCH | `/assignments/:id` | Update |
| DELETE | `/assignments/:id` | Delete |
| POST | `/assignments/:id/publish` \| `/unpublish` | Lifecycle |
| POST | `/assignments/:id/attachments` | Upload attachment |
| DELETE | `/assignments/:id/attachments/:attachmentId` | Remove attachment |
| GET | `/assignments/:id/submissions` | List submissions |
| GET | `/assignments/:id/submissions/:submissionId` | Submission detail |
| POST | `/assignments/:id/submissions/:submissionId/grade` | Grade |
| POST | `/assignments/:id/submissions/:submissionId/return` | Return for revision |
| GET | `/assignments/:id/submissions/:submissionId/files/:fileId/download` | Download submitted file |

### Question bank
| Method | Path | Description |
|--------|------|-------------|
| GET | `/questions` | Paginated question bank (search/filter) |
| POST | `/questions` | Create question |
| GET | `/questions/:id` | Detail |
| PATCH | `/questions/:id` | Update (versioned) |
| DELETE | `/questions/:id` | Delete |
| GET | `/questions/:id/preview` | Preview |
| GET | `/questions/:id/versions` \| `/versions/:version` | Version history |
| POST | `/questions/:id/archive` \| `/restore` \| `/duplicate` | Lifecycle |
| POST | `/questions/:id/attachments` | Attach media |
| GET | `/questions/categories/list` \| `/tags/list` | Taxonomy |
| POST | `/questions/categories` | Create category |
| GET | `/questions/export/csv` \| `/export/excel` | Export |
| POST | `/questions/import/csv` \| `/import/excel` | Import |

### Quiz engine
| Method | Path | Description |
|--------|------|-------------|
| GET | `/quizzes/mine` | Instructor's quizzes |
| POST | `/quizzes` | Create |
| GET | `/quizzes/:id` | Detail |
| PATCH | `/quizzes/:id` | Update |
| DELETE | `/quizzes/:id` | Delete |
| POST | `/quizzes/:id/publish` \| `/unpublish` \| `/archive` | Lifecycle |
| PUT | `/quizzes/:id/questions` | Set quiz questions |
| POST | `/quizzes/:id/questions/generate` | Auto-generate from bank |
| GET | `/quizzes/:id/analytics` | Quiz analytics |
| GET | `/quizzes/:id/attempts` | List attempts |
| POST | `/quizzes/attempts/:attemptId/answers/:answerId/grade` | Manually grade an answer |

### Students & progress analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/instructors/me` | Roster is included in workspace payload |
| GET | `/progress/instructor/courses/:courseSlug/analytics` | Course progress analytics |
| GET | `/progress/instructor/courses/:courseSlug/students/:studentId` | Per-student progress |

### Certificates & templates
| Method | Path | Description |
|--------|------|-------------|
| GET | `/certificates/mine` | Issued certificates |
| POST | `/certificates/issue` | Issue certificate |
| POST | `/certificates/:id/revoke` | Revoke |
| POST | `/certificates/:id/reissue` | Reissue |
| GET | `/certificates/:id/history` | History chain |
| GET | `/certificates/templates` | List templates |
| POST | `/certificates/templates` | Create template |
| GET | `/certificates/templates/:templateId` | Template detail |
| PATCH | `/certificates/templates/:templateId` | Update |
| POST | `/certificates/templates/:templateId/upload` | Upload background (PNG/JPEG) |
| GET | `/certificates/templates/:templateId/preview` | Preview |
| GET | `/certificates/templates/:templateId/versions` | Version history |
| GET | `/certificates/courses/:courseSlug/rules` | Get completion rules |
| PUT | `/certificates/courses/:courseSlug/rules` | Set completion rules |

### Batch management & bulk import
| Method | Path | Description |
|--------|------|-------------|
| GET | `/batches/mine` | Instructor's batches |
| POST | `/batches` | Create |
| GET | `/batches/:id` | Detail |
| PATCH | `/batches/:id` | Update |
| DELETE | `/batches/:id` | Delete |
| POST | `/batches/:id/archive` \| `/publish` \| `/unpublish` | Lifecycle |
| GET | `/batches/:id/dashboard` | Batch dashboard |
| GET | `/batches/:id/calendar` | Calendar |
| POST | `/batches/:id/events` | Add calendar event |
| GET | `/batches/:id/students` | List students |
| POST | `/batches/:id/students` | Add student |
| DELETE | `/batches/:id/students/:studentId` | Remove student |
| POST | `/batches/:id/students/:studentId/transfer` | Transfer to another batch |
| POST | `/batches/:id/instructors` | Add co-instructor |
| GET | `/batches/import/template` | Download CSV template |
| POST | `/batches/import/preview` | Preview import (multipart) |
| POST | `/batches/import/execute` | Execute import |
| GET | `/batches/import/jobs/:jobId` | Import job status |

### Analytics & reports (instructor)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/instructor/me` | Analytics dashboard |
| GET | `/analytics/instructor/widgets` | Widgets |
| GET | `/analytics/instructor/heatmap` | Activity heatmap |
| GET | `/reports/:type?format=csv\|pdf\|xlsx` | Reports (`assignments`, `quizzes`, `batches`, `certificates`, `course-progress`) |

### Media
| Method | Path | Description |
|--------|------|-------------|
| GET | `/media` | List media assets |
| GET | `/media/stats` | Storage stats |
| POST | `/media/upload` | Upload file (multipart) |
| POST | `/media/upload/batch` | Batch upload |
| POST | `/media/avatars` | Upload avatar |
| POST | `/media/courses/:courseSlug/thumbnail` \| `/banner` | Course imagery |
| POST | `/media/batches/:batchId/thumbnail` | Batch imagery |
| POST | `/media/lessons/:lessonId/resources` | Lesson resource |
| GET | `/media/:id/url` | Signed URL |
| GET | `/media/:id/download` | Download |
| DELETE | `/media/:id` | Delete |

### Notifications & Settings
Notifications are delivered in `/instructors/me`; mark read via `/instructors/me/notifications/*`. Profile/settings write via `PATCH /instructors/me/profile`; password via `POST /auth/change-password`.

---

# 4. Admin APIs (existing surface)

Admin roles (`org_admin`, `platform_admin`) exist in the schema and a small number of endpoints already accept them. See [`../INTEGRATION_GUIDE.md`](../INTEGRATION_GUIDE.md) for the full admin integration plan.

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/analytics/admin/org` | `org_admin`, `platform_admin` | Organization-wide analytics |
| GET | `/reports/:type` | includes admin roles | Org-scoped reports |
| certificates templates (`/certificates/templates*`) | `instructor`, `org_admin` | Template management |
| media routes | include admin roles | Media access |

> No `org_admin` / `platform_admin` user is seeded. Create one manually (see Integration Guide) to exercise admin endpoints.

---

# Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Basic health |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness (DB + Redis) |
| GET | `/health/detailed` | Extended dependency status (restrict in production) |

---

# Errors

```json
{
  "statusCode": 400,
  "message": "Human-readable message",
  "requestId": "uuid",
  "timestamp": "ISO-8601"
}
```

500 responses return a generic message in production; details are logged server-side with the `requestId`.

---

# Frontend → API mapping

| Frontend area | Primary API |
|---------------|-------------|
| Marketing (`/`, `/courses`) | `GET /courses`, `GET /categories` |
| Auth pages | `/auth/*` |
| Student dashboard | `GET /students/me` + module APIs (`/assignments/me`, `/quizzes/me`, `/progress/*`, `/certificates/me`) |
| Instructor dashboard | `GET /instructors/me` + module APIs (`/courses/mine`, `/assignments/mine`, `/quizzes/mine`, `/batches/mine`, `/analytics/instructor/*`) |
| Certificate verify page | `GET /certificates/verify/:credentialId` |

API client modules live in `src/lib/api/`.
