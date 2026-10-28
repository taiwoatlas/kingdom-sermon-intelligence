"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Image as ImageIcon, Mic2, Sparkles, WandSparkles, Upload, CheckCircle2 } from "lucide-react";
import CarouselStudio from "../components/CarouselStudio";

const AUDIENCES = ["General congregation", "Youth and young adults", "Children and families", "Church leaders", "Small groups", "New believers", "Social media audience", "Bible study class"];
const TONES = ["Pastoral and warm", "Teaching and explanatory", "Bold and exhortational", "Reflective and devotional", "Simple and accessible"];
const LANGUAGES = ["English", "Nigerian Pidgin", "Yoruba", "French", "Spanish", "Portuguese", "Arabic", "Chinese", "Russian", "Indonesian", "Filipino"];
const PLATFORMS = ["All platforms", "Instagram", "Facebook", "WhatsApp", "TikTok", "YouTube"];

export default function VisualContentPage() {
  const [title, setTitle] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [scripture, setScripture] = useState("");
  const [transcript, setTranscript] = useState("");
  const [audience, setAudience] = useState("Social media audience");
  const [tone, setTone] = useState("Teaching and explanatory");
  const [language, setLanguage] = useState("English");
  const [platform, setPlatform] = useState("Instagram");
  const [deckContent, setDeckContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [notice, setNotice] = useState("");
  const [stage, setStage] = useState<"source" | "design">("source");

  async function transcribe(file?: File) {
    if (!file) return;
    setTranscribing(true);
    setNotice("Transcribing your recording. Keep this page open while it processes.");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/transcribe", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) { setNotice(result?.error?.message || "Transcription failed. Try a smaller file or paste a transcript."); return; }
      if (typeof result.transcript !== "string" || !result.transcript.trim()) { setNotice("No transcript was returned. Try another file."); return; }
      setTranscript(result.transcript.slice(0, 16000));
      if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
      setNotice(result.transcript.length > 16000 ? "Transcription was longer than the 16,000-character generation limit; the beginning is loaded. Split the sermon into sections for the rest." : "Transcription complete. Review the words and Scripture references before generating.");
    } catch { setNotice("Could not reach transcription. Check your connection and try again."); }
    finally { setTranscribing(false); }
  }

  async function importText(file?: File) {
    if (!file) return;
    try {
      const text = await file.text();
      if (!text.trim()) { setNotice("That text file is empty."); return; }
      if (text.length > 16000) { setNotice("This transcript exceeds 16,000 characters. Split it into shorter sections before importing."); return; }
      setTranscript(text);
      if (!title.trim()) setTitle(file.name.replace(/\.txt$/i, "").replace(/[_-]+/g, " "));
      setNotice("Transcript imported. Check it before generating your visuals.");
    } catch { setNotice("Could not read that file. Save it as a UTF-8 .txt file and try again."); }
  }

  async function generate() {
    if (!title.trim()) { setNotice("Add a sermon title first."); return; }
    if (!transcript.trim()) { setNotice("Paste a transcript or upload audio/video first."); return; }
    if (transcript.trim().length > 16000) { setNotice("This free-tier workflow accepts up to 16,000 transcript characters. Split the sermon into sections."); return; }
    setBusy(true);
    setNotice("Creating a connected visual carousel from your sermon…");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), speaker: speaker.trim(), scripture: scripture.trim(), transcript: transcript.trim(), resourceIds: ["carousel"], options: { audience, tone, language, platforms: platform } }),
      });
      const result = await response.json();
      if (!response.ok) { setNotice(result?.error?.message || "Generation failed. Your transcript is still here; please try again."); return; }
      const resource = Array.isArray(result.resources) ? result.resources.find((item: { id?: string }) => item.id === "carousel") : null;
      if (!resource || typeof resource.content !== "string") { setNotice("The AI response did not include a usable carousel. No source text was lost; please try again."); return; }
      let parsed;
      try { parsed = JSON.parse(resource.content); } catch { setNotice("The AI returned slide content in an unexpected format. Try generating again."); return; }
      if (!Array.isArray(parsed.slides) || parsed.slides.length < 1) { setNotice("The generated response did not contain any slides. Please try again."); return; }
      setDeckContent(JSON.stringify(parsed, null, 2));
      setStage("design");
      setNotice("Carousel created. Edit the slides, choose a theme and export your images below.");
      window.setTimeout(() => document.getElementById("visual-output")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch { setNotice("Could not reach the AI generation endpoint. Check your connection and try again."); }
    finally { setBusy(false); }
  }

  return <main className="visual-page">
    <header className="visual-topbar">
      <Link href="/" className="visual-back"><ArrowLeft size={17} /> Main workspace</Link>
      <div className="visual-brand"><span><ImageIcon size={18} /></span><div><b>Kingdom Sermon Intelligence</b><small>VISUAL CONTENT CREATOR</small></div></div>
      <span className="visual-free-badge"><span /> Free AI mode</span>
    </header>
    <div className="visual-page-content">
      <section className="visual-hero">
        <div className="visual-hero-copy"><div className="visual-eyebrow"><Sparkles size={14} /> SERMON → VISUAL STORY</div><h1>Turn the message into visuals people can <em>see, save and share.</em></h1><p>Build a complete sermon carousel from a transcript or recording. Shape the copy, preview every slide and export share-ready images.</p>
          <div className="visual-benefits"><span><CheckCircle2 size={15} /> 6–8 connected slides</span><span><CheckCircle2 size={15} /> Editable slide text</span><span><CheckCircle2 size={15} /> PNG and SVG export</span></div>
        </div>
        <div className="visual-hero-art" aria-hidden="true"><div className="visual-art-card card-back"><small>THE WORD</small><b>Rooted in truth.</b><span>01 / 08</span></div><div className="visual-art-card card-front"><small>SERMON SERIES</small><div className="visual-art-line" /><b>Let the message live beyond the pulpit.</b><span>VISUAL NOTES · 01</span></div></div>
      </section>

      <div className="visual-steps"><div className={stage === "source" ? "visual-step active" : "visual-step"}><span>01</span><div><b>Add your sermon</b><small>Transcript or recording</small></div></div><div className="visual-step-line" /><div className={stage === "design" ? "visual-step active" : "visual-step"}><span>02</span><div><b>Design the carousel</b><small>Edit, preview and export</small></div></div></div>

      <section className="visual-source-card">
        <div className="visual-section-heading"><div className="visual-section-icon"><Mic2 size={19} /></div><div><h2>Start with the sermon</h2><p>The original message is the source. Visual copy should preserve its meaning.</p></div></div>
        <div className="visual-form-grid">
          <label className="visual-field full"><span>Sermon title <i>Required</i></span><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. The Power of Obedience" /></label>
          <label className="visual-field"><span>Preacher / speaker</span><input value={speaker} onChange={e => setSpeaker(e.target.value)} placeholder="Speaker name (optional)" /></label>
          <label className="visual-field"><span>Key Scripture references</span><input value={scripture} onChange={e => setScripture(e.target.value)} placeholder="e.g. John 15:1–8" /></label>
        </div>
        <div className="visual-input-tabs"><b>Bring in your message</b><div><label className="visual-upload-button"><Upload size={15} /> {transcribing ? "Transcribing…" : "Upload audio / video"}<input type="file" accept="audio/*,video/mp4,video/webm,.mp4,.webm,.m4a,.mp3,.wav,.ogg,.flac" disabled={transcribing} onChange={e => { void transcribe(e.target.files?.[0]); e.currentTarget.value = ""; }} /></label><label className="visual-upload-button secondary"><Download size={15} /> Import .txt transcript<input type="file" accept=".txt,text/plain" onChange={e => { void importText(e.target.files?.[0]); e.currentTarget.value = ""; }} /></label></div></div>
        <label className="visual-field transcript-field"><span>Or paste the sermon transcript <small>{transcript.length.toLocaleString()} / 16,000 characters</small></span><textarea value={transcript} onChange={e => setTranscript(e.target.value)} maxLength={16000} rows={8} placeholder="Paste the sermon transcript here… Include the main teaching, illustrations and Scripture references so the carousel reflects the message actually preached." /></label>
        <div className="visual-generation-settings">
          <label className="visual-field"><span>Who is this for?</span><select value={audience} onChange={e => setAudience(e.target.value)}>{AUDIENCES.map(x => <option key={x}>{x}</option>)}</select></label>
          <label className="visual-field"><span>Writing tone</span><select value={tone} onChange={e => setTone(e.target.value)}>{TONES.map(x => <option key={x}>{x}</option>)}</select></label>
          <label className="visual-field"><span>Language</span><select value={language} onChange={e => setLanguage(e.target.value)}>{LANGUAGES.map(x => <option key={x}>{x}</option>)}</select></label>
          <label className="visual-field"><span>Publishing platform</span><select value={platform} onChange={e => setPlatform(e.target.value)}>{PLATFORMS.map(x => <option key={x}>{x}</option>)}</select></label>
        </div>
        <div className="visual-generate-footer"><div><b>What you’ll get</b><p>A hook, sequenced teaching points, practical application and a closing takeaway — all grounded in the transcript.</p></div><button onClick={() => void generate()} disabled={busy || transcribing}><WandSparkles size={19} /> {busy ? "Creating your carousel…" : "Generate Visual Carousel"} <span>→</span></button></div>
      </section>

      <section id="visual-output" className="visual-output-section">
        <div className="visual-output-heading"><div><div className="visual-eyebrow"><ImageIcon size={14} /> YOUR CREATION SPACE</div><h2>Design, refine and export</h2><p>Each slide is editable. Choose a visual theme, review every word, then export individual graphics.</p></div><span className="visual-output-tag">1080 × 1350 · 4:5 portrait</span></div>
        {deckContent ? <CarouselStudio content={deckContent} title={title} onChange={setDeckContent} /> : <div className="visual-output-empty"><div className="visual-empty-icon"><ImageIcon size={27} /></div><h3>Your slide deck will appear here</h3><p>Once you generate the carousel, this space becomes your visual editor. You can revise headlines and body text, select a theme and export each slide as a PNG or SVG.</p><div className="visual-empty-mini"><span>01</span><span>02</span><span>03</span><span>04</span><span>05</span><span>06</span></div></div>}
      </section>
      <footer className="visual-footer"><span>Kingdom Sermon Intelligence</span><span>Check every slide and Scripture reference against the original sermon before publishing.</span></footer>
    </div>
    {notice && <div className="visual-notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}
  </main>;
}
