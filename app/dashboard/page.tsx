import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDb, accounts, calls, messages } from "@/db";
import { getUser } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await getUser();
  if (!user) redirect("/login");
  const db = getDb();
  const [acct] = await db.select().from(accounts).where(eq(accounts.userId, user.id)).limit(1);
  if (!acct) redirect("/onboarding");

  const recentCalls = await db
    .select()
    .from(calls)
    .where(eq(calls.accountId, acct.id))
    .orderBy(desc(calls.createdAt))
    .limit(50);
  const recentMsgs = await db
    .select()
    .from(messages)
    .where(eq(messages.accountId, acct.id))
    .orderBy(desc(messages.createdAt))
    .limit(100);
  const sent = recentMsgs.filter((m) => m.direction === "outbound_caller");
  const replies = recentMsgs.filter((m) => m.direction === "inbound");
  const active = acct.subStatus === "active" || acct.subStatus === "trialing";

  return (
    <main>
      <h1>{acct.businessName}</h1>
      <p>
        Subscription: <strong>{acct.subStatus}</strong> · Text-back number:{" "}
        <strong>{acct.twilioNumber ?? "pending assignment"}</strong> · <Link href="/onboarding">Edit settings</Link>
      </p>
      {active ? (
        <form action="/api/stripe/portal" method="post">
          <button type="submit">Manage billing</button>
        </form>
      ) : (
        <form action="/api/stripe/checkout" method="post">
          <button type="submit">Subscribe – $49/mo</button>
        </form>
      )}

      <h2>Missed calls ({recentCalls.length})</h2>
      <ul>
        {recentCalls.map((c) => (
          <li key={c.id}>
            {c.fromNumber} – {c.dialStatus} – {c.createdAt.toLocaleString()}
          </li>
        ))}
      </ul>

      <h2>Texts sent ({sent.length})</h2>
      <ul>
        {sent.map((m) => (
          <li key={m.id}>{m.createdAt.toLocaleString()}: {m.body}</li>
        ))}
      </ul>

      <h2>Replies ({replies.length})</h2>
      <ul>
        {replies.map((m) => (
          <li key={m.id}>{m.createdAt.toLocaleString()}: {m.body}</li>
        ))}
      </ul>
    </main>
  );
}
