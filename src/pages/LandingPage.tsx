import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Sparkles, Users, Award, Building2, CheckCircle2, ArrowRight } from "lucide-react";
import { apiFetch } from "../lib/api.ts";
import { ProblemCard, ProblemItem } from "../components/ProblemCard.tsx";

export const LandingPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [featuredProblems, setFeaturedProblems] = useState<ProblemItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<any>("/api/analytics/summary"),
      apiFetch<{ problems: ProblemItem[] }>("/api/problems?limit=3&sort=most_supported"),
    ])
      .then(([sumData, probData]) => {
        setSummary(sumData);
        setFeaturedProblems(probData.problems || []);
      })
      .catch((err) => console.error("Landing data load error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI-Assisted Triaging &middot; Real Civic Impact</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto text-balance leading-[1.12]">
            Turn Everyday Societal Problems into Verified Real-World Solutions
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Citizens report real issues by text or voice. AI structures clear engineering briefs. University teams claim and solve them. Industry sponsors fund the work with verifiable proof.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/problems/new"
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all text-center"
            >
              Report a Problem
            </Link>
            <Link
              to="/problems"
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-all text-center"
            >
              Browse Open Challenges
            </Link>
          </div>

          {/* Quantitative Impact Strip (Tabular Figures) */}
          <div className="mt-16 pt-10 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                {summary ? summary.total_problems : "40+"}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Community Issues Raised</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-emerald-700 font-mono tabular-nums">
                {summary ? summary.solved_problems : "6"}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Ground-Verified Solutions</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                {summary ? summary.active_teams : "12"}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">University Capstone Teams</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                ${summary ? summary.total_funding_deployed.toLocaleString() : "20,500"}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Committed CSR Capital</div>
            </div>
          </div>
        </div>
      </section>

      {/* The 3-Pillar Mechanism Walkthrough */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How CivicBridge Connects the Three Pillars
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Replacing fragmented complaints and theoretical classroom exercises with transparent, auditable collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm mb-4">
                01
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Citizens & NGOs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Report acute neighbourhood issues in your mother tongue using text or speech. AI cleans your post into an actionable brief, filters spam, and flags nearby duplicate posts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Real-time status tracking & support</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm mb-4">
                02
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Universities & Labs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Engineering and design students claim real problems instead of fake toy projects. AI drafts a 4-to-6 milestone plan. Every step requires on-site proof uploads.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-600" />
              <span>Verifiable completion certificates</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm mb-4">
                03
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Industry & CSR</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Corporate sustainability teams browse local problem hotspots, deploy funding or technical mentorship, and generate one-click ESG compliance reports.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Auditable beneficiary metrics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Community Issues */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Community Challenges</h2>
            <p className="text-xs text-slate-500 mt-1">High-priority civic issues waiting for university teams or sponsors</p>
          </div>
          <Link
            to="/problems"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            <span>View all 40+ problems</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredProblems.map((prob) => (
            <ProblemCard key={prob.id} problem={prob} />
          ))}
        </div>
      </section>
    </div>
  );
};
