"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, ChevronDown, Clipboard, Download, FileText, HeartHandshake, Lightbulb, ListChecks, Menu, MessageCircle, Mic2, Plus, Search, Settings2, Share2, Sparkles, WandSparkles } from "lucide-react";

type Resource = { id: string; title: string; type: string; content: string; status: "Draft" | "Needs review" | "Approved" };

const starterResources: Resource[] = [
  { id: "summary", title: "Sermon summary", type: "Summary", content: "Add a sermon transcript, then use the workspace to prepare a concise summary that preserves the preacher’s central message and supporting points.", status: "Draft" },
  { id: "outline", title: "Sermon outline", type: "Outline", content: "1. Main message\n2. Supporting truth\n3. Practical response\n\nThe outline should follow the sermon’s actual flow. Review and adjust it against the transcript.", status: "Draft" },
  { id: "scriptures", title: "Scripture references", type: "Scripture list", content: "Scripture references will need to be checked against the supplied transcript. Any uncertain reference should be marked for verification rather than guessed.", status: "Needs review" },
  { id: "devotional", title: "Devotional draft", type: "Devotional", content: "Reflection: What truth did this message bring into focus?\n\nPersonal response: Identify one practical step that follows from the message.\n\nPrayer: Write a prayer grounded in the sermon’s teaching.", status: "Draft" },
  { id: "discussion", title: "Small-group guide", type: "Discussion guide", content: "Opening: What stood out to you from the message?\n\nExplore: Which Scripture or point shaped your understanding?\n\nApply: What is one response you can put into practice this week?", status: "Draft" },
  { id: "social", title: "Social captions", type: "Social content", content: "A key truth from this week’s message is worth carrying into the week. Revisit the sermon, reflect on the Scripture, and put the teaching into practice.\n\nReview this caption and add the exact sermon theme before publishing.", status: "Draft" },
];

