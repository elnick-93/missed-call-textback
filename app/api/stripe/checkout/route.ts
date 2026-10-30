import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, accounts } from "@/db";
import { getUser } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import { env, appUrl } from "@/lib/env";

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.redirect(`${appUrl()}/login`, 303);
  const db = getDb();
  const [acct] = await db.select().from(accounts).where(eq(accounts.userId, user.id)).limit(1);
  if (!acct) return NextResponse.redirect(`${appUrl()}/onboarding`, 303);

  const stripe = getStripe();
  let customerId = acct.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: acct.ownerEmail,
      name: acct.businessName,
      metadata: { account_id: acct.id },
    });
    customerId = customer.id;
    await db.update(accounts).set({ stripeCustomerId: customerId }).where(eq(accounts.id, acct.id));
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: acct.id,
    line_items: [{ price: env("STRIPE_PRICE_ID"), quantity: 1 }],
    subscription_data: { metadata: { account_id: acct.id } },
    success_url: `${appUrl()}/dashboard?checkout=success`,
    cancel_url: `${appUrl()}/dashboard?checkout=cancel`,
  });
  return NextResponse.redirect(session.url!, 303);
}
