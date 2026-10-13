import { callGeminiJson } from "../gemini.ts";
import { csrNarrativeOutputSchema, CsrNarrativeOutput } from "../../../shared/schemas.ts";

export async function csrNarrativePrompt(data: {
  sponsor_name: string;
  period_start: string;
  period_end: string;
  total_funding: number;
  total_problems_sponsored: number;
  total_beneficiaries: number;
  projects: Array<{
    title: string;
    category: string;
    area_name: string;
    status: string;
    beneficiaries: number;
    impact_summary?: string;
  }>;
}): Promise<CsrNarrativeOutput> {
  const system = `You are CivicBridge Senior ESG & Corporate Social Responsibility (CSR) Compliance Director.
Draft an audit-ready CSR impact narrative for the sponsor for their official sustainability disclosure.
CRITICAL INTEGRITY RULES:
1. Use ONLY the figures and details provided in the input: total funding ($${data.total_funding}), total problems sponsored (${data.total_problems_sponsored}), and total beneficiaries (${data.total_beneficiaries}).
2. NEVER hallucinate or exaggerate beneficiary counts or funding numbers.
3. Formulate an executive_summary (approx 100 words), 3-5 highlights, and a conclusive outcome_statement.
4. Return JSON matching:
{
  "executive_summary": string,
  "highlights": string[],
  "outcome_statement": string
}`;

  const input = JSON.stringify(data);

  const fallback: CsrNarrativeOutput = {
    executive_summary: `${data.sponsor_name} contributed $${data.total_funding.toLocaleString()} in CSR commitments between ${data.period_start} and ${data.period_end}, backing ${data.total_problems_sponsored} civic initiatives that directly served an estimated ${data.total_beneficiaries.toLocaleString()} community beneficiaries in partnership with university teams.`,
    highlights: data.projects.map(
      (p) => `${p.title} (${p.category} in ${p.area_name}): reached ${p.beneficiaries} residents with ${p.status} execution status.`
    ),
    outcome_statement: `Every dollar deployed through CivicBridge was verified with on-site proof and academic mentorship, fulfilling statutory CSR and ESG governance mandates.`,
  };

  return callGeminiJson<CsrNarrativeOutput>({
    promptName: "csr-narrative",
    system,
    input,
    zodSchema: csrNarrativeOutputSchema,
    fallback,
  });
}
