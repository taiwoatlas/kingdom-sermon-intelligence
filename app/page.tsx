"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, ChevronDown, Clipboard, Download, FileText, HeartHandshake, Lightbulb, ListChecks, Menu, MessageCircle, Mic2, Plus, Search, Settings2, Share2, Sparkles, WandSparkles } from "lucide-react";

type Resource = { id: string; title: string; type: string; content: string; status: "Draft" | "Needs review" | "Approved" };
type SavedSermon = { id: string; title: string; speaker: string; scripture: string; date: string; transcript: string; resources: Resource[]; updatedAt: string };

const starterResources: Resource[] = [
  { id: "summary", title: "Sermon summary", type: "Summary", content: "Add a sermon transcript and generate a summary grounded in the actual message.", status: "Draft" },
  { id: "outline", title: "Sermon outline", type: "Outline", content: "A structured outline will appear here after generation.", status: "Draft" },
  { id: "scriptures", title: "Scripture references", type: "Scripture list", content: "Detected references will be listed with context and a verification reminder.", status: "Needs review" },
  { id: "devotional", title: "Devotional draft", type: "Devotional", content: "A sermon-grounded devotional will appear here after generation.", status: "Draft" },
  { id: "discussion", title: "Small-group guide", type: "Discussion guide", content: "Discussion questions and facilitator notes will appear here after generation.", status: "Draft" },
  { id: "social", title: "Social captions", type: "Social content", content: "Platform-specific caption drafts will appear here after generation.", status: "Draft" },
  { id: "quotes", title: "Quote candidates", type: "Quote review", content: "Potential exact quotes will appear here after generation. Verify every quote against the transcript.", status: "Needs review" },
  { id: "slides", title: "Slide outline", type: "Presentation outline", content: "A concise slide-by-slide outline will appear here after generation.", status: "Draft" },
];

