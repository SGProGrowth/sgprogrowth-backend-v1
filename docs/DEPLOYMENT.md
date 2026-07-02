# SG Pro Growth LMS — Production Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2
- PostgreSQL 16 (or use compose)
- Redis 7+
- S3-compatible object storage (MinIO, AWS S3, R2, Spaces)
- SMTP provider for production email

## Quick Start (Production Compose)

```bash
cp backend/.env.example .env.prod
# Edit .env.prod with production secrets (32+ char JWT secrets, DB password, SMTP)

export $(cat .env.prod | xargs)
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec api npm run db:seed  # first deploy only
```

API: `http://localhost:3000/api/v1`  
Health: `GET /api/v1/health/ready`  
Swagger: `http://localhost:3000/docs`

## Environment Variables

| Variable | Required (prod) | Description |
|----------|-----------------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis for queues, cache, rate limits |
| `JWT_ACCESS_SECRET` | Yes (32+ chars) | Access token signing |
| `JWT_REFRESH_SECRET` | Yes (32+ chars) | Refresh token signing |
| `STORAGE_PROVIDER` | Yes | `s3` or `local` |
| `S3_*` | If s3 | Object storage credentials |
| `MAIL_QUEUE_ENABLED` | Recommended | `true` for async email via BullMQ |
| `SCHEDULED_JOBS_ENABLED` | Optional | Cron cleanup jobs |
| `E2E_TEST_MODE` | **Never in prod** | Test token endpoint |

## Architecture

```
Client → API (NestJS) → PostgreSQL
              ↓
           Redis ← BullMQ Workers (mail, certificates, imports, analytics, cleanup)
              ↓
         S3 / MinIO
```

## Scaling

- **Horizontal API scaling:** Run multiple `api` containers behind a load balancer. Requires Redis for throttling and BullMQ.
- **Workers:** Processors run in-process by default. For high load, run dedicated worker containers using the same image with `WORKERS_ONLY=true` (future entrypoint).
- **Database:** Add read replicas for analytics; indexes applied in migration `20260330250000_performance_indexes`.
- **Cache:** Analytics widgets cached 5 minutes in Redis.

## Health Probes

| Endpoint | Use |
|----------|-----|
| `GET /health/live` | Kubernetes liveness |
| `GET /health/ready` | Kubernetes readiness (DB + Redis) |
| `GET /health/detailed` | Ops dashboard (storage, SMTP, queues, disk, memory) |

## Backup & Restore

**PostgreSQL:**
```bash
docker exec sgpg-postgres pg_dump -U sgpg sgpg_lms > backup.sql
docker exec -i sgpg-postgres psql -U sgpg sgpg_lms < backup.sql
```

**Object storage:** Use provider-native replication/versioning. Migrate local `uploads/` with `aws s3 sync`.

**Redis:** Ephemeral (queues/cache). No backup required unless using Redis persistence for sessions.

## Disaster Recovery

1. Restore PostgreSQL from latest backup
2. Restore S3 bucket from replication/backup
3. Redeploy API containers
4. Run `prisma migrate deploy`
5. Verify `GET /health/ready` and run `node scripts/verify-backend.mjs`

## Security Checklist

- [ ] JWT secrets rotated (32+ characters, not placeholders)
- [ ] `E2E_TEST_MODE=false`
- [ ] `REQUIRE_EMAIL_VERIFICATION=true`
- [ ] CORS restricted to production frontend origin
- [ ] SMTP credentials in secrets manager
- [ ] MinIO/S3 bucket private; signed URLs for downloads
- [ ] Rate limiting via Redis (multi-instance safe)
- [ ] Structured JSON logs shipped to Loki/ELK

## CI/CD

GitHub Actions workflow `.github/workflows/ci.yml`:
- Migrate + seed + build + test + verify + Docker build
- Frontend build
- Security audit (npm audit)
