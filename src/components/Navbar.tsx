import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.tsx";
import { Shield, Bell, User as UserIcon, PlusCircle, CheckCircle2, ChevronDown, LogOut } from "lucide-react";
import { UserRole } from "../../shared/schemas.ts";

export const Navbar: React.FC = () => {
  const { user, logout, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const demoRoles: Array<{ role: UserRole; label: string; desc: string }> = [
    { role: "citizen", label: "Citizen", desc: "Report & support problems" },
    { role: "student", label: "Student", desc: "Claim problems & build projects" },
    { role: "professor", label: "Professor", desc: "Mentor capstone student teams" },
    { role: "industry", label: "Industry CSR", desc: "Sponsor projects & generate CSR reports" },
    { role: "government", label: "Government", desc: "View regional civic dashboards" },
    { role: "admin", label: "Admin", desc: "Moderate feed & grant verifiers" },
  ];

  const handleRoleSwitch = async (r: UserRole) => {
    setRoleMenuOpen(false);
    await switchDemoRole(r);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element, whitespace-nowrap shrink-0) */}
        <Link to="/" className="flex items-center gap-2 whitespace-nowrap shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
            CivicBridge
          </span>
        </Link>

        {/* Zone 2: 4-5 Clean Nav Links (whitespace-nowrap shrink-0) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link to="/problems" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Problems Feed
          </Link>
          <Link to="/impact" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Impact & Map
          </Link>
          <Link to="/assistant" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Matchmaker AI
          </Link>
          <Link to="/leaderboard" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Leaderboard
          </Link>
          {user?.role === "industry" && (
            <Link to="/reports" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              CSR Reports
            </Link>
          )}
          {user?.role === "admin" && (
            <Link to="/admin" className="hover:text-slate-900 text-rose-600 transition-colors whitespace-nowrap shrink-0">
              Admin Moderation
            </Link>
          )}
        </nav>

        {/* Zone 3: Primary Actions & User Role Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Demo Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
              title="Switch demo persona for testing"
            >
              <span className="text-slate-500">Role:</span>
              <span className="font-semibold capitalize text-emerald-800">{user ? user.role : "Guest"}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
                <div className="px-3 py-1.5 font-medium text-slate-400 uppercase tracking-wider text-[10px]">
                  Switch Demo Account
                </div>
                {demoRoles.map((d) => (
                  <button
                    key={d.role}
                    onClick={() => handleRoleSwitch(d.role)}
                    className={`w-full text-left px-3 py-2 flex flex-col hover:bg-slate-50 transition-colors ${
                      user?.role === d.role ? "bg-emerald-50/70 text-emerald-950 font-semibold" : "text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="capitalize">{d.label}</span>
                      {user?.role === d.role && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal">{d.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <>
              <Link
                to="/problems/new"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Report Problem</span>
              </Link>

              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="My Dashboard"
              >
                <UserIcon className="w-4 h-4" />
              </Link>

              <button
                onClick={() => logout().then(() => navigate("/"))}
                className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
