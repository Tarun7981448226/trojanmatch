import type { CSSProperties, ReactNode } from "react";

import type { ResumeData, ResumeStyle } from "@/lib/resume/types";

// One US Letter page (816 x 1056 px at 96 dpi). Ten looks modeled on the
// most-used Overleaf templates; the same data, different typography,
// header and column layout. All text stays real text for ATS.
type SectionKey = "summary" | "education" | "experience" | "projects" | "skills";

interface Look {
  font: string;
  size: number;
  name: { size: number; style: CSSProperties; split?: boolean };
  header: "center" | "left" | "split";
  contactSep: string;
  section: CSSProperties;
  sectionBar?: string; // ModernCV-style bar before the title
  sectionGap: number;
  itemGap: number;
  accent: string;
  pad: string;
  main: SectionKey[];
  sidebar?: { keys: SectionKey[]; width: string; side: "left" | "right"; bg?: string };
  headerRule?: string;
  titleColor?: string;
}

const SERIF = "'Times New Roman', 'Latin Modern Roman', Georgia, serif";
const SANS = "Inter, 'Helvetica Neue', Arial, sans-serif";
const ALL: SectionKey[] = ["summary", "education", "experience", "projects", "skills"];

const LOOKS: Record<ResumeStyle, Look> = {
  jake: {
    font: SERIF, size: 10.5, name: { size: 28, style: { fontVariant: "small-caps", fontWeight: 700 } },
    header: "center", contactSep: "  |  ",
    section: { fontVariant: "small-caps", fontSize: 13.5, fontWeight: 700, borderBottom: "1px solid #000", paddingBottom: 1, marginBottom: 5 },
    sectionGap: 9, itemGap: 6, accent: "#000", pad: "38px 46px", main: ["summary", "education", "experience", "projects", "skills"],
  },
  faang: {
    font: SANS, size: 9.8, name: { size: 26, style: { fontWeight: 800 } },
    header: "center", contactSep: "  •  ",
    section: { textTransform: "uppercase", fontSize: 11.5, fontWeight: 800, borderBottom: "1.5px solid #000", paddingBottom: 1, marginBottom: 5 },
    sectionGap: 9, itemGap: 6, accent: "#000", pad: "34px 44px", main: ["education", "experience", "projects", "skills", "summary"],
  },
  awesome: {
    font: SANS, size: 9.8, name: { size: 32, style: { fontWeight: 300 }, split: true },
    header: "center", contactSep: "  |  ",
    section: { fontSize: 13, fontWeight: 700, color: "#990000", borderBottom: "1px solid #ccc", paddingBottom: 2, marginBottom: 6 },
    sectionGap: 11, itemGap: 7, accent: "#990000", pad: "40px 50px", main: ALL, titleColor: "#990000",
  },
  moderncv: {
    font: SANS, size: 9.8, name: { size: 30, style: { fontWeight: 400, color: "#1f4e8c" } },
    header: "split", contactSep: "",
    section: { fontSize: 13, fontWeight: 500, color: "#1f4e8c", marginBottom: 5 },
    sectionBar: "#1f4e8c", sectionGap: 11, itemGap: 7, accent: "#1f4e8c", pad: "40px 48px", main: ALL,
  },
  rendercv: {
    font: SANS, size: 9.8, name: { size: 28, style: { fontWeight: 700, color: "#004f90" } },
    header: "left", contactSep: "   ",
    section: { fontSize: 12, fontWeight: 700, color: "#004f90", borderBottom: "1px solid #004f90", paddingBottom: 1, marginBottom: 5 },
    sectionGap: 10, itemGap: 6, accent: "#004f90", pad: "38px 46px", main: ALL,
  },
  deedy: {
    font: SANS, size: 9.4, name: { size: 34, style: { fontWeight: 300, letterSpacing: "-0.5px" }, split: true },
    header: "left", contactSep: "  |  ",
    section: { textTransform: "uppercase", fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", color: "#555", marginBottom: 4 },
    sectionGap: 11, itemGap: 6, accent: "#333", pad: "36px 40px", main: ["experience", "projects"],
    sidebar: { keys: ["education", "skills", "summary"], width: "34%", side: "left" }, headerRule: "1px solid #999",
  },
  altacv: {
    font: SANS, size: 9.4, name: { size: 28, style: { fontWeight: 800 } },
    header: "left", contactSep: "   ",
    section: { textTransform: "uppercase", fontSize: 11.5, fontWeight: 800, color: "#8b1d41", borderBottom: "2px solid #8b1d41", paddingBottom: 1, marginBottom: 5 },
    sectionGap: 10, itemGap: 6, accent: "#8b1d41", pad: "34px 36px", main: ["summary", "experience", "projects"],
    sidebar: { keys: ["education", "skills"], width: "35%", side: "right", bg: "#f7eff2" },
  },
  harvard: {
    font: SERIF, size: 10.8, name: { size: 22, style: { fontWeight: 700 } },
    header: "center", contactSep: "  •  ",
    section: { textTransform: "uppercase", fontSize: 11.5, fontWeight: 700, textAlign: "center", marginBottom: 5 },
    sectionGap: 11, itemGap: 7, accent: "#000", pad: "44px 54px", main: ["education", "experience", "projects", "skills", "summary"],
  },
  minimal: {
    font: SANS, size: 9.8, name: { size: 24, style: { fontWeight: 300, letterSpacing: "3px", textTransform: "uppercase" } },
    header: "left", contactSep: "    ",
    section: { textTransform: "uppercase", fontSize: 9, fontWeight: 600, letterSpacing: "2.5px", color: "#888", marginBottom: 6 },
    sectionGap: 15, itemGap: 8, accent: "#333", pad: "50px 58px", main: ALL,
  },
  compact: {
    font: SANS, size: 9, name: { size: 20, style: { fontWeight: 800 } },
    header: "split", contactSep: "",
    section: { fontSize: 10.5, fontWeight: 800, borderBottom: "1px solid #bbb", paddingBottom: 1, marginBottom: 4 },
    sectionGap: 7, itemGap: 4, accent: "#000", pad: "28px 36px", main: ["summary", "skills", "experience", "projects", "education"],
  },
};

const lines = (text: string) => text.split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
const range = (a: string, b: string) => [a, b].filter(Boolean).join(" – ");
const href = (url: string) => (/^(https?:|mailto:)/.test(url) ? url : `https://${url}`);
const bare = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function Row({ left, right, bold, italic }: { left: ReactNode; right?: ReactNode; bold?: boolean; italic?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontWeight: bold ? 700 : 400, fontStyle: italic ? "italic" : "normal" }}>
      <span>{left}</span>
      {right ? <span style={{ whiteSpace: "nowrap" }}>{right}</span> : null}
    </div>
  );
}

