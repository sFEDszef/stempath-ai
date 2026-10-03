ALTER TABLE "projects" ADD COLUMN "completion_celebration_seen" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "projects" SET "completion_celebration_seen" = true WHERE "status" = 'COMPLETED';
