// @vitest-environment node
//
// jose's key-type check is a strict `instanceof Uint8Array`, and jsdom's
// realm creates its own Uint8Array constructor distinct from Node's, so
// this file runs under plain Node.
import { beforeAll, describe, expect, it } from "vitest";

import { createSessionToken, sessionCookieOptions, verifySessionToken } from "./session";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-only-secret-do-not-use-in-production";
});

describe("session tokens", () => {
  it("returns the user id the token was made for", async () => {
    const token = await createSessionToken(42, false);
    await expect(verifySessionToken(token)).resolves.toBe(42);
  });

  it("keeps different users apart", async () => {
    const a = await createSessionToken(1, true);
    const b = await createSessionToken(2, true);
    await expect(verifySessionToken(a)).resolves.toBe(1);
    await expect(verifySessionToken(b)).resolves.toBe(2);
  });

  it("rejects a tampered token", async () => {
    const token = await createSessionToken(7, true);
    await expect(verifySessionToken(token.slice(0, -4) + "abcd")).resolves.toBeNull();
  });

  it("rejects garbage input", async () => {
    await expect(verifySessionToken("not-a-jwt-at-all")).resolves.toBeNull();
  });
});

describe("keep me logged in", () => {
  it("lasts 30 days when ticked and ends with the browser otherwise", () => {
    expect(sessionCookieOptions(true).maxAge).toBe(60 * 60 * 24 * 30);
    expect("maxAge" in sessionCookieOptions(false)).toBe(false);
    expect(sessionCookieOptions(false).httpOnly).toBe(true);
  });
});