function Bullets({ text }: { text: string }) {
  const items = lines(text);
  if (!items.length) return null;
  return (
    <ul style={{ margin: "2px 0 0", paddingLeft: 15, listStyle: "disc" }}>
      {items.map((b, i) => (
        <li key={i} style={{ marginTop: 1 }}>{b}</li>
      ))}
    </ul>
  );
}

function Section({ look, title, children }: { look: Look; title: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: look.sectionGap }}>
      <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, ...look.section }}>
        {look.sectionBar && <span style={{ display: "inline-block", width: 34, height: 6, background: look.sectionBar }} />}
        <span style={{ flex: look.section.textAlign === "center" ? 1 : undefined }}>{title}</span>
      </h2>
      {children}
    </section>
  );
}

function Block({ k, data, look, narrow }: { k: SectionKey; data: ResumeData; look: Look; narrow: boolean }) {
  const gap = (i: number) => ({ marginTop: i ? look.itemGap : 0 });
  if (k === "summary") {
    return data.summary.trim() ? (
      <Section look={look} title={narrow ? "About" : "Summary"}><div>{data.summary}</div></Section>
    ) : null;
  }
  if (k === "education") {
    const items = data.education.filter((e) => e.school || e.degree);
    if (!items.length) return null;
    return (
      <Section look={look} title="Education">
        {items.map((e, i) =>
          narrow ? (
            <div key={i} style={gap(i)}>
              <div style={{ fontWeight: 700 }}>{e.school}</div>
              <div style={{ fontStyle: "italic" }}>{e.degree}</div>
              <div style={{ color: "#555" }}>{[range(e.start, e.end), e.gpa && `GPA ${e.gpa}`].filter(Boolean).join(" · ")}</div>
            </div>
          ) : (
            <div key={i} style={gap(i)}>
              <Row left={<span style={{ color: look.titleColor }}>{e.school}</span>} right={e.location} bold />
              <Row left={[e.degree, e.gpa && `GPA: ${e.gpa}`].filter(Boolean).join(" · ")} right={range(e.start, e.end)} italic />
              {e.coursework && <div><span style={{ fontWeight: 600 }}>Coursework:</span> {e.coursework}</div>}
            </div>
          ),
        )}
      </Section>
    );
  }
  if (k === "experience") {
    const items = data.experience.filter((e) => e.title || e.company);
    if (!items.length) return null;
    return (
      <Section look={look} title="Experience">
        {items.map((e, i) => (
          <div key={i} style={gap(i)}>
            <Row left={<span style={{ color: look.titleColor }}>{e.title}</span>} right={range(e.start, e.end)} bold />
            <Row left={e.company} right={e.location} italic />
            <Bullets text={e.bullets} />
          </div>
        ))}
      </Section>
    );
  }
  if (k === "projects") {
    const items = data.projects.filter((p) => p.name);
    if (!items.length) return null;
    return (
      <Section look={look} title="Projects">
        {items.map((p, i) => (
          <div key={i} style={gap(i)}>
            <Row
              left={
                <>
                  <strong style={{ color: look.titleColor }}>{p.name}</strong>
                  {p.tech && <span style={{ fontStyle: "italic" }}> | {p.tech}</span>}
                  {p.link && (
                    <>
                      {" | "}
                      <a href={href(p.link)} style={{ color: look.accent }}>{bare(p.link)}</a>
                    </>
                  )}
                </>
              }
              right={p.dates}
            />
            <Bullets text={p.bullets} />
          </div>
        ))}
      </Section>
    );
  }
  const groups = data.skills.filter((s) => s.items.trim());
  if (!groups.length) return null;
  return (
    <Section look={look} title={narrow ? "Skills" : "Technical Skills"}>
      {groups.map((s, i) =>
        narrow ? (
          <div key={i} style={{ marginTop: i ? 4 : 0 }}>
            {s.category && <div style={{ fontWeight: 700 }}>{s.category}</div>}
            <div>{s.items}</div>
          </div>
        ) : (
          <div key={i} style={{ marginTop: i ? 1 : 0 }}>
            {s.category && <strong>{s.category}: </strong>}
            {s.items}
          </div>
        ),
      )}
    </Section>
  );
}

