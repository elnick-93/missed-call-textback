"use client";
import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const supabase = createSupabaseBrowser();
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

  async function magicLink(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setMsg(error ? error.message : "Check your email for a login link.");
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) setMsg(error.message);
  }

  return (
    <main>
      <h1>Log in</h1>
      <form onSubmit={magicLink}>
        <input
          type="email"
          required
          placeholder="you@business.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Email me a link</button>
      </form>
      <p>or</p>
      <button onClick={google}>Continue with Google</button>
      {msg && <p>{msg}</p>}
    </main>
  );
}
