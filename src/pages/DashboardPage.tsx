import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Plus, FileText, CheckCircle2, ShieldCheck, DollarSign, ArrowRight, User } from "lucide-react";
import { useAuth } from "../lib/auth.tsx";
import { apiFetch } from "../lib/api.ts";
import { ProblemCard, ProblemItem } from "../components/ProblemCard.tsx";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [myProblems, setMyProblems] = useState<ProblemItem[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [sponsorships, setSponsorships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    Promise.all([
      apiFetch<{ problems: ProblemItem[] }>(`/api/problems`),
      apiFetch<{ badges: any[]; certificates: any[] }>("/api/badges/me").catch(() => ({ badges: [], certificates: [] })),
      user.role === "industry"
        ? apiFetch<{ sponsorships: any[] }>("/api/me/sponsorships").catch(() => ({ sponsorships: [] }))
        : Promise.resolve({ sponsorships: [] }),
    ])
      .then(([probRes, badgeRes, sponRes]) => {
        // Filter problems created by user
        const mine = (probRes.problems || []).filter((p: any) => p.created_by === user.id);
        setMyProblems(mine.length > 0 ? mine : (probRes.problems || []).slice(0, 3));
        setBadges(badgeRes.badges || []);
        setCertificates(badgeRes.certificates || []);
        setSponsorships(sponRes.sponsorships || []);
      })
      .catch((err) => console.error("Dashboard error:", err))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-base font-bold text-slate-900">Please Sign In</h2>
        <p className="text-xs text-slate-500 mt-1">Sign in to view your personalized civic dashboard.</p>
        <Link to="/login" className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{user.name}</h1>
            {user.can_verify && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-md border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" /> Accredited Verifier
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Role: <b className="capitalize text-slate-700">{user.role}</b> &middot; {user.organisation || "Individual Member"} &middot; Reputation: <span className="font-mono">{user.reputation}</span> pts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/problems/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Problem</span>
          </Link>
          {user.role === "industry" && (
            <Link
              to="/reports"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>CSR Disclosures</span>
            </Link>
          )}
        </div>
      </div>

      {/* Badges & Recognition */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-500" />
          <span>Earned Civic Recognition Badges</span>
        </h2>

        {badges.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No badges earned yet. Report or verify a problem to earn your first recognition.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {badges.map((b) => (
              <div key={b.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="text-xs font-bold text-slate-900">{b.name}</div>
                <div className="text-[11px] text-slate-500 leading-relaxed">{b.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificates Earned (Students) */}
      {certificates.length > 0 && (
        <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-6 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Verifiable Impact Certificates</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certificates.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-lg border border-emerald-200 text-xs space-y-2">
                <div className="font-bold text-slate-900 text-sm">{c.title}</div>
                <p className="text-slate-600 line-clamp-2">{c.problem_title}</p>
                <div className="pt-2 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-500">{c.code}</span>
                  <Link to={`/certificates/${c.code}`} className="font-semibold text-emerald-700 underline">
                    View & Verify
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Reported / Linked Problems */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Active Societal Problems in Your Radar</h2>
          <Link to="/problems" className="text-xs font-semibold text-emerald-700 hover:underline">
            View all feed
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {myProblems.slice(0, 3).map((prob) => (
            <ProblemCard key={prob.id} problem={prob} />
          ))}
        </div>
      </div>
    </div>
  );
};
