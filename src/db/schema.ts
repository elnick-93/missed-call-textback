import { pgTable, uuid, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  businessName: text("business_name").notNull(),
  ownerCell: text("owner_cell").notNull(),
  ownerEmail: text("owner_email").notNull(),
  replyTemplate: text("reply_template").notNull(),
  twilioNumber: text("twilio_number").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  subStatus: text("sub_status").notNull().default("inactive"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const calls = pgTable("calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  fromNumber: text("from_number").notNull(),
  dialStatus: text("dial_status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  callId: uuid("call_id").references(() => calls.id, { onDelete: "set null" }),
  // 'outbound_caller' | 'outbound_owner' | 'inbound'
  direction: text("direction").notNull(),
  body: text("body").notNull(),
  twilioSid: text("twilio_sid"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const optOuts = pgTable(
  "opt_outs",
  {
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    phone: text("phone").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.phone] })]
);

export type Account = typeof accounts.$inferSelect;
