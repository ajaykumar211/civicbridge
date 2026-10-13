import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShieldCheck, Award, Download, CheckCircle, ExternalLink } from "lucide-react";
import { jsPDF } from "jspdf";
import { apiFetch } from "../lib/api.ts";

export const CertificateVerificationPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    apiFetch<any>(`/api/certificates/${code}`)
      .then((res) => setCert(res.certificate))
      .catch((err) => setError(err.message || "Certificate code not found."))
      .finally(() => setLoading(false));
  }, [code]);

  const handleDownloadPDF = () => {
    if (!cert) return;

    const doc = new jsPDF({ orientation: "landscape" });

    // Decorative border
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(14, 14, 269, 182);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(15, 23, 42);
    doc.text("CIVICBRIDGE IMPACT CERTIFICATE", 148.5, 45, { align: "center" });

    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("CERTIFICATE OF SOCIETAL INNOVATION & VERIFIED IMPACT", 148.5, 55, { align: "center" });

    doc.setFontSize(11);
    doc.text("This credential certifies that", 148.5, 75, { align: "center" });

    // Recipient Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(5, 150, 105);
    doc.text(cert.user_name.toUpperCase(), 148.5, 90, { align: "center" });

    // Subtext
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text(`of ${cert.institution} with team ${cert.team_name}`, 148.5, 102, { align: "center" });
    doc.text("has successfully engineered, deployed, and verified a field solution for:", 148.5, 110, { align: "center" });

    // Problem Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    const splitTitle = doc.splitTextToSize(`"${cert.problem_title}"`, 240);
    doc.text(splitTitle, 148.5, 122, { align: "center" });

    // Verification Code & Date Footer
    doc.setLineWidth(0.5);
    doc.setDrawColor(203, 213, 225);
    doc.line(40, 160, 100, 160);
    doc.line(197, 160, 257, 160);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CivicBridge Verification", 70, 166, { align: "center" });
    doc.text("University Academic Chair", 227, 166, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Verification Code: ${cert.code} | Issued: ${new Date(cert.issued_at).toLocaleDateString()}`, 148.5, 180, { align: "center" });
    doc.text("Verify online at https://civicbridge.org/certificates/" + cert.code, 148.5, 186, { align: "center" });

    doc.save(`CivicBridge_Certificate_${cert.code}.pdf`);
  };

  if (loading) {
    return <div className="max-w-md mx-auto px-4 py-16 text-center text-xs text-slate-500 animate-pulse">Verifying cryptographic credential...</div>;
  }

  if (error || !cert) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center bg-white border border-slate-200 rounded-xl p-8">
        <h2 className="text-base font-bold text-slate-900">Certificate Verification Failed</h2>
        <p className="text-xs text-slate-500 mt-2">The certificate code "{code}" does not exist in our registry.</p>
        <Link to="/" className="mt-4 inline-block text-xs font-semibold text-emerald-700 underline">
          Return to CivicBridge Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Verification Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 text-emerald-700">
          <ShieldCheck className="w-6 h-6" />
          <span className="text-sm font-bold uppercase tracking-wider">Official Verified Credential</span>
        </div>

        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download PDF Certificate</span>
        </button>
      </div>

      {/* Certificate Card */}
      <div className="bg-white border-2 border-emerald-600/30 rounded-2xl p-8 sm:p-12 shadow-sm text-center space-y-6 relative overflow-hidden">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
          <Award className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            CivicBridge Certificate of Impact
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Certificate of Societal Innovation
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Presented to
          </p>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {cert.user_name}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            {cert.institution} &middot; Team <b>{cert.team_name}</b>
          </div>
        </div>

        <div className="max-w-xl mx-auto py-4 border-y border-slate-100 text-xs text-slate-700 leading-relaxed space-y-2">
          <div>
            For successfully addressing and implementing verified community milestones for:
          </div>
          <div className="font-semibold text-slate-900 text-sm">
            "{cert.problem_title}"
          </div>
          {cert.impact_summary && (
            <p className="text-slate-500 text-[11px] italic pt-1">
              {cert.impact_summary}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-4 gap-4">
          <div>
            Verification Code: <span className="font-mono font-bold text-slate-900">{cert.code}</span>
          </div>
          <div>
            Issued: <span className="text-slate-700 font-medium">{new Date(cert.issued_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
