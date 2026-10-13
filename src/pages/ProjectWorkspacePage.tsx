import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Clock, Upload, ShieldCheck, Award, ArrowRight, AlertCircle, FileText, Check, Users } from "lucide-react";
import confetti from "canvas-confetti";
import { apiFetch } from "../lib/api.ts";
import { useAuth } from "../lib/auth.tsx";

export const ProjectWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Proof Upload Modal
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);

  // Complete Project Modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completionResult, setCompletionResult] = useState<any>(null);

  const loadProject = () => {
    if (!id) return;
    setLoading(true);
    apiFetch<any>(`/api/projects/${id}`)
      .then((res) => setProjectData(res))
      .catch((err) => setError(err.message || "Failed to load project."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone || !proofUrl.trim()) return;

    setUploadingProof(true);
    try {
      await apiFetch<any>(`/api/milestones/${selectedMilestone.id}/proofs`, {
        method: "POST",
        body: JSON.stringify({
          milestone_id: selectedMilestone.id,
          file_url: proofUrl.trim(),
          file_type: "image/jpeg",
          note: proofNote.trim(),
        }),
      });
      setSelectedMilestone(null);
      setProofUrl("");
      setProofNote("");
      loadProject();
    } catch (err: any) {
      alert(err.message || "Failed to upload proof.");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleVerifyMilestone = async (milestoneId: string) => {
    try {
      await apiFetch<any>(`/api/milestones/${milestoneId}/verify`, { method: "POST" });
      loadProject();
    } catch (err: any) {
      alert(err.message || "Failed to verify milestone.");
    }
  };

  const handleCompleteProject = async () => {
    setCompleting(true);
    try {
      const res = await apiFetch<any>(`/api/projects/${id}/complete`, {
        method: "POST",
        body: JSON.stringify({
          beneficiaries_count: 1500,
        }),
      });

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setCompletionResult(res);
      setCompleteModalOpen(false);
      loadProject();
    } catch (err: any) {
      alert(err.message || "Failed to complete project.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-slate-500 animate-pulse">Loading project workspace...</div>;
  }

  if (error || !projectData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-900">Project Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">{error}</p>
      </div>
    );
  }

  const { project, milestones, team_members, sponsorships } = projectData;
  const allMilestonesVerified = milestones.length > 0 && milestones.every((m: any) => m.status === "verified");
  const isVerifierOrMentor = user?.can_verify || user?.role === "professor" || user?.role === "admin";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">University Project Workspace</span>
            <span aria-hidden="true">&middot;</span>
            <span className="capitalize font-medium text-sky-700">{project.status}</span>
          </div>

          <Link
            to={`/problems/${project.problem?.id}`}
            className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
          >
            <span>Linked Problem Brief</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {project.problem?.title || "Community Innovation Project"}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Led by <span className="font-semibold text-slate-900">{project.team?.name}</span> &middot; {project.team?.institution}
            </p>
          </div>

          <div>
            {project.status === "completed" ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Project Solved & Certified</span>
              </div>
            ) : (
              <button
                onClick={() => setCompleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Award className="w-4 h-4" />
                <span>Complete Project & Issue Certificate</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Completion Banner if Solved */}
      {project.status === "completed" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-700" />
            <h3 className="text-base font-bold text-emerald-900">Project Successfully Completed</h3>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            {project.impact_summary || "All milestones have been verified with proof of field execution."}
          </p>
          <div className="pt-2 flex items-center gap-4 text-xs font-medium text-emerald-900">
            <span>Estimated Beneficiaries: <b className="font-mono tabular-nums">{project.beneficiaries_count}</b> residents</span>
            <span>&middot;</span>
            <Link
              to="/certificates/CB-2026-IISc-98214"
              className="underline font-semibold hover:text-emerald-950"
            >
              View Verifiable Certificate
            </Link>
          </div>
        </div>
      )}

      {/* Milestones Flow with Proof Requirements */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Project Milestones & Proof-of-Work</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every milestone requires at least one photo, document, or lab test upload before review.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            {milestones.filter((m: any) => m.status === "verified").length} / {milestones.length} Verified
          </div>
        </div>

        <div className="space-y-4">
          {milestones.map((m: any, index: number) => {
            const hasProofs = m.proofs && m.proofs.length > 0;
            const isPending = m.status === "pending";
            const isSubmitted = m.status === "submitted";
            const isVerified = m.status === "verified";

            return (
              <div
                key={m.id}
                className={`border rounded-xl p-5 transition-all ${
                  isVerified
                    ? "border-emerald-200 bg-emerald-50/20"
                    : isSubmitted
                    ? "border-sky-200 bg-sky-50/20"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-xs font-bold">
                      {index + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{m.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status badge */}
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-md">
                        <Check className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : isSubmitted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-800 bg-sky-100/70 px-2.5 py-0.5 rounded-md">
                        <Clock className="w-3.5 h-3.5" /> Proof Submitted
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        Pending Proof
                      </span>
                    )}

                    {/* Upload Proof Button */}
                    {!isVerified && (
                      <button
                        onClick={() => setSelectedMilestone(m)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-2xs"
                      >
                        Upload Proof
                      </button>
                    )}

                    {/* Verifier action */}
                    {isSubmitted && isVerifierOrMentor && (
                      <button
                        onClick={() => handleVerifyMilestone(m.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-2xs"
                      >
                        Sign Off (Verify)
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">{m.description}</p>

                {/* Uploaded proofs listing */}
                {hasProofs && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Attached Proof Artifacts:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.proofs.map((p: any) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700"
                        >
                          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="overflow-hidden flex-1">
                            <span className="font-medium truncate block">{p.note || "Field inspection upload"}</span>
                            <a
                              href={p.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-sky-600 hover:underline truncate block"
                            >
                              View uploaded file
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Proof Upload Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Upload Proof for: {selectedMilestone.title}
            </h3>
            <p className="text-xs text-slate-500">
              Provide verifiable physical or digital evidence (photo URL, lab assay PDF, CAD link, or field report).
            </p>

            <form onSubmit={handleProofSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proof File URL / Attachment Link <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Auditor Proof Description / Note</label>
                <textarea
                  rows={3}
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="e.g. Conducted laboratory spectrometry showing 42% surfactant reduction; photos attached."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMilestone(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-700 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingProof}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  {uploadingProof ? "Submitting..." : "Attach Proof & Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Project Confirmation Modal */}
      {completeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Complete Project & Generate Impact Audit</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Completing this capstone project triggers the AI impact evaluation engine, officially marks the societal problem as Solved, awards the <b>Campus Innovator (PROBLEM_SOLVER)</b> badge, and issues unique cryptographic verification certificates.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCompleteModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-700 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteProject}
                disabled={completing}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                {completing ? "Auditing Impact..." : "Confirm Project Completion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
