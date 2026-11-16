import React, { useRef, useState } from "react";
import { Upload, FileText, ArrowRight, RotateCcw, LockKeyhole } from "lucide-react";
import { Panel, PageIntro, ErrorNotice } from "../components/ui.jsx";
import ResultsPanel from "../components/ResultsPanel.jsx";
import { analyzeEmail, extractPdf } from "../services/api.js";
import { useEmailWorkspace } from "../state/EmailWorkspaceContext.jsx";
import { SAMPLE_EMAILS } from "../data/sampleEmails.js";
function DashboardPage() {
  const { state, dispatch } = useEmailWorkspace();
  const { subject, body, mode, pdfFilename, extractionNote, pageCount, isUserEdited, isLoading, result, backendError } = state;
  const [extracting, setExtracting] = useState(false), [uploadError, setUploadError] = useState(null), [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const busy = isLoading || extracting;
  const length = Array.from(subject).length + Array.from(body).length;
  async function processFile(file) {
    if (busy) return;
    setUploadError(null);
    if (!file || !file.name.toLowerCase().endsWith(".pdf") || !["", "application/pdf", "application/octet-stream"].includes(file.type)) {
      setUploadError("Choose a PDF file. Other file types are not accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("The PDF is larger than 10 MB. Choose a smaller file.");
      return;
    }
    setExtracting(true);
    try {
      dispatch({ type: "PDF_EXTRACTED", payload: await extractPdf(file) });
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setExtracting(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  async function analyze() {
    setUploadError(null);
    if (!subject.trim() && !body.trim()) {
      setUploadError("Upload a PDF or enter email text before analysis.");
      return;
    }
    if (length > 1e4) {
      setUploadError("Subject and body together must not exceed 10,000 characters.");
      return;
    }
    dispatch({ type: "ANALYSIS_START" });
    try {
      dispatch({ type: "ANALYSIS_SUCCESS", result: await analyzeEmail({ subject, body, mode }), isOfflineDemo: false });
    } catch (error) {
      dispatch({ type: "ANALYSIS_ERROR", error });
    }
  }
  return <div className="page"><PageIntro eyebrow="Email security workspace" title="Understand the patterns. Inspect the evidence." tag="DFA · ε-NFA · REGEX">Analyze a saved email PDF or paste its text. Every finding is explained by the configured detection engines.</PageIntro><div className="analyze-layout"><div className="stack"><Panel title="Analyze email" aside={<span className="tag teal"><LockKeyhole size={11} />Local processing</span>}><div className="stack">
 <div className={`dropzone ${dragging ? "dragging" : ""}`} onDragOver={(e) => {
    e.preventDefault();
    setDragging(true);
  }} onDragLeave={() => setDragging(false)} onDrop={(e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  }}><div className="drop-icon"><Upload size={22} /></div><div><h3>Drop an email PDF here</h3><p className="tiny muted">Selectable text · PDF only · up to 10 MB</p></div><input id="pdf-file" ref={fileInput} type="file" accept="application/pdf,.pdf" className="sr-only" aria-label="Email PDF file" disabled={busy} onChange={(e) => processFile(e.target.files[0])} /><button className="btn" disabled={busy} onClick={() => fileInput.current?.click()}>{extracting ? "Extracting…" : "Choose PDF"}</button></div>
 <div className="samples tiny muted"><span>Or try a sample:</span>{SAMPLE_EMAILS.map((sample) => <button key={sample.id} className="btn compact" disabled={busy} title={sample.summary} onClick={() => { setUploadError(null); dispatch({ type: "LOAD_SAMPLE", sample }); }}>{sample.label}</button>)}</div>
 <ErrorNotice error={uploadError} />{pdfFilename && <div className="small muted"><div className="row"><FileText size={15} /><strong>{pdfFilename}</strong><span>{pageCount} page{pageCount === 1 ? "" : "s"}</span>{isUserEdited && <span className="tag amber">User-edited text</span>}</div><p className="tiny" style={{ marginTop: 6 }}>{extractionNote}</p></div>}
 <div><label htmlFor="email-subject">Subject <span className="muted">(optional)</span></label><input id="email-subject" className="input" value={subject} disabled={busy} onChange={(e) => dispatch({ type: "EDIT_SUBJECT", value: e.target.value })} placeholder="Email subject" /></div><div><label htmlFor="extracted-text">{pdfFilename ? "Extracted text — review before analysis" : "Email body"}</label><textarea id="extracted-text" className="input mono" rows={9} value={body} disabled={busy} onChange={(e) => dispatch({ type: "EDIT_BODY", value: e.target.value })} placeholder="Paste email text here, or extract it from a PDF…" /><div className="row between tiny muted" style={{ marginTop: 6 }}><span>Review the text before you analyze.</span><span className={length > 1e4 ? "warning" : ""}>{length.toLocaleString()} / 10,000 characters</span></div></div>
 <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}><legend className="small" style={{ marginBottom: 8 }}>Detection mode</legend><div className="mode-options">{[["combined", "All detectors"], ["dfa", "DFA only"], ["nfa", "ε-NFA only"], ["regex", "Regex only"]].map(([value, label]) => <button key={value} className={`btn compact ${mode === value ? "selected" : ""}`} aria-pressed={mode === value} onClick={() => dispatch({ type: "SET_MODE", mode: value })}>{label}</button>)}</div></fieldset><div className="row between divider" style={{ paddingTop: 18 }}><button className="btn primary" disabled={busy || !subject.trim() && !body.trim() || length > 1e4} onClick={analyze}>{isLoading ? "Analyzing…" : "Analyze email"}<ArrowRight size={15} /></button><button className="btn compact" disabled={busy} onClick={() => {
    dispatch({ type: "CLEAR" });
    setUploadError(null);
  }}><RotateCcw size={13} />Clear email</button></div></div></Panel><p className="tiny muted row"><LockKeyhole size={13} />No permanent email storage, external analysis, or OCR.</p></div><ResultsPanel result={result} isLoading={isLoading} error={backendError} subject={subject} body={body} /></div><div className="notice">A match identifies a configured pattern, not proof of phishing. No configured match does not guarantee safety. DFA and ε-NFA match complete fields; regex rules can match substrings.</div></div>;
}
export {
  DashboardPage as default
};
