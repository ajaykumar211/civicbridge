import React, { useEffect, useState } from "react";
import { Shield, AlertTriangle, CheckCircle2, XCircle, Copy, Users } from "lucide-react";
import { apiFetch } from "../lib/api.ts";
import { useAuth } from "../lib/auth.tsx";

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<{ pending_review: any[]; rejected: any[] }>({ pending_review: [], rejected: [] });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"moderation" | "verifiers">("moderation");
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      apiFetch<any>("/api/admin/queue"),
      apiFetch<{ users: any[] }>("/api/admin/users"),
    ])
      .then(([qRes, uRes]) => {
        setQueue(qRes);
        setUsersList(uRes.users || []);
      })
      .catch((err) => console.error("Admin load error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleModerate = async (problemId: string, action: "approve" | "reject") => {
    try {
      await apiFetch<any>(`/api/admin/problems/${problemId}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to moderate problem.");
    }
  };

  const handleToggleVerifier = async (userId: string, currentStatus: boolean) => {
    try {
      await apiFetch<any>(`/api/admin/users/${userId}/verifier`, {
        method: "PATCH",
        body: JSON.stringify({ can_verify: !currentStatus }),
      });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update verifier rights.");
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-base font-bold text-slate-900">Administrator Access Required</h2>
        <p className="text-xs text-slate-500 mt-1">Please use the Demo Role Switcher in the top right to switch to the Admin role.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-rose-600" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Administration & Moderation</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Review posts flagged by the AI spam classifier, merge duplicates, and grant on-site verifier credentials.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-slate-100 p-1 rounded-lg w-fit text-xs font-semibold">
        <button
          onClick={() => setActiveTab("moderation")}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "moderation" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Moderation Queue ({queue.pending_review.length})
        </button>
        <button
          onClick={() => setActiveTab("verifiers")}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === "verifiers" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Verifier Rights Management
        </button>
      </div>

      {activeTab === "moderation" ? (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Pending Review Items (Flagged by AI Spam/Repetition Filter)
            </h2>

            {queue.pending_review.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                The moderation queue is currently clear. All incoming submissions passed integrity checks.
              </p>
            ) : (
              <div className="space-y-4">
                {queue.pending_review.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/20 text-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                      </div>
                      <span className="font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                        Spam Score: {item.spam_score}
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed font-sans">{item.description}</p>

                    {item.spam_flags && item.spam_flags.length > 0 && (
                      <div className="flex items-center gap-2 text-[11px] text-rose-800">
                        <span className="font-semibold">Flags:</span>
                        <div className="flex gap-1">
                          {item.spam_flags.map((flag: string) => (
                            <span key={flag} className="bg-rose-100 px-2 py-0.5 rounded uppercase font-mono text-[10px]">
                              {flag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-rose-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleModerate(item.id, "reject")}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject Post</span>
                      </button>
                      <button
                        onClick={() => handleModerate(item.id, "approve")}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & Publish to Open</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Grant On-Site Verifier Rights (can_verify)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accredited NGOs, engineering professors, and verified field agents carry the can_verify flag to audit problems and milestone proofs.
            </p>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4 text-center">Verifier Credential</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 text-slate-500">{u.email}</td>
                  <td className="py-3 px-4 capitalize">{u.role}</td>
                  <td className="py-3 px-4 text-slate-500">{u.organisation || "—"}</td>
                  <td className="py-3 px-4 text-center">
                    {u.can_verify ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        Accredited
                      </span>
                    ) : (
                      <span className="text-slate-400">Standard</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleVerifier(u.id, u.can_verify)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                        u.can_verify
                          ? "bg-slate-100 text-rose-700 hover:bg-rose-50"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
                      }`}
                    >
                      {u.can_verify ? "Revoke Rights" : "Grant Verifier"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
