import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth.tsx";
import { Navbar } from "./components/Navbar.tsx";
import { Footer } from "./components/Footer.tsx";

import { LandingPage } from "./pages/LandingPage.tsx";
import { ProblemsFeedPage } from "./pages/ProblemsFeedPage.tsx";
import { ReportProblemPage } from "./pages/ReportProblemPage.tsx";
import { ProblemDetailPage } from "./pages/ProblemDetailPage.tsx";
import { ProjectWorkspacePage } from "./pages/ProjectWorkspacePage.tsx";
import { ImpactDashboardPage } from "./pages/ImpactDashboardPage.tsx";
import { AssistantPage } from "./pages/AssistantPage.tsx";
import { LeaderboardPage } from "./pages/LeaderboardPage.tsx";
import { CSRReportsPage } from "./pages/CSRReportsPage.tsx";
import { CertificateVerificationPage } from "./pages/CertificateVerificationPage.tsx";
import { DashboardPage } from "./pages/DashboardPage.tsx";
import { AdminPage } from "./pages/AdminPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { RegisterPage } from "./pages/RegisterPage.tsx";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500/20 selection:text-emerald-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/problems" element={<ProblemsFeedPage />} />
              <Route
                path="/problems/new"
                element={
                  <ProtectedRoute>
                    <ReportProblemPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/problems/:id" element={<ProblemDetailPage />} />
              <Route path="/projects/:id" element={<ProjectWorkspacePage />} />
              <Route path="/impact" element={<ImpactDashboardPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <CSRReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/certificates/:code" element={<CertificateVerificationPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