function Name({ look, text }: { look: Look; text: string }) {
  const name = text || "Your Name";
  const cut = name.trim().lastIndexOf(" ");
  return (
    <h1 style={{ margin: 0, fontSize: look.name.size, lineHeight: 1.08, ...look.name.style }}>
      {look.name.split && cut > 0 ? (
        <>
          {name.slice(0, cut)} <span style={{ fontWeight: 800 }}>{name.slice(cut + 1)}</span>
        </>
      ) : (
        name
      )}
    </h1>
  );
}

export function ResumeDocument({ data, style }: { data: ResumeData; style: ResumeStyle }) {
  const look = LOOKS[style] ?? LOOKS.jake;
  const contact = [
    data.phone && { label: data.phone },
    data.email && { label: data.email, url: `mailto:${data.email}` },
    data.location && { label: data.location },
    data.linkedin && { label: bare(data.linkedin), url: href(data.linkedin) },
    data.github && { label: bare(data.github), url: href(data.github) },
    data.website && { label: bare(data.website), url: href(data.website) },
  ].filter(Boolean) as { label: string; url?: string }[];

  const contactNodes = contact.map((c, i) => (
    <span key={i}>
      {c.url ? (
        <a href={c.url} style={{ color: "inherit", textDecoration: style === "jake" ? "underline" : "none" }}>{c.label}</a>
      ) : (
        c.label
      )}
    </span>
  ));

  const header =
    look.header === "split" ? (
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
        <Name look={look} text={data.name} />
        <div style={{ textAlign: "right", lineHeight: 1.35 }}>
          {contactNodes.map((n, i) => (
            <div key={i}>{n}</div>
          ))}
        </div>
      </header>
    ) : (
      <header style={{ textAlign: look.header }}>
        <Name look={look} text={data.name} />
        <div style={{ marginTop: 5 }}>
          {contactNodes.map((n, i) => (
            <span key={i}>
              {i > 0 && look.contactSep}
              {n}
            </span>
          ))}
        </div>
      </header>
    );

  const sb = look.sidebar;
  return (
    <div
      className="resume-page"
      style={{ width: 816, minHeight: 1056, background: "#fff", color: "#111", fontFamily: look.font, fontSize: look.size, lineHeight: 1.32, padding: look.pad, boxSizing: "border-box" }}
    >
      {header}
      {look.headerRule && <div style={{ borderTop: look.headerRule, marginTop: 10 }} />}
      {sb ? (
        <div style={{ display: "flex", flexDirection: sb.side === "left" ? "row" : "row-reverse", gap: 22, marginTop: 4 }}>
          <aside style={{ width: sb.width, flexShrink: 0, background: sb.bg, padding: sb.bg ? "2px 12px 12px" : 0, borderRadius: sb.bg ? 6 : 0 }}>
            {sb.keys.map((k) => (
              <Block key={k} k={k} data={data} look={look} narrow />
            ))}
          </aside>
          <div style={{ flex: 1, minWidth: 0 }}>
            {look.main.map((k) => (
              <Block key={k} k={k} data={data} look={look} narrow={false} />
            ))}
          </div>
        </div>
      ) : (
        look.main.map((k) => <Block key={k} k={k} data={data} look={look} narrow={false} />)
      )}
    </div>
  );
}
