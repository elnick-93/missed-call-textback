import { eq } from "drizzle-orm";
import { getDb, accounts } from "@/db";
import { readTwilioForm, twiml, escapeXml } from "@/lib/twilio";
import { appUrl } from "@/lib/env";

// Twilio Voice webhook for the account's Twilio number (customer forwards unanswered calls here).
export async function POST(req: Request) {
  const params = await readTwilioForm(req);
  if (!params) return new Response("Invalid signature", { status: 403 });

  const to = params.To ?? "";
  const db = getDb();
  const [acct] = await db.select().from(accounts).where(eq(accounts.twilioNumber, to)).limit(1);
  if (!acct) return twiml("<Say>This number is not in service.</Say><Hangup/>");

  const action = escapeXml(`${appUrl()}/api/voice/status`);
  return twiml(
    `<Dial timeout="20" action="${action}" method="POST">${escapeXml(acct.ownerCell)}</Dial>`
  );
}
