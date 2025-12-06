CREATE TYPE "public"."fixable_types" AS ENUM('defunct', 'redirect');--> statement-breakpoint
CREATE TABLE "aliases" (
	"id" serial PRIMARY KEY NOT NULL,
	"alias_url" text NOT NULL,
	"channel_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" RENAME COLUMN "item_checksum" TO "item_hash";--> statement-breakpoint
ALTER TABLE "items" RENAME COLUMN "content_checksum" TO "content_hash";--> statement-breakpoint
ALTER TABLE "sources" RENAME COLUMN "channel_id" TO "alias_id";--> statement-breakpoint
ALTER TABLE "fixables" DROP CONSTRAINT "fixables_channel_id_channels_id_fk";
--> statement-breakpoint
ALTER TABLE "sources" DROP CONSTRAINT "sources_channel_id_channels_id_fk";
--> statement-breakpoint
DROP INDEX "fixables_channel_id_feed_url";--> statement-breakpoint
DROP INDEX "sources_user_channel";--> statement-breakpoint
DROP INDEX "items_item_checksum";--> statement-breakpoint
DROP INDEX "items_channel_id_item_checksum_content_checksum";--> statement-breakpoint
ALTER TABLE "fixables" ALTER COLUMN "channel_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "self_url" text;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "last_scan_hash" varchar;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "last_fix_check_hash" varchar;--> statement-breakpoint
ALTER TABLE "fixables" ADD COLUMN "type" "fixable_types" NOT NULL;--> statement-breakpoint
ALTER TABLE "fixables" ADD COLUMN "from_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "aliases" ADD CONSTRAINT "aliases_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "channel_aliases_alias_url" ON "aliases" USING btree ("alias_url");--> statement-breakpoint
ALTER TABLE "fixables" ADD CONSTRAINT "fixables_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_alias_id_aliases_id_fk" FOREIGN KEY ("alias_id") REFERENCES "public"."aliases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fixables_type" ON "fixables" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "fixables_from_url" ON "fixables" USING btree ("feed_url");--> statement-breakpoint
CREATE INDEX "fixables_feed_url" ON "fixables" USING btree ("feed_url");--> statement-breakpoint
CREATE UNIQUE INDEX "sources_user_alias" ON "sources" USING btree ("user_id","alias_id");--> statement-breakpoint
CREATE INDEX "items_item_checksum" ON "items" USING btree ("item_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "items_channel_id_item_checksum_content_checksum" ON "items" USING btree ("channel_id","item_hash","content_hash");--> statement-breakpoint
ALTER TABLE "public"."channels" ALTER COLUMN "feed_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."channel_types";--> statement-breakpoint
CREATE TYPE "public"."channel_types" AS ENUM('atom', 'json', 'rdf', 'rss');--> statement-breakpoint
ALTER TABLE "public"."channels" ALTER COLUMN "feed_type" SET DATA TYPE "public"."channel_types" USING "feed_type"::"public"."channel_types";