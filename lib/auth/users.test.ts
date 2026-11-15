import { describe, expect, it } from "vitest";

import { normalizeEmail, normalizePhone, normalizeSkills, passwordProblem } from "./users";

describe("sign-up input rules", () => {
  it("lower-cases and validates emails", () => {
    expect(normalizeEmail("  Tommy@USC.edu ")).toBe("tommy@usc.edu");
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail(42)).toBeNull();
  });

  it("accepts an optional phone number and rejects junk", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("+1 (213) 555-1234")).toBe("+12135551234");
    expect(normalizePhone("call me")).toBeUndefined();
  });

  it("requires passwords of at least 8 characters", () => {
    expect(passwordProblem("short")).toMatch(/at least 8/);
    expect(passwordProblem("long enough pw")).toBeNull();
  });

  it("cleans skills into a lower-case, de-duplicated list", () => {
    expect(normalizeSkills("Python, SQL, python, , React")).toEqual(["python", "sql", "react"]);
    expect(normalizeSkills(["PyTorch", 5, "LLM"])).toEqual(["pytorch", "llm"]);
  });
});
