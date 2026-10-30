import { and, eq } from "drizzle-orm";
import { getDb, accounts, calls, messages, optOuts } from "@/db";
import { readTwilioForm, twiml, sendSms } from "@/lib/twilio";
import { sendEmail } from "@/lib/resend";

const MISSED = new Set(["no-answer", "busy", "failed"]);

// Dial action callback. DialCallStatus tells us whether the owner picked up.
export async function POST(req: Request) {
  const params = await readTwilioForm(req);
  if (!params) return new Response("Invalid signature", { status: 403 });

  const dialStatus = params.DialCallStatus ?? "";
  const from = params.From ?? "";
  const to = params.To ?? "";
  if (!MISSED.has(dialStatus) || !from) return twiml("<Hangup/>");

  const db = getDb();
  const [acct] = await db.select().from(accounts).where(eq(accounts.twilioNumber, to)).limit(1);
  if (!acct) return twiml("<Hangup/>");
  if (acct.subStatus !== "active" && acct.subStatus !== "trialing") return twiml("<Hangup/>");

  const opted = await db
    .select()
    .from(optOuts)
    .where(and(eq(optOuts.accountId, acct.id), eq(optOuts.phone, from)))
    .limit(1);
  if (opted.length > 0) return twiml("<Hangup/>");

  const [call] = await db
    .insert(calls)
    .values({ accountId: acct.id, fromNumber: from, dialStatus })
    .returning();

  const reply = acct.replyTemplate.replaceAll("{business}", acct.businessName);
  const callerSms = await sendSms(from, reply);
  await db.insert(messages).values({
    accountId: acct.id,
    callId: call.id,
    direction: "outbound_caller",
    body: reply,
    twilioSid: callerSms.sid,
  });

  const alert = `Missed call from ${from}. We texted them: "${reply}"`;
  const ownerSms = await sendSms(acct.ownerCell, alert);
  await db.insert(messages).values({
    accountId: acct.id,
    callId: call.id,
    direction: "outbound_owner",
    body: alert,
    twilioSid: ownerSms.sid,
  });
  await sendEmail(acct.ownerEmail, `Missed call from ${from}`, alert);

  return twiml("<Hangup/>");
}
