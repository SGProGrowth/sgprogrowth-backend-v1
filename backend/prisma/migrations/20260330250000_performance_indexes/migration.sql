-- Phase 3.9: Performance indexes for analytics and enrollment queries
CREATE INDEX IF NOT EXISTS "enrollments_enrolled_at_idx" ON "enrollments"("enrolled_at");
CREATE INDEX IF NOT EXISTS "enrollments_last_accessed_at_idx" ON "enrollments"("last_accessed_at");
CREATE INDEX IF NOT EXISTS "enrollments_batch_id_idx" ON "enrollments"("batch_id");
CREATE INDEX IF NOT EXISTS "enrollments_organization_id_idx" ON "enrollments"("organization_id");
CREATE INDEX IF NOT EXISTS "enrollments_completed_at_idx" ON "enrollments"("completed_at");
CREATE INDEX IF NOT EXISTS "enrollments_course_id_status_idx" ON "enrollments"("course_id", "status");
CREATE INDEX IF NOT EXISTS "learning_activities_course_id_created_at_idx" ON "learning_activities"("course_id", "created_at");
