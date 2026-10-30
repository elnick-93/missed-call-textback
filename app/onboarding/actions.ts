"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, accounts } from "@/db";
import { getUser } from "@/lib/supabase-server";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw.trim().startsWith("+") ? `+${digits}` : `+${digits}`;
}

export async function saveOnboarding(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");

  const businessName = String(formData.get("business_name") ?? "").trim();
  const ownerCell = normalizePhone(String(formData.get("owner_cell") ?? ""));
  const ownerEmail = String(formData.get("owner_email") ?? user.email ?? "").trim();
  const replyTemplate = String(formData.get("reply_template") ?? "").trim();
  if (!businessName || ownerCell.length < 11 || !ownerEmail || !replyTemplate) {
    redirect("/onboarding?error=missing");
  }

  const db = getDb();
  const existing = await db.select().from(accounts).where(eq(accounts.userId, user.id)).limit(1);
  if (existing.length > 0) {
    await db
      .update(accounts)
      .set({ businessName, ownerCell, ownerEmail, replyTemplate })
      .where(eq(accounts.id, existing[0].id));
  } else {
    await db.insert(accounts).values({
      userId: user.id,
      businessName,
      ownerCell,
      ownerEmail,
      replyTemplate,
    });
  }
  redirect("/dashboard");
}
