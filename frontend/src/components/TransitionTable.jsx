import React from "react";
import { edgesOf } from "../utils/traceModel.js";
import { setLabel } from "./ui.jsx";
function TransitionTable({ model, activeEdges = [] }) {
  const edges = edgesOf(model);
  const symbols = [...edges.some((e) => e.symbol === null) ? [null] : [], ...model.alphabet];
  return <div className="table-wrap"><table><thead><tr><th>State</th>{symbols.map((s) => <th key={s ?? "epsilon"}>{s ?? "ε"}</th>)}</tr></thead><tbody>{model.states.map((state) => <tr key={state}><td className="mono">{state === model.start_state ? "→ " : ""}{state}{model.accepting_states.includes(state) ? " ◎" : ""}</td>{symbols.map((symbol) => {
    const matches = edges.filter((e) => e.source === state && e.symbol === symbol), active = matches.some((e) => activeEdges.includes(e.id));
    return <td key={symbol ?? "epsilon"} style={active ? { background: "var(--active-bg)", color: "var(--active-fg)", fontWeight: 700 } : {}}>{setLabel(matches.map((e) => e.target))}{active ? " ← current" : ""}</td>;
  })}</tr>)}</tbody></table></div>;
}
export {
  TransitionTable as default
};
