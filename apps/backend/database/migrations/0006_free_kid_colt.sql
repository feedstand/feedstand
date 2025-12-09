ALTER TABLE "channels" RENAME COLUMN "last_scanned_at" TO "last_scan_at";--> statement-breakpoint
ALTER TABLE "channels" RENAME COLUMN "last_fix_checked_at" TO "last_fix_check_at";--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "last_scan_last_modified" varchar;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "last_fix_check_last_modified" varchar;