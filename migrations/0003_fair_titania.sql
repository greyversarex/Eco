CREATE TABLE "sessions" (
	"sid" text PRIMARY KEY NOT NULL,
	"sess" text NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "content" text;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "document_number" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "document_number" text;