import { getDocumentProxy } from "unpdf";

// Reads a PDF the way a resume parser would: real lines (rebuilt from each
// text item's position), clickable links, document metadata, and text that
// a human can't see (tiny or placed off the page).
export interface PdfFacts {
  text: string; // one line per visual line
  links: string[];
  pages: number;
  meta: { producer: string; creator: string; author: string; title: string };
  tinyText: string[]; // font size under 4pt
  offPageText: string[]; // drawn outside the visible page
}

interface Item {
  str: string;
  transform: number[];
  height: number;
}

const clean = (v: unknown) => (typeof v === "string" && v !== "(unspecified)" && v !== "(anonymous)" ? v : "");

export async function readPdf(bytes: Uint8Array): Promise<PdfFacts> {
  const pdf = await getDocumentProxy(bytes);
  const lines: string[] = [];
  const links = new Set<string>();
  const tinyText: string[] = [];
  const offPageText: string[] = [];

  for (let n = 1; n <= Math.min(pdf.numPages, 4); n++) {
    const page = await pdf.getPage(n);
    const { width, height } = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const raw of content.items as Item[]) {
      if (!raw.str || !raw.str.trim()) continue;
      const [a, b, , , x, y] = raw.transform;
      const size = Math.hypot(a, b) || raw.height;
      if (size > 0 && size < 4) tinyText.push(raw.str.trim());
      if (x < -2 || x > width + 2 || y < -2 || y > height + 2) offPageText.push(raw.str.trim());
      // Items within 2.5pt vertically sit on the same visual line.
      const key = [...rows.keys()].find((k) => Math.abs(k - y) < 2.5) ?? y;
      rows.set(key, [...(rows.get(key) ?? []), { x, s: raw.str }]);
    }
    for (const y of [...rows.keys()].sort((p, q) => q - p)) {
      const line = rows.get(y)!.sort((p, q) => p.x - q.x).map((i) => i.s).join(" ").replace(/\s+/g, " ").trim();
      if (line) lines.push(line);
    }
    for (const a of (await page.getAnnotations()) as { url?: string }[]) {
      if (a.url && !a.url.startsWith("mailto:")) links.add(a.url);
    }
  }

  const info = ((await pdf.getMetadata().catch(() => null))?.info ?? {}) as Record<string, unknown>;
  return {
    text: lines.join("\n"),
    links: [...links],
    pages: pdf.numPages,
    meta: { producer: clean(info.Producer), creator: clean(info.Creator), author: clean(info.Author), title: clean(info.Title) },
    tinyText,
    offPageText,
  };
}

// Neon returns bytea as a Buffer or a "\x..." hex string depending on driver mode.
export function byteaToBytes(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (typeof value === "string") return new Uint8Array(Buffer.from(value.replace(/^\\x/, ""), "hex"));
  throw new Error("Unsupported bytea value");
}
