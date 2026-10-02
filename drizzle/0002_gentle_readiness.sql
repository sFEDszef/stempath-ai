ALTER TABLE "project_stage_state" ADD COLUMN "readiness" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "readiness_policy_version" varchar(24) DEFAULT 'checkpoint-v1' NOT NULL;