-- Phase 3.5 Certificate Management System

CREATE TYPE "CertificateStatus" AS ENUM ('active', 'revoked', 'expired', 'superseded');
CREATE TYPE "CertificateVerificationResult" AS ENUM ('valid', 'invalid', 'revoked', 'expired');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'certificate';

CREATE TABLE "certificate_templates" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "design" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "certificate_completion_rules" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "require_progress_pct" INTEGER NOT NULL DEFAULT 100,
    "require_all_lessons" BOOLEAN NOT NULL DEFAULT true,
    "require_assignments_submitted" BOOLEAN NOT NULL DEFAULT false,
    "min_assignment_score_pct" INTEGER,
    "require_quiz_pass" BOOLEAN NOT NULL DEFAULT false,
    "min_quiz_pass_pct" INTEGER NOT NULL DEFAULT 70,
    "require_live_sessions" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "certificate_completion_rules_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "certificates" ADD COLUMN "organization_id" UUID;
ALTER TABLE "certificates" ADD COLUMN "course_id" UUID;
ALTER TABLE "certificates" ADD COLUMN "student_id" UUID;
ALTER TABLE "certificates" ADD COLUMN "template_id" UUID;
ALTER TABLE "certificates" ADD COLUMN "certificate_number" VARCHAR(100);
ALTER TABLE "certificates" ADD COLUMN "student_name" VARCHAR(255);
ALTER TABLE "certificates" ADD COLUMN "instructor_name" VARCHAR(255);
ALTER TABLE "certificates" ADD COLUMN "status" "CertificateStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "certificates" ADD COLUMN "completion_date" TIMESTAMPTZ;
ALTER TABLE "certificates" ADD COLUMN "expires_at" TIMESTAMPTZ;
ALTER TABLE "certificates" ADD COLUMN "verification_url" VARCHAR(512);
ALTER TABLE "certificates" ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "certificates" ADD COLUMN "revoked_at" TIMESTAMPTZ;
ALTER TABLE "certificates" ADD COLUMN "revoked_by_id" UUID;
ALTER TABLE "certificates" ADD COLUMN "revoke_reason" TEXT;
ALTER TABLE "certificates" ADD COLUMN "reissued_from_id" UUID;
ALTER TABLE "certificates" ADD COLUMN "issued_by_id" UUID;
ALTER TABLE "certificates" ADD COLUMN "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "certificates" ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "certificates" c
SET
    "organization_id" = e."organization_id",
    "course_id" = e."course_id",
    "student_id" = e."student_id",
    "certificate_number" = c."credential_id",
    "student_name" = COALESCE(sp."display_name", u."email"),
    "instructor_name" = COALESCE(ip."display_name", 'Instructor'),
    "completion_date" = c."issued_at",
    "verification_url" = CONCAT('/verify/', c."credential_id")
FROM "enrollments" e
JOIN "users" u ON u."id" = e."student_id"
LEFT JOIN "student_profiles" sp ON sp."user_id" = u."id"
JOIN "courses" co ON co."id" = e."course_id"
JOIN "users" iu ON iu."id" = co."instructor_id"
LEFT JOIN "instructor_profiles" ip ON ip."user_id" = iu."id"
WHERE c."enrollment_id" = e."id";

ALTER TABLE "certificates" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "certificates" ALTER COLUMN "course_id" SET NOT NULL;
ALTER TABLE "certificates" ALTER COLUMN "student_id" SET NOT NULL;
ALTER TABLE "certificates" ALTER COLUMN "certificate_number" SET NOT NULL;
ALTER TABLE "certificates" ALTER COLUMN "student_name" SET NOT NULL;
ALTER TABLE "certificates" ALTER COLUMN "instructor_name" SET NOT NULL;
ALTER TABLE "certificates" ALTER COLUMN "completion_date" SET NOT NULL;
ALTER TABLE "certificates" ALTER COLUMN "verification_url" SET NOT NULL;

CREATE TABLE "certificate_verifications" (
    "id" UUID NOT NULL,
    "certificate_id" UUID,
    "credential_id" VARCHAR(100) NOT NULL,
    "result" "CertificateVerificationResult" NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(512),
    "verified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "certificate_verifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "certificate_templates_organization_id_slug_key" ON "certificate_templates"("organization_id", "slug");
CREATE INDEX "certificate_templates_organization_id_active_idx" ON "certificate_templates"("organization_id", "active");
CREATE UNIQUE INDEX "certificate_completion_rules_course_id_key" ON "certificate_completion_rules"("course_id");
CREATE UNIQUE INDEX "certificates_certificate_number_key" ON "certificates"("certificate_number");
CREATE INDEX "certificates_student_id_status_idx" ON "certificates"("student_id", "status");
CREATE INDEX "certificates_course_id_status_idx" ON "certificates"("course_id", "status");
CREATE INDEX "certificates_enrollment_id_idx" ON "certificates"("enrollment_id");
CREATE INDEX "certificate_verifications_credential_id_idx" ON "certificate_verifications"("credential_id");
CREATE INDEX "certificate_verifications_certificate_id_idx" ON "certificate_verifications"("certificate_id");

ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "certificate_completion_rules" ADD CONSTRAINT "certificate_completion_rules_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "certificates" ADD CONSTRAINT "certificates_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_reissued_from_id_fkey"
    FOREIGN KEY ("reissued_from_id") REFERENCES "certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_revoked_by_id_fkey"
    FOREIGN KEY ("revoked_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_issued_by_id_fkey"
    FOREIGN KEY ("issued_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "certificate_verifications" ADD CONSTRAINT "certificate_verifications_certificate_id_fkey"
    FOREIGN KEY ("certificate_id") REFERENCES "certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
