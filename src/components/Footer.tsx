import React from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-white">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight">CivicBridge</span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Empowering citizens to report real societal challenges, enabling university engineering teams to claim and solve them, and connecting industry CSR funding for verified community outcomes.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Explore</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link to="/problems" className="hover:text-slate-900 transition-colors">Problems Feed</Link></li>
              <li><Link to="/impact" className="hover:text-slate-900 transition-colors">Impact & Hotspots Map</Link></li>
              <li><Link to="/leaderboard" className="hover:text-slate-900 transition-colors">Campus & Sponsor Rankings</Link></li>
              <li><Link to="/assistant" className="hover:text-slate-900 transition-colors">AI Matchmaker</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Platform Governance</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link to="/reports" className="hover:text-slate-900 transition-colors">CSR Compliance Reports</Link></li>
              <li><Link to="/certificates/CB-2026-IISc-98214" className="hover:text-slate-900 transition-colors">Certificate Verification</Link></li>
              <li><span className="text-slate-400">Anti-Spam AI & Ground Audits</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; 2026 CivicBridge Platform. All civic datasets licensed under open public trust.
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-slate-400">Verified Proof-of-Impact Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
