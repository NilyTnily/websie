ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "is_new_arrival" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "new_arrival_at" timestamp;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "new_arrival_sort_order" integer;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN IF NOT EXISTS "whatsapp_template_new_arrivals" text;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN IF NOT EXISTS "whatsapp_template_new_arrivals_body" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_is_new_arrival_idx" ON "product" USING btree ("is_new_arrival");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_new_arrival_sort_order_idx" ON "product" USING btree ("new_arrival_sort_order");