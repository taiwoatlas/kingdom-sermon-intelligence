"use client";

import { useMemo, useState } from "react";
import { Download, Image as ImageIcon, WandSparkles, LoaderCircle, ExternalLink, Palette } from "lucide-react";

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
type Composition = "auto" | "editorial" | "offset" | "centered" | "literary" | "framed";
const compositions: { value: Composition; label: string; layout: number | null }[] = [
  { value: "auto", label: "Editorial sequence · varied layouts", layout: null },
  { value: "editorial", label: "Editorial · left-accented", layout: 0 },
  { value: "offset", label: "Offset · asymmetric", layout: 1 },
  { value: "centered", label: "Centered · statement", layout: 2 },
  { value: "literary", label: "Literary · reading-first", layout: 3 },
  { value: "framed", label: "Framed · bold kicker", layout: 4 },
];

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


function makeFreeArtwork(slide: Slide, palette: { bg: string; accent: string; text: string }, index: number) {
  const meaning = [slide.headline, slide.body, slide.visualDirection || ""].join(" ").toLowerCase();
  let motif = "abstract";
  if (/light|glory|reveal|vision|shine|hope|dawn|illum|lamp|darkness/.test(meaning)) motif = "light";
  else if (/grow|seed|fruit|root|harvest|plant|life|branch|vine|faithfulness/.test(meaning)) motif = "growth";
  else if (/wilderness|mountain|valley|journey|path|way|season|desert|wait|process/.test(meaning)) motif = "journey";
  else if (/water|river|flow|thirst|well|rain|storm|sea|peace|rest/.test(meaning)) motif = "water";
  else if (/fire|spirit|altar|zeal|revival|passion|burn|power|boldness/.test(meaning)) motif = "fire";
  else if (/word|scripture|bible|truth|wisdom|knowledge|teach|understand|written/.test(meaning)) motif = "word";
  else if (/king|kingdom|authority|crown|throne|reign|royal|purpose|calling/.test(meaning)) motif = "kingdom";
  const bg = palette.bg, accent = palette.accent, pale = palette.text;
  const motifMarkup: Record<string, string> = {
    light: '<g fill="none" stroke="' + accent + '" stroke-linecap="round"><circle cx="820" cy="310" r="154" stroke-width="3" opacity=".7"/><circle cx="820" cy="310" r="205" stroke-width="1.5" opacity=".38"/>' + Array.from({length:18},(_,i)=>{const a=i*Math.PI/9;const x1=820+Math.cos(a)*225;const y1=310+Math.sin(a)*225;const x2=820+Math.cos(a)*300;const y2=310+Math.sin(a)*300;return '<path d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+'L'+x2.toFixed(1)+' '+y2.toFixed(1)+'" stroke-width="'+(i%3===0?4:2)+'" opacity="'+(i%2===0?".5":".25")+'"/>';}).join("") + '</g><circle cx="820" cy="310" r="92" fill="' + accent + '" opacity=".16"/>',
    growth: '<g fill="none" stroke="' + accent + '" stroke-linecap="round" stroke-linejoin="round"><path d="M820 760 C810 600 860 440 790 245" stroke-width="5" opacity=".75"/><path d="M814 610 C690 585 620 500 620 410 C720 420 790 495 814 610Z" fill="' + accent + '" fill-opacity=".18" stroke-width="3"/><path d="M820 490 C925 460 1000 370 1002 285 C910 300 840 375 820 490Z" fill="' + pale + '" fill-opacity=".1" stroke-width="3"/><path d="M800 390 C720 345 690 270 705 205 C780 235 820 305 800 390Z" fill="' + accent + '" fill-opacity=".12" stroke-width="3"/><path d="M815 680 C910 660 975 600 1000 520 C915 515 845 580 815 680Z" fill="' + accent + '" fill-opacity=".13" stroke-width="3"/></g><circle cx="820" cy="245" r="105" fill="' + accent + '" opacity=".06"/>',
    journey: '<g fill="none" stroke-linejoin="round"><path d="M0 760 L220 500 L380 665 L620 330 L820 555 L1010 390 L1080 470 L1080 1350 L0 1350Z" fill="' + accent + '" fill-opacity=".12" stroke="' + accent + '" stroke-opacity=".35" stroke-width="3"/><path d="M0 900 L245 690 L430 820 L680 520 L860 710 L1080 570 L1080 1350 L0 1350Z" fill="' + pale + '" fill-opacity=".07" stroke="' + pale + '" stroke-opacity=".22" stroke-width="2"/><path d="M525 1350 C570 1170 470 1050 560 900 C625 790 710 770 730 675" stroke="' + accent + '" stroke-width="22" stroke-opacity=".35"/><path d="M525 1350 C570 1170 470 1050 560 900 C625 790 710 770 730 675" stroke="' + bg + '" stroke-width="9" stroke-opacity=".75"/></g>',
    water: '<g fill="none" stroke-linecap="round"><path d="M-30 500 C140 430 240 570 410 500 S680 430 850 500 S1060 560 1120 480" stroke="' + accent + '" stroke-width="5" opacity=".55"/><path d="M-30 560 C140 490 240 630 410 560 S680 490 850 560 S1060 620 1120 540" stroke="' + pale + '" stroke-width="2" opacity=".28"/><path d="M-30 630 C140 560 240 700 410 630 S680 560 850 630 S1060 690 1120 610" stroke="' + accent + '" stroke-width="2" opacity=".3"/><path d="M-30 1000 C140 930 240 1070 410 1000 S680 930 850 1000 S1060 1060 1120 980" stroke="' + accent + '" stroke-width="4" opacity=".25"/></g><circle cx="820" cy="300" r="140" fill="' + accent + '" opacity=".09"/>',
    fire: '<g fill="' + accent + '" fill-opacity=".16" stroke="' + accent + '" stroke-width="3" stroke-opacity=".6" stroke-linejoin="round"><path d="M770 730 C650 600 760 500 735 370 C850 465 870 555 845 620 C940 560 950 450 925 390 C1080 555 1040 720 910 800 C820 855 720 820 680 760 C630 690 665 620 700 580 C705 650 730 690 770 730Z"/><path d="M810 760 C770 690 835 635 830 575 C900 645 900 700 870 745 C850 775 830 780 810 760Z" fill="' + pale + '" fill-opacity=".13"/></g><circle cx="820" cy="620" r="230" fill="none" stroke="' + accent + '" stroke-opacity=".15" stroke-width="2"/>',
    word: '<g stroke="' + accent + '" stroke-width="4" stroke-linejoin="round"><path d="M540 360 C430 290 310 300 220 350 L220 720 C335 680 445 690 540 760Z" fill="' + accent + '" fill-opacity=".14"/><path d="M540 360 C650 290 770 300 860 350 L860 720 C745 680 635 690 540 760Z" fill="' + pale + '" fill-opacity=".08"/><path d="M540 360V760" fill="none" stroke-width="5"/><path d="M275 430 Q390 400 475 450 M275 495 Q390 465 475 515 M275 560 Q390 530 475 580 M605 450 Q690 400 805 430 M605 515 Q690 465 805 495 M605 580 Q690 530 805 560" fill="none" stroke-width="2" opacity=".45"/></g>',
    kingdom: '<g stroke="' + accent + '" stroke-width="4" stroke-linejoin="round"><path d="M610 475 L680 335 L790 430 L875 280 L960 430 L1030 345 L1000 600 L650 600Z" fill="' + accent + '" fill-opacity=".17"/><path d="M650 650 H1000 M690 690 H960 M730 730 H920" fill="none" opacity=".45"/><circle cx="875" cy="280" r="145" fill="none" stroke-width="2" opacity=".25"/></g>',
    abstract: '<g fill="none" stroke="' + accent + '" stroke-width="3"><circle cx="850" cy="310" r="205" opacity=".28"/><circle cx="850" cy="310" r="150" opacity=".18"/><path d="M620 95 L1030 505 M700 65 L1060 425" opacity=".28"/><path d="M720 540 C820 390 920 650 1080 480" stroke-width="5" opacity=".35"/></g><path d="M720 80 L1030 140 L960 430 L680 360Z" fill="' + accent + '" opacity=".09"/>'
  };
  const dots = Array.from({length:22},(_,i)=>{const x=90+((i*137+index*41)%900);const y=100+((i*211+index*67)%1120);const r=2+(i%4);return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+(i%3===0?accent:pale)+'" opacity="'+(i%3===0?".28":".12")+'"/>';}).join("");
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><linearGradient id="wash" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + accent + '" stop-opacity=".18"/><stop offset=".55" stop-color="' + bg + '" stop-opacity="0"/><stop offset="1" stop-color="' + pale + '" stop-opacity=".08"/></linearGradient><radialGradient id="glow"><stop offset="0" stop-color="' + accent + '" stop-opacity=".22"/><stop offset="1" stop-color="' + accent + '" stop-opacity="0"/></radialGradient></defs><rect width="1080" height="1350" fill="' + bg + '"/><rect width="1080" height="1350" fill="url(#wash)"/><ellipse cx="850" cy="320" rx="360" ry="390" fill="url(#glow)"/>' + motifMarkup[motif] + dots + '<path d="M58 80 H210 M58 80 V232 M1022 1118 V1270 H870" fill="none" stroke="' + accent + '" stroke-width="2" opacity=".5"/><rect x="78" y="100" width="6" height="80" fill="' + accent + '" opacity=".7"/></svg>';
  return "data:image/svg+xml;base64," + btoa(svg);
}

export default function CarouselStudio({ content, title, author, onChange }: { content: string; title: string; author?: string; onChange: (value: string) => void }) {
  const [themeKey, setThemeKey] = useState<Theme>("evergreen");
  const [composition, setComposition] = useState<Composition>("auto");
  const [artImages, setArtImages] = useState<Record<number, string>>({});
  const [generatingArt, setGeneratingArt] = useState<number | null>(null);
  const [artError, setArtError] = useState<Record<number, string>>({});
  const deck = useMemo(() => parseDeck(content), [content]);
  const theme = themes[themeKey];
  const paletteKeys = Object.keys(themes) as Theme[];
  function slideLayout(index: number) {
    const selected = compositions.find((item) => item.value === composition);
    return selected?.layout ?? index % 5;
  }
  function slideTheme(slide: Slide, index: number): { key: Theme; label: string; bg: string; accent: string; text: string } {
    const style = paletteKeys.includes(slide.designStyle as Theme) ? slide.designStyle as Theme : paletteKeys[index % paletteKeys.length];
    const base = themes[style];
    const validHex = (value: string | undefined, fallback: string) => value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
    return { key: style, ...base, bg: validHex(slide.backgroundColor, base.bg), accent: validHex(slide.accentColor, base.accent) };
  }
  function generateFreeArtwork(index: number) {
    const slide = deck.slides[index];
    if (!slide) return;
    const palette = slideTheme(slide, index);
    const artwork = makeFreeArtwork(slide, palette, index);
    setArtImages((previous) => ({ ...previous, [index]: artwork }));
    setArtError((previous) => ({ ...previous, [index]: "" }));
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
      const message = error instanceof Error ? error.message : "Artwork generation failed.";
      const fallback = makeFreeArtwork(slide, slideTheme(slide, index), index);
      setArtImages((previous) => ({ ...previous, [index]: fallback }));
      setArtError((previous) => ({ ...previous, [index]: message + " A free local illustration was created instead, so you can still export this slide without Replicate." }));
    } finally { setGeneratingArt(null); }
  }
  function generateAllFreeArtwork() {
    setArtImages((previous) => {
      const next = { ...previous };
      deck.slides.forEach((slide, index) => {
        next[index] = makeFreeArtwork(slide, slideTheme(slide, index), index);
      });
      return next;
    });
    setArtError({});
  }

  function patchSlide(index: number, patch: Partial<Slide>) {
    onChange(JSON.stringify({ ...deck, slides: deck.slides.map((s, i) => i === index ? { ...s, ...patch } : s) }, null, 2));
  }
  function exportSlide(index: number, format: "png" | "svg") {
    const slide = deck.slides[index];
    if (!slide) return;
    const t = slideTheme(slide, index);
    const layout = slideLayout(index);
    const centered = layout === 2;
    const headingX = centered ? 540 : layout === 1 ? 140 : layout === 4 ? 150 : 86;
    const bodyX = centered ? 540 : layout === 1 ? 190 : layout === 4 ? 155 : 90;
    const headingAnchor = centered ? "middle" : "start";
    const bodyAnchor = centered ? "middle" : "start";
    const headingLines = wrap(slide.headline, layout === 1 ? 18 : slide.headline.length < 32 ? 16 : 22);
    const heading = headingLines.map((line, i) => '<text x="' + headingX + '" text-anchor="' + headingAnchor + '" y="' + (300 + i * 72) + '" font-family="' + (layout === 3 ? "Georgia,Times New Roman,serif" : "Georgia,Times New Roman,serif") + '" font-size="' + (layout === 4 ? 54 : 58) + '" font-weight="700" letter-spacing="-1" fill="' + t.text + '">' + escapeXml(line) + "</text>").join("");
    const bodyStart = slide.headline ? 370 + headingLines.length * 66 : 330;
    const body = wrap(slide.body, layout === 1 || layout === 4 ? 38 : 46).map((line, i) => '<text x="' + bodyX + '" text-anchor="' + bodyAnchor + '" y="' + (bodyStart + i * 43) + '" font-family="' + (layout === 3 ? "Georgia,Times New Roman,serif" : "Arial,Helvetica,sans-serif") + '" font-size="' + (layout === 3 ? 31 : 30) + '" fill="' + t.text + '" opacity=".96">' + escapeXml(line) + "</text>").join("");
    const scripture = slide.scripture ? '<text x="90" y="1040" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="700" fill="' + t.accent + '">' + escapeXml(slide.scripture) + "</text>" : "";
    const footer = escapeXml(slide.footer || "SAVE THIS MESSAGE");
    const artwork = artImages[index] ? '<image href="' + artImages[index] + '" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice" opacity=".9"/><rect width="1080" height="1350" fill="' + t.bg + '" opacity=".3"/>' : "";
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
      <div><div className="eyebrow"><ImageIcon size={14} /> MESSAGE-LED DESIGN STUDIO</div><h2>Your message carousel</h2><p>Create original, message-led illustrations directly in your browser for free. External AI artwork is optional.</p></div>
      <div className="carousel-theme-control"><label htmlFor="carousel-theme">Colour palette</label><select id="carousel-theme" value={themeKey} onChange={(e) => setThemeKey(e.target.value as Theme)}>{Object.entries(themes).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select><label htmlFor="carousel-composition">Composition template</label><select id="carousel-composition" value={composition} onChange={(e) => setComposition(e.target.value as Composition)}>{compositions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
    </div>
    {deck.slides.length ? <>
      <div className="carousel-preview-grid">{deck.slides.map((slide, index) => <article className="carousel-slide-editor" key={index}>
        <div className={"carousel-artboard artboard-" + slideTheme(slide, index).key + " art-layout-" + slideLayout(index)} style={{ background: slideTheme(slide, index).bg, color: slideTheme(slide, index).text, borderTop: "5px solid " + slideTheme(slide, index).accent, "--art-accent": slideTheme(slide, index).accent } as React.CSSProperties}>{artImages[index] && <><img className="carousel-ai-art" src={artImages[index]} alt="" /><div className="carousel-ai-art-overlay" style={{ background: slideTheme(slide, index).bg }} /></>}<div className="carousel-artboard-kicker" style={{ color: slideTheme(slide, index).accent }}>{(title || "MESSAGE").toUpperCase().slice(0, 24)} · {String(index + 1).padStart(2, "0")}</div><div className="carousel-artboard-rule" style={{ background: slideTheme(slide, index).accent }} /><h3>{slide.headline}</h3><p>{slide.body}</p>{slide.scripture && <strong style={{ color: slideTheme(slide, index).accent }}>{slide.scripture}</strong>}<div className="carousel-artboard-footer">{slide.footer || "SAVE THIS MESSAGE"}</div><div style={{ textAlign: "right", fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 10, marginTop: 6 }}>{author || ""}</div></div>
        <div className="carousel-slide-fields"><label>Slide headline<input value={slide.headline} onChange={(e) => patchSlide(index, { headline: e.target.value })} maxLength={120} /></label><label>Slide text<textarea value={slide.body} onChange={(e) => patchSlide(index, { body: e.target.value })} rows={3} maxLength={600} /></label><label>Visual direction<input value={slide.visualDirection || ""} onChange={(e) => patchSlide(index, { visualDirection: e.target.value })} placeholder="Message-specific composition / motif" /></label><label>Scripture / source reference<input value={slide.scripture || ""} onChange={(e) => patchSlide(index, { scripture: e.target.value })} placeholder="Optional reference" /></label><div className="carousel-art-actions"><button className="primary-button" onClick={() => generateFreeArtwork(index)}><Palette size={14} />{artImages[index] && !artError[index] ? "Regenerate free artwork" : "Create free artwork"}</button><button className="secondary-button" onClick={() => generateArtwork(index)} disabled={generatingArt !== null}>{generatingArt === index ? <LoaderCircle size={14} className="spin" /> : <WandSparkles size={14} />}{generatingArt === index ? "Trying AI artwork…" : "Try AI artwork (optional)"}</button>{artError[index] && <p className="carousel-art-error">{artError[index]}</p>}</div><div className="carousel-export-actions"><button className="secondary-button" onClick={() => exportSlide(index, "png")}><Download size={14} /> PNG</button><button className="secondary-button" onClick={() => exportSlide(index, "svg")}><Download size={14} /> SVG</button></div></div>
      </article>)}</div>
      <div className="carousel-deck-footer"><span>{deck.slides.length} slides · 2160 × 2700 PNG · scalable SVG</span><div className="carousel-deck-actions"><button className="secondary-button" onClick={generateAllFreeArtwork}><Palette size={14} /> Create free artwork for all slides</button><button className="secondary-button" onClick={() => { window.open("https://www.canva.com/", "_blank", "noopener,noreferrer"); }}><ExternalLink size={14} /> Open Canva to import</button><button className="primary-button" onClick={() => deck.slides.forEach((_, index) => exportSlide(index, "svg"))}><Download size={16} /> Export all slides as SVG</button></div></div><p className="carousel-canva-note"><Palette size={13} /> Using Canva Free? Export the slides first, then upload the SVG files in Canva. This opens Canva for manual import; direct Canva API handoff requires a separate eligible integration.</p>
      {deck.designNotes && <p className="carousel-design-notes"><b>Design notes:</b> {deck.designNotes}</p>}
    </> : <div className="carousel-empty"><ImageIcon size={32} /><h3>Your visual slides will appear here</h3><p>Paste any long message, generate a carousel, then refine each slide and export high-resolution images.</p></div>}
  </section>;
}
