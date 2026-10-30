// Read lazily: on Cloudflare (nodejs_compat) process.env is populated per request.
export function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function appUrl(): string {
  return env("APP_URL").replace(/\/$/, "");
}
