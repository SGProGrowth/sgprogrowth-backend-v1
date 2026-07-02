-- CreateEnum
CREATE TYPE "AssignmentVisibility" AS ENUM ('enrolled', 'hidden');

-- AlterEnum
ALTER TYPE "SubmissionStatus" ADD VALUE 'returned';

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN "module_id" UUID,
ADD COLUMN "lesson_id" UUID,
ADD COLUMN "late_penalty_pct" INTEGER,
ADD COLUMN "allow_resubmission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "allowed_file_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "max_file_size_bytes" INTEGER NOT NULL DEFAULT 10485760,
ADD COLUMN "visibility" "AssignmentVisibility" NOT NULL DEFAULT 'enrolled',
ADD COLUMN "published_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "assignment_submissions" ADD COLUMN "attempt_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "returned_at" TIMESTAMPTZ,
ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "submission_files" ADD COLUMN "attempt_number" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "assignment_attachments" (
    "id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "storage_key" VARCHAR(512) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(128) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_grades" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "grader_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL,
    "feedback" TEXT,
    "returned" BOOLEAN NOT NULL DEFAULT false,
    "graded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_grades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assignments_instructor_id_status_idx" ON "assignments"("instructor_id", "status");

-- CreateIndex
CREATE INDEX "assignments_module_id_idx" ON "assignments"("module_id");

-- CreateIndex
CREATE INDEX "assignments_lesson_id_idx" ON "assignments"("lesson_id");

-- CreateIndex
CREATE INDEX "assignment_attachments_assignment_id_idx" ON "assignment_attachments"("assignment_id");

-- CreateIndex
CREATE INDEX "assignment_submissions_assignment_id_status_idx" ON "assignment_submissions"("assignment_id", "status");

-- CreateIndex
CREATE INDEX "submission_files_submission_id_is_active_idx" ON "submission_files"("submission_id", "is_active");

-- CreateIndex
CREATE INDEX "assignment_grades_submission_id_graded_at_idx" ON "assignment_grades"("submission_id", "graded_at");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "course_lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_attachments" ADD CONSTRAINT "assignment_attachments_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_grades" ADD CONSTRAINT "assignment_grades_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_grades" ADD CONSTRAINT "assignment_grades_grader_id_fkey" FOREIGN KEY ("grader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
