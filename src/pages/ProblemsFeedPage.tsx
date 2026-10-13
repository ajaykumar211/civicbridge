import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, MapPin, LayoutGrid, Map as MapIcon, Plus, CheckCircle, ShieldCheck } from "lucide-react";
import { apiFetch } from "../lib/api.ts";
import { ProblemCard, ProblemItem } from "../components/ProblemCard.tsx";
import { CivicMap, MapMarkerItem } from "../components/CivicMap.tsx";

const CATEGORIES = [
  "all",
  "water",
  "waste",
  "health",
  "agriculture",
  "education",
  "safety",
  "infrastructure",
  "environment",
  "livelihood",
];

export const ProblemsFeedPage: React.FC = () => {
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const loadProblems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (selectedSeverity !== "all") params.set("severity", selectedSeverity);
    if (verifiedOnly) params.set("verified", "true");
    params.set("sort", sortBy);

    apiFetch<{ problems: ProblemItem[]; total: number }>(`/api/problems?${params.toString()}`)
      .then((res) => {
        setProblems(res.problems || []);
      })
      .catch((err) => console.error("Error fetching problems:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProblems();
  }, [selectedCategory, selectedStatus, selectedSeverity, verifiedOnly, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProblems();
  };

  const mapItems: MapMarkerItem[] = problems.map((p: any) => ({
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Societal Problems Feed</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real civic challenges reported by citizens, ready for academic innovation & industry sponsorship.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Grid feed view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === "map" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Interactive map view"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>

          <Link
            to="/problems/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Problem</span>
          </Link>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        {/* Search Input Row */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keywords, location (e.g., Peenya, Bellandur, water, roads)..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        {/* Category Tabs (Interactive buttons with active states, per Skill section 1A) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100/70 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sub-Filters: Status, Severity, Verified, Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-2 py-1 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="solved">Solved</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Severity:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-2 py-1 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Only
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-2 py-1 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="most_supported">Most Supported</option>
              <option value="severity">Highest Severity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main View: Grid vs Map */}
      {viewMode === "map" ? (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Displaying {problems.length} geo-tagged problems on the map</span>
            <span className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span> Critical</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span> Open</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span> Solved</span>
            </span>
          </div>
          <CivicMap items={mapItems} height="560px" />
        </div>
      ) : (
        <div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white border border-slate-200 rounded-xl p-5 h-48 animate-pulse">
                  <div className="h-3 bg-slate-100 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2 mb-4"></div>
                  <div className="h-12 bg-slate-50 rounded mb-4"></div>
                </div>
              ))}
            </div>
          ) : problems.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-xl p-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">No matching societal issues found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try widening your category or location filters, or be the first citizen to report this problem in your area.
              </p>
              <Link
                to="/problems/new"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Report This Problem</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {problems.map((prob) => (
                <ProblemCard key={prob.id} problem={prob} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
