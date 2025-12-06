CREATE TYPE "public"."channel_fix_check_statuses" AS ENUM('checked', 'skipped', 'failed');--> statement-breakpoint
CREATE TYPE "public"."channel_scan_statuses" AS ENUM('scanned', 'skipped', 'failed');--> statement-breakpoint
CREATE TYPE "public"."channel_types" AS ENUM('xml', 'json');--> statement-breakpoint
CREATE TABLE "fixables" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" integer NOT NULL,
	"title" varchar,
	"feed_url" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channels" RENAME COLUMN "link" TO "site_url";--> statement-breakpoint
ALTER TABLE "channels" RENAME COLUMN "url" TO "feed_url";--> statement-breakpoint
ALTER TABLE "channels" RENAME COLUMN "error" TO "last_scan_error";--> statement-breakpoint
DROP INDEX "channels_url_idx";--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "feed_type" "channel_types";--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "last_scan_status" "channel_scan_statuses";--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "last_scan_etag" varchar;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "last_fix_checked_at" timestamp;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "last_fix_check_status" "channel_fix_check_statuses";--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "last_fix_check_etag" varchar;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "last_fix_check_error" text;--> statement-breakpoint
ALTER TABLE "fixables" ADD CONSTRAINT "fixables_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fixables_channel_id_feed_url_idx" ON "fixables" USING btree ("channel_id","feed_url");--> statement-breakpoint
CREATE UNIQUE INDEX "channels_feed_url_idx" ON "channels" USING btree ("feed_url");