export default function Home() {
  const [sermonTitle, setSermonTitle] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [scripture, setScripture] = useState("");
  const [date, setDate] = useState("");
  const [transcript, setTranscript] = useState("");
  const [activeId, setActiveId] = useState("summary");
  const [resources, setResources] = useState<Resource[]>(starterResources);
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
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem("kingdom-sermon-intelligence-v1", JSON.stringify({ sermonTitle, speaker, scripture, date, transcript, resources })); }
    catch { setNotice("Your browser could not save more local data. Export important drafts as text files."); }
  }, [hydrated, sermonTitle, speaker, scripture, date, transcript, resources]);

  const active = resources.find((r) => r.id === activeId) ?? resources[0];
  const filtered = useMemo(() => resources.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()) || r.type.toLowerCase().includes(query.toLowerCase())), [resources, query]);

  function prepareDrafts() {
    const raw = transcript.trim();
    if (!raw) {
      setNotice("Add the sermon transcript first. Drafts should be grounded in the actual message.");
      return;
    }
    setGenerating(true);
    const normalized = raw.replace(/\r/g, "").replace(/[ \t]+/g, " ");
    const sentences = (normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).map((s) => s.trim()).filter((s) => s.length > 25);
    const paragraphs = normalized.split(/\n+/).map((p) => p.trim()).filter((p) => p.length > 25);
    const useful = sentences.length ? sentences : paragraphs;
    const excerpt = useful.slice(0, 5).map((s, i) => String(i + 1) + ". " + s).join("\n");
    const firstPass = useful.slice(0, 3).join(" ");
    const refs = Array.from(new Set((raw.match(/\b(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1\s?Samuel|2\s?Samuel|1\s?Kings|2\s?Kings|Psalms?|Proverbs|Ecclesiastes|Isaiah|Jeremiah|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1\s?Corinthians|2\s?Corinthians|Galatians|Ephesians|Philippians|Colossians|1\s?Thessalonians|2\s?Thessalonians|1\s?Timothy|2\s?Timothy|Titus|Philemon|Hebrews|James|1\s?Peter|2\s?Peter|1\s?John|2\s?John|3\s?John|Jude|Revelation)\s+\d{1,3}(?::\d{1,3}(?:[-–]\d{1,3})?)?/gi) || [])));
    const scriptureText = refs.length ? refs.join(", ") : "No clearly formatted Bible references were detected automatically. Check the transcript manually; this tool will not guess missing references.";
    const title = sermonTitle.trim() || "Untitled sermon";
    const heading = "SERMON: " + title + "\n" + (speaker.trim() ? "SPEAKER: " + speaker.trim() + "\n" : "") + (date ? "DATE: " + date + "\n" : "") + (scripture.trim() ? "USER-SUPPLIED SCRIPTURES: " + scripture.trim() + "\n" : "");
    const nextResources: Resource[] = [
      { id: "summary", title: "Sermon summary", type: "Summary", content: heading + "SUMMARY WORKING DRAFT\n\nThis free, local tool does not use a paid AI service. It has extracted the opening statements below to help you begin a summary. Edit this into a faithful account of the sermon’s central message, supporting teaching, and intended response.\n\nOPENING EXTRACT\n" + (firstPass || raw.slice(0, 1800)), status: "Needs review" },
      { id: "outline", title: "Sermon outline", type: "Outline", content: heading + "OUTLINE WORKING DRAFT\n\nReview the sermon and group these extracted statements into the preacher’s actual main points. This is automatic text extraction, not an interpretation.\n\n" + (excerpt || raw.slice(0, 1800)) + "\n\nMAIN POINT 1: [Edit from the sermon]\nMAIN POINT 2: [Edit from the sermon]\nPRACTICAL RESPONSE: [Edit from the sermon]", status: "Needs review" },
      { id: "scriptures", title: "Scripture references", type: "Scripture list", content: heading + "SCRIPTURE REFERENCE CHECK\n\nReferences detected by simple text matching:\n" + scriptureText + "\n\nVerify each reference against the transcript and Bible translation. This basic matcher can miss references or misread formatting; it does not verify verse contents.", status: "Needs review" },
      { id: "devotional", title: "Devotional draft", type: "Devotional", content: heading + "DEVOTIONAL WORKING TEMPLATE\n\nKEY TRUTH\n[Identify the central biblical truth from the sermon.]\n\nREFLECTION\n" + (firstPass || "[Summarise the sermon’s key teaching in your own words.]") + "\n\nPERSONAL APPLICATION\n[Write a practical response that follows from the actual message.]\n\nPRAYER\n[Write a prayer grounded in the sermon and its Scriptures.]", status: "Needs review" },
      { id: "discussion", title: "Small-group guide", type: "Discussion guide", content: heading + "SMALL-GROUP DISCUSSION\n\n1. What did you understand to be the central message of this sermon?\n2. Which Scripture or teaching in the message stood out to you, and why?\n3. What part of the message would you like to study more carefully?\n4. What practical response follows from the sermon?\n5. How can the group encourage one another to live out this teaching?\n\nLeader note: tailor these questions to the actual sermon before use.", status: "Needs review" },
      { id: "social", title: "Social captions", type: "Social content", content: heading + "SOCIAL CAPTION WORKING DRAFT\n\nThis week’s message: " + title + ".\n\nKey takeaway: [Insert one accurate, memorable point from the sermon.]\nScripture: " + (scripture.trim() || refs[0] || "[Verify the sermon’s Scripture reference]") + "\n\nReview the wording against the sermon before publishing. Add your church’s preferred details and approved link manually.", status: "Needs review" },
    ];
    setResources(nextResources);
    setActiveId("summary");
    setGenerating(false);
    setNotice("Six working drafts prepared offline. No AI service or paid API was used; edit each draft against the sermon before sharing.");
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
        <button className="nav-item" onClick={() => setNotice("Archive is planned for a later version. Your current drafts stay in this browser session.")}><BookOpen size={18} /> Sermon library <span className="soon">SOON</span></button>
        <button className="nav-item" onClick={() => setNotice("Team collaboration is planned for a later version.")}><HeartHandshake size={18} /> Team &amp; ministry <span className="soon">SOON</span></button>
        <div className="nav-label nav-label-spaced">YOUR RESOURCES</div>
        {resources.slice(0, 4).map((r) => <button key={r.id} className={`nav-item ${activeId === r.id ? "sub-active" : ""}`} onClick={() => setActiveId(r.id)}><span className="nav-dot" />{r.title}</button>)}
        <div className="sidebar-bottom"><div className="privacy-icon"><HeartHandshake size={17} /></div><div><b>Your message, handled carefully.</b><p>Review every resource before sharing it with your church.</p></div></div>
      </aside>

      <section className="main-area">
        <header className="topbar"><button className="mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu"><Menu size={20} /></button><div className="breadcrumb">Workspace <span>/</span> <b>Sermon studio</b></div><div className="topbar-right"><span className="local-badge"><span /> Local draft mode</span><button className="icon-button" aria-label="Settings" onClick={() => setNotice("Settings and connected AI services will be configured in a later setup step.")}><Settings2 size={18} /></button><div className="profile">TA</div></div></header>

        <div className="page-content">
          <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14} /> YOUR SERMON, MULTIPLIED WITH CARE</div><h1>Make more of every message.</h1><p className="intro">Turn your sermon into useful church resources while keeping the original message at the centre.</p></div><div className="welcome-icon"><Mic2 size={28} /></div></div>

          <div className="workflow"><div className="workflow-step current"><span>1</span><div><b>Add sermon</b><small>Transcript &amp; details</small></div></div><div className="workflow-line" /><div className="workflow-step"><span>2</span><div><b>Prepare drafts</b><small>Build your resource set</small></div></div><div className="workflow-line" /><div className="workflow-step"><span>3</span><div><b>Review &amp; share</b><small>You stay in control</small></div></div></div>

          <div className="content-grid">
            <section className="panel sermon-panel">
              <div className="panel-heading"><div className="heading-icon green"><Mic2 size={18} /></div><div><h2>Sermon details</h2><p>Start with the message you want to develop.</p></div></div>
              <div className="form-grid"><label className="field full"><span>Sermon title</span><input value={sermonTitle} onChange={(e) => setSermonTitle(e.target.value)} placeholder="e.g. Faith That Moves Forward" /></label><label className="field"><span>Speaker</span><input value={speaker} onChange={(e) => setSpeaker(e.target.value)} placeholder="Pastor / speaker" /></label><label className="field"><span>Date preached</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label className="field full"><span>Key Scripture references</span><input value={scripture} onChange={(e) => setScripture(e.target.value)} placeholder="e.g. Hebrews 11:1–6" /></label></div>
              <div className="transcript-head"><label htmlFor="transcript">Sermon transcript <span className="required">Required</span></label><span>{transcript.length.toLocaleString()} characters</span></div>
              <textarea id="transcript" value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste the sermon transcript here…&#10;&#10;For best results, include the full message and any Scripture references as preached." />
              <div className="transcript-foot"><span><span className="tiny-lock">✓</span> Your transcript is saved in this browser only.</span><span>Text only · No upload required</span></div>
              <button className="primary-button" onClick={prepareDrafts} disabled={generating} aria-busy={generating}><WandSparkles size={17} /> {generating ? "Generating resources…" : "Generate sermon resources"} <span>→</span></button>
              <p className="button-note">Runs locally in your browser. No paid AI API or key is required; all drafts require human review.</p>
            </section>

            <section className="panel resources-panel">
              <div className="panel-heading resources-heading"><div className="heading-icon purple"><Sparkles size={18} /></div><div><h2>Resource workspace</h2><p>Your editable sermon companion set.</p></div><span className="count-pill">{resources.length} resources</span></div>
              <div className="resource-toolbar"><div className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a resource" /></div><button className="filter-button" onClick={() => setQuery("")}>All <ChevronDown size={14} /></button></div>
              <div className="resource-list">{filtered.map((r) => <button key={r.id} className={`resource-row ${activeId === r.id ? "resource-selected" : ""}`} onClick={() => setActiveId(r.id)}><div className={`resource-type-icon type-${r.id}`}>{r.id === "summary" ? <FileText size={17} /> : r.id === "outline" ? <ListChecks size={17} /> : r.id === "scriptures" ? <BookOpen size={17} /> : r.id === "devotional" ? <Lightbulb size={17} /> : r.id === "discussion" ? <MessageCircle size={17} /> : <Share2 size={17} />}</div><div className="resource-row-copy"><b>{r.title}</b><small>{r.type}</small></div><span className={`status status-${r.status.toLowerCase().replace(" ", "-")}`}>{r.status}</span></button>)}</div>
              <div className="resource-tip"><Lightbulb size={16} /><span><b>Faithfulness first.</b> Check every draft against the original sermon. Uncertain Scripture references should be verified, never guessed.</span></div>
            </section>
          </div>

          <section className="panel editor-panel">
            <div className="editor-top"><div className="editor-title"><div className="heading-icon blue"><FileText size={18} /></div><div><h2>{active.title}</h2><p>{sermonTitle.trim() || "Untitled sermon"}{speaker.trim() ? " · " + speaker.trim() : ""}{date ? " · " + date : ""}</p></div></div><div className="editor-actions"><button className="secondary-button" onClick={copyDraft}><Clipboard size={15} /> Copy</button><button className="secondary-button" onClick={downloadDraft}><Download size={15} /> Export .txt</button><button className="approve-button" onClick={markApproved}><Check size={16} /> Approve draft</button></div></div>
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