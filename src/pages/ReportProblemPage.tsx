import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, MapPin, Upload, AlertTriangle, ShieldCheck, CheckCircle2, Copy } from "lucide-react";
import { useAuth } from "../lib/auth.tsx";
import { apiFetch } from "../lib/api.ts";
import { VoiceInputButton } from "../components/VoiceInputButton.tsx";
import { CivicMap } from "../components/CivicMap.tsx";
import { ProblemCategory, ProblemSeverity } from "../../shared/schemas.ts";

const CATEGORIES: ProblemCategory[] = [
  "waste",
  "water",
  "health",
  "agriculture",
  "education",
  "safety",
  "infrastructure",
  "environment",
  "livelihood",
  "other",
];

export const ReportProblemPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProblemCategory>("infrastructure");
  const [addressText, setAddressText] = useState("Bangalore North, Karnataka");
  const [areaName, setAreaName] = useState("Central");
  const [coords, setCoords] = useState<[number, number]>([12.9716, 77.5946]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState("");

  // AI Pipeline State
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [editedBrief, setEditedBrief] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<ProblemSeverity>("medium");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleVoiceTranscript = (text: string) => {
    setDescription((prev) => (prev ? `${prev} ${text}` : text));
  };

  const handleMapLocationSelect = (lat: number, lng: number) => {
    setCoords([lat, lng]);
  };

  const handleAddPhoto = () => {
    if (photoInput.trim()) {
      setPhotoUrls([...photoUrls, photoInput.trim()]);
      setPhotoInput("");
    }
  };

  const handleAnalyzeAI = async () => {
    if (title.length < 10) {
      setFormError("Title must be at least 10 characters long.");
      return;
    }
    if (description.length < 30) {
      setFormError("Description must be at least 30 characters long to provide sufficient detail for AI triaging.");
      return;
    }
    setFormError("");
    setAnalyzingAI(true);

    try {
      const res = await apiFetch<any>("/api/problems/preview-ai", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          category,
          address_text: addressText,
          language: user?.preferred_language || "en",
        }),
      });

      setAiAnalysis(res);
      setEditedBrief(res.ai_brief);
      if (res.category) setCategory(res.category);
      if (res.severity) setSelectedSeverity(res.severity);
    } catch (err: any) {
      setFormError(err.message || "Failed to analyze problem with AI.");
    } finally {
      setAnalyzingAI(false);
    }
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setFormError("Please enter both title and description.");
      return;
    }
    setSubmitting(true);
    setFormError("");

    try {
      const res = await apiFetch<{ problem: any; is_pending_review: boolean }>("/api/problems", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          ai_brief: editedBrief || description,
          category,
          severity: selectedSeverity,
          latitude: coords[0],
          longitude: coords[1],
          address_text: addressText,
          area_name: areaName,
          photo_urls: photoUrls,
          language: user?.preferred_language || "en",
        }),
      });

      if (res.is_pending_review) {
        alert("Your problem report has been submitted! Because our automated integrity checks flagged potential spam or repetition, it is currently in the administrative moderation queue.");
      }
      navigate(`/problems/${res.problem.id}`);
    } catch (err: any) {
      setFormError(err.message || "Submission failed.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Report a Societal Problem</h1>
        <p className="text-xs text-slate-500 mt-1">
          Citizen complaints are structured by AI into technical problem briefs that universities and CSR sponsors can adopt.
        </p>
      </div>

      {formError && (
        <div className="p-3.5 mb-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmitFinal} className="space-y-8">
        {/* Step 1: Input details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            1. Problem Description & Multilingual Voice Input
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Problem Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Heavy chemical runoff and foaming in Bellandur outflow bridge"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">10 to 120 characters</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Detailed Complaint <span className="text-rose-500">*</span>
              </label>
              {/* Web Speech Voice Dictation */}
              <VoiceInputButton onTranscript={handleVoiceTranscript} />
            </div>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is happening, who is impacted, how frequently it occurs, and any hazards. You can also click 'Speak complaint' above to dictate in your local language."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">At least 30 characters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProblemCategory)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none capitalize"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Locality / Ward Area Name</label>
              <input
                type="text"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                placeholder="e.g., Koramangala, Peenya, Whitefield"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Location & Map Pinning */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            2. Geo-Location & Ground Coordinates
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Landmark</label>
            <input
              type="text"
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder="e.g., Near Yamalur Bridge discharge weir, Bellandur Lake"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500 block">
              Click anywhere on the map to pin the exact coordinates:
            </span>
            <div className="text-[11px] font-mono text-slate-500 mb-2">
              Lat: {coords[0].toFixed(4)}, Lng: {coords[1].toFixed(4)}
            </div>
            <CivicMap
              items={[]}
              selectedCoord={coords}
              onSelectLocation={handleMapLocationSelect}
              height="260px"
            />
          </div>
        </div>

        {/* Step 3: Photos */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            3. Photo Evidence
          </h2>

          <div className="flex gap-2">
            <input
              type="url"
              value={photoInput}
              onChange={(e) => setPhotoInput(e.target.value)}
              placeholder="Paste photo URL (or upload field image link)"
              className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddPhoto}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Add Photo
            </button>
          </div>

          {photoUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {photoUrls.map((url, i) => (
                <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                  <img src={url} alt={`Evidence ${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrls(photoUrls.filter((_, idx) => idx !== i))}
                    className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 text-xs transition-opacity"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Structuring & Duplicate Detection Trigger */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>AI Structuring & Integrity Pre-Check</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Always review the AI-synthesized brief and check for near duplicates before publishing.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAnalyzeAI}
              disabled={analyzingAI}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              {analyzingAI ? "Analyzing with Gemini..." : "Generate AI Brief Preview"}
            </button>
          </div>

          {/* AI Analysis Preview Box */}
          {aiAnalysis && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 mt-4 shadow-2xs">
              {/* Spam & Integrity Score Indicator */}
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Integrity Classification:</span>
                  {aiAnalysis.spam_score >= 0.7 ? (
                    <span className="font-semibold text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> High Risk (Admin Moderation Required)
                    </span>
                  ) : (
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Civic Content (Score: {(1 - aiAnalysis.spam_score).toFixed(2)})
                    </span>
                  )}
                </div>

                <div className="text-slate-500">
                  Est. Difficulty: <span className="font-semibold capitalize text-slate-900">{aiAnalysis.difficulty}</span> (
                  <span className="font-mono tabular-nums">{aiAnalysis.estimated_weeks}</span> wks)
                </div>
              </div>

              {/* Similar / Duplicate Problems Alert */}
              {aiAnalysis.similar_problems && aiAnalysis.similar_problems.length > 0 && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs space-y-2">
                  <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5 text-amber-700" />
                    <span>Potential Near-Duplicate Problems Detected:</span>
                  </div>
                  <ul className="space-y-1 text-amber-800">
                    {aiAnalysis.similar_problems.map((dup: any) => (
                      <li key={dup.id} className="flex items-center justify-between">
                        <span>&bull; {dup.title} ({dup.area_name})</span>
                        <a
                          href={`/problems/${dup.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold underline ml-2 hover:text-amber-950"
                        >
                          View existing
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-amber-700">
                    If your issue is the same, supporting the existing post helps concentrate university and industry attention!
                  </p>
                </div>
              )}

              {/* Editable AI Brief */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  AI-Synthesized Engineering Brief (You may edit before submitting):
                </label>
                <textarea
                  rows={4}
                  value={editedBrief}
                  onChange={(e) => setEditedBrief(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-emerald-50/20 border border-emerald-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-500">One-line summary: <i>{aiAnalysis.summary_one_line}</i></span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Severity:</span>
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value as ProblemSeverity)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded px-2 py-1 text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/problems")}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
          >
            {submitting ? "Publishing Problem..." : "Confirm & Submit Problem"}
          </button>
        </div>
      </form>
    </div>
  );
};
