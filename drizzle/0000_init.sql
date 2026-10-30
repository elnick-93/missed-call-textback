CREATE TABLE IF NOT EXISTS "accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "business_name" text NOT NULL,
  "owner_cell" text NOT NULL,
  "owner_email" text NOT NULL,
  "reply_template" text NOT NULL,
  "twilio_number" text UNIQUE,
  "stripe_customer_id" text,
  "sub_status" text DEFAULT 'inactive' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "calls" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "from_number" text NOT NULL,
  "dial_status" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "call_id" uuid REFERENCES "calls"("id") ON DELETE SET NULL,
  "direction" text NOT NULL,
  "body" text NOT NULL,
  "twilio_sid" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "opt_outs" (
  "account_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "phone" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("account_id", "phone")
);

CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts" ("user_id");
CREATE INDEX IF NOT EXISTS "calls_account_idx" ON "calls" ("account_id", "created_at");
CREATE INDEX IF NOT EXISTS "messages_account_idx" ON "messages" ("account_id", "created_at");
