CREATE TYPE "public"."delivery_method" AS ENUM('courier', 'hand_delivery', 'collect');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('pending_review', 'placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."presentation_option" AS ENUM('house_case', 'gift', 'engraving');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('error', 'info', 'success', 'warning');--> statement-breakpoint
CREATE TYPE "public"."type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_match_method" AS ENUM('order_number', 'phone', 'manual', 'unmatched');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_message_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_message_status" AS ENUM('received', 'matched', 'applied', 'ignored');--> statement-breakpoint
CREATE TABLE "action_rate_limit" (
	"count" integer NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"window_start" timestamp NOT NULL,
	CONSTRAINT "action_rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "category" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"description" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"image" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_image" (
	"id" text PRIMARY KEY NOT NULL,
	"media_type" text DEFAULT 'image' NOT NULL,
	"product_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"case_material" text,
	"case_size_mm" integer,
	"category_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"description" text NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"features" jsonb NOT NULL,
	"gemstone" text,
	"id" text PRIMARY KEY NOT NULL,
	"image" text NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"metal" text,
	"movement" text,
	"name" text NOT NULL,
	"on_table" boolean DEFAULT false NOT NULL,
	"price" integer NOT NULL,
	"ref" text NOT NULL,
	"specs" jsonb NOT NULL,
	"model_id" text,
	"strap_material" text,
	"subcategory_id" text,
	"table_cutout_url" text,
	"table_sort_order" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"water_resistance_m" integer
);
--> statement-breakpoint
CREATE TABLE "subcategory" (
	"category_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watch_model" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"subcategory_id" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiry" (
	"carrier" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"customer_contact" text NOT NULL,
	"customer_name" text NOT NULL,
	"delivery_address" jsonb,
	"delivery_cost" integer,
	"delivery_method" "delivery_method",
	"delivery_status" "delivery_status" DEFAULT 'pending_review' NOT NULL,
	"engraving_text" text,
	"id" text PRIMARY KEY NOT NULL,
	"items" jsonb NOT NULL,
	"note" text,
	"order_number" integer GENERATED ALWAYS AS IDENTITY (sequence name "inquiry_order_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"presentation_cost" integer,
	"presentation_option" "presentation_option",
	"status" "inquiry_status" DEFAULT 'pending' NOT NULL,
	"subtotal" integer NOT NULL,
	"tracking_url" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "integration_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"whatsapp_access_token" text,
	"whatsapp_app_secret" text,
	"whatsapp_phone_number_id" text,
	"whatsapp_verify_token" text
);
--> statement-breakpoint
CREATE TABLE "newsletter_signup" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	CONSTRAINT "newsletter_signup_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"description" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"link" text,
	"read" boolean DEFAULT false NOT NULL,
	"title" text NOT NULL,
	"type" "notification_type" DEFAULT 'info' NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_review" (
	"approved" boolean DEFAULT false NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"customer_name" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"rating" integer NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"description" text NOT NULL,
	"facebook_url" text,
	"favicon_url" text,
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"instagram_url" text,
	"logo_url" text,
	"name" text NOT NULL,
	"no_money_mode" boolean DEFAULT false NOT NULL,
	"slogan" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"whatsapp_number" text
);
--> statement-breakpoint
CREATE TABLE "inquiry_shipment" (
	"carrier" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"inquiry_id" text NOT NULL,
	"item_ids" jsonb,
	"label" text,
	"tracking_number" text,
	"tracking_url" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_notification" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"notified" boolean DEFAULT false NOT NULL,
	"product_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonial" (
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"customer_handle" text NOT NULL,
	"customer_name" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"quote" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"type" "type" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"url" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"access_token" text,
	"access_token_expires_at" timestamp,
	"account_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"id_token" text,
	"password" text,
	"provider_id" text NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"count" integer NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"ip_address" text,
	"token" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"backup_codes" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"age" integer,
	"created_at" timestamp NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"first_name" text,
	"id" text PRIMARY KEY NOT NULL,
	"image" text,
	"last_name" text,
	"name" text NOT NULL,
	"two_factor_enabled" boolean,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"created_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"updated_at" timestamp,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_message" (
	"applied_shipment_id" text,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"direction" "whatsapp_message_direction" NOT NULL,
	"extracted_carrier" text,
	"extracted_order_number" integer,
	"extracted_tracking_number" text,
	"from_phone" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"inquiry_id" text,
	"match_method" "whatsapp_match_method" DEFAULT 'unmatched' NOT NULL,
	"raw_payload" jsonb,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"status" "whatsapp_message_status" DEFAULT 'received' NOT NULL,
	"to_phone" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"wa_message_id" text NOT NULL,
	CONSTRAINT "whatsapp_message_wa_message_id_unique" UNIQUE("wa_message_id")
);
--> statement-breakpoint
ALTER TABLE "product_image" ADD CONSTRAINT "product_image_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_model_id_watch_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."watch_model"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_subcategory_id_subcategory_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategory"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcategory" ADD CONSTRAINT "subcategory_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_model" ADD CONSTRAINT "watch_model_subcategory_id_subcategory_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_review" ADD CONSTRAINT "product_review_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_review" ADD CONSTRAINT "product_review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry_shipment" ADD CONSTRAINT "inquiry_shipment_inquiry_id_inquiry_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_notification" ADD CONSTRAINT "stock_notification_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_message" ADD CONSTRAINT "whatsapp_message_applied_shipment_id_inquiry_shipment_id_fk" FOREIGN KEY ("applied_shipment_id") REFERENCES "public"."inquiry_shipment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_message" ADD CONSTRAINT "whatsapp_message_inquiry_id_inquiry_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiry"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_image_product_id_idx" ON "product_image" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_visible_idx" ON "product" USING btree ("visible");--> statement-breakpoint
CREATE INDEX "product_category_id_idx" ON "product" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_model_id_idx" ON "product" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "product_on_table_idx" ON "product" USING btree ("on_table");--> statement-breakpoint
CREATE INDEX "product_featured_idx" ON "product" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "product_visible_category_idx" ON "product" USING btree ("visible","category_id");--> statement-breakpoint
CREATE INDEX "subcategory_category_id_idx" ON "subcategory" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "watch_model_subcategory_id_idx" ON "watch_model" USING btree ("subcategory_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_notification_product_email_idx" ON "stock_notification" USING btree ("product_id","email");