import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";
import { useAuth } from "../lib/auth.tsx";
import { UserRole } from "../../shared/schemas.ts";

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts: Array<{ role: UserRole; email: string; label: string; desc: string }> = [
    { role: "citizen", email: "resident@civicbridge.org", label: "Resident Citizen", desc: "Report & support civic complaints" },
    { role: "student", email: "student@mit.edu", label: "University Student", desc: "Claim problems, earn badges & certificates" },
    { role: "professor", email: "prof.sharma@iisc.ac.in", label: "Academic Professor", desc: "Mentor capstone student engineering teams" },
    { role: "industry", email: "csr@tcs-foundation.org", label: "Industry CSR Sponsor", desc: "Sponsor projects & generate CSR disclosures" },
    { role: "government", email: "ward.officer@bbmp.gov.in", label: "Municipal Officer", desc: "Review area hotspots & ward analytics" },
    { role: "admin", email: "admin@civicbridge.org", label: "Platform Administrator", desc: "Review moderation queue & grant verifier rights" },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
          <Shield className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to CivicBridge</h1>
        <p className="text-xs text-slate-500">Access your crowdsourced civic challenges, capstone projects, or CSR reports.</p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* 1-Click Demo Login Personas */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Fast-Track Testing (1-Click Persona Sign-In):
        </span>
        <div className="grid grid-cols-2 gap-2">
          {demoAccounts.map((d) => (
            <button
              key={d.role}
              type="button"
              onClick={async () => {
                await switchDemoRole(d.role);
                navigate("/dashboard");
              }}
              className="text-left p-2.5 bg-white hover:bg-emerald-50/50 border border-slate-200 rounded-lg text-xs transition-colors shadow-2xs group"
            >
              <span className="font-semibold text-slate-900 block group-hover:text-emerald-800">{d.label}</span>
              <span className="text-[10px] text-slate-400 block line-clamp-1">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
        <span className="relative bg-slate-50 px-3 text-xs text-slate-400">or sign in with credentials</span>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="resident@civicbridge.org"
            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="text-center text-xs text-slate-500">
        Don't have an account yet?{" "}
        <Link to="/register" className="font-semibold text-emerald-700 underline">
          Sign up with your community role
        </Link>
      </div>
    </div>
  );
};
