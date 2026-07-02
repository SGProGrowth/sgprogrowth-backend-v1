-- Phase 3.4 Learning Progress Engine

CREATE TYPE "LessonProgressStatus" AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE "LearningActivityType" AS ENUM (
  'lesson_started', 'lesson_completed', 'lesson_incomplete', 'video_progress',
  'resource_download', 'assignment_submitted', 'quiz_submitted', 'quiz_passed',
  'module_completed', 'course_completed', 'live_attended'
);

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'progress';

ALTER TABLE "enrollments" ADD COLUMN "last_lesson_id" UUID;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_last_lesson_id_fkey"
  FOREIGN KEY ("last_lesson_id") REFERENCES "course_lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lesson_progress" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "status" "LessonProgressStatus" NOT NULL DEFAULT 'not_started',
    "video_progress_pct" INTEGER NOT NULL DEFAULT 0,
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "resource_downloaded" BOOLEAN NOT NULL DEFAULT false,
    "visit_count" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMPTZ,
    "last_accessed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "module_progress" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "completed_lessons" INTEGER NOT NULL DEFAULT 0,
    "total_lessons" INTEGER NOT NULL DEFAULT 0,
    "progress_pct" INTEGER NOT NULL DEFAULT 0,
    "estimated_minutes_remaining" INTEGER,
    "completed_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "module_progress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_progress" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "lessons_completed" INTEGER NOT NULL DEFAULT 0,
    "total_lessons" INTEGER NOT NULL DEFAULT 0,
    "modules_completed" INTEGER NOT NULL DEFAULT 0,
    "total_modules" INTEGER NOT NULL DEFAULT 0,
    "assignments_completed" INTEGER NOT NULL DEFAULT 0,
    "total_assignments" INTEGER NOT NULL DEFAULT 0,
    "quizzes_completed" INTEGER NOT NULL DEFAULT 0,
    "total_quizzes" INTEGER NOT NULL DEFAULT 0,
    "progress_pct" INTEGER NOT NULL DEFAULT 0,
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "last_lesson_id" UUID,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "course_progress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "learning_activities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "enrollment_id" UUID,
    "course_id" UUID,
    "lesson_id" UUID,
    "type" "LearningActivityType" NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "learning_activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "progress_history" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "progress_pct" INTEGER NOT NULL,
    "previous_pct" INTEGER NOT NULL,
    "trigger" VARCHAR(100) NOT NULL,
    "snapshot" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "progress_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lesson_progress_enrollment_id_lesson_id_key" ON "lesson_progress"("enrollment_id", "lesson_id");
CREATE INDEX "lesson_progress_enrollment_id_status_idx" ON "lesson_progress"("enrollment_id", "status");
CREATE INDEX "lesson_progress_course_id_lesson_id_idx" ON "lesson_progress"("course_id", "lesson_id");

CREATE UNIQUE INDEX "module_progress_enrollment_id_module_id_key" ON "module_progress"("enrollment_id", "module_id");
CREATE INDEX "module_progress_enrollment_id_idx" ON "module_progress"("enrollment_id");

CREATE UNIQUE INDEX "course_progress_enrollment_id_key" ON "course_progress"("enrollment_id");
CREATE INDEX "course_progress_course_id_progress_pct_idx" ON "course_progress"("course_id", "progress_pct");
CREATE INDEX "course_progress_student_id_idx" ON "course_progress"("student_id");

CREATE INDEX "learning_activities_user_id_created_at_idx" ON "learning_activities"("user_id", "created_at");
CREATE INDEX "learning_activities_enrollment_id_created_at_idx" ON "learning_activities"("enrollment_id", "created_at");
CREATE INDEX "learning_activities_course_id_type_idx" ON "learning_activities"("course_id", "type");

CREATE INDEX "progress_history_enrollment_id_created_at_idx" ON "progress_history"("enrollment_id", "created_at");

ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "course_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_last_lesson_id_fkey" FOREIGN KEY ("last_lesson_id") REFERENCES "course_lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "learning_activities" ADD CONSTRAINT "learning_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learning_activities" ADD CONSTRAINT "learning_activities_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "learning_activities" ADD CONSTRAINT "learning_activities_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "learning_activities" ADD CONSTRAINT "learning_activities_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "course_lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "progress_history" ADD CONSTRAINT "progress_history_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
