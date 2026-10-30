import { and, eq } from "drizzle-orm";
import { getDb, accounts, messages, optOuts } from "@/db";
import { readTwilioForm, twiml, sendSms } from "@/lib/twilio";

const STOP = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);
const START = new Set(["START", "YES", "UNSTOP"]);

// Messaging webhook. Note: Twilio Messaging Services handle STOP/START replies
// automatically by default; we mirror opt-outs locally to suppress sends.
export async function POST(req: Request) {
  const params = await readTwilioForm(req);
  if (!params) return new Response("Invalid signature", { status: 403 });

  const from = params.From ?? "";
  const to = params.To ?? "";
  const body = params.Body ?? "";
  const db = getDb();
  const [acct] = await db.select().from(accounts).where(eq(accounts.twilioNumber, to)).limit(1);
  if (!acct) return twiml("");

  await db.insert(messages).values({
    accountId: acct.id,
    direction: "inbound",
    body,
    twilioSid: params.MessageSid ?? null,
  });

  const keyword = body.trim().toUpperCase();
  if (STOP.has(keyword)) {
    await db.insert(optOuts).values({ accountId: acct.id, phone: from }).onConflictDoNothing();
    return twiml("");
  }
  if (START.has(keyword)) {
    await db.delete(optOuts).where(and(eq(optOuts.accountId, acct.id), eq(optOuts.phone, from)));
    return twiml("");
  }

  if (from !== acct.ownerCell) {
    await sendSms(acct.ownerCell, `Reply from ${from}: ${body}`);
  }
  return twiml("");
}
