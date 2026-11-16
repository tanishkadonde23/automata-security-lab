import React, { useMemo, useEffect, useRef, useState } from "react";
import { ReactFlow, Background, Controls, MarkerType, BaseEdge, EdgeLabelRenderer } from "@xyflow/react";
import AutomataNode from "./AutomataNode.jsx";
import { edgesOf } from "../utils/traceModel.js";
function LoopEdge(props) {
  const { id, sourceX: x, sourceY: y, markerEnd, style, label, data } = props;
  return <><BaseEdge id={id} path={`M ${x} ${y} C ${x + 95} ${y + 105}, ${x - 130} ${y + 105}, ${x - 70} ${y}`} markerEnd={markerEnd} style={style} /><EdgeLabelRenderer><span style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${x - 35}px,${y + 78}px)`, fontSize: 12, fontWeight: data.active ? 700 : 400, color: data.active ? "var(--accent-primary)" : "var(--edge-label)", background: "var(--graph-bg)", padding: "2px 5px" }}>{label}</span></EdgeLabelRenderer></>;
}
function FallbackEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, style, label, data }) {
  const y = data.routeY;
  return <><BaseEdge id={id} path={`M ${sourceX} ${sourceY} L ${sourceX} ${y} L ${targetX} ${y} L ${targetX} ${targetY}`} markerEnd={markerEnd} style={style}/><EdgeLabelRenderer><span style={{position:'absolute',transform:`translate(-50%,-50%) translate(${(sourceX+targetX)/2}px,${y}px)`,fontSize:12,fontWeight:data.active?700:400,color:data.active?'var(--accent-primary)':'var(--edge-label)',background:'var(--graph-bg)',padding:'2px 5px'}}>{label}</span></EdgeLabelRenderer></>;
}
const nodeTypes = { automataNode: AutomataNode }, edgeTypes = { loop: LoopEdge, fallback: FallbackEdge };
function AutomataGraph({ model, nodes: legacyNodes = [], edges: legacyEdges = [], activeStates = [], activeEdges = [], title = "Automaton graph", height, toolbar }) {
  const host = useRef(null);
  const [flow, setFlow] = useState(null);
  // Refit on real container resizes, not on playback; manual zoom stays put.
  useEffect(() => {
    if (!flow || !host.current) return;
    let frame;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => flow.fitView({ padding: .15, minZoom: .5, maxZoom: 1.4 }));
    });
    observer.observe(host.current);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [flow]);
  const graph = useMemo(() => {
    if (!model) return { nodes: legacyNodes, edges: legacyEdges };
    const transitions = edgesOf(model), ranks = /* @__PURE__ */ new Map([[model.start_state, 0]]), queue = [model.start_state];
    while (queue.length) {
      const s = queue.shift();
      for (const e of transitions.filter((e2) => e2.source === s)) {
        if (!ranks.has(e.target)) {
          ranks.set(e.target, ranks.get(s) + 1);
          queue.push(e.target);
        }
      }
    }
    const columns = {};
    const nodes = model.states.map((state, index) => {
      const rank = ranks.get(state) ?? 0;
      const row = columns[rank] || 0;
      columns[rank] = row + 1;
      const isDead = /dead|sink/i.test(state) || (model.automaton_type === "dfa" && !model.accepting_states.includes(state) && model.alphabet.length > 0 && model.alphabet.every(symbol => transitions.some(e => e.source === state && e.symbol === symbol && e.target === state)));
      const position = model.automaton_id === 'dfa_win_prize_now' && isDead ? { x: 390, y: 300 } : { x: 90 + rank * 200, y: 90 + row * 155 };
      return { id: state, type: "automataNode", position, data: { label: state, isStart: state === model.start_state, isAccept: model.accepting_states.includes(state), isDead, isActive: activeStates.includes(state) } };
    });
    const grouped = /* @__PURE__ */ new Map();
    for (const e of transitions) {
      const key = JSON.stringify([e.source, e.target]);
      const g = grouped.get(key) || { source: e.source, target: e.target, labels: [], ids: [], epsilon: true };
      g.labels.push(e.label);
      g.ids.push(e.id);
      g.epsilon = g.epsilon && e.symbol === null;
      grouped.set(key, g);
    }
    const edges = [...grouped.entries()].map(([id, e]) => {
      const active = e.ids.some((id2) => activeEdges.includes(id2));
      const fallback = model.automaton_id === 'dfa_win_prize_now' && e.target === 'q_dead' && e.source !== e.target;
      const label = model.automaton_type === 'dfa' && e.labels.length === model.alphabet.length ? 'Σ' : e.labels.join(' | ');
      return { id, source: e.source, target: e.target, sourceHandle:fallback?'bottom':undefined, targetHandle:fallback?'top':undefined, label, type: e.source === e.target ? "loop" : fallback?'fallback':"smoothstep", data: { active,routeY:185+model.states.indexOf(e.source)*30 }, markerEnd: { type: MarkerType.ArrowClosed, color: active ? "var(--accent-primary)" : "var(--edge)" }, style: { stroke: active ? "var(--accent-primary)" : e.epsilon ? "var(--accent-secondary)" : "var(--edge)", strokeWidth: active ? 3.5 : 1.4, strokeDasharray: e.epsilon ? "5 4" : void 0 }, labelStyle: { fill: active ? "var(--accent-primary)" : "var(--edge-label)", fontSize: 12, fontWeight: active ? 700 : 400 }, labelBgStyle: { fill: "var(--graph-bg)", fillOpacity: 1 }, labelBgPadding: [5, 3] };
    });
    return { nodes, edges };
  }, [model, legacyNodes, legacyEdges, activeStates, activeEdges]);
  return <section className="panel" aria-label={title}><div className="panel-head"><h2>{title}</h2><span className="tiny muted">→ start · ◎ accept · ε move · Σ alphabet · thick ring = active</span></div>{toolbar}<div ref={host} className="graph" style={{ height }}><ReactFlow onInit={setFlow} key={model?.states.join(",") || title} nodes={graph.nodes} edges={graph.edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={{ padding: 0.15, minZoom: .5, maxZoom: 1.4 }} minZoom={0.15} maxZoom={2} nodesConnectable={false} nodesDraggable={false} colorMode={document.documentElement.dataset.theme === "light" ? "light" : "dark"}><Background color="var(--border-color)" gap={24} /><Controls showInteractive={false} /></ReactFlow></div><div className="tiny muted" style={{ padding: "8px 16px" }}>Pan to explore · zoom and fit controls affect the view only. The table below provides a text alternative.</div></section>;
}
export {
  AutomataGraph as default
};


