import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, ThumbsUp, ArrowRight, ShieldCheck } from "lucide-react";
import { apiFetch } from "../lib/api.ts";
import { useAuth } from "../lib/auth.tsx";

export interface ProblemItem {
  id: string;
  title: string;
  description: string;
  ai_brief?: string;
  category: string;
  severity: string;
  difficulty?: string;
  estimated_weeks?: number;
  area_name: string;
  address_text?: string;
  status: string;
  verified: boolean;
  support_count: number;
  created_at: string;
}

interface ProblemCardProps {
  problem: ProblemItem;
  hasSupportedInitial?: boolean;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({ problem, hasSupportedInitial = false }) => {
  const { user } = useAuth();
  const [supportCount, setSupportCount] = useState(problem.support_count);
  const [hasSupported, setHasSupported] = useState(hasSupportedInitial);
  const [supporting, setSupporting] = useState(false);

  const handleSupportToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    try {
      setSupporting(true);
      if (hasSupported) {
        const res = await apiFetch<{ supported: boolean; count: number }>(`/api/problems/${problem.id}/support`, {
          method: "DELETE",
        });
        setHasSupported(false);
        setSupportCount(res.count);
      } else {
        const res = await apiFetch<{ supported: boolean; count: number }>(`/api/problems/${problem.id}/support`, {
          method: "POST",
        });
        setHasSupported(true);
        setSupportCount(res.count);
      }
    } catch (err) {
      console.error("Support toggle error:", err);
    } finally {
      setSupporting(false);
    }
  };

  const statusLabel =
    problem.status === "solved"
      ? "Solved"
      : problem.status === "in_progress"
      ? "In Progress"
      : problem.status === "pending_review"
      ? "Under Moderation"
      : "Open";

  const statusColor =
    problem.status === "solved"
      ? "text-emerald-700"
      : problem.status === "in_progress"
      ? "text-sky-700"
      : problem.status === "pending_review"
      ? "text-amber-700"
      : "text-slate-700";

  return (
    <div className="group bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 transition-all shadow-xs hover:shadow-sm flex flex-col justify-between">
      <div>
        {/* Anti-Slop Zero-Pill Metadata Line with typographic dots */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
          <div className="flex items-center gap-1.5 capitalize">
            <span className="font-medium text-slate-700">{problem.category}</span>
            <span aria-hidden="true">·</span>
            <span>{problem.area_name}</span>
            <span aria-hidden="true">·</span>
            <span className={`font-medium ${statusColor}`}>{statusLabel}</span>
          </div>

          {problem.verified && (
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ground-Verified</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link to={`/problems/${problem.id}`} className="block group-hover:text-emerald-800 transition-colors">
          <h3 className="text-base font-semibold text-slate-900 leading-snug line-clamp-2 mb-2">
            {problem.title}
          </h3>
        </Link>

        {/* Description / AI Brief */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
          {problem.ai_brief || problem.description}
        </p>
      </div>

      {/* Footer Area with Unboxed Metadata & Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <button
            type="button"
            onClick={handleSupportToggle}
            disabled={supporting}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              hasSupported
                ? "bg-emerald-50 text-emerald-800 font-semibold"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            }`}
            title="I face this issue too"
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${hasSupported ? "fill-emerald-700" : ""}`} />
            <span className="font-mono tabular-nums">{supportCount}</span>
            <span className="hidden sm:inline">Support</span>
          </button>

          {problem.estimated_weeks && (
            <span className="text-slate-400 text-[11px]">
              Est. <span className="font-mono tabular-nums">{problem.estimated_weeks}</span> wks
            </span>
          )}
        </div>

        <Link
          to={`/problems/${problem.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <span>View Brief</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
