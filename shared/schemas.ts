import { z } from "zod";

// User roles
export const userRoleEnum = z.enum([
  "citizen",
  "student",
  "professor",
  "industry",
  "government",
  "admin",
]);
export type UserRole = z.infer<typeof userRoleEnum>;

export const allowedSelfServiceRoles = z.enum([
  "citizen",
  "student",
  "professor",
  "industry",
  "government",
]);

// Auth Schemas
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: allowedSelfServiceRoles,
  organisation: z.string().max(120).optional().default(""),
  skills: z.array(z.string()).optional().default([]),
  location: z.string().max(100).optional().default(""),
  preferred_language: z.string().optional().default("en"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Problem Enums
export const problemCategoryEnum = z.enum([
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
]);
export type ProblemCategory = z.infer<typeof problemCategoryEnum>;

export const problemSeverityEnum = z.enum(["low", "medium", "high", "critical"]);
export type ProblemSeverity = z.infer<typeof problemSeverityEnum>;

export const problemDifficultyEnum = z.enum(["beginner", "intermediate", "advanced"]);
export type ProblemDifficulty = z.infer<typeof problemDifficultyEnum>;

export const problemStatusEnum = z.enum([
  "pending_review",
  "open",
  "in_progress",
  "solved",
  "rejected",
]);
export type ProblemStatus = z.infer<typeof problemStatusEnum>;

// Problem Creation Schema
export const createProblemSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(120, "Title cannot exceed 120 characters"),
  description: z
    .string()
    .min(30, "Description must be at least 30 characters")
    .max(3000, "Description cannot exceed 3000 characters"),
  category: problemCategoryEnum.default("other"),
  severity: problemSeverityEnum.optional().default("medium"),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  address_text: z.string().max(300).optional().default(""),
  area_name: z.string().max(120).optional().default(""),
  language: z.string().max(10).optional().default("en"),
  photo_urls: z.array(z.string()).optional().default([]),
  // Optional pre-reviewed AI brief if citizen edited it
  ai_brief: z.string().max(1000).optional(),
});
export type CreateProblemInput = z.infer<typeof createProblemSchema>;

// Comment Schema
export const commentSchema = z.object({
  body: z.string().min(2, "Comment must not be empty").max(1000, "Comment cannot exceed 1000 characters"),
});
export type CommentInput = z.infer<typeof commentSchema>;

// Verification Schema
export const verificationSchema = z.object({
  note: z.string().max(500).optional().default(""),
});

// Team Creation Schema
export const createTeamSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters").max(100),
  institution: z.string().min(2, "Institution is required").max(120),
});

export const addTeamMemberSchema = z.object({
  user_id: z.string().uuid(),
  member_role: z.enum(["lead", "member", "mentor"]).default("member"),
});

// Claim Problem Schema
export const claimProblemSchema = z.object({
  team_name: z.string().min(3).max(100).optional(),
  institution: z.string().min(2).max(120).optional(),
  team_id: z.string().uuid().optional(),
  custom_milestones: z
    .array(
      z.object({
        title: z.string().min(3).max(120),
        description: z.string().min(10).max(500),
        week: z.number().min(1).max(52).optional(),
      })
    )
    .optional(),
});

// Milestone Schema
export const milestoneSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(500),
  due_date: z.string().optional().nullable(),
  order_index: z.number().int().optional().default(0),
});

// Proof Schema
export const proofSchema = z.object({
  milestone_id: z.string().uuid(),
  note: z.string().max(500).optional().default(""),
  file_url: z.string().min(1, "File URL or attachment is required"),
  file_type: z.string().default("image/png"),
});

// Sponsorship Schema
export const sponsorSchema = z.object({
  type: z.enum(["funding", "mentorship", "resources"]),
  amount: z
    .number()
    .positive("Funding amount must be greater than 0")
    .optional()
    .nullable(),
  note: z.string().max(500).optional().default(""),
}).refine(
  (data) => {
    if (data.type === "funding") {
      return data.amount !== undefined && data.amount !== null && data.amount > 0;
    }
    return true;
  },
  {
    message: "Amount is required for funding sponsorship",
    path: ["amount"],
  }
);
export type SponsorInput = z.infer<typeof sponsorSchema>;

// CSR Report Schema
export const reportRequestSchema = z.object({
  period_start: z.string(),
  period_end: z.string(),
}).refine(
  (data) => new Date(data.period_start) <= new Date(data.period_end),
  {
    message: "Period start date must be before or equal to period end date",
    path: ["period_start"],
  }
);

// AI Schemas (Section 14 & 15)
export const structureProblemOutputSchema = z.object({
  brief: z.string(),
  category: problemCategoryEnum,
  severity: problemSeverityEnum,
  summary_one_line: z.string(),
  language_detected: z.string().default("en"),
});
export type StructureProblemOutput = z.infer<typeof structureProblemOutputSchema>;

export const spamCheckOutputSchema = z.object({
  spam_score: z.number().min(0).max(1),
  flags: z.array(z.string()),
  reasoning: z.string(),
});
export type SpamCheckOutput = z.infer<typeof spamCheckOutputSchema>;

export const difficultyAndPlanOutputSchema = z.object({
  difficulty: problemDifficultyEnum,
  estimated_weeks: z.number().min(1).max(52),
  skills_needed: z.array(z.string()),
  milestones: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      week: z.number().min(1).max(52),
    })
  ).min(4).max(6),
});
export type DifficultyAndPlanOutput = z.infer<typeof difficultyAndPlanOutputSchema>;

export const assistantChatOutputSchema = z.object({
  reply: z.string(),
  recommended_problem_ids: z.array(z.string()),
});
export type AssistantChatOutput = z.infer<typeof assistantChatOutputSchema>;

export const trendSummaryOutputSchema = z.object({
  headline: z.string(),
  insights: z.array(z.string()),
  rising_areas: z.array(z.string()),
});
export type TrendSummaryOutput = z.infer<typeof trendSummaryOutputSchema>;

export const csrNarrativeOutputSchema = z.object({
  executive_summary: z.string(),
  highlights: z.array(z.string()),
  outcome_statement: z.string(),
});
export type CsrNarrativeOutput = z.infer<typeof csrNarrativeOutputSchema>;

export const impactSummaryOutputSchema = z.object({
  impact_summary: z.string(),
  beneficiaries_estimate_reasoning: z.string(),
});
export type ImpactSummaryOutput = z.infer<typeof impactSummaryOutputSchema>;
