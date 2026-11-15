import { neon } from "@neondatabase/serverless";

// Postgres (Neon) over HTTP: no connection pool to manage on serverless.
// Created on first use, so importing this file never needs DATABASE_URL.
let client: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    client = neon(url);
  }
  return client;
}
