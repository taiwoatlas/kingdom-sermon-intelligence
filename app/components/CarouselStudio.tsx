"use client";

import { useMemo, useState } from "react";
import { Download, Image as ImageIcon, WandSparkles, LoaderCircle } from "lucide-react";

type Slide = { headline: string; body: string; scripture?: string; footer?: string; visualDirection?: string; designStyle?: string; accentColor?: string; backgroundColor?: string };
type Deck = { slides: Slide[]; designNotes?: string };
const themes = {
  evergreen: { label: "Evergreen editorial", bg: "#102b22", accent: "#b9e5c8", text: "#fffaf0" },
  cream: { label: "Warm cream", bg: "#f5efe3", accent: "#276449", text: "#202b24" },
  midnight: { label: "Midnight gold", bg: "#15171d", accent: "#e5bd70", text: "#fffaf2" },
  paper: { label: "Paper collage", bg: "#f4dfc9", accent: "#b94b37", text: "#30221d" },
  botanical: { label: "Botanical study", bg: "#e8efe2", accent: "#2e654d", text: "#18392c" },
  electric: { label: "Electric modern", bg: "#25144b", accent: "#f6e84a", text: "#fffdf5" },
  ocean: { label: "Deep ocean", bg: "#103d48", accent: "#7de0d0", text: "#f4fffc" },
};
type Theme = keyof typeof themes;

