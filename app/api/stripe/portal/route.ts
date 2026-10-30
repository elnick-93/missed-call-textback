import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, accounts } from "@/db";
import { getUser } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import { appUrl } from "@/lib/env";

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.redirect(`${appUrl()}/login`, 303);
  const db = getDb();
  const [acct] = await db.select().from(accounts).where(eq(accounts.userId, user.id)).limit(1);
  if (!acct?.stripeCustomerId) return NextResponse.redirect(`${appUrl()}/dashboard`, 303);

  const session = await getStripe().billingPortal.sessions.create({
    customer: acct.stripeCustomerId,
    return_url: `${appUrl()}/dashboard`,
  });
  return NextResponse.redirect(session.url, 303);
}
