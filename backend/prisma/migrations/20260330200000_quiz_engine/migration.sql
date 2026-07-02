-- Phase 3.3 Quiz Engine

CREATE TYPE "QuizVisibility" AS ENUM ('enrolled', 'hidden', 'public');
CREATE TYPE "QuizAttemptStatus" AS ENUM ('in_progress', 'submitted', 'auto_graded', 'pending_manual', 'graded', 'expired');
CREATE TYPE "QuizAnswerGradingStatus" AS ENUM ('ungraded', 'auto_graded', 'pending_manual', 'manually_graded');
CREATE TYPE "QuizQuestionSelectionMode" AS ENUM ('manual', 'category', 'tag', 'difficulty', 'random');

ALTER TABLE "quizzes" ADD COLUMN "module_id" UUID;
ALTER TABLE "quizzes" ADD COLUMN "lesson_id" UUID;
ALTER TABLE "quizzes" ADD COLUMN "description" TEXT;
ALTER TABLE "quizzes" ADD COLUMN "instructions" TEXT;
ALTER TABLE "quizzes" ADD COLUMN "unlimited_duration" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "quizzes" ADD COLUMN "total_marks" INTEGER;
ALTER TABLE "quizzes" ADD COLUMN "randomize_questions" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "quizzes" ADD COLUMN "randomize_options" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "quizzes" ADD COLUMN "negative_marking" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "quizzes" ADD COLUMN "show_score_immediately" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "quizzes" ADD COLUMN "show_correct_answers" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "quizzes" ADD COLUMN "show_explanations" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "quizzes" ADD COLUMN "available_from" TIMESTAMPTZ;
ALTER TABLE "quizzes" ADD COLUMN "available_until" TIMESTAMPTZ;
ALTER TABLE "quizzes" ADD COLUMN "visibility" "QuizVisibility" NOT NULL DEFAULT 'enrolled';
ALTER TABLE "quizzes" ADD COLUMN "selection_mode" "QuizQuestionSelectionMode" NOT NULL DEFAULT 'manual';
ALTER TABLE "quizzes" ADD COLUMN "selection_rules" JSONB;

ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "course_lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "quizzes_course_id_status_idx" ON "quizzes"("course_id", "status");

-- Migrate quiz_attempts status to enum
ALTER TABLE "quiz_attempts" ADD COLUMN "percentage" DOUBLE PRECISION;
ALTER TABLE "quiz_attempts" ADD COLUMN "passed" BOOLEAN;
ALTER TABLE "quiz_attempts" ADD COLUMN "time_taken_seconds" INTEGER;
ALTER TABLE "quiz_attempts" ADD COLUMN "flagged_question_ids" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "quiz_attempts" ADD COLUMN "expires_at" TIMESTAMPTZ;
ALTER TABLE "quiz_attempts" ADD COLUMN "last_saved_at" TIMESTAMPTZ;

ALTER TABLE "quiz_attempts" ADD COLUMN "status_new" "QuizAttemptStatus" NOT NULL DEFAULT 'in_progress';

UPDATE "quiz_attempts" SET "status_new" = CASE
  WHEN "status" = 'graded' THEN 'graded'::"QuizAttemptStatus"
  WHEN "status" = 'submitted' THEN 'submitted'::"QuizAttemptStatus"
  WHEN "status" = 'in_progress' THEN 'in_progress'::"QuizAttemptStatus"
  ELSE 'graded'::"QuizAttemptStatus"
END;

ALTER TABLE "quiz_attempts" DROP COLUMN "status";
ALTER TABLE "quiz_attempts" RENAME COLUMN "status_new" TO "status";

ALTER TABLE "quiz_attempts" ALTER COLUMN "score" TYPE DOUBLE PRECISION USING "score"::DOUBLE PRECISION;
ALTER TABLE "quiz_attempts" ALTER COLUMN "max_score" TYPE DOUBLE PRECISION USING "max_score"::DOUBLE PRECISION;

CREATE UNIQUE INDEX "quiz_attempts_quiz_id_enrollment_id_attempt_number_key" ON "quiz_attempts"("quiz_id", "enrollment_id", "attempt_number");
CREATE INDEX "quiz_attempts_quiz_id_status_idx" ON "quiz_attempts"("quiz_id", "status");

CREATE INDEX "quiz_questions_quiz_id_sort_order_idx" ON "quiz_questions"("quiz_id", "sort_order");

CREATE TABLE "quiz_answers" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "quiz_question_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "response" JSONB NOT NULL DEFAULT '{}',
    "score" DOUBLE PRECISION,
    "max_score" DOUBLE PRECISION NOT NULL,
    "is_correct" BOOLEAN,
    "grading_status" "QuizAnswerGradingStatus" NOT NULL DEFAULT 'ungraded',
    "feedback" TEXT,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quiz_answers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quiz_results" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "max_score" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "time_taken_seconds" INTEGER NOT NULL,
    "grading_status" "QuizAttemptStatus" NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL,
    "submitted_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quiz_answers_attempt_id_quiz_question_id_key" ON "quiz_answers"("attempt_id", "quiz_question_id");
CREATE INDEX "quiz_answers_attempt_id_idx" ON "quiz_answers"("attempt_id");

CREATE UNIQUE INDEX "quiz_results_attempt_id_key" ON "quiz_results"("attempt_id");
CREATE INDEX "quiz_results_quiz_id_submitted_at_idx" ON "quiz_results"("quiz_id", "submitted_at");
CREATE INDEX "quiz_results_enrollment_id_idx" ON "quiz_results"("enrollment_id");

ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_quiz_question_id_fkey" FOREIGN KEY ("quiz_question_id") REFERENCES "quiz_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question_bank_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
