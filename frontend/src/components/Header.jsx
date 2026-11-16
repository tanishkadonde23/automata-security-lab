import React, { useState } from "react";
import { Menu, RefreshCw, Sun, Moon } from "lucide-react";
function Header({ title, onOpenSidebar, isConnected, isChecking, onCheckConnection }) {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || "dark");
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
    setTheme(next);
  }
  return <header className="topbar"><div className="row"><button className="btn compact mobile-only" onClick={onOpenSidebar} aria-label="Open navigation menu"><Menu size={18} /></button><div className="topbar-title"><span>Workspace / </span><strong>{title}</strong></div></div><div className="row"><button className="btn compact" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title="Toggle theme">{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button><button className={`status ${isConnected ? "connected" : ""}`} onClick={onCheckConnection} disabled={isChecking} aria-label="Refresh backend connection status"><span className="dot" />{isChecking ? "Checking backend…" : isConnected ? "Backend: Connected" : "Backend: Offline"}<RefreshCw size={12} /></button></div></header>;
}
export {
  Header as default
};
