import React, { useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import { useBackendStatus } from "./hooks/useBackendStatus.js";
import { EmailWorkspaceProvider } from "./state/EmailWorkspaceContext.jsx";
const Engine = lazy(() => import("./pages/AutomataLabPage.jsx"));
const Lab = lazy(() => import("./pages/TeachingLabPage.jsx"));
const Theory = lazy(() => import("./pages/TheoryAboutPage.jsx"));
const About = lazy(() => import("./pages/AboutPage.jsx"));
function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const status = useBackendStatus();
  const title = { "/": "Analyze Email", "/engine": "Detection Engine", "/lab": "Automata Lab", "/theory": "Theory & Viva", "/about": "Scope & privacy" }[location.pathname] || "Automata Security Lab";
  return <div className="shell"><a className="skip-link" href="#main">Skip to content</a><Sidebar isOpen={open} onClose={() => setOpen(false)} /><div className="main-shell"><Header title={title} onOpenSidebar={() => setOpen(true)} {...status} onCheckConnection={status.checkConnection} /><main id="main" tabIndex={-1}><Suspense fallback={<div className="skeleton" role="status" aria-label="Opening workspace"><div style={{ height: 90, maxWidth: 620 }} /><div style={{ height: 44, maxWidth: 360 }} /><div style={{ height: 220 }} /><div style={{ height: 420 }} /></div>}><Routes><Route path="/" element={<DashboardPage />} /><Route path="/engine" element={<Engine key={location.key} />} /><Route path="/lab" element={<Lab />} /><Route path="/theory" element={<Theory />} /><Route path="/how-it-works" element={<Navigate to="/theory" replace />} /><Route path="/about" element={<About />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></Suspense></main></div></div>;
}
function App() {
  return <EmailWorkspaceProvider><BrowserRouter><Layout /></BrowserRouter></EmailWorkspaceProvider>;
}
export {
  App as default
};
