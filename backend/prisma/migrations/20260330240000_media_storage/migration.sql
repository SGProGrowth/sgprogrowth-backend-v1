-- Phase 3.8 Media Storage & File Management

CREATE TYPE "MediaAssetType" AS ENUM (
  'avatar',
  'course_thumbnail',
  'course_banner',
  'batch_thumbnail',
  'batch_banner',
  'lesson_resource',
  'assignment_attachment',
  'submission_file',
  'certificate_pdf',
  'image',
  'document',
  'archive',
  'other'
);

CREATE TYPE "MediaVisibility" AS ENUM ('public', 'private');

CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "asset_type" "MediaAssetType" NOT NULL,
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'private',
    "storage_key" VARCHAR(512) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(128) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "variants" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "course_id" UUID,
    "batch_id" UUID,
    "lesson_id" UUID,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "media_assets_organization_id_asset_type_idx" ON "media_assets"("organization_id", "asset_type");
CREATE INDEX "media_assets_owner_id_created_at_idx" ON "media_assets"("owner_id", "created_at");
CREATE INDEX "media_assets_course_id_idx" ON "media_assets"("course_id");
CREATE INDEX "media_assets_batch_id_idx" ON "media_assets"("batch_id");
CREATE INDEX "media_assets_lesson_id_idx" ON "media_assets"("lesson_id");
CREATE INDEX "media_assets_deleted_at_idx" ON "media_assets"("deleted_at");

ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_batch_id_fkey"
    FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_lesson_id_fkey"
    FOREIGN KEY ("lesson_id") REFERENCES "course_lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
