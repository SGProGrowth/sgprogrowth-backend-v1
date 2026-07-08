-- Certificate template versioning & course assignment

ALTER TABLE "courses" ADD COLUMN "certificate_template_id" UUID;

ALTER TABLE "certificate_templates"
  ADD COLUMN "current_version_id" UUID,
  ADD COLUMN "created_by_id" UUID;

CREATE TABLE "certificate_template_versions" (
  "id" UUID NOT NULL,
  "template_id" UUID NOT NULL,
  "version_number" INTEGER NOT NULL,
  "storage_key" VARCHAR(512),
  "mime_type" VARCHAR(128),
  "file_size_bytes" INTEGER,
  "original_name" VARCHAR(255),
  "design" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by_id" UUID,

  CONSTRAINT "certificate_template_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "certificate_template_versions_template_id_version_number_key"
  ON "certificate_template_versions"("template_id", "version_number");
CREATE INDEX "certificate_template_versions_template_id_idx"
  ON "certificate_template_versions"("template_id");

ALTER TABLE "certificates"
  ADD COLUMN "template_version_id" UUID,
  ADD COLUMN "design_snapshot" JSONB;

-- Seed version 1 for existing templates (legacy JSON-only templates remain inactive until re-uploaded)
INSERT INTO "certificate_template_versions" (
  "id", "template_id", "version_number", "design", "created_at"
)
SELECT
  gen_random_uuid(),
  "id",
  1,
  "design",
  "created_at"
FROM "certificate_templates";

UPDATE "certificate_templates" AS t
SET "current_version_id" = v."id"
FROM "certificate_template_versions" AS v
WHERE v."template_id" = t."id" AND v."version_number" = 1;

ALTER TABLE "courses"
  ADD CONSTRAINT "courses_certificate_template_id_fkey"
  FOREIGN KEY ("certificate_template_id") REFERENCES "certificate_templates"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "certificate_templates"
  ADD CONSTRAINT "certificate_templates_current_version_id_fkey"
  FOREIGN KEY ("current_version_id") REFERENCES "certificate_template_versions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "certificate_templates"
  ADD CONSTRAINT "certificate_templates_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "certificate_template_versions"
  ADD CONSTRAINT "certificate_template_versions_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "certificate_templates"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "certificate_template_versions"
  ADD CONSTRAINT "certificate_template_versions_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "certificates"
  ADD CONSTRAINT "certificates_template_version_id_fkey"
  FOREIGN KEY ("template_version_id") REFERENCES "certificate_template_versions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "certificate_templates_current_version_id_key"
  ON "certificate_templates"("current_version_id");
