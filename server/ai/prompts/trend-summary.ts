import { callGeminiJson } from "../gemini.ts";
import { trendSummaryOutputSchema, TrendSummaryOutput } from "../../../shared/schemas.ts";

export async function trendSummaryPrompt(data: {
  current_period: {
    total: number;
    by_category: Record<string, number>;
    by_area: Record<string, number>;
  };
  previous_period: {
    total: number;
    by_category: Record<string, number>;
    by_area: Record<string, number>;
  };
}): Promise<TrendSummaryOutput> {
  const system = `You are CivicBridge Senior Civic Data Analyst.
Analyze problem submission and resolution trends across geographical areas and categories between the two periods provided.
Rules:
1. Generate an informative, executive-ready headline.
2. Provide 3-4 bullet insights highlighting key surges, emerging hot categories, and solved improvements.
3. List rising_areas that require university intervention or CSR sponsorship.
4. Base all statements strictly on the numeric data provided.
5. Return JSON matching:
{
  "headline": string,
  "insights": string[],
  "rising_areas": string[]
}`;

  const input = JSON.stringify(data);

  const topCategories = Object.entries(data.current_period.by_category)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  const topAreas = Object.entries(data.current_period.by_area)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([area]) => area);

  const fallback: TrendSummaryOutput = {
    headline: `Civic Activity Report: ${data.current_period.total} Total Issues Recorded with Surge in ${topCategories[0] || "Infrastructure"}`,
    insights: [
      `Leading issue category is ${topCategories.join(", ") || "General infrastructure"}.`,
      `Geographic activity is highest across ${topAreas.join(", ") || "Metro wards"}.`,
      `Community participation has grown compared to the baseline period with active team formations.`,
    ],
    rising_areas: topAreas.length > 0 ? topAreas : ["Central Ward", "Industrial Cluster"],
  };

  return callGeminiJson<TrendSummaryOutput>({
    promptName: "trend-summary",
    system,
    input,
    zodSchema: trendSummaryOutputSchema,
    fallback,
  });
}
