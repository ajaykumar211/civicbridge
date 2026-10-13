import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ThumbsUp, ShieldCheck, MapPin, CheckCircle2, MessageSquare, Send, Award, DollarSign, ArrowRight, Building, User } from "lucide-react";
import { apiFetch } from "../lib/api.ts";
import { useAuth } from "../lib/auth.tsx";
import { CivicMap } from "../components/CivicMap.tsx";

export const ProblemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [problemData, setProblemData] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Action Modals
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [institution, setInstitution] = useState(user?.organisation || "University Faculty of Engineering");
  const [claiming, setClaiming] = useState(false);

  const [sponsorModalOpen, setSponsorModalOpen] = useState(false);
  const [sponsorType, setSponsorType] = useState<"funding" | "mentorship" | "resources">("funding");
  const [sponsorAmount, setSponsorAmount] = useState<number>(5000);
  const [sponsorNote, setSponsorNote] = useState("");
  const [sponsoring, setSponsoring] = useState(false);

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyNote, setVerifyNote] = useState("");
  const [verifying, setVerifying] = useState(false);

  const loadData = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      apiFetch<any>(`/api/problems/${id}`),
      apiFetch<{ comments: any[] }>(`/api/problems/${id}/comments`),
    ])
      .then(([probRes, comRes]) => {
        setProblemData(probRes);
        setComments(comRes.comments || []);
      })
      .catch((err) => {
        setError(err.message || "Problem not found.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSupportToggle = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!problemData) return;

    try {
      if (problemData.has_supported) {
        const res = await apiFetch<{ count: number }>(`/api/problems/${id}/support`, { method: "DELETE" });
        setProblemData({
          ...problemData,
          has_supported: false,
          problem: { ...problemData.problem, support_count: res.count },
        });
      } else {
        const res = await apiFetch<{ count: number }>(`/api/problems/${id}/support`, { method: "POST" });
        setProblemData({
          ...problemData,
          has_supported: true,
          problem: { ...problemData.problem, support_count: res.count },
        });
      }
    } catch (err) {
      console.error("Support toggle error:", err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    try {
      const res = await apiFetch<any>(`/api/problems/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: commentText.trim() }),
      });
      setComments([...comments, res.comment]);
      setCommentText("");
    } catch (err: any) {
      alert(err.message || "Failed to post comment.");
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaiming(true);
    try {
      const res = await apiFetch<any>(`/api/problems/${id}/claim`, {
        method: "POST",
        body: JSON.stringify({
          team_name: teamName || `${user?.name || "Student"} Innovation Unit`,
          institution,
        }),
      });
      setClaimModalOpen(false);
      navigate(`/projects/${res.project.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to claim problem.");
      setClaiming(false);
    }
  };

  const handleSponsorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSponsoring(true);
    try {
      await apiFetch<any>(`/api/problems/${id}/sponsor`, {
        method: "POST",
        body: JSON.stringify({
          type: sponsorType,
          amount: sponsorType === "funding" ? Number(sponsorAmount) : undefined,
          note: sponsorNote,
        }),
      });
      setSponsorModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to submit sponsorship.");
      setSponsoring(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      await apiFetch<any>(`/api/problems/${id}/verify`, {
        method: "POST",
        body: JSON.stringify({ note: verifyNote }),
      });
      setVerifyModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Ground verification failed.");
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-slate-500 animate-pulse">
        Loading problem brief and live community data...
      </div>
    );
  }

  if (error || !problemData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-900">Problem Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">{error || "This problem may be under moderation or does not exist."}</p>
        <Link to="/problems" className="mt-4 inline-block text-xs font-semibold text-emerald-700">
          Back to Problems Feed
        </Link>
      </div>
    );
  }

  const { problem, has_supported, verifications, sponsorships, project } = problemData;
  const isClaimable = (user?.role === "student" || user?.role === "professor") && problem.status === "open";
  const isSponsorable = user?.role === "industry" || user?.role === "admin";
  const canVerifyThis = (user?.can_verify || user?.role === "admin") && !problem.verified;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header and Title */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        {/* Anti-Slop Zero-Pill Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 capitalize">
            <span className="font-semibold text-slate-800">{problem.category}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{problem.area_name}</span>
            <span aria-hidden="true">&middot;</span>
            <span className="capitalize">{problem.severity} severity</span>
            <span aria-hidden="true">&middot;</span>
            <span className="capitalize">{problem.difficulty || "intermediate"}</span>
          </div>

          {problem.verified ? (
            <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Ground Verified</span>
            </div>
          ) : (
            canVerifyThis && (
              <button
                onClick={() => setVerifyModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-md"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verify Problem (Auditor)</span>
              </button>
            )
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {problem.title}
        </h1>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSupportToggle}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition-colors ${
                has_supported
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${has_supported ? "fill-white" : ""}`} />
              <span className="font-mono tabular-nums">{problem.support_count}</span>
              <span>I face this too</span>
            </button>

            <span className="text-slate-400">
              Reported by {problem.creator?.name || "Citizen"} on {new Date(problem.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {project ? (
              <Link
                to={`/projects/${project.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                <span>View Active Project Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : isClaimable ? (
              <button
                onClick={() => setClaimModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Claim Problem with University Team</span>
              </button>
            ) : null}

            {isSponsorable && (
              <button
                onClick={() => setSponsorModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold border border-emerald-200 rounded-lg transition-colors"
              >
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>Sponsor Initiative (CSR)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Technical Brief & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Brief and Verifications */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Structured Engineering Brief */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              AI Structured Problem Brief
            </h2>
            <div className="text-sm text-slate-800 leading-relaxed font-sans bg-slate-50/60 p-4 rounded-lg border border-slate-100">
              {problem.ai_brief || problem.description}
            </div>

            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-2">
              Original Citizen Testimony
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "{problem.description}"
            </p>
          </div>

          {/* Ground Verifications Audit Log */}
          {verifications && verifications.length > 0 && (
            <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>On-Site Ground Verification Audit Log</span>
              </h3>
              <div className="space-y-2 text-xs">
                {verifications.map((v: any) => (
                  <div key={v.id} className="bg-white p-3 rounded-lg border border-emerald-100 text-slate-700">
                    <div className="flex justify-between font-semibold text-slate-900 mb-1">
                      <span>{v.verifier_name} (Accredited Verifier)</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {new Date(v.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600">{v.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Sponsorships */}
          {sponsorships && sponsorships.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Corporate & NGO Sponsorship Commitments
              </h3>
              <div className="space-y-2 text-xs">
                {sponsorships.map((sp: any) => (
                  <div key={sp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-500" />
                      <div>
                        <span className="font-semibold text-slate-900">{sp.sponsor_org}</span>
                        <span className="text-slate-500 block text-[11px] capitalize">Type: {sp.type} &middot; {sp.status}</span>
                      </div>
                    </div>
                    {sp.amount && (
                      <span className="font-mono tabular-nums font-bold text-emerald-700 text-sm">
                        ${Number(sp.amount).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community Comments */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span>Community Discussion & Field Updates ({comments.length})</span>
            </h3>

            {user ? (
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share ground updates, local context, or academic interest..."
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Post</span>
                </button>
              </form>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg text-center">
                <Link to="/login" className="font-semibold text-emerald-700 underline">Sign in</Link> to post comments or join discussion.
              </div>
            )}

            <div className="space-y-3 pt-2">
              {comments.map((c) => (
                <div key={c.id} className="text-xs border-b border-slate-100 pb-3 last:border-b-0 space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-slate-900 capitalize">{c.user_name} ({c.user_role})</span>
                    <span className="text-[11px]">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Location Map & Spatial Context */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Geographical Location</span>
            </h3>
            <p className="text-xs text-slate-700 font-medium">{problem.address_text || problem.area_name}</p>
            <CivicMap
              items={[
                {
                  id: problem.id,
                  title: problem.title,
                  category: problem.category,
                  severity: problem.severity,
                  status: problem.status,
                  area_name: problem.area_name,
                  latitude: Number(problem.latitude) || 12.9716,
                  longitude: Number(problem.longitude) || 77.5946,
                },
              ]}
              center={[Number(problem.latitude) || 12.9716, Number(problem.longitude) || 77.5946]}
              zoom={13}
              height="240px"
            />
          </div>

          {/* Capstone Team info card if claimed */}
          {project && (
            <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-5 text-xs space-y-2">
              <h4 className="font-bold text-sky-950 uppercase tracking-wider text-[11px]">Active University Project</h4>
              <p className="text-sky-900 font-semibold">{project.team?.name || "Student Team"}</p>
              <p className="text-sky-800">{project.team?.institution || "Engineering College"}</p>
              <div className="pt-2">
                <Link
                  to={`/projects/${project.id}`}
                  className="font-semibold text-sky-700 underline flex items-center gap-1"
                >
                  <span>Open milestone workspace</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Claim Problem Modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Claim Problem for University Capstone</h3>
            <p className="text-xs text-slate-600">
              Your team will receive an AI-drafted 4-to-6 milestone plan. Every completed milestone will require physical or digital proof uploads.
            </p>
            <form onSubmit={handleClaimSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. EcoHydro Tech Labs"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">University / Institution</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. BMS College of Engineering"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-700 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claiming}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  {claiming ? "Generating Plan..." : "Confirm & Start Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sponsor Problem Modal */}
      {sponsorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Sponsor Civic Initiative</h3>
            <p className="text-xs text-slate-600">
              Commit CSR capital, mentorship, or technical resources. All sponsored outcomes feed into your one-click ESG reporting.
            </p>
            <form onSubmit={handleSponsorSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sponsorship Type</label>
                <select
                  value={sponsorType}
                  onChange={(e) => setSponsorType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="funding">Direct Grant Funding ($)</option>
                  <option value="mentorship">Technical Lab Mentorship</option>
                  <option value="resources">Hardware & Equipment Resources</option>
                </select>
              </div>
              {sponsorType === "funding" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grant Amount ($ USD)</label>
                  <input
                    type="number"
                    value={sponsorAmount}
                    onChange={(e) => setSponsorAmount(Number(e.target.value))}
                    min={100}
                    step={100}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CSR Commitment Note</label>
                <textarea
                  rows={3}
                  value={sponsorNote}
                  onChange={(e) => setSponsorNote(e.target.value)}
                  placeholder="e.g. Funding earmarked for prototype bio-enzyme dispersal equipment and sensor buoys."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSponsorModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-700 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sponsoring}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  {sponsoring ? "Submitting..." : "Confirm Sponsorship"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ground Verification Modal */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Accredited Ground Verification</h3>
            <p className="text-xs text-slate-600">
              As an accredited verifier, submit your physical field inspection note to grant the verified badge to this problem.
            </p>
            <form onSubmit={handleVerifySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Auditor Field Note</label>
                <textarea
                  rows={4}
                  value={verifyNote}
                  onChange={(e) => setVerifyNote(e.target.value)}
                  placeholder="e.g. Conducted perimeter walk at 2:00 PM. Verified severe chemical foam and chemical odor affecting 100+ local homes."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-700 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  {verifying ? "Submitting..." : "Grant Verified Badge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
