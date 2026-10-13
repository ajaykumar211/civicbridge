import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, TrendingUp, MapPin, Users, Award, Shield, CheckCircle2, ArrowUpRight } from "lucide-react";
import { apiFetch } from "../lib/api.ts";
import { CivicMap, MapMarkerItem } from "../components/CivicMap.tsx";

export const ImpactDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<any>("/api/analytics/summary"),
      apiFetch<{ hotspots: any[] }>("/api/analytics/hotspots"),
      apiFetch<any>("/api/analytics/trends"),
      apiFetch<{ problems: any[] }>("/api/problems?limit=100"),
    ])
      .then(([sumRes, hotRes, trendRes, probRes]) => {
        setSummary(sumRes);
        setHotspots(hotRes.hotspots || []);
        setTrends(trendRes);
        setProblems(probRes.problems || []);
      })
      .catch((err) => console.error("Impact data load error:", err))
      .finally(() => setLoading(false));
  }, []);

  const mapItems: MapMarkerItem[] = problems.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    severity: p.severity,
    status: p.status,
    area_name: p.area_name,
    latitude: Number(p.latitude) || 12.9716,
    longitude: Number(p.longitude) || 77.5946,
    support_count: p.support_count,
  }));

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-xs text-slate-500 animate-pulse">
        Aggregating civic analytics, geographic clusters, and AI trend models...
      </div>
    );
  }

  const aiSummary = trends?.ai_summary;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Public Impact & Hotspots Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">
          Open telemetry tracking problem submissions, university capstones, deployed CSR capital, and community outcomes.
        </p>
      </div>

      {/* Quantitative Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Problems Logged</span>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
            {summary?.total_problems || 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {summary?.open_problems || 0} Open &middot; {summary?.in_progress_problems || 0} In Progress
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Verified Solved</span>
          <div className="text-3xl font-extrabold text-emerald-700 font-mono tabular-nums mt-1">
            {summary?.solved_problems || 0}
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block font-medium">
            Proof-backed completions
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Community Beneficiaries</span>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
            {(summary?.total_beneficiaries || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Direct & indirect residents</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Deployed CSR Capital</span>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
            ${(summary?.total_funding_deployed || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Industry grants to student projects</span>
        </div>
      </div>

      {/* AI Trends Summary Callout */}
      {aiSummary && (
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-emerald-950">{aiSummary.headline}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-emerald-900">
            <div className="space-y-2">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-emerald-800">Key Analytical Insights:</span>
              <ul className="space-y-1.5 list-disc pl-4">
                {aiSummary.insights.map((ins: string, i: number) => (
                  <li key={i}>{ins}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-emerald-800">Emerging Geographic Priorities:</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {aiSummary.rising_areas.map((area: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-900 rounded-md font-semibold text-xs shadow-2xs"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Map View */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Geographical Problem Distribution & Hotspots</h2>
            <p className="text-xs text-slate-500 mt-0.5">Explore problem clusters across wards and municipal zones.</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Critical Hazard</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span> Open Problem</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Solved</span>
          </div>
        </div>

        <CivicMap items={mapItems} height="520px" />
      </div>

      {/* Category Breakdown and Hotspots Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Breakdown by Category</h3>
          <div className="space-y-3">
            {summary?.category_breakdown &&
              Object.entries(summary.category_breakdown).map(([cat, count]: any) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs capitalize text-slate-700">
                    <span className="font-medium">{cat}</span>
                    <span className="font-mono tabular-nums text-slate-500">{count} issues</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (count / summary.total_problems) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Hotspots Area Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Top Municipal Problem Clusters</h3>
          <div className="divide-y divide-slate-100 text-xs">
            {hotspots.slice(0, 7).map((h) => (
              <div key={h.area_name} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">{h.area_name}</span>
                  <span className="text-[11px] text-slate-400">
                    {h.critical_count > 0 ? `${h.critical_count} critical issues` : "Moderate severity"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">{h.count}</span>
                  <span className="text-[11px] text-slate-400 block">{h.solved_count} solved</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
