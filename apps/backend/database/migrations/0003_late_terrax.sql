DROP INDEX "items_guid_idx";--> statement-breakpoint
DROP INDEX "items_channel_id_guid";--> statement-breakpoint
DROP INDEX "items_published_at_idx";--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "item_checksum" varchar;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "content_checksum" varchar;--> statement-breakpoint
CREATE INDEX "items_item_checksum" ON "items" USING btree ("item_checksum");--> statement-breakpoint
CREATE UNIQUE INDEX "items_channel_id_item_checksum_content_checksum" ON "items" USING btree ("channel_id","item_checksum","content_checksum");--> statement-breakpoint
CREATE INDEX "items_published_at" ON "items" USING btree ("published_at");--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "is_readabilitified";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "error";
