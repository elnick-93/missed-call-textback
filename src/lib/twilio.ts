import { env, appUrl } from "./env";

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/**
 * Twilio signature: base64(HMAC-SHA1(authToken, url + concat(sorted key+value))).
 * The URL must match exactly what Twilio requested, so we rebuild it from APP_URL
 * (the request URL seen by the Worker may differ behind proxies).
 */
export async function validateTwilioRequest(
  req: Request,
  params: Record<string, string>
): Promise<boolean> {
  const signature = req.headers.get("x-twilio-signature");
  if (!signature) return false;
  const u = new URL(req.url);
  const url = appUrl() + u.pathname + u.search;
  const data =
    url +
    Object.keys(params)
      .sort()
      .map((k) => k + params[k])
      .join("");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env("TWILIO_AUTH_TOKEN")),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return safeEqual(toBase64(sig), signature);
}

/** Parse form body + validate. Returns null if signature invalid. */
export async function readTwilioForm(req: Request): Promise<Record<string, string> | null> {
  const form = await req.formData();
  const params: Record<string, string> = {};
  form.forEach((v, k) => {
    if (typeof v === "string") params[k] = v;
  });
  const ok = await validateTwilioRequest(req, params);
  return ok ? params : null;
}

export async function sendSms(to: string, body: string): Promise<{ sid: string | null }> {
  const sid = env("TWILIO_ACCOUNT_SID");
  const auth = btoa(`${sid}:${env("TWILIO_AUTH_TOKEN")}`);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: to,
      MessagingServiceSid: env("TWILIO_MESSAGING_SERVICE_SID"),
      Body: body,
    }),
  });
  if (!res.ok) {
    console.error("Twilio send failed", res.status, await res.text());
    return { sid: null };
  }
  const json = (await res.json()) as { sid?: string };
  return { sid: json.sid ?? null };
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function twiml(xml: string, status = 200): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${xml}</Response>`, {
    status,
    headers: { "Content-Type": "text/xml" },
  });
}
