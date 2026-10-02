CREATE TYPE "public"."account_status" AS ENUM('ACTIVE', 'DISABLED');--> statement-breakpoint
CREATE TYPE "public"."account_role" AS ENUM('STUDENT', 'RESEARCHER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."stem_stage" AS ENUM('understand', 'imagine', 'plan', 'build', 'test', 'improve', 'reflect');--> statement-breakpoint
CREATE TYPE "public"."stage_status" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'READY', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "task_assignments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"condition" varchar(32) NOT NULL,
	"research_config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_records" (
	"project_id" uuid NOT NULL,
	"stage" "stem_stage" NOT NULL,
	"field" varchar(80) NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_records_project_id_stage_field_pk" PRIMARY KEY("project_id","stage","field")
);
--> statement-breakpoint
CREATE TABLE "login_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"attempts" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"project_id" uuid NOT NULL,
	"id" varchar(100) NOT NULL,
	"stage" "stem_stage" NOT NULL,
	"role" varchar(16) NOT NULL,
	"text" text NOT NULL,
	"suggestions" jsonb,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_project_id_id_pk" PRIMARY KEY("project_id","id"),
	CONSTRAINT "message_role" CHECK ("messages"."role" in ('student','assistant'))
);
--> statement-breakpoint
CREATE TABLE "project_stage_state" (
	"project_id" uuid NOT NULL,
	"stage" "stem_stage" NOT NULL,
	"status" "stage_status" NOT NULL,
	"challenge" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_stage_state_project_id_stage_pk" PRIMARY KEY("project_id","stage")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"assignment_id" uuid,
	"current_stage" "stem_stage" NOT NULL,
	"support_level" integer NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"notebook" text DEFAULT '' NOT NULL,
	"research_config" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"last_opened_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_level_range" CHECK ("projects"."support_level" between 1 and 3)
);
--> statement-breakpoint
CREATE TABLE "research_events" (
	"session_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "research_events_session_id_event_id_pk" PRIMARY KEY("session_id","event_id")
);
--> statement-breakpoint
CREATE TABLE "research_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_definitions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"definition_id" varchar(100) NOT NULL,
	"revision" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"participant_code" varchar(32) NOT NULL,
	"pin_hash" text NOT NULL,
	"role" "account_role" DEFAULT 'STUDENT' NOT NULL,
	"status" "account_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_task_id_task_definitions_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_records" ADD CONSTRAINT "learning_records_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_stage_state" ADD CONSTRAINT "project_stage_state_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_task_id_task_definitions_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_assignment_id_task_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."task_assignments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_events" ADD CONSTRAINT "research_events_session_id_research_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."research_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_sessions" ADD CONSTRAINT "research_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_sessions" ADD CONSTRAINT "research_sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_definitions" ADD CONSTRAINT "task_definitions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assignments_user" ON "task_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_user_task" ON "task_assignments" USING btree ("user_id","task_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_user" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_expiry" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "login_limits_expiry" ON "login_limits" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "messages_stage_order" ON "messages" USING btree ("project_id","stage","position");--> statement-breakpoint
CREATE INDEX "projects_owner" ON "projects" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "research_sessions_owner" ON "research_sessions" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_revision_unique" ON "task_definitions" USING btree ("definition_id","revision");--> statement-breakpoint
CREATE UNIQUE INDEX "users_participant_code_unique" ON "users" USING btree ("participant_code");