export default function Home() {
  const [sermonTitle, setSermonTitle] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [scripture, setScripture] = useState("");
  const [date, setDate] = useState("");
  const [transcript, setTranscript] = useState("");
  const [activeId, setActiveId] = useState("summary");
  const [resources, setResources] = useState<Resource[]>(starterResources);
  const [library, setLibrary] = useState<SavedSermon[]>([]);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [selectedSermonId, setSelectedSermonId] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kingdom-sermon-intelligence-v1");
      if (saved) {
        const data = JSON.parse(saved);
        if (typeof data.sermonTitle === "string") setSermonTitle(data.sermonTitle);
        if (typeof data.speaker === "string") setSpeaker(data.speaker);
        if (typeof data.scripture === "string") setScripture(data.scripture);
        if (typeof data.date === "string") setDate(data.date);
        if (typeof data.transcript === "string") setTranscript(data.transcript);
        if (Array.isArray(data.resources) && data.resources.every((r: Resource) => typeof r.id === "string" && typeof r.content === "string")) setResources(data.resources);
      }
    } catch { /* Ignore malformed local data. */ }
    try { const savedLibrary = localStorage.getItem("kingdom-sermon-library-v1"); if (savedLibrary) { const parsed = JSON.parse(savedLibrary); if (Array.isArray(parsed)) setLibrary(parsed.filter((item: SavedSermon) => item && typeof item.id === "string" && Array.isArray(item.resources))); } } catch { /* Ignore malformed archive data. */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem("kingdom-sermon-intelligence-v1", JSON.stringify({ sermonTitle, speaker, scripture, date, transcript, resources })); }
    catch { setNotice("Your browser could not save more local data. Export important drafts as text files."); }
  }, [hydrated, sermonTitle, speaker, scripture, date, transcript, resources]);

  useEffect(() => { if (!hydrated) return; try { localStorage.setItem("kingdom-sermon-library-v1", JSON.stringify(library)); } catch { setNotice("The browser could not save the full library. Export your sermon pack for safekeeping."); } }, [hydrated, library]);

  const active = resources.find((r) => r.id === activeId) ?? resources[0];
  const filteredLibrary = library.filter((item) => [item.title, item.speaker, item.scripture].some((value) => (value || "").toLowerCase().includes(libraryQuery.toLowerCase()))).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const filtered = useMemo(() => resources.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()) || r.type.toLowerCase().includes(query.toLowerCase())), [resources, query]);

  async function prepareDrafts() {
    const raw = transcript.trim();
    if (!sermonTitle.trim()) { setNotice("Enter a sermon title before generating resources."); return; }
    if (!raw) { setNotice("Paste the sermon transcript before generating resources."); return; }
    if (raw.length > 16000) { setNotice("This free-tier generation workflow supports up to 16,000 transcript characters per request. Split a longer sermon into sections."); return; }

    setGenerating(true);
    setNotice("Sending the transcript for AI generation. Existing drafts will remain unchanged until a valid response arrives.");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sermonTitle.trim(), speaker: speaker.trim(), scripture: scripture.trim(), date, transcript: raw }),
      });
      const result = await response.json();
      if (!response.ok) {
        setNotice(result?.error?.message || "Generation failed. Your transcript is still available; please try again.");
        return;
      }
      if (!Array.isArray(result.resources) || result.resources.length !== 8) {
        setNotice("The server returned an incomplete resource pack. Your existing drafts were not overwritten.");
        return;
      }
      setResources(result.resources);
      setActiveId("summary");
      setNotice("AI generated all eight resource drafts. Review each against the sermon before approving or sharing. Nothing has been published.");
    } catch {
      setNotice("Could not reach the generation endpoint. Your transcript is still in the editor; check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  function saveToLibrary() {
    const title = sermonTitle.trim() || "Untitled sermon";
    const record: SavedSermon = { id: selectedSermonId || String(Date.now()), title, speaker, scripture, date, transcript, resources: resources.map((item) => ({ ...item })), updatedAt: new Date().toISOString() };
    setLibrary((old) => selectedSermonId ? old.map((item) => item.id === selectedSermonId ? record : item) : [record, ...old]);
    setSelectedSermonId(record.id);
    setNotice(selectedSermonId ? "Sermon changes saved to your local library." : "Sermon saved to your local library on this device.");
  }

  function openSavedSermon(record: SavedSermon) {
    setSermonTitle(record.title); setSpeaker(record.speaker || ""); setScripture(record.scripture || ""); setDate(record.date || ""); setTranscript(record.transcript || "");
    setResources(record.resources.map((item) => ({ ...item }))); setActiveId(record.resources[0]?.id || "summary"); setSelectedSermonId(record.id);
    setNotice("Opened sermon from this browser's local library.");
  }

  function startNewSermon() {
    setSermonTitle(""); setSpeaker(""); setScripture(""); setDate(""); setTranscript(""); setResources(starterResources.map((item) => ({ ...item })));
    setActiveId("summary"); setSelectedSermonId(""); setNotice("Started a new sermon. Save it to add it to your library.");
  }

  function deleteSavedSermon(id: string) {
    if (!window.confirm("Delete this saved sermon and its resource drafts from this browser? This cannot be undone.")) return;
    setLibrary((old) => old.filter((item) => item.id !== id));
    if (selectedSermonId === id) setSelectedSermonId("");
    setNotice("Saved sermon deleted from this browser.");
  }

  function exportResourcePack() {
    const pack = ["KINGDOM SERMON INTELLIGENCE — RESOURCE PACK", "SERMON: " + (sermonTitle.trim() || "Untitled sermon"), "SPEAKER: " + speaker, "DATE: " + date, "SCRIPTURES: " + scripture, "", ...resources.flatMap((item) => ["=".repeat(56), item.title.toUpperCase() + " — " + item.status, "=".repeat(56), item.content, ""])].join("\n");
    const blob = new Blob([pack], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = (sermonTitle.trim() || "sermon-resource-pack").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-resource-pack.txt";
    link.click(); URL.revokeObjectURL(url); setNotice("Complete resource pack exported as a text file.");
  }

  function updateActive(content: string) {
    setResources((old) => old.map((r) => r.id === activeId ? { ...r, content, status: "Draft" } : r));
    setNotice("");
  }

  function downloadDraft() {
    const blob = new Blob([active.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = active.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(active.content);
      setNotice("Draft copied to clipboard.");
    } catch {
      setNotice("Copy is not available in this browser. Select the text and copy it manually.");
    }
  }

  function markApproved() {
    setResources((old) => old.map((r) => r.id === activeId ? { ...r, status: "Approved" } : r));
    setNotice("Marked approved in this session. This does not publish anything.");
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><BookOpen size={21} /></div><div><strong>Kingdom</strong><span>SERMON INTELLIGENCE</span></div></div>
        <button className="workspace-select"><span className="workspace-avatar">K</span><span className="workspace-copy"><b>Church workspace</b><small>Personal workspace</small></span><ChevronDown size={16} /></button>
        <div className="nav-label">WORKSPACE</div>
        <button className="nav-item active"><FileText size={18} /> Sermon studio</button>
        <button className="nav-item" onClick={() => document.getElementById("sermon-library")?.scrollIntoView({ behavior: "smooth" })}><BookOpen size={18} /> Sermon library <span className="soon">{library.length}</span></button>
        <button className="nav-item" onClick={() => setNotice("Team collaboration is planned for a later version.")}><HeartHandshake size={18} /> Team &amp; ministry <span className="soon">SOON</span></button>
        <div className="nav-label nav-label-spaced">YOUR RESOURCES</div>
        {resources.slice(0, 4).map((r) => <button key={r.id} className={`nav-item ${activeId === r.id ? "sub-active" : ""}`} onClick={() => setActiveId(r.id)}><span className="nav-dot" />{r.title}</button>)}
        <div className="sidebar-bottom"><div className="privacy-icon"><HeartHandshake size={17} /></div><div><b>Your message, handled carefully.</b><p>Review every resource before sharing it with your church.</p></div></div>
      </aside>

      <section className="main-area">
        <header className="topbar"><button className="mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu"><Menu size={20} /></button><div className="breadcrumb">Workspace <span>/</span> <b>Sermon studio</b></div><div className="topbar-right"><span className="local-badge"><span /> Free AI mode</span><button className="icon-button" aria-label="Settings" onClick={() => setNotice("AI generation uses the Groq free plan. Add GROQ_API_KEY in Vercel Environment Variables; the key stays on the server. Do not upgrade to a paid plan.")}><Settings2 size={18} /></button><div className="profile">TA</div></div></header>

        <div className="page-content">
          <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14} /> YOUR SERMON, MULTIPLIED WITH CARE</div><h1>Make more of every message.</h1><p className="intro">Turn your sermon into useful church resources while keeping the original message at the centre.</p></div><div className="welcome-icon"><Mic2 size={28} /></div></div>

          <section className="panel library-panel" id="sermon-library">
            <div className="panel-heading"><div className="heading-icon green"><BookOpen size={18} /></div><div><h2>Sermon library</h2><p>Save, reopen, search and export sermons on this device.</p></div><span className="count-pill">{library.length} saved</span></div>
            <div className="library-actions"><div className="search-box"><Search size={16} /><input value={libraryQuery} onChange={(e) => setLibraryQuery(e.target.value)} placeholder="Search saved sermons" /></div><button className="secondary-button" onClick={startNewSermon}><Plus size={15} /> New sermon</button><button className="secondary-button" onClick={saveToLibrary}><Check size={15} /> {selectedSermonId ? "Update saved sermon" : "Save sermon"}</button><button className="secondary-button" onClick={exportResourcePack}><Download size={15} /> Export full pack</button></div>
            {filteredLibrary.length ? <div className="library-list">{filteredLibrary.map((item) => <div className="library-item" key={item.id}><button className="library-open" onClick={() => openSavedSermon(item)}><b>{item.title || "Untitled sermon"}</b><small>{item.speaker || "Speaker not set"} · {item.date || "Date not set"} · {item.resources.length} resources</small><small>Last saved: {new Date(item.updatedAt).toLocaleString()}</small></button><button className="text-button" onClick={() => deleteSavedSermon(item.id)} aria-label={"Delete " + item.title}>Delete</button></div>)}</div> : <p className="library-empty">{libraryQuery ? "No saved sermons match that search." : "Your archive is empty. Add sermon details and a transcript, then choose Save sermon. Your library stays in this browser and does not sync across devices."}</p>}
          </section>

          <div className="workflow"><div className="workflow-step current"><span>1</span><div><b>Add sermon</b><small>Transcript &amp; details</small></div></div><div className="workflow-line" /><div className="workflow-step"><span>2</span><div><b>Prepare drafts</b><small>Build your resource set</small></div></div><div className="workflow-line" /><div className="workflow-step"><span>3</span><div><b>Review &amp; share</b><small>You stay in control</small></div></div></div>

          <div className="content-grid">
            <section className="panel sermon-panel">
              <div className="panel-heading"><div className="heading-icon green"><Mic2 size={18} /></div><div><h2>Sermon details</h2><p>Start with the message you want to develop.</p></div></div>
              <div className="form-grid"><label className="field full"><span>Sermon title</span><input value={sermonTitle} onChange={(e) => setSermonTitle(e.target.value)} placeholder="e.g. Faith That Moves Forward" required /></label><label className="field"><span>Speaker</span><input value={speaker} onChange={(e) => setSpeaker(e.target.value)} placeholder="Pastor / speaker" /></label><label className="field"><span>Date preached</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label className="field full"><span>Key Scripture references</span><input value={scripture} onChange={(e) => setScripture(e.target.value)} placeholder="e.g. Hebrews 11:1–6" /></label></div>
              <div className="transcript-head"><label htmlFor="transcript">Sermon transcript <span className="required">Required</span></label><span>{transcript.length.toLocaleString()} characters</span></div>
              <textarea id="transcript" value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste the sermon transcript here…&#10;&#10;For best results, include the full message and any Scripture references as preached." maxLength={16000} />
              <div className="transcript-foot"><span><span className="tiny-lock">✓</span> Your transcript is saved in this browser only.</span><span>Text only · Up to 16,000 characters</span></div>
              <button className="primary-button" onClick={prepareDrafts} disabled={generating} aria-busy={generating}><WandSparkles size={17} /> {generating ? "Generating resources…" : "Generate sermon resources"} <span>→</span></button>
              <p className="button-note">Uses the configured server-side AI provider free tier. A Groq free-plan key must be configured in Vercel; paid usage is not enabled. Every output requires human review.</p>
            </section>

            <section className="panel resources-panel">
              <div className="panel-heading resources-heading"><div className="heading-icon purple"><Sparkles size={18} /></div><div><h2>Resource workspace</h2><p>Your editable sermon companion set.</p></div><span className="count-pill">{resources.length} resources</span></div>
              <div className="resource-toolbar"><div className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a resource" /></div><button className="filter-button" onClick={() => setQuery("")}>All <ChevronDown size={14} /></button></div>
              <div className="resource-list">{filtered.map((r) => <button key={r.id} className={`resource-row ${activeId === r.id ? "resource-selected" : ""}`} onClick={() => setActiveId(r.id)}><div className={`resource-type-icon type-${r.id}`}>{r.id === "summary" ? <FileText size={17} /> : r.id === "outline" ? <ListChecks size={17} /> : r.id === "scriptures" ? <BookOpen size={17} /> : r.id === "devotional" ? <Lightbulb size={17} /> : r.id === "discussion" ? <MessageCircle size={17} /> : <Share2 size={17} />}</div><div className="resource-row-copy"><b>{r.title}</b><small>{r.type}</small></div><span className={`status status-${r.status.toLowerCase().replace(" ", "-")}`}>{r.status}</span></button>)}</div>
              <div className="resource-tip"><Lightbulb size={16} /><span><b>Faithfulness first.</b> Check every draft against the original sermon. Uncertain Scripture references should be verified, never guessed.</span></div>
            </section>
          </div>

          <section className="panel editor-panel">
            <div className="editor-top"><div className="editor-title"><div className="heading-icon blue"><FileText size={18} /></div><div><h2>{active.title}</h2><p>{sermonTitle.trim() || "Untitled sermon"}{speaker.trim() ? " · " + speaker.trim() : ""}{date ? " · " + date : ""}</p></div></div><div className="editor-actions"><button className="secondary-button" onClick={copyDraft}><Clipboard size={15} /> Copy</button><button className="secondary-button" onClick={downloadDraft}><Download size={15} /> Export .txt</button><button className="secondary-button" onClick={exportResourcePack}><Download size={15} /> Full pack</button><button className="approve-button" onClick={markApproved}><Check size={16} /> Approve draft</button></div></div>
            <div className="editor-label"><span>EDITABLE CONTENT</span><span className={`status status-${active.status.toLowerCase().replace(" ", "-")}`}>{active.status}</span></div>
            <textarea className="draft-editor" aria-label="Edit selected resource" value={active.content} onChange={(e) => updateActive(e.target.value)} />
            <div className="editor-footer"><span><span className="tiny-lock">✓</span> Changes are saved in this browser only.</span><button className="text-button" onClick={() => { setResources((old) => old.map((r) => r.id === activeId ? { ...r, content: "" , status: "Draft" } : r)); setNotice("Draft cleared."); }}><Plus size={14} /> Clear draft</button></div>
          </section>

          <div className="bottom-note"><div className="bottom-note-icon"><HeartHandshake size={19} /></div><div><b>Built to serve the local church.</b><p>Kingdom Sermon Intelligence assists ministry work; it does not replace the preacher’s voice, biblical study, pastoral discernment, or human review.</p></div><div className="bottom-note-mark"><BookOpen size={23} /></div></div>
          {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notice">×</button></div>}
          <footer><span>© 2026 Kingdom Sermon Intelligence</span><span>Built for faithful stewardship <span className="footer-heart">♥</span></span></footer>
        </div>
      </section>
    </main>
  );
}