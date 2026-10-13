import React, { useEffect, useState } from "react";
import { Trophy, Award, Building2, Users } from "lucide-react";
import { apiFetch } from "../lib/api.ts";

export const LeaderboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"teams" | "universities" | "sponsors">("teams");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<{ leaderboards: any[] }>(`/api/leaderboards/${activeTab}`)
      .then((res) => setData(res.leaderboards || []))
      .catch((err) => console.error("Leaderboard load error:", err))
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Recognition & Leaderboards</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Honouring student teams, academic faculties, and corporate champions driving verified societal change.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-slate-100 p-1 rounded-lg w-fit text-xs font-semibold">
        <button
          onClick={() => setActiveTab("teams")}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "teams" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          University Student Teams
        </button>
        <button
          onClick={() => setActiveTab("universities")}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "universities" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Colleges & Institutions
        </button>
        <button
          onClick={() => setActiveTab("sponsors")}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "sponsors" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          CSR & Industry Sponsors
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading ranking metrics...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">Rank</th>
                  <th className="py-3.5 px-4">Entity</th>
                  {activeTab === "teams" && (
                    <>
                      <th className="py-3.5 px-4">Institution</th>
                      <th className="py-3.5 px-4 text-center">Solved Issues</th>
                      <th className="py-3.5 px-4 text-center">Beneficiaries</th>
                      <th className="py-3.5 px-4 text-right">Impact Score</th>
                    </>
                  )}
                  {activeTab === "universities" && (
                    <>
                      <th className="py-3.5 px-4 text-center">Active Teams</th>
                      <th className="py-3.5 px-4 text-center">Solved Issues</th>
                      <th className="py-3.5 px-4 text-right">Beneficiaries Reached</th>
                    </>
                  )}
                  {activeTab === "sponsors" && (
                    <>
                      <th className="py-3.5 px-4">Organization</th>
                      <th className="py-3.5 px-4 text-center">Initiatives Sponsored</th>
                      <th className="py-3.5 px-4 text-right">Total Committed ($)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-center text-slate-900 tabular-nums">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.name || item.institution || item.org}
                    </td>

                    {activeTab === "teams" && (
                      <>
                        <td className="py-3 px-4 text-slate-500">{item.institution}</td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums">{item.solved_count}</td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums">
                          {item.total_beneficiaries.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums">
                          {item.points} pts
                        </td>
                      </>
                    )}

                    {activeTab === "universities" && (
                      <>
                        <td className="py-3 px-4 text-center font-mono tabular-nums">{item.teams_count}</td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums">{item.solved_count}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums">
                          {item.beneficiaries.toLocaleString()}
                        </td>
                      </>
                    )}

                    {activeTab === "sponsors" && (
                      <>
                        <td className="py-3 px-4 text-slate-500">{item.org}</td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums">{item.sponsored_count}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums">
                          ${item.total_amount.toLocaleString()}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
