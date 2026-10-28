"use client";

import { useMemo, useState } from "react";
import { Download, Image as ImageIcon } from "lucide-react";

type Slide = { headline: string; body: string; scripture?: string; footer?: string; visualDirection?: string };
type Deck = { slides: Slide[]; designNotes?: string };
const themes = {
  evergreen: { label: "Evergreen editorial", bg: "#102b22", accent: "#b9e5c8", text: "#fffaf0" },
  cream: { label: "Warm cream", bg: "#f5efe3", accent: "#276449", text: "#202b24" },
  midnight: { label: "Midnight gold", bg: "#15171d", accent: "#e5bd70", text: "#fffaf2" },
};
type Theme = keyof typeof themes;

function parseDeck(content: string): Deck {
  try {
    const data = JSON.parse(content);
    if (data && Array.isArray(data.slides)) return {
      slides: data.slides.filter((s: unknown) => !!s && typeof s === "object" && typeof (s as Slide).headline === "string" && typeof (s as Slide).body === "string").slice(0, 10),
      designNotes: typeof data.designNotes === "string" ? data.designNotes : "",
    };
  } catch { /* Empty state until a deck has been generated. */ }
  return { slides: [] };
}
function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function wrap(value: string, max: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of value.split(/\s+/)) {
    if ((line + " " + word).trim().length > max && line) { lines.push(line); line = word; }
    else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines;
}

export default function CarouselStudio({ content, title, onChange }: { content: string; title: string; onChange: (value: string) => void }) {
  const [themeKey, setThemeKey] = useState<Theme>("evergreen");
  const deck = useMemo(() => parseDeck(content), [content]);
  const theme = themes[themeKey];
  function patchSlide(index: number, patch: Partial<Slide>) {
    onChange(JSON.stringify({ ...deck, slides: deck.slides.map((s, i) => i === index ? { ...s, ...patch } : s) }, null, 2));
  }
  function exportSlide(index: number, format: "png" | "svg") {
    const slide = deck.slides[index];
    if (!slide) return;
    const heading = wrap(slide.headline, 23).slice(0, 4).map((line, i) => '<text x="88" y="' + (370 + i * 76) + '" font-family="Arial,Helvetica,sans-serif" font-size="61" font-weight="700" fill="' + theme.text + '">' + escapeXml(line) + "</text>").join("");
    const bodyStart = 420 + wrap(slide.headline, 23).slice(0, 4).length * 76;
    const body = wrap(slide.body, 31).slice(0, 8).map((line, i) => '<text x="90" y="' + (bodyStart + i * 43) + '" font-family="Arial,Helvetica,sans-serif" font-size="28" fill="' + theme.text + '" opacity=".88">' + escapeXml(line) + "</text>").join("");
    const scripture = slide.scripture ? '<text x="90" y="1040" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="700" fill="' + theme.accent + '">' + escapeXml(slide.scripture) + "</text>" : "";
    const footer = escapeXml(slide.footer || title || "KINGDOM SERMON INTELLIGENCE");
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="' + theme.bg + '"/><circle cx="960" cy="110" r="230" fill="' + theme.accent + '" opacity=".10"/><rect x="74" y="80" width="70" height="7" rx="3" fill="' + theme.accent + '"/><text x="90" y="170" font-family="Arial,Helvetica,sans-serif" font-size="22" letter-spacing="5" fill="' + theme.accent + '">SERMON NOTES · ' + String(index + 1).padStart(2, "0") + "</text>" + heading + body + scripture + '<line x1="90" y1="1165" x2="990" y2="1165" stroke="' + theme.accent + '" stroke-opacity=".5"/><text x="90" y="1215" font-family="Arial,Helvetica,sans-serif" font-size="19" letter-spacing="2" fill="' + theme.text + '" opacity=".75">' + footer + '</text><text x="90" y="1270" font-family="Arial,Helvetica,sans-serif" font-size="16" fill="' + theme.accent + '">KEEP THIS MESSAGE CLOSE</text></svg>';
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const filename = (title || "sermon-carousel").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-slide-" + (index + 1);
    if (format === "svg") {
      const a = document.createElement("a"); a.href = url; a.download = filename + ".svg"; a.click(); URL.revokeObjectURL(url); return;
    }
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); return; }
      ctx.drawImage(image, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) { const pngUrl = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = pngUrl; a.download = filename + ".png"; a.click(); URL.revokeObjectURL(pngUrl); }
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
  }
  return <section className="panel carousel-studio-panel">
    <div className="carousel-studio-heading">
      <div><div className="eyebrow"><ImageIcon size={14} /> VISUAL CONTENT STUDIO</div><h2>Your sermon carousel</h2><p>Review each slide, edit the wording, choose a visual theme, then export image files.</p></div>
      <div className="carousel-theme-control"><label htmlFor="carousel-theme">Design theme</label><select id="carousel-theme" value={themeKey} onChange={(e) => setThemeKey(e.target.value as Theme)}>{Object.entries(themes).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></div>
    </div>
    {deck.slides.length ? <>
      <div className="carousel-preview-grid">{deck.slides.map((slide, index) => <article className="carousel-slide-editor" key={index}>
        <div className="carousel-artboard" style={{ background: theme.bg, color: theme.text }}><div className="carousel-artboard-kicker" style={{ color: theme.accent }}>SERMON NOTES · {String(index + 1).padStart(2, "0")}</div><div className="carousel-artboard-rule" style={{ background: theme.accent }} /><h3>{slide.headline}</h3><p>{slide.body}</p>{slide.scripture && <strong style={{ color: theme.accent }}>{slide.scripture}</strong>}<div className="carousel-artboard-footer">{slide.footer || title || "KINGDOM SERMON INTELLIGENCE"}</div></div>
        <div className="carousel-slide-fields"><label>Slide headline<input value={slide.headline} onChange={(e) => patchSlide(index, { headline: e.target.value })} maxLength={120} /></label><label>Slide text<textarea value={slide.body} onChange={(e) => patchSlide(index, { body: e.target.value })} rows={3} maxLength={600} /></label><label>Scripture reference<input value={slide.scripture || ""} onChange={(e) => patchSlide(index, { scripture: e.target.value })} placeholder="Optional reference" /></label><div className="carousel-export-actions"><button className="secondary-button" onClick={() => exportSlide(index, "png")}><Download size={14} /> PNG</button><button className="secondary-button" onClick={() => exportSlide(index, "svg")}><Download size={14} /> SVG</button></div></div>
      </article>)}</div>
      <div className="carousel-deck-footer"><span>{deck.slides.length} slides · 1080 × 1350 export size</span><button className="primary-button" onClick={() => deck.slides.forEach((_, index) => exportSlide(index, "svg"))}><Download size={16} /> Export all slides as SVG</button></div>
      {deck.designNotes && <p className="carousel-design-notes"><b>Design notes:</b> {deck.designNotes}</p>}
    </> : <div className="carousel-empty"><ImageIcon size={32} /><h3>Your visual slides will appear here</h3><p>Paste the sermon transcript, select “Visual carousel deck,” then generate content. The AI will create slide-by-slide copy that you can edit and export as actual image files.</p></div>}
  </section>;
}
