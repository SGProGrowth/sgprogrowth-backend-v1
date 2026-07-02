-- Extend QuestionType enum
ALTER TYPE "QuestionType" ADD VALUE 'multiple_choice_multi';
ALTER TYPE "QuestionType" ADD VALUE 'long_answer';
ALTER TYPE "QuestionType" ADD VALUE 'fill_blank';
ALTER TYPE "QuestionType" ADD VALUE 'matching';
ALTER TYPE "QuestionType" ADD VALUE 'ordering';

-- Extend question_bank_items (Question model)
ALTER TABLE "question_bank_items" ADD COLUMN "created_by_id" UUID,
ADD COLUMN "updated_by_id" UUID,
ADD COLUMN "course_id" UUID,
ADD COLUMN "module_id" UUID,
ADD COLUMN "lesson_id" UUID,
ADD COLUMN "category_id" UUID,
ADD COLUMN "title" VARCHAR(500),
ADD COLUMN "explanation" TEXT,
ADD COLUMN "subject" VARCHAR(150),
ADD COLUMN "topic" VARCHAR(150),
ADD COLUMN "negative_marks" DOUBLE PRECISION,
ADD COLUMN "estimated_seconds" INTEGER,
ADD COLUMN "code_snippet" TEXT,
ADD COLUMN "current_version" INTEGER NOT NULL DEFAULT 1;

UPDATE "question_bank_items" SET "created_by_id" = "instructor_id" WHERE "created_by_id" IS NULL;
ALTER TABLE "question_bank_items" ALTER COLUMN "created_by_id" SET NOT NULL;

ALTER TABLE "quiz_questions" ADD COLUMN "pinned_version" INTEGER;

-- CreateTable question_categories
CREATE TABLE "question_categories" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "instructor_id" UUID,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "subject" VARCHAR(150),
    "parent_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "question_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable question_tags
CREATE TABLE "question_tags" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "question_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable question_options
CREATE TABLE "question_options" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "label" VARCHAR(10),
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "match_key" VARCHAR(100),
    "match_value" TEXT,
    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable question_tag_links
CREATE TABLE "question_tag_links" (
    "question_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    CONSTRAINT "question_tag_links_pkey" PRIMARY KEY ("question_id","tag_id")
);

-- CreateTable question_attachments
CREATE TABLE "question_attachments" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "storage_key" VARCHAR(512) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(128) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "kind" VARCHAR(20) NOT NULL DEFAULT 'file',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "question_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable question_versions
CREATE TABLE "question_versions" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changed_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "question_versions_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "question_bank_items_organization_id_instructor_id_status_idx" ON "question_bank_items"("organization_id", "instructor_id", "status");
CREATE INDEX "question_bank_items_course_id_idx" ON "question_bank_items"("course_id");
CREATE INDEX "question_bank_items_category_id_idx" ON "question_bank_items"("category_id");
CREATE INDEX "question_bank_items_type_difficulty_idx" ON "question_bank_items"("type", "difficulty");
CREATE UNIQUE INDEX "question_categories_organization_id_slug_key" ON "question_categories"("organization_id", "slug");
CREATE INDEX "question_categories_organization_id_instructor_id_idx" ON "question_categories"("organization_id", "instructor_id");
CREATE UNIQUE INDEX "question_tags_organization_id_slug_key" ON "question_tags"("organization_id", "slug");
CREATE INDEX "question_options_question_id_sort_order_idx" ON "question_options"("question_id", "sort_order");
CREATE INDEX "question_attachments_question_id_idx" ON "question_attachments"("question_id");
CREATE UNIQUE INDEX "question_versions_question_id_version_number_key" ON "question_versions"("question_id", "version_number");
CREATE INDEX "question_versions_question_id_created_at_idx" ON "question_versions"("question_id", "created_at");

-- ForeignKeys
ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "course_lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "question_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "question_categories" ADD CONSTRAINT "question_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "question_categories" ADD CONSTRAINT "question_categories_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "question_categories" ADD CONSTRAINT "question_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "question_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question_bank_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "question_tag_links" ADD CONSTRAINT "question_tag_links_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question_bank_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_tag_links" ADD CONSTRAINT "question_tag_links_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "question_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "question_attachments" ADD CONSTRAINT "question_attachments_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question_bank_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question_bank_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
