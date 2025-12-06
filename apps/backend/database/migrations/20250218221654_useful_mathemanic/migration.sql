DROP INDEX "channels_feed_url_idx";--> statement-breakpoint
DROP INDEX "fixables_channel_id_feed_url_idx";--> statement-breakpoint
DROP INDEX "sources_user_channel_idx";--> statement-breakpoint
DROP INDEX "unreads_user_item_idx";--> statement-breakpoint
DROP INDEX "users_email_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "channels_feed_url" ON "channels" USING btree ("feed_url");--> statement-breakpoint
CREATE UNIQUE INDEX "fixables_channel_id_feed_url" ON "fixables" USING btree ("channel_id","feed_url");--> statement-breakpoint
CREATE UNIQUE INDEX "sources_user_channel" ON "sources" USING btree ("user_id","channel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unreads_user_item" ON "unreads" USING btree ("user_id","item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email" ON "users" USING btree ("email");