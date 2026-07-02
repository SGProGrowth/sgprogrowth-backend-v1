-- Phase 3.6 Batch Management & Bulk Import

ALTER TYPE "BatchStatus" ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE "BatchStatus" ADD VALUE IF NOT EXISTS 'archived';

CREATE TYPE "BatchVisibility" AS ENUM ('public', 'private', 'invite');
CREATE TYPE "BatchInstructorRole" AS ENUM ('lead', 'assistant');
CREATE TYPE "BatchEnrollmentStatus" AS ENUM ('active', 'waitlist', 'completed', 'dropped');
CREATE TYPE "BatchImportJobStatus" AS ENUM ('pending', 'preview', 'processing', 'completed', 'failed', 'rolled_back');
CREATE TYPE "BatchImportRowStatus" AS ENUM ('valid', 'warning', 'error', 'imported', 'skipped');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'batch';

ALTER TABLE "batches" ADD COLUMN "batch_code" VARCHAR(50);
ALTER TABLE "batches" ADD COLUMN "description" TEXT;
ALTER TABLE "batches" ADD COLUMN "visibility" "BatchVisibility" NOT NULL DEFAULT 'private';
ALTER TABLE "batches" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "batches" ADD COLUMN "thumbnail_url" VARCHAR(512);
ALTER TABLE "batches" ADD COLUMN "banner_url" VARCHAR(512);

UPDATE "batches" SET "batch_code" = UPPER(SUBSTRING(REPLACE("id"::text, '-', ''), 1, 12)) WHERE "batch_code" IS NULL;
UPDATE "batches" SET "published" = true, "status" = 'active' WHERE "status" = 'active';
UPDATE "batches" SET "published" = true WHERE "status" IN ('upcoming', 'completed');

ALTER TABLE "batches" ALTER COLUMN "batch_code" SET NOT NULL;

CREATE UNIQUE INDEX "batches_organization_id_batch_code_key" ON "batches"("organization_id", "batch_code");
CREATE INDEX "batches_organization_id_published_idx" ON "batches"("organization_id", "published");

CREATE TABLE "batch_instructors" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "instructor_id" UUID NOT NULL,
    "role" "BatchInstructorRole" NOT NULL DEFAULT 'assistant',
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "batch_instructors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "batch_enrollments" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "enrollment_id" UUID,
    "status" "BatchEnrollmentStatus" NOT NULL DEFAULT 'active',
    "enrolled_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dropped_at" TIMESTAMPTZ,
    "notes" TEXT,
    CONSTRAINT "batch_enrollments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "batch_events" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "batch_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "batch_import_jobs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "instructor_id" UUID NOT NULL,
    "batch_id" UUID,
    "course_id" UUID,
    "file_name" VARCHAR(255) NOT NULL,
    "status" "BatchImportJobStatus" NOT NULL DEFAULT 'pending',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "warning_count" INTEGER NOT NULL DEFAULT 0,
    "column_mapping" JSONB NOT NULL DEFAULT '{}',
    "summary" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    CONSTRAINT "batch_import_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "batch_import_rows" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "row_number" INTEGER NOT NULL,
    "raw_data" JSONB NOT NULL DEFAULT '{}',
    "parsed_data" JSONB NOT NULL DEFAULT '{}',
    "status" "BatchImportRowStatus" NOT NULL DEFAULT 'valid',
    "message" TEXT,
    "student_id" UUID,
    "enrollment_id" UUID,
    CONSTRAINT "batch_import_rows_pkey" PRIMARY KEY ("id")
);

INSERT INTO "batch_instructors" ("id", "batch_id", "instructor_id", "role")
SELECT gen_random_uuid(), b."id", b."instructor_id", 'lead' FROM "batches" b;

INSERT INTO "batch_enrollments" ("id", "batch_id", "student_id", "enrollment_id", "status", "enrolled_at")
SELECT gen_random_uuid(), e."batch_id", e."student_id", e."id", 'active', e."enrolled_at"
FROM "enrollments" e
WHERE e."batch_id" IS NOT NULL;

CREATE UNIQUE INDEX "batch_instructors_batch_id_instructor_id_key" ON "batch_instructors"("batch_id", "instructor_id");
CREATE INDEX "batch_instructors_instructor_id_idx" ON "batch_instructors"("instructor_id");
CREATE UNIQUE INDEX "batch_enrollments_batch_id_student_id_key" ON "batch_enrollments"("batch_id", "student_id");
CREATE INDEX "batch_enrollments_batch_id_status_idx" ON "batch_enrollments"("batch_id", "status");
CREATE INDEX "batch_enrollments_student_id_idx" ON "batch_enrollments"("student_id");
CREATE INDEX "batch_events_batch_id_starts_at_idx" ON "batch_events"("batch_id", "starts_at");
CREATE INDEX "batch_import_jobs_instructor_id_created_at_idx" ON "batch_import_jobs"("instructor_id", "created_at");
CREATE INDEX "batch_import_rows_job_id_status_idx" ON "batch_import_rows"("job_id", "status");

ALTER TABLE "batch_instructors" ADD CONSTRAINT "batch_instructors_batch_id_fkey"
    FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "batch_instructors" ADD CONSTRAINT "batch_instructors_instructor_id_fkey"
    FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "batch_enrollments" ADD CONSTRAINT "batch_enrollments_batch_id_fkey"
    FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "batch_enrollments" ADD CONSTRAINT "batch_enrollments_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "batch_enrollments" ADD CONSTRAINT "batch_enrollments_enrollment_id_fkey"
    FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "batch_events" ADD CONSTRAINT "batch_events_batch_id_fkey"
    FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "batch_import_jobs" ADD CONSTRAINT "batch_import_jobs_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "batch_import_jobs" ADD CONSTRAINT "batch_import_jobs_instructor_id_fkey"
    FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "batch_import_jobs" ADD CONSTRAINT "batch_import_jobs_batch_id_fkey"
    FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "batch_import_jobs" ADD CONSTRAINT "batch_import_jobs_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "batch_import_rows" ADD CONSTRAINT "batch_import_rows_job_id_fkey"
    FOREIGN KEY ("job_id") REFERENCES "batch_import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
