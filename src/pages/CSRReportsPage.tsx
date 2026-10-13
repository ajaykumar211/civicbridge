import React, { useEffect, useState } from "react";
import { FileText, Download, Sparkles, Building, Calendar, DollarSign, CheckCircle2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { apiFetch } from "../lib/api.ts";
import { useAuth } from "../lib/auth.tsx";

export const CSRReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [periodStart, setPeriodStart] = useState("2026-01-01");
  const [periodEnd, setPeriodEnd] = useState("2026-03-31");
  const [generating, setGenerating] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);

  const loadReports = () => {
    setLoading(true);
    apiFetch<{ reports: any[] }>("/api/reports")
      .then((res) => {
        setReports(res.reports || []);
        if (res.reports && res.reports.length > 0) {
          setCurrentReport(res.reports[0]);
        }
      })
      .catch((err) => console.error("Error loading reports:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const res = await apiFetch<any>("/api/reports/csr", {
        method: "POST",
        body: JSON.stringify({
          period_start: periodStart,
          period_end: periodEnd,
        }),
      });

      setCurrentReport(res.report);
      setReports([res.report, ...reports]);
    } catch (err: any) {
      alert(err.message || "Failed to generate CSR report.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = (reportToDownload = currentReport) => {
    if (!reportToDownload) return;

    const doc = new jsPDF();
    const content = reportToDownload.content;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("CivicBridge CSR Impact Disclosure", 20, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Official Corporate Social Responsibility & ESG Performance Report`, 20, 32);
    doc.text(`Sponsor Entity: ${content.sponsor_name}`, 20, 38);
    doc.text(`Reporting Period: ${content.period_start} to ${content.period_end}`, 20, 44);

    doc.setLineWidth(0.5);
    doc.line(20, 48, 190, 48);

    // Summary Metrics
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Executive Summary & Capital Allocation", 20, 58);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total Committed Capital: $${Number(content.total_funding).toLocaleString()}`, 20, 66);
    doc.text(`Sponsored Civic Initiatives: ${content.total_problems_sponsored}`, 20, 72);
    doc.text(`Verified Community Beneficiaries: ${Number(content.total_beneficiaries).toLocaleString()}`, 20, 78);

    // AI Narrative
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Audited Impact Narrative", 20, 92);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const splitNarrative = doc.splitTextToSize(reportToDownload.narrative, 170);
    doc.text(splitNarrative, 20, 100);

    // Sponsored Projects Table
    let yPos = 135;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Sponsored Initiatives Breakdown", 20, yPos);
    yPos += 8;

    doc.setFontSize(9);
    content.projects.forEach((p: any, idx: number) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${idx + 1}. ${p.title}`, 20, yPos);
      yPos += 5;
      doc.setFont("helvetica", "normal");
      doc.text(`   Category: ${p.category} | Area: ${p.area_name} | Beneficiaries: ${p.beneficiaries} | Status: ${p.status}`, 20, yPos);
      yPos += 8;
    });

    // Verification Footer
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("Verified by CivicBridge Ground-Truth Verification Protocol. Tamper-evident digital record.", 20, 285);

    doc.save(`CivicBridge_CSR_Report_${content.period_start}_${content.period_end}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Automated CSR Report Generator</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Generate audit-ready corporate sustainability disclosures for statutory filing with verified outcomes and AI-drafted executive narratives.
        </p>
      </div>

      {/* Generator Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
          Generate New Disclosure for Reporting Period
        </h2>

        <form onSubmit={handleGenerateReport} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Period Start</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Period End</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={generating}
              className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{generating ? "Drafting Report..." : "Generate CSR Report"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Report Preview */}
      {currentReport && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                Official ESG Disclosure &middot; Statutory Compliance
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                CSR Performance: {currentReport.content.sponsor_name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Period: {currentReport.content.period_start} to {currentReport.content.period_end}
              </p>
            </div>

            <button
              onClick={() => handleDownloadPDF(currentReport)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </button>
          </div>

          {/* Metric Highlights Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Committed CSR Capital</span>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                ${Number(currentReport.content.total_funding).toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Initiatives Backed</span>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                {currentReport.content.total_problems_sponsored}
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Total Beneficiaries</span>
              <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-0.5">
                {Number(currentReport.content.total_beneficiaries).toLocaleString()}
              </div>
            </div>
          </div>

          {/* AI Narrative Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI-Synthesized Impact Narrative</span>
            </h3>
            <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-lg text-xs text-slate-700 leading-relaxed font-sans">
              {currentReport.narrative}
            </div>
          </div>

          {/* Sponsored Initiatives Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Sponsored Societal Initiatives in Period
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {currentReport.content.projects.map((p: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 block">{p.title}</span>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {p.category} &middot; {p.area_name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-medium text-slate-700 block">
                      {p.beneficiaries.toLocaleString()} beneficiaries
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold capitalize">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
