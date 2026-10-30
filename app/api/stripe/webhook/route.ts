import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb, accounts } from "@/db";
import { getStripe, cryptoProvider } from "@/lib/stripe";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });
  const body = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      env("STRIPE_WEBHOOK_SECRET"),
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error("Stripe signature failed", err);
    return new Response("Bad signature", { status: 400 });
  }

  const db = getDb();
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const accountId = s.client_reference_id;
      const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
      if (accountId) {
        await db
          .update(accounts)
          .set({ subStatus: "active", ...(customerId ? { stripeCustomerId: customerId } : {}) })
          .where(eq(accounts.id, accountId));
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const status = event.type === "customer.subscription.deleted" ? "canceled" : sub.status;
      await db.update(accounts).set({ subStatus: status }).where(eq(accounts.stripeCustomerId, customerId));
      break;
    }
    default:
      break;
  }
  return Response.json({ received: true });
}