function parseDeck(content: string): Deck {
  try {
    const data = JSON.parse(content);
    if (data && Array.isArray(data.slides)) return {
      slides: data.slides.filter((s: unknown) => !!s && typeof s === "object" && typeof (s as Slide).headline === "string" && typeof (s as Slide).body === "string"),
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

export default function CarouselStudio({ content, title, author, onChange }: { content: string; title: string; author?: string; onChange: (value: string) => void }) {
  const [themeKey, setThemeKey] = useState<Theme>("evergreen");
  const [artImages, setArtImages] = useState<Record<number, string>>({});
  const [generatingArt, setGeneratingArt] = useState<number | null>(null);
  const [artError, setArtError] = useState<Record<number, string>>({});
  const deck = useMemo(() => parseDeck(content), [content]);
  const theme = themes[themeKey];
  const paletteKeys = Object.keys(themes) as Theme[];
  function slideTheme(slide: Slide, index: number): { key: Theme; label: string; bg: string; accent: string; text: string } {
    const style = paletteKeys.includes(slide.designStyle as Theme) ? slide.designStyle as Theme : paletteKeys[index % paletteKeys.length];
    const base = themes[style];
    const validHex = (value: string | undefined, fallback: string) => value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
    return { key: style, ...base, bg: validHex(slide.backgroundColor, base.bg), accent: validHex(slide.accentColor, base.accent) };
  }
  async function generateArtwork(index: number) {
    const slide = deck.slides[index];
    if (!slide) return;
    setGeneratingArt(index);
    setArtError((previous) => ({ ...previous, [index]: "" }));
    try {
      const response = await fetch("/api/generate-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, headline: slide.headline, body: slide.body, visualDirection: slide.visualDirection, designStyle: slideTheme(slide, index).key, backgroundColor: slideTheme(slide, index).bg, accentColor: slideTheme(slide, index).accent }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || "Could not generate artwork for this slide.");
      if (typeof result.image !== "string" || !result.image.startsWith("data:image/")) throw new Error("The image provider returned an unusable image.");
      setArtImages((previous) => ({ ...previous, [index]: result.image }));
    } catch (error) {
      setArtError((previous) => ({ ...previous, [index]: error instanceof Error ? error.message : "Artwork generation failed. Try again." }));
    } finally { setGeneratingArt(null); }
  }
  function patchSlide(index: number, patch: Partial<Slide>) {
    onChange(JSON.stringify({ ...deck, slides: deck.slides.map((s, i) => i === index ? { ...s, ...patch } : s) }, null, 2));
  }
  function exportSlide(index: number, format: "png" | "svg") {
    const slide = deck.slides[index];
    if (!slide) return;
    const t = slideTheme(slide, index);
    const heading = wrap(slide.headline, slide.headline.length < 32 ? 16 : 22).map((line, i) => '<text x="86" y="' + (300 + i * 72) + '" font-family="Georgia,Times New Roman,serif" font-size="58" font-weight="700" letter-spacing="-1" fill="' + t.text + '">' + escapeXml(line) + "</text>").join("");
    const bodyStart = slide.headline ? 370 + wrap(slide.headline, 23).length * 66 : 330;
    const body = wrap(slide.body, 46).map((line, i) => '<text x="90" y="' + (bodyStart + i * 43) + '" font-family="Arial,Helvetica,sans-serif" font-size="30" fill="' + t.text + '" opacity=".96">' + escapeXml(line) + "</text>").join("");
    const scripture = slide.scripture ? '<text x="90" y="1040" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="700" fill="' + t.accent + '">' + escapeXml(slide.scripture) + "</text>" : "";
    const footer = escapeXml(slide.footer || "SAVE THIS MESSAGE");
    const artwork = artImages[index] ? '<image href="' + artImages[index] + '" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice" opacity=".78"/><rect width="1080" height="1350" fill="' + t.bg + '" opacity=".56"/>' : "";
    const signature = escapeXml(author?.trim() || "");
    const motif = t.key === "botanical"
      ? '<path d="M790 100 C940 150 970 290 880 410 C840 300 810 220 790 100Z" fill="' + t.accent + '" opacity=".18"/><path d="M790 100 C850 210 875 290 880 410" stroke="' + t.accent + '" stroke-width="5" fill="none" opacity=".55"/>'
      : t.key === "paper"
      ? '<path d="M720 85 L1030 135 L960 420 L680 350Z" fill="' + t.accent + '" opacity=".17"/><circle cx="930" cy="220" r="110" fill="' + t.accent + '" opacity=".12"/>'
      : t.key === "electric"
      ? '<path d="M760 90 L1030 90 L1030 355 L890 300Z" fill="' + t.accent + '" opacity=".22"/><circle cx="900" cy="250" r="125" fill="none" stroke="' + t.accent + '" stroke-width="3"/>'
      : t.key === "ocean"
      ? '<path d="M700 110 Q820 20 940 110 T1180 110" stroke="' + t.accent + '" stroke-width="5" fill="none" opacity=".45"/><path d="M700 160 Q820 70 940 160 T1180 160" stroke="' + t.accent + '" stroke-width="3" fill="none" opacity=".35"/>'
      : t.key === "midnight"
      ? '<circle cx="930" cy="180" r="120" fill="' + t.accent + '" opacity=".13"/><circle cx="930" cy="180" r="88" fill="none" stroke="' + t.accent + '" stroke-width="2" opacity=".55"/>'
      : '<circle cx="930" cy="180" r="180" fill="' + t.accent + '" opacity=".10"/><path d="M760 90 L1020 350" stroke="' + t.accent + '" stroke-width="3" opacity=".45"/>';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="2160" height="2700" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="' + t.bg + '">' + '</rect>' + artwork + motif + '<rect x="76" y="80" width="52" height="6" rx="3" fill="' + t.accent + '"/><text x="86" y="150" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="700" letter-spacing="3" fill="' + t.accent + '">' + escapeXml((title || "MESSAGE NOTES").toUpperCase().slice(0, 42)) + '</text>' + heading + body + scripture + '<line x1="86" y1="1160" x2="994" y2="1160" stroke="' + t.accent + '" stroke-opacity=".5"/><text x="86" y="1210" font-family="Arial,Helvetica,sans-serif" font-size="16" letter-spacing="1.4" fill="' + t.text + '" opacity=".68">' + footer + '</text><text x="994" y="1270" text-anchor="end" font-family="Georgia,serif" font-style="italic" font-size="25" fill="' + t.text + '">' + signature + '</text><text x="86" y="1300" font-family="Arial,Helvetica,sans-serif" font-size="12" letter-spacing="2" fill="' + t.accent + '">' + String(index + 1).padStart(2, "0") + " / " + String(deck.slides.length).padStart(2, "0") + '</text></svg>';
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const filename = (title || "message-carousel").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-slide-" + (index + 1);
    if (format === "svg") {
      const a = document.createElement("a"); a.href = url; a.download = filename + ".svg"; a.click(); URL.revokeObjectURL(url); return;
    }
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas"); canvas.width = 2160; canvas.height = 2700;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); return; }
      ctx.scale(2, 2); ctx.drawImage(image, 0, 0, 1080, 1350);
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
      <div><div className="eyebrow"><ImageIcon size={14} /> MESSAGE-LED DESIGN STUDIO</div><h2>Your message carousel</h2><p>Different colour stories and graphic motifs guided by the message, not a generic template.</p></div>
      <div className="carousel-theme-control"><label htmlFor="carousel-theme">Fallback design style</label><select id="carousel-theme" value={themeKey} onChange={(e) => setThemeKey(e.target.value as Theme)}>{Object.entries(themes).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></div>
    </div>
    {deck.slides.length ? <>
      <div className="carousel-preview-grid">{deck.slides.map((slide, index) => <article className="carousel-slide-editor" key={index}>
        <div className={"carousel-artboard artboard-" + slideTheme(slide, index).key} style={{ background: slideTheme(slide, index).bg, color: slideTheme(slide, index).text, borderTop: "5px solid " + slideTheme(slide, index).accent, "--art-accent": slideTheme(slide, index).accent } as React.CSSProperties}>{artImages[index] && <><img className="carousel-ai-art" src={artImages[index]} alt="" /><div className="carousel-ai-art-overlay" style={{ background: slideTheme(slide, index).bg }} /></>}<div className="carousel-artboard-kicker" style={{ color: slideTheme(slide, index).accent }}>{(title || "MESSAGE").toUpperCase().slice(0, 24)} · {String(index + 1).padStart(2, "0")}</div><div className="carousel-artboard-rule" style={{ background: slideTheme(slide, index).accent }} /><h3>{slide.headline}</h3><p>{slide.body}</p>{slide.scripture && <strong style={{ color: slideTheme(slide, index).accent }}>{slide.scripture}</strong>}<div className="carousel-artboard-footer">{slide.footer || "SAVE THIS MESSAGE"}</div><div style={{ textAlign: "right", fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 10, marginTop: 6 }}>{author || ""}</div></div>
        <div className="carousel-slide-fields"><label>Slide headline<input value={slide.headline} onChange={(e) => patchSlide(index, { headline: e.target.value })} maxLength={120} /></label><label>Slide text<textarea value={slide.body} onChange={(e) => patchSlide(index, { body: e.target.value })} rows={3} maxLength={600} /></label><label>Visual direction<input value={slide.visualDirection || ""} onChange={(e) => patchSlide(index, { visualDirection: e.target.value })} placeholder="Message-specific composition / motif" /></label><label>Scripture / source reference<input value={slide.scripture || ""} onChange={(e) => patchSlide(index, { scripture: e.target.value })} placeholder="Optional reference" /></label><div className="carousel-art-actions"><button className="secondary-button" onClick={() => generateArtwork(index)} disabled={generatingArt !== null}>{generatingArt === index ? <LoaderCircle size={14} className="spin" /> : <WandSparkles size={14} />}{generatingArt === index ? "Creating artwork…" : artImages[index] ? "Regenerate AI artwork" : "Generate AI artwork"}</button>{artError[index] && <p className="carousel-art-error">{artError[index]}</p>}</div><div className="carousel-export-actions"><button className="secondary-button" onClick={() => exportSlide(index, "png")}><Download size={14} /> PNG</button><button className="secondary-button" onClick={() => exportSlide(index, "svg")}><Download size={14} /> SVG</button></div></div>
      </article>)}</div>
      <div className="carousel-deck-footer"><span>{deck.slides.length} slides · 2160 × 2700 PNG · scalable SVG</span><button className="primary-button" onClick={() => deck.slides.forEach((_, index) => exportSlide(index, "svg"))}><Download size={16} /> Export all slides as SVG</button></div>
      {deck.designNotes && <p className="carousel-design-notes"><b>Design notes:</b> {deck.designNotes}</p>}
    </> : <div className="carousel-empty"><ImageIcon size={32} /><h3>Your visual slides will appear here</h3><p>Paste any long message, generate a carousel, then refine each slide and export high-resolution images.</p></div>}
  </section>;
}
