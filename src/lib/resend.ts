import { env } from "./env";

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env("RESEND_FROM"), to: [to], subject, text }),
  });
  if (!res.ok) console.error("Resend failed", res.status, await res.text());
}
