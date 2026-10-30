import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, accounts } from "@/db";
import { getUser } from "@/lib/supabase-server";
import { saveOnboarding } from "./actions";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const db = getDb();
  const [acct] = await db.select().from(accounts).where(eq(accounts.userId, user.id)).limit(1);

  return (
    <main>
      <h1>Set up your text-back</h1>
      <form action={saveOnboarding} style={{ display: "grid", gap: 12 }}>
        <label>
          Business name
          <input name="business_name" required defaultValue={acct?.businessName ?? ""} />
        </label>
        <label>
          Your cell (we ring this first)
          <input name="owner_cell" required defaultValue={acct?.ownerCell ?? ""} />
        </label>
        <label>
          Alert email
          <input name="owner_email" type="email" required defaultValue={acct?.ownerEmail ?? user.email ?? ""} />
        </label>
        <label>
          Auto-reply text
          <textarea
            name="reply_template"
            required
            rows={4}
            defaultValue={
              acct?.replyTemplate ??
              "Hi, sorry we missed your call! This is {business}. How can we help? Reply STOP to opt out."
            }
          />
        </label>
        <small>Use {"{business}"} to insert your business name.</small>
        <button type="submit">Save</button>
      </form>
    </main>
  );
}
