import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Missed a call? We text them back in seconds.</h1>
      <p>
        For plumbers, electricians, HVAC, roofers and other local trades. When you can&apos;t pick up,
        your caller instantly gets a friendly text from your business, and you get an alert with their
        number so you can win the job.
      </p>
      <ul>
        <li>Works with your existing cell number (conditional call forwarding)</li>
        <li>Custom auto-reply message</li>
        <li>SMS + email alerts for every missed call</li>
        <li>Replies forwarded straight to your phone</li>
      </ul>
      <section style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}>
        <h2>$49/month</h2>
        <p>One plan. Everything included. Cancel anytime.</p>
        <Link href="/login">Get started</Link>
      </section>
    </main>
  );
}
