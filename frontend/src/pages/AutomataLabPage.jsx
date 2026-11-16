import React, { useEffect, useState } from "react";
import { useLocation, useSearchParams, Link } from "react-router-dom";
import { getAutomaton, simulateAutomaton } from "../services/api.js";
import { PageIntro, Panel, Metric, ErrorNotice, setLabel } from "../components/ui.jsx";
import AutomataGraph from "../components/AutomataGraph.jsx";
import ExecutionTraceView from "../components/ExecutionTraceView.jsx";
import TransitionTable from "../components/TransitionTable.jsx";
import StepControls, { usePlayback } from "../components/StepControls.jsx";
import { traceFrame } from "../utils/traceModel.js";
const ids = { dfa: "dfa_win_prize_now", nfa: "nfa_phishing_branches" };
function AutomataLabPage() {
  const location = useLocation(), [params, setParams] = useSearchParams();
  const kind = params.get("detector") === "nfa" ? "nfa" : "dfa";
  const [input, setInput] = useState(location.state?.input ?? "WIN PRIZE NOW");
  const [model, setModel] = useState(null), [result, setResult] = useState(null), [error, setError] = useState(null), [loading, setLoading] = useState(false);
  const playback = usePlayback(result?.trace.length || 0);
  useEffect(() => {
    let alive = true;
    setModel(null);
    setResult(null);
    setError(null);
    setLoading(true);
    getAutomaton(ids[kind]).then(async (definition) => {
      if (!alive) return;
      setModel(definition);
      if (location.state?.input !== void 0) {
        const computed = await simulateAutomaton(ids[kind], { input: location.state.input });
        if (alive) setResult(computed);
      }
    }).catch((e) => {
      if (alive) setError(e);
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [kind]);
  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    playback.reset();
    try {
      setResult(await simulateAutomaton(ids[kind], { input }));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  const frame = traceFrame(model, result?.trace || [], playback.index);
  const complete = result && playback.index === playback.last;
  const tokens = result?.input_text.split(/\s+/).filter(Boolean) || [];
  return <div className="page"><PageIntro eyebrow="Detection engine" title="Follow every transition." tag="Real backend computation">Inspect how the configured email phrase detectors consume tokens. A complete input must belong to the recognizer’s language.</PageIntro><div className="tabs">{["dfa", "nfa"].map((k) => <button className={`btn ${kind === k ? "selected" : ""}`} disabled={loading} aria-pressed={kind === k} key={k} onClick={() => {
    playback.reset();
    setParams({ detector: k });
  }}>{k === "dfa" ? "DFA · reward sequence" : "ε-NFA · three email phrases"}</button>)}</div>{location.state?.evidence && <div className="notice"><strong>From email evidence:</strong> “{location.state.evidence.text}” · {location.state.evidence.source} [{location.state.evidence.start_index}, {location.state.evidence.end_index}). {location.state.evidence.isolated ? "This loads only the isolated regex phrase. Acceptance here does not mean the complete email field was accepted." : "This loads the complete original source field."} {input !== location.state.input ? "Input has been edited; this is now an exploratory simulation." : ""} <Link to="/" className="accent">Return to email</Link></div>}<ErrorNotice error={error} /><Panel title="Simulation input"><div className="stack"><div><label htmlFor="sim-input">Whitespace-separated email phrase</label><div className="row"><input className="input mono" style={{ flex: 1 }} id="sim-input" value={input} maxLength={1e4} disabled={loading} onChange={(e) => {
    setInput(e.target.value);
    setResult(null);
    playback.reset();
  }} /><button className="btn primary" disabled={loading || !model} onClick={run}>{loading ? "Computing…" : "Simulate"}</button></div></div><div className="row tiny muted">Try:{["WIN PRIZE NOW", "CLAIM REWARD NOW", "WIN PRIZE", "PRIZE WIN NOW", "WIN PRIZE NOW EXTRA", ""].map((text) => <button className="btn compact" key={text} disabled={loading} onClick={() => {
    setInput(text);
    setResult(null);
    playback.reset();
  }}>{text || "Empty input"}</button>)}</div><p className="tiny muted">Case-insensitive whitespace tokens; punctuation is preserved. Empty input is supported and rejects for these configured languages.</p></div></Panel>{model && <><AutomataGraph model={model} activeStates={frame.active} activeEdges={frame.edges} title={kind === "dfa" ? "DFA · configured reward phrase" : "ε-NFA · parallel active states"} toolbar={result && <StepControls playback={playback} />} /><section className="panel"><div className="panel-body"><div className="tokens">{tokens.length ? tokens.map((t, i) => <span key={i} className={`token ${i < playback.index ? "consumed" : ""} ${i === playback.index ? "current" : ""}`}>{t}</span>) : <span className="tiny muted">{result ? "ε — no input tokens" : "Run a simulation to begin trace playback."}</span>}</div><div className="grid3"><Metric label="Input position">{result ? `${frame.position} / ${tokens.length}` : "—"}</Metric><Metric label={kind === "dfa" ? "Current state" : "Current active-state set"}>{result ? setLabel(frame.active) : setLabel([model.start_state])}</Metric><Metric label="Remaining input">{result ? frame.remaining.join(" ") || "ε" : "—"}</Metric></div>{result && <p className="small" style={{ marginTop: 14 }}>{frame.explanation}</p>}{complete && <div className="notice" style={{ marginTop: 14 }}><strong>{result.accepted ? "Accepted" : "Rejected"} after all input was consumed.</strong> {result.explanation}</div>}{kind === "nfa" && result && <div className="grid3" style={{ marginTop: 14 }}><Metric label="ε-closure before consuming">{setLabel(frame.closureBefore)}</Metric><Metric label="Direct move / initial seed">{setLabel(frame.move)}</Metric><Metric label="ε-closure after move">{setLabel(frame.active)}</Metric></div>}{result && <div className="small muted" style={{ marginTop: 12 }}>Previous: {setLabel(frame.before)} · Consumed: {frame.symbol ?? "ε / start"} · Next token: {frame.remaining[0] || "none"}{result.trace[playback.index + 1] && <div>Next transition: {setLabel(result.trace[playback.index + 1].states_before)} —{result.trace[playback.index + 1].symbol}→ {setLabel(result.trace[playback.index + 1].states_after)}</div>}</div>}</div></section><Panel title="Transition function"><TransitionTable model={model} activeEdges={frame.edges} /></Panel>{result && <Panel><ExecutionTraceView trace={result.trace} isAccepted={result.accepted} currentIndex={playback.index} onSelect={(i) => {
    playback.setPlaying(false);
    playback.setIndex(i);
  }} /></Panel>}</>}</div>;
}
export {
  AutomataLabPage as default
};
