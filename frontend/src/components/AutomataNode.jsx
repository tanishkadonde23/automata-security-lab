import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
function AutomataNode({ data }) {
  const { label, isStart, isAccept, isDead, isActive } = data;
  return <div className={`automata-state ${isAccept ? "accept" : ""} ${isActive ? "active" : ""} ${isDead ? "dead" : ""}`} aria-label={`${label}${isStart ? ", start" : ""}${isAccept ? ", accepting" : ""}${isActive ? ", active" : ""}${isDead ? ", dead state" : ""}`}><Handle type="target" position={Position.Left} /><Handle type="source" position={Position.Right} /><Handle type="source" id="bottom" position={Position.Bottom}/><Handle type="target" id="top" position={Position.Top}/>{isStart && <span className="state-start">start →</span>}<span>{label}</span><small>{isActive ? "ACTIVE" : isDead ? "DEAD" : isAccept ? "ACCEPT" : ""}</small></div>;
}
var stdin_default = memo(AutomataNode);
export {
  stdin_default as default
};
