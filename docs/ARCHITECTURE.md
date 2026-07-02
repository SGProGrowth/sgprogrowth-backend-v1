# SG Pro Growth LMS — Architecture (Phase 3.9)

## Stack

| Layer | Technology |
|-------|------------|
| API | NestJS 11, TypeScript |
| Database | PostgreSQL 16, Prisma ORM |
| Cache / Queues | Redis 7, BullMQ |
| Storage | S3-compatible (MinIO / AWS / R2) |
| Auth | JWT (access + refresh), Argon2 |
| Email | Nodemailer + BullMQ workers |
| Logging | Pino (JSON in production) |

## Module Map

```
src/
├── config/          Startup env validation
├── redis/           Redis client (global)
├── cache/           Redis-backed cache with memory fallback
├── queue/           BullMQ queues + processors
├── modules/
│   ├── auth/        Registration, login, tokens
│   ├── courses/     Catalog, curriculum, publishing
│   ├── assignments/ Submissions, grading
│   ├── quizzes/     Attempts, auto-grading
│   ├── progress/    Lesson/course tracking
│   ├── certificates/ PDF generation, verification
│   ├── batches/     Cohorts, bulk import
│   ├── analytics/   Dashboards, reports
│   ├── media/       Object storage asset registry
│   └── health/      Liveness, readiness, detailed probes
```

## Background Jobs (BullMQ)

| Queue | Purpose |
|-------|---------|
| `mail` | Async email delivery (when `MAIL_QUEUE_ENABLED=true`) |
| `certificates` | PDF generation |
| `batch-import` | Large CSV imports (50+ rows) |
| `analytics` | Cache warming |
| `notifications` | Scheduled digests |
| `cleanup` | Token expiry, orphan media hard-delete |

Processors run in-process via `WorkersModule`. For high scale, run dedicated worker containers.

## Request Flow

```
HTTP Request
  → RequestIdMiddleware (X-Request-Id)
  → Pino HTTP logger
  → ThrottlerGuard (Redis-backed when REDIS_URL set)
  → JwtAuthGuard + RolesGuard
  → Controller → Service → Prisma / Storage / Queue
  → AllExceptionsFilter (structured error + requestId)
```

## Data Stores

- **PostgreSQL:** All relational data, 11 migrations
- **Redis:** BullMQ, rate limits, analytics cache, E2E test tokens (dev only)
- **S3/MinIO:** Binary files (media, certificates, assignments)

## Security

- Helmet + CSP (production)
- CORS allowlist via `CORS_ORIGIN`
- Env validation at startup (JWT secret length, Redis required in prod)
- Private media with signed URLs and RBAC
- `E2E_TEST_MODE` must be `false` in production

## Scaling Guide

1. Run multiple API replicas behind load balancer
2. Enable `MAIL_QUEUE_ENABLED=true` and Redis
3. Add read replica for analytics queries
4. Use CDN for public media variants
5. Monitor `/health/detailed` and queue failed job counts

See [DEPLOYMENT.md](./DEPLOYMENT.md) for ops procedures.
