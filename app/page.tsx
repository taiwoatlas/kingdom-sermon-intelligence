"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, ChevronDown, Clipboard, Download, FileText, HeartHandshake, Lightbulb, ListChecks, Menu, MessageCircle, Mic2, Plus, RefreshCw, Search, Settings2, Share2, Sparkles, WandSparkles } from "lucide-react";

type Revision = { id: string; resourceId: string; title: string; content: string; status: "Draft" | "Needs review" | "Approved"; action: string; createdAt: string; actor: string };
type Resource = { id: string; title: string; type: string; content: string; status: "Draft" | "Needs review" | "Approved"; approvedAt?: string; approvedBy?: string };
type SavedSermon = { id: string; title: string; speaker: string; scripture: string; date: string; transcript: string; resources: Resource[]; revisions?: Record<string, Revision[]>; updatedAt: string };

const RESOURCE_CHOICES = [
  { id: "summary", label: "Sermon summary" }, { id: "outline", label: "Sermon outline" }, { id: "scriptures", label: "Scripture references" }, { id: "devotional", label: "Devotional" }, { id: "discussion", label: "Small-group guide" }, { id: "social", label: "Social captions" }, { id: "quotes", label: "Quote candidates" }, { id: "slides", label: "Slide outline" },
];
const AUDIENCE_CHOICES = ["General congregation", "Youth and young adults", "Children and families", "Church leaders", "Small groups", "New believers", "Social media audience", "Bible study class"];
const TONE_CHOICES = ["Pastoral and warm", "Teaching and explanatory", "Bold and exhortational", "Reflective and devotional", "Simple and accessible"];
const LANGUAGE_CHOICES = ["English", "Nigerian Pidgin", "Yoruba", "French", "Spanish", "Portuguese", "Arabic", "Chinese", "Russian", "Indonesian", "Filipino"];
const PLATFORM_CHOICES = ["All platforms", "Instagram", "Facebook", "WhatsApp", "TikTok", "YouTube"];

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
  const [revisions, setRevisions] = useState<Record<string, Revision[]>>({});
  const [libraryQuery, setLibraryQuery] = useState("");
  const [selectedSermonId, setSelectedSermonId] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>(RESOURCE_CHOICES.map((item) => item.id));
  const [audience, setAudience] = useState("General congregation");
  const [tone, setTone] = useState("Pastoral and warm");
  const [outputLanguage, setOutputLanguage] = useState("English");
  const [socialPlatforms, setSocialPlatforms] = useState("All platforms");
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
        if (Array.isArray(data.selectedResourceIds) && data.selectedResourceIds.every((id: unknown) => typeof id === "string" && RESOURCE_CHOICES.some((choice) => choice.id === id))) setSelectedResourceIds(data.selectedResourceIds);
        if (typeof data.audience === "string" && AUDIENCE_CHOICES.includes(data.audience)) setAudience(data.audience);
        if (typeof data.tone === "string" && TONE_CHOICES.includes(data.tone)) setTone(data.tone);
        if (typeof data.outputLanguage === "string" && LANGUAGE_CHOICES.includes(data.outputLanguage)) setOutputLanguage(data.outputLanguage);
        if (typeof data.socialPlatforms === "string" && PLATFORM_CHOICES.includes(data.socialPlatforms)) setSocialPlatforms(data.socialPlatforms);
        if (Array.isArray(data.resources) && data.resources.every((r: Resource) => typeof r.id === "string" && typeof r.content === "string")) setResources(data.resources);
        if (data.revisions && typeof data.revisions === "object" && !Array.isArray(data.revisions)) setRevisions(data.revisions);
      }
    } catch { /* Ignore malformed local data. */ }
    try { const savedLibrary = localStorage.getItem("kingdom-sermon-library-v1"); if (savedLibrary) { const parsed = JSON.parse(savedLibrary); if (Array.isArray(parsed)) setLibrary(parsed.filter((item: SavedSermon) => item && typeof item.id === "string" && Array.isArray(item.resources))); } } catch { /* Ignore malformed archive data. */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem("kingdom-sermon-intelligence-v1", JSON.stringify({ sermonTitle, speaker, scripture, date, transcript, resources, revisions, selectedResourceIds, audience, tone, outputLanguage, socialPlatforms })); }
    catch { setNotice("Your browser could not save more local data. Export important drafts as text files."); }
  }, [hydrated, sermonTitle, speaker, scripture, date, transcript, resources, revisions, selectedResourceIds, audience, tone, outputLanguage, socialPlatforms]);

  useEffect(() => { if (!hydrated) return; try { localStorage.setItem("kingdom-sermon-library-v1", JSON.stringify(library)); } catch { setNotice("The browser could not save the full library. Export your sermon pack for safekeeping."); } }, [hydrated, library]);

  const active = resources.find((r) => r.id === activeId) ?? resources[0];
  const activeRevisions = (revisions[activeId] || []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function recordRevision(resource: Resource, action: string) {
    const entry: Revision = { id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 7), resourceId: resource.id, title: resource.title, content: resource.content, status: resource.status, action, createdAt: new Date().toISOString(), actor: "Local owner" };
    setRevisions((old) => ({ ...old, [resource.id]: [entry, ...(old[resource.id] || [])].slice(0, 20) }));
  }

  function saveActiveRevision() {
    recordRevision(active, "Manual version saved");
    setNotice("Version saved. You can restore it from the revision history.");
  }

  function restoreRevision(revision: Revision) {
    recordRevision(active, "Snapshot before restoring an older version");
    setResources((old) => old.map((item) => item.id === activeId ? { ...item, title: revision.title, content: revision.content, status: "Draft", approvedAt: undefined, approvedBy: undefined } : item));
    setNotice("Previous version restored as a draft. Review it before approving again.");
  }
  const filteredLibrary = library.filter((item) => {
    const term = libraryQuery.toLowerCase().trim();
    if (!term) return true;
    return [item.title, item.speaker, item.scripture, item.transcript, ...item.resources.flatMap((resource) => [resource.title, resource.content])].some((value) => (value || "").toLowerCase().includes(term));
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const filtered = useMemo(() => resources.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()) || r.type.toLowerCase().includes(query.toLowerCase())), [resources, query]);

  async function prepareDrafts() {
    const raw = transcript.trim();
    if (selectedResourceIds.length === 0) { setNotice("Select at least one resource to generate."); return; }
    if (!sermonTitle.trim()) { setNotice("Enter a sermon title before generating resources."); return; }
    if (!raw) { setNotice("Paste the sermon transcript before generating resources."); return; }
    if (raw.length > 16000) { setNotice("This free-tier generation workflow supports up to 16,000 transcript characters per request. Split a longer sermon into sections."); return; }

    setGenerating(true);
    setNotice("Sending the transcript for AI generation. Existing drafts will remain unchanged until a valid response arrives.");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sermonTitle.trim(), speaker: speaker.trim(), scripture: scripture.trim(), date, transcript: raw, resourceIds: selectedResourceIds, options: { audience, tone, language: outputLanguage, platforms: socialPlatforms } }),
      });
      const result = await response.json();
      if (!response.ok) {
        setNotice(result?.error?.message || "Generation failed. Your transcript is still available; please try again.");
        return;
      }
      if (!Array.isArray(result.resources) || result.resources.length !== selectedResourceIds.length || !selectedResourceIds.every((id) => result.resources.some((item: Resource) => item.id === id))) {
        setNotice("The server returned an incomplete selected resource set. Your existing drafts were not overwritten.");
        return;
      }
      const generated = result.resources as Resource[];
      setResources((old) => [...old.filter((item) => !selectedResourceIds.includes(item.id)), ...generated].sort((a, b) => RESOURCE_CHOICES.findIndex((choice) => choice.id === a.id) - RESOURCE_CHOICES.findIndex((choice) => choice.id === b.id)));
      setActiveId(generated[0]?.id || "summary");
      setNotice("Generated " + generated.length + " selected resource draft(s) using your audience, tone and language settings. Review each against the sermon before sharing.");
    } catch {
      setNotice("Could not reach the generation endpoint. Your transcript is still in the editor; check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function regenerateActiveResource() {
    const raw = transcript.trim();
    if (!sermonTitle.trim()) { setNotice("Enter a sermon title before regenerating a resource."); return; }
    if (!raw) { setNotice("Paste the sermon transcript before regenerating a resource."); return; }
    if (raw.length > 16000) { setNotice("This free-tier workflow supports up to 16,000 transcript characters per request."); return; }

    setGenerating(true);
    setNotice("Regenerating only the selected resource. Your current version will remain until a valid replacement arrives.");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sermonTitle.trim(), speaker: speaker.trim(), scripture: scripture.trim(), date, transcript: raw, resourceIds: [activeId], options: { audience, tone, language: outputLanguage, platforms: socialPlatforms } }),
      });
      const result = await response.json();
      if (!response.ok) {
        setNotice(result?.error?.message || "Resource regeneration failed. Your current draft has been kept.");
        return;
      }
      if (!Array.isArray(result.resources) || result.resources.length !== 1 || result.resources[0]?.id !== activeId) {
        setNotice("The server returned an unexpected resource. Your current draft has been kept.");
        return;
      }
      const replacement = result.resources[0] as Resource;
      recordRevision(active, "Previous version saved before regeneration");
      setResources((old) => old.map((item) => item.id === activeId ? { ...replacement, status: "Needs review", approvedAt: undefined, approvedBy: undefined } : item));
      setNotice("Selected resource regenerated. Review it against the sermon; your other resources were not changed.");
    } catch {
      setNotice("Could not reach the generation endpoint. Your current draft has been kept.");
    } finally {
      setGenerating(false);
    }
  }

  async function importTranscriptText(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".txt") && file.type !== "text/plain") {
      setNotice("Choose a plain-text .txt transcript file.");
      return;
    }
    try {
      const text = await file.text();
      if (!text.trim()) { setNotice("That text file is empty."); return; }
      if (text.length > 16000) { setNotice("This transcript is " + text.length.toLocaleString() + " characters. The current free AI workflow accepts up to 16,000; shorten the file before importing."); return; }
      setTranscript(text);
      if (!sermonTitle.trim()) setSermonTitle(file.name.replace(/\\.txt$/i, "").replace(/[_-]+/g, " "));
      setNotice("Transcript imported from " + file.name + ". Check the text before generating resources.");
    } catch {
      setNotice("The transcript file could not be read. Try saving it as UTF-8 plain text.");
    }
  }

  function exportBackup() {
    const backup = { app: "Kingdom Sermon Intelligence", schemaVersion: 1, exportedAt: new Date().toISOString(), current: { sermonTitle, speaker, scripture, date, transcript, resources, revisions }, library };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "kingdom-sermon-intelligence-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    link.click(); URL.revokeObjectURL(url);
    setNotice("Full backup exported, including the current sermon, local library, resource versions and approval timestamps. Store this file somewhere safe.");
  }

  async function importBackup(file?: File) {
    if (!file) return;
    try {
      if (file.size > 15 * 1024 * 1024) { setNotice("Backup is larger than 15 MB. Choose a smaller backup file."); return; }
      const backup = JSON.parse(await file.text());
      const validResources = (items: unknown) => Array.isArray(items) && items.every((item) => item && typeof item.id === "string" && typeof item.title === "string" && typeof item.type === "string" && typeof item.content === "string" && ["Draft", "Needs review", "Approved"].includes(item.status));
      if (!backup || backup.app !== "Kingdom Sermon Intelligence" || backup.schemaVersion !== 1 || !backup.current || typeof backup.current.transcript !== "string" || !validResources(backup.current.resources) || !Array.isArray(backup.library) || !backup.library.every((item: SavedSermon) => item && typeof item.id === "string" && typeof item.title === "string" && typeof item.transcript === "string" && validResources(item.resources))) {
        setNotice("This file is not a valid Kingdom Sermon Intelligence backup. Nothing was imported.");
        return;
      }
      const current = backup.current;
      setSermonTitle(typeof current.sermonTitle === "string" ? current.sermonTitle : "");
      setSpeaker(typeof current.speaker === "string" ? current.speaker : "");
      setScripture(typeof current.scripture === "string" ? current.scripture : "");
      setDate(typeof current.date === "string" ? current.date : "");
      setTranscript(current.transcript);
      setResources(current.resources);
      setRevisions(current.revisions && typeof current.revisions === "object" && !Array.isArray(current.revisions) ? current.revisions : {});
      setLibrary(backup.library);
      setSelectedSermonId("");
      setActiveId(current.resources[0]?.id || "summary");
      setNotice("Backup imported. Current sermon, library and saved versions have been restored in this browser. Export another backup first if you need to preserve the previous data.");
    } catch {
      setNotice("The backup file could not be read as valid JSON. Nothing was imported.");
    }
  }

  function saveToLibrary() {
    const title = sermonTitle.trim() || "Untitled sermon";
    const record: SavedSermon = { id: selectedSermonId || String(Date.now()), title, speaker, scripture, date, transcript, resources: resources.map((item) => ({ ...item })), revisions: JSON.parse(JSON.stringify(revisions)) as Record<string, Revision[]>, updatedAt: new Date().toISOString() };
    setLibrary((old) => selectedSermonId ? old.map((item) => item.id === selectedSermonId ? record : item) : [record, ...old]);
    setSelectedSermonId(record.id);
    setNotice(selectedSermonId ? "Sermon changes saved to your local library." : "Sermon saved to your local library on this device.");
  }

  function openSavedSermon(record: SavedSermon) {
    setSermonTitle(record.title); setSpeaker(record.speaker || ""); setScripture(record.scripture || ""); setDate(record.date || ""); setTranscript(record.transcript || "");
    setResources(record.resources.map((item) => ({ ...item }))); setRevisions(record.revisions || {}); setActiveId(record.resources[0]?.id || "summary"); setSelectedSermonId(record.id);
    setNotice("Opened sermon from this browser's local library.");
  }

  function startNewSermon() {
    setSermonTitle(""); setSpeaker(""); setScripture(""); setDate(""); setTranscript(""); setResources(starterResources.map((item) => ({ ...item })));
    setActiveId("summary"); setSelectedSermonId(""); setRevisions({}); setNotice("Started a new sermon. Save it to add it to your library.");
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
    setResources((old) => old.map((r) => r.id === activeId ? { ...r, content, status: "Draft", approvedAt: undefined, approvedBy: undefined } : r));
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
    const approvedAt = new Date().toISOString();
    const approvedResource: Resource = { ...active, status: "Approved", approvedAt, approvedBy: "Local owner" };
    setResources((old) => old.map((r) => r.id === activeId ? approvedResource : r));
    recordRevision(approvedResource, "Approved by Local owner");
    setNotice("Approval recorded locally with a timestamp. This does not publish anything; there is no signed-in user identity yet.");
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
            <div className="library-actions"><div className="search-box"><Search size={16} /><input value={libraryQuery} onChange={(e) => setLibraryQuery(e.target.value)} placeholder="Search sermons, transcripts, resources" /></div><button className="secondary-button" onClick={startNewSermon}><Plus size={15} /> New sermon</button><button className="secondary-button" onClick={saveToLibrary}><Check size={15} /> {selectedSermonId ? "Update saved sermon" : "Save sermon"}</button><button className="secondary-button" onClick={exportResourcePack}><Download size={15} /> Export full pack</button><button className="secondary-button" onClick={exportBackup}><Download size={15} /> Backup all</button><button className="secondary-button" onClick={() => document.getElementById("backup-import")?.click()}>Import backup</button><input id="backup-import" type="file" accept=".json,application/json" hidden onChange={(e) => { void importBackup(e.target.files?.[0]); e.currentTarget.value = ""; }} /></div>
            {filteredLibrary.length ? <div className="library-list">{filteredLibrary.map((item) => <div className="library-item" key={item.id}><button className="library-open" onClick={() => openSavedSermon(item)}><b>{item.title || "Untitled sermon"}</b><small>{item.speaker || "Speaker not set"} · {item.date || "Date not set"} · {item.resources.length} resources</small><small>Last saved: {new Date(item.updatedAt).toLocaleString()}</small></button><button className="text-button" onClick={() => deleteSavedSermon(item.id)} aria-label={"Delete " + item.title}>Delete</button></div>)}</div> : <p className="library-empty">{libraryQuery ? "No saved sermons match that search." : "Your archive is empty. Add sermon details and a transcript, then choose Save sermon. Your library stays in this browser and does not sync across devices."}</p>}
          </section>

          <div className="workflow"><div className="workflow-step current"><span>1</span><div><b>Add sermon</b><small>Transcript &amp; details</small></div></div><div className="workflow-line" /><div className="workflow-step"><span>2</span><div><b>Prepare drafts</b><small>Build your resource set</small></div></div><div className="workflow-line" /><div className="workflow-step"><span>3</span><div><b>Review &amp; share</b><small>You stay in control</small></div></div></div>

          <div className="content-grid">
            <section className="panel sermon-panel">
              <div className="panel-heading"><div className="heading-icon green"><Mic2 size={18} /></div><div><h2>Sermon details</h2><p>Start with the message you want to develop.</p></div></div>
              <div className="form-grid"><label className="field full"><span>Sermon title</span><input value={sermonTitle} onChange={(e) => setSermonTitle(e.target.value)} placeholder="e.g. Faith That Moves Forward" required /></label><label className="field"><span>Speaker</span><input value={speaker} onChange={(e) => setSpeaker(e.target.value)} placeholder="Pastor / speaker" /></label><label className="field"><span>Date preached</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label className="field full"><span>Key Scripture references</span><input value={scripture} onChange={(e) => setScripture(e.target.value)} placeholder="e.g. Hebrews 11:1–6" /></label></div>
              <div className="transcript-head"><label htmlFor="transcript">Sermon transcript <span className="required">Required</span></label><div className="transcript-tools"><span>{transcript.length.toLocaleString()} characters</span><button className="text-button" onClick={() => document.getElementById("transcript-file")?.click()}>Import .txt</button><input id="transcript-file" type="file" accept=".txt,text/plain" hidden onChange={(e) => { void importTranscriptText(e.target.files?.[0]); e.currentTarget.value = ""; }} /></div></div>
              <textarea id="transcript" value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste the sermon transcript here…&#10;&#10;For best results, include the full message and any Scripture references as preached." maxLength={16000} />
              <div className="transcript-foot"><span><span className="tiny-lock">✓</span> Your transcript is saved in this browser only.</span><span>Text only · Up to 16,000 characters</span></div>
              <section className="generation-controls">
                <div className="generation-controls-heading"><div><b>Build your content pack</b><small>Choose exactly what the AI should create.</small></div><button type="button" className="text-button" onClick={() => setSelectedResourceIds(RESOURCE_CHOICES.map((item) => item.id))}>Select all</button></div>
                <div className="generation-resource-grid">{RESOURCE_CHOICES.map((item) => <label className="generation-choice" key={item.id}><input type="checkbox" checked={selectedResourceIds.includes(item.id)} onChange={(e) => setSelectedResourceIds((old) => e.target.checked ? [...old, item.id] : old.filter((id) => id !== item.id))} /><span>{item.label}</span></label>)}</div>
                <div className="generation-settings">
                  <label className="field"><span>Target audience</span><select value={audience} onChange={(e) => setAudience(e.target.value)}>{AUDIENCE_CHOICES.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label className="field"><span>Writing tone</span><select value={tone} onChange={(e) => setTone(e.target.value)}>{TONE_CHOICES.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label className="field"><span>Output language</span><select value={outputLanguage} onChange={(e) => setOutputLanguage(e.target.value)}>{LANGUAGE_CHOICES.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label className="field"><span>Social platforms</span><select value={socialPlatforms} onChange={(e) => setSocialPlatforms(e.target.value)}>{PLATFORM_CHOICES.map((item) => <option key={item}>{item}</option>)}</select></label>
                </div>
              </section>
              <button className="primary-button" onClick={prepareDrafts} disabled={generating || selectedResourceIds.length === 0} aria-busy={generating}><WandSparkles size={17} /> {generating ? "Generating content…" : "Generate selected content"} <span>→</span></button>
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
            <div className="editor-top"><div className="editor-title"><div className="heading-icon blue"><FileText size={18} /></div><div><h2>{active.title}</h2><p>{sermonTitle.trim() || "Untitled sermon"}{speaker.trim() ? " · " + speaker.trim() : ""}{date ? " · " + date : ""}</p></div></div><div className="editor-actions"><button className="secondary-button" onClick={copyDraft}><Clipboard size={15} /> Copy</button><button className="secondary-button" onClick={downloadDraft}><Download size={15} /> Export .txt</button><button className="secondary-button" onClick={exportResourcePack}><Download size={15} /> Full pack</button><button className="secondary-button" onClick={regenerateActiveResource} disabled={generating || !transcript.trim()}><RefreshCw size={15} /> {generating ? "Working…" : "Regenerate this resource"}</button><button className="secondary-button" onClick={saveActiveRevision}><FileText size={15} /> Save version</button><button className="approve-button" onClick={markApproved}><Check size={16} /> Approve draft</button></div></div>
            <div className="editor-label"><span>EDITABLE CONTENT</span><span className={`status status-${active.status.toLowerCase().replace(" ", "-")}`}>{active.status}</span></div>
            <textarea className="draft-editor" aria-label="Edit selected resource" value={active.content} onChange={(e) => updateActive(e.target.value)} />
            <div className="editor-footer"><span><span className="tiny-lock">✓</span> Changes are saved in this browser only.</span><button className="text-button" onClick={() => { recordRevision(active, "Saved before clearing draft"); setResources((old) => old.map((r) => r.id === activeId ? { ...r, content: "", status: "Draft", approvedAt: undefined, approvedBy: undefined } : r)); setNotice("Draft cleared. Its previous version was saved to history."); }}><Plus size={14} /> Clear draft</button></div>
            {active.status === "Approved" && active.approvedAt && <div className="approval-audit"><Check size={15} /><span><b>Approved locally</b><small>{active.approvedBy || "Local owner"} · {new Date(active.approvedAt).toLocaleString()}</small></span></div>}
            <section className="revision-panel"><div className="revision-heading"><div><h3>Revision history</h3><p>Up to 20 saved versions for this resource on this device.</p></div><span className="count-pill">{activeRevisions.length} versions</span></div>{activeRevisions.length ? <div className="revision-list">{activeRevisions.map((revision) => <div className="revision-item" key={revision.id}><div className="revision-copy"><b>{revision.action}</b><small>{new Date(revision.createdAt).toLocaleString()} · {revision.actor} · {revision.status}</small><p>{revision.content.slice(0, 150) || "Empty draft"}{revision.content.length > 150 ? "…" : ""}</p></div><button className="secondary-button" onClick={() => restoreRevision(revision)}>Restore</button></div>)}</div> : <p className="library-empty">No versions saved yet. Choose “Save version” before major edits, or regenerate/approve to create a history entry.</p>}</section>
          </section>

          <div className="bottom-note"><div className="bottom-note-icon"><HeartHandshake size={19} /></div><div><b>Built to serve the local church.</b><p>Kingdom Sermon Intelligence assists ministry work; it does not replace the preacher’s voice, biblical study, pastoral discernment, or human review.</p></div><div className="bottom-note-mark"><BookOpen size={23} /></div></div>
          {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notice">×</button></div>}
          <footer><span>© 2026 Kingdom Sermon Intelligence</span><span>Built for faithful stewardship <span className="footer-heart">♥</span></span></footer>
        </div>
      </section>
    </main>
  );
}