// Gets job-post text from what the student pasted, or from a public job page.
// LinkedIn and Handshake need a login, so we never fetch them: the student pastes the text.
const BLOCKED = /(^|\.)(linkedin\.com|joinhandshake\.com|handshake\.com)$/i;

export class JobTextError extends Error {}

export async function jobTextFrom(input: { text?: unknown; url?: unknown }): Promise<string> {
  const pasted = typeof input.text === "string" ? input.text.trim() : "";
  if (pasted.length >= 200) return pasted.slice(0, 15000);
  const url = typeof input.url === "string" ? input.url.trim() : "";
  if (!url) {
    if (pasted.length > 0) throw new JobTextError("That job post is too short. Paste the full description, or leave it empty for a general evaluation.");
    return ""; // no job: evaluate the resume on its own
  }
  let host = "";
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) throw new Error();
    host = u.hostname;
  } catch {
    throw new JobTextError("That link doesn't look right. Paste the job description instead.");
  }
  if (BLOCKED.test(host)) throw new JobTextError("LinkedIn and Handshake need you to be logged in, so we can't open them. Copy the job description text and paste it here.");
  const res = await fetch(url, { headers: { "User-Agent": "TrojanJobMatch/1.0" }, signal: AbortSignal.timeout(10000), redirect: "follow" }).catch(() => null);
  if (!res?.ok) throw new JobTextError("Couldn't open that page. Paste the job description instead.");
  const html = (await res.text()).slice(0, 600000);
  const text = html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|h\d|br|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
  if (text.length < 200) throw new JobTextError("That page didn't have readable job text. Paste the job description instead.");
  return text.slice(0, 15000);
}
