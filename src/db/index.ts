import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Workers cannot reuse TCP sockets across requests, so create a client per call.
// prepare:false is required for Supabase's transaction-mode pooler.
export function getDb() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
  return drizzle(client, { schema });
}

export * from "./schema";
