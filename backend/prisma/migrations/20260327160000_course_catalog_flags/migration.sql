-- AlterTable
ALTER TABLE "courses" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "courses" ADD COLUMN "trending" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "courses" ADD COLUMN "is_new" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "courses" ADD COLUMN "for_teams" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "course_lessons" ADD COLUMN "description" TEXT;

-- CreateIndex
CREATE INDEX "courses_organization_id_status_visibility_featured_idx" ON "courses"("organization_id", "status", "visibility", "featured");

-- CreateIndex
CREATE INDEX "courses_category_id_status_idx" ON "courses"("category_id", "status");
