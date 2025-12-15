ALTER TYPE "public"."channel_types" RENAME TO "channel_formats";--> statement-breakpoint
ALTER TABLE "channels" RENAME COLUMN "feed_type" TO "feed_format";