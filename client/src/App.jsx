import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { useState, useEffect, useRef } from "react";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import IssuesPage from "./pages/IssuesPage";
import InboxPage from "./pages/InboxPage";
import MyIssuesPage from "./pages/MyIssuesPage";
import MembersPage from "./pages/MembersPage";
import CreateIssuePage from "./pages/CreateIssuePage";
import EditIssuePage from "./pages/EditIssuePage";
import IssueDetailPage from "./pages/IssueDetailPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ViewsPage from "./pages/ViewsPage";
import ViewDetailPage from "./pages/ViewDetailPage";
import NotFoundPage from "./pages/NotFoundPage";

// hidden sequence listener
const _k = ["/oscar", "\\oscar"];
function useSeq(cb) {
  const buf = useRef("");
  useEffect(() => {
    const h = (e) => {
      if (e.key.length !== 1) return;
      buf.current = (buf.current + e.key).slice(-8).toLowerCase();
      if (_k.some((s) => buf.current.endsWith(s))) { buf.current = ""; cb(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [cb]);
}

function App() {
  const [_p, _sp] = useState(false);
  useSeq(() => _sp(true));
  useEffect(() => { if (_p) { const t = setTimeout(() => _sp(false), 3000); return () => clearTimeout(t); } }, [_p]);

  return (
    <BrowserRouter>
      <DataProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inbox"
              element={
                <ProtectedRoute>
                  <InboxPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-issues"
              element={
                <ProtectedRoute>
                  <MyIssuesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/members"
              element={
                <ProtectedRoute>
                  <MembersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/issues"
              element={
                <ProtectedRoute>
                  <IssuesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/issues/new"
              element={
                <ProtectedRoute>
                  <CreateIssuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/issues/:id"
              element={
                <ProtectedRoute>
                  <IssueDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/issues/:id/edit"
              element={
                <ProtectedRoute>
                  <EditIssuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <ProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <ProjectDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/views"
              element={
                <ProtectedRoute>
                  <ViewsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/views/:id"
              element={
                <ProtectedRoute>
                  <ViewDetailPage />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/inbox" replace />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <div style={{position:"fixed",bottom:"20px",right:"20px",color:"var(--color-text-subtle,#52525c)",fontSize:"10px",userSelect:"none",pointerEvents:"none",opacity:0.3,zIndex:9999}}>
            
          </div>

          {_p && (
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10000,backdropFilter:"blur(4px)"}} onClick={() => _sp(false)}>
              <div style={{background:"var(--color-surface,#1e1e23)",border:"1px solid var(--color-border,#2e2e34)",borderRadius:"8px",padding:"28px 36px",textAlign:"center",boxShadow:"0 12px 32px rgba(0,0,0,0.5)"}} onClick={e => e.stopPropagation()}>
                <p style={{margin:0,color:"var(--color-text,#e4e4e8)",fontSize:"16px",fontWeight:500,fontFamily:"Inter,sans-serif"}}>Developed By Oscar 2026</p>
              </div>
            </div>
          )}
        </AuthProvider>
      </DataProvider>
    </BrowserRouter>
  );
}

export default App;
