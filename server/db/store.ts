import crypto from "crypto";
import { SEED_USERS, SEED_PROBLEMS, SeedUser, SeedProblemRaw } from "./seed-data.ts";

export interface DBUser extends SeedUser {}

export interface DBProblem extends SeedProblemRaw {
  content_hash?: string;
  embedding?: number[];
  duplicate_of?: string | null;
  updated_at: string;
}

export interface DBProblemSupport {
  user_id: string;
  problem_id: string;
  created_at: string;
}

export interface DBComment {
  id: string;
  problem_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  body: string;
  created_at: string;
}

export interface DBVerification {
  id: string;
  problem_id: string;
  verifier_id: string;
  verifier_name: string;
  verifier_role: string;
  note: string;
  created_at: string;
}

export interface DBTeam {
  id: string;
  name: string;
  institution: string;
  lead_id: string;
  created_at: string;
}

export interface DBTeamMember {
  team_id: string;
  user_id: string;
  member_role: string; // lead, member, mentor
}

export interface DBMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string;
  due_date?: string | null;
  status: "pending" | "submitted" | "verified";
  order_index: number;
}

export interface DBProofUpload {
  id: string;
  milestone_id: string;
  uploaded_by: string;
  file_url: string;
  file_type: string;
  note: string;
  created_at: string;
}

export interface DBProject {
  id: string;
  problem_id: string;
  team_id: string;
  plan: any[];
  status: "planning" | "active" | "completed" | "abandoned";
  started_at: string;
  completed_at?: string | null;
  impact_summary?: string;
  beneficiaries_count: number;
  impact_score: number;
}

export interface DBSponsorship {
  id: string;
  sponsor_id: string;
  sponsor_name: string;
  sponsor_org: string;
  problem_id: string;
  project_id?: string | null;
  type: "funding" | "mentorship" | "resources";
  amount?: number | null;
  note?: string;
  status: "offered" | "accepted" | "completed";
  created_at: string;
}

export interface DBBadge {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface DBUserBadge {
  user_id: string;
  badge_id: string;
  awarded_at: string;
}

export interface DBCertificate {
  id: string;
  user_id: string;
  user_name: string;
  project_id: string;
  problem_title: string;
  team_name: string;
  institution: string;
  title: string;
  code: string;
  issued_at: string;
  impact_summary?: string;
}

export interface DBNotification {
  id: string;
  user_id: string;
  type: string;
  payload: any;
  is_read: boolean;
  created_at: string;
}

export interface DBCsrReport {
  id: string;
  sponsor_id: string;
  period_start: string;
  period_end: string;
  content: any;
  narrative: string;
  created_at: string;
}

class Store {
  public users: Map<string, DBUser> = new Map();
  public problems: Map<string, DBProblem> = new Map();
  public supports: DBProblemSupport[] = [];
  public comments: Map<string, DBComment> = new Map();
  public verifications: Map<string, DBVerification> = new Map();
  public teams: Map<string, DBTeam> = new Map();
  public teamMembers: DBTeamMember[] = [];
  public projects: Map<string, DBProject> = new Map();
  public milestones: Map<string, DBMilestone> = new Map();
  public proofs: Map<string, DBProofUpload> = new Map();
  public sponsorships: Map<string, DBSponsorship> = new Map();
  public badges: Map<string, DBBadge> = new Map();
  public userBadges: DBUserBadge[] = [];
  public certificates: Map<string, DBCertificate> = new Map();
  public notifications: Map<string, DBNotification> = new Map();
  public csrReports: Map<string, DBCsrReport> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    // 1. Users
    for (const u of SEED_USERS) {
      this.users.set(u.id, { ...u });
    }

    // 2. Badges
    const defaultBadges: DBBadge[] = [
      {
        id: "b1111111-1111-1111-1111-111111111111",
        code: "FIRST_REPORT",
        name: "Civic Voice",
        description: "Reported your first societal problem on CivicBridge",
      },
      {
        id: "b2222222-2222-2222-2222-222222222222",
        code: "GROUND_VERIFIED",
        name: "Truth Seeker",
        description: "Conducted on-site verification of a reported civic issue",
      },
      {
        id: "b3333333-3333-3333-3333-333333333333",
        code: "PROBLEM_SOLVER",
        name: "Campus Innovator",
        description: "Completed a university capstone project solving a real community issue",
      },
      {
        id: "b4444444-4444-4444-4444-444444444444",
        code: "CSR_CHAMPION",
        name: "Impact Patron",
        description: "Sponsored and funded societal initiatives addressing acute local needs",
      },
      {
        id: "b5555555-5555-5555-5555-555555555555",
        code: "COMMUNITY_BACKER",
        name: "Local Ally",
        description: "Supported 10 or more community problems faced by fellow citizens",
      },
    ];
    for (const b of defaultBadges) {
      this.badges.set(b.id, b);
    }

    // Award initial badges to sample users
    this.userBadges.push({
      user_id: "u1111111-0000-0000-0000-000000000002",
      badge_id: "b1111111-1111-1111-1111-111111111111",
      awarded_at: "2026-01-10T00:00:00Z",
    });
    this.userBadges.push({
      user_id: "u1111111-0000-0000-0000-000000000008",
      badge_id: "b2222222-2222-2222-2222-222222222222",
      awarded_at: "2026-01-09T00:00:00Z",
    });
    this.userBadges.push({
      user_id: "u1111111-0000-0000-0000-000000000005",
      badge_id: "b4444444-4444-4444-4444-444444444444",
      awarded_at: "2026-01-08T00:00:00Z",
    });

    // 3. Problems
    for (const p of SEED_PROBLEMS) {
      const hash = crypto.createHash("sha256").update(p.description.toLowerCase().trim()).digest("hex");
      this.problems.set(p.id, {
        ...p,
        content_hash: hash,
        updated_at: p.created_at,
      });

      // Seed initial supporters for realism
      if (p.support_count > 0) {
        this.supports.push({
          user_id: "u1111111-0000-0000-0000-000000000003",
          problem_id: p.id,
          created_at: p.created_at,
        });
      }
    }

    // 4. Sample Teams
    const sampleTeam1: DBTeam = {
      id: "t1111111-0000-0000-0000-000000000001",
      name: "EcoHydro Tech Labs",
      institution: "Indian Institute of Science (IISc)",
      lead_id: "u1111111-0000-0000-0000-000000000003",
      created_at: "2026-01-16T00:00:00Z",
    };
    const sampleTeam2: DBTeam = {
      id: "t1111111-0000-0000-0000-000000000002",
      name: "CleanUrban Robotics",
      institution: "BMS College of Engineering",
      lead_id: "u1111111-0000-0000-0000-000000000003",
      created_at: "2026-01-19T00:00:00Z",
    };
    this.teams.set(sampleTeam1.id, sampleTeam1);
    this.teams.set(sampleTeam2.id, sampleTeam2);

    this.teamMembers.push({ team_id: sampleTeam1.id, user_id: "u1111111-0000-0000-0000-000000000003", member_role: "lead" });
    this.teamMembers.push({ team_id: sampleTeam1.id, user_id: "u1111111-0000-0000-0000-000000000004", member_role: "mentor" });
    this.teamMembers.push({ team_id: sampleTeam2.id, user_id: "u1111111-0000-0000-0000-000000000003", member_role: "lead" });

    // 5. Sample Projects (In Progress: Bellandur; Solved: Electronic City Waste)
    const project1: DBProject = {
      id: "proj0001-0000-0000-0000-000000000001",
      problem_id: "p0000001-0000-0000-0000-000000000001",
      team_id: sampleTeam1.id,
      plan: [
        { title: "Chemical Effluent Sampling & Laboratory Assay", week: 1 },
        { title: "Floating Bio-Remediation Wetland Raft Prototype", week: 3 },
        { title: "Automated Dissolved Oxygen Sensor Mesh Deployment", week: 6 },
        { title: "Final Field Testing & Municipal Transfer", week: 12 },
      ],
      status: "active",
      started_at: "2026-02-02T00:00:00Z",
      impact_summary: "Deployed 4 bio-enzyme micro-diffusers and 2 solar aerator rafts at Yamalur outflow weir.",
      beneficiaries_count: 15000,
      impact_score: 92.5,
    };
    this.projects.set(project1.id, project1);

    // Milestones for Project 1
    const m1_1: DBMilestone = {
      id: "m0000001-0000-0000-0000-000000000001",
      project_id: project1.id,
      title: "Chemical Effluent Sampling & Laboratory Assay",
      description: "Sampled 5 inflow points across Yamalur weir and performed spectrophotometric surfactant assay.",
      status: "verified",
      order_index: 0,
    };
    const m1_2: DBMilestone = {
      id: "m0000001-0000-0000-0000-000000000002",
      project_id: project1.id,
      title: "Floating Bio-Remediation Wetland Raft Prototype",
      description: "Constructed 2 modular bamboo-vetiver root filtration rafts with microbial bacterial consortium.",
      status: "submitted",
      order_index: 1,
    };
    const m1_3: DBMilestone = {
      id: "m0000001-0000-0000-0000-000000000003",
      project_id: project1.id,
      title: "Automated Dissolved Oxygen Sensor Mesh Deployment",
      description: "Install solar telemetry buoys transmitting realtime DO and foam thickness readings.",
      status: "pending",
      order_index: 2,
    };
    this.milestones.set(m1_1.id, m1_1);
    this.milestones.set(m1_2.id, m1_2);
    this.milestones.set(m1_3.id, m1_3);

    // Proofs for m1_1
    const proof1: DBProofUpload = {
      id: "pf000001-0000-0000-0000-000000000001",
      milestone_id: m1_1.id,
      uploaded_by: "u1111111-0000-0000-0000-000000000003",
      file_url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      file_type: "image/jpeg",
      note: "Certified IISc Water Technology Laboratory test report showing 42% decrease in LAS surfactants.",
      created_at: "2026-02-05T00:00:00Z",
    };
    this.proofs.set(proof1.id, proof1);

    // Solved Project 2: Peenya School STEM Lab
    const project2: DBProject = {
      id: "proj0001-0000-0000-0000-000000000002",
      problem_id: "p0000001-0000-0000-0000-000000000006",
      team_id: sampleTeam2.id,
      plan: [
        { title: "School STEM Need Audit & Layout Planning", week: 1 },
        { title: "Procurement of 12 Modular Physics/Chemistry Science Kits", week: 2 },
        { title: "Teacher Training & Student Hands-on Workshop", week: 3 },
        { title: "Formal Handover & Learning Assessment", week: 4 },
      ],
      status: "completed",
      started_at: "2026-01-12T00:00:00Z",
      completed_at: "2026-02-08T00:00:00Z",
      impact_summary: "Fully renovated STEM practical laboratory with 12 experiment stations and 340 active students.",
      beneficiaries_count: 340,
      impact_score: 98.0,
    };
    this.projects.set(project2.id, project2);

    // Certificate for Project 2 Lead
    const certCode = "CB-2026-IISc-98214";
    this.certificates.set(certCode, {
      id: "cert0001-0000-0000-0000-000000000001",
      user_id: "u1111111-0000-0000-0000-000000000003",
      user_name: "Aarav Chen",
      project_id: project2.id,
      problem_title: "Lack of Science Lab & Digital STEM Tools in Peenya Government High School",
      team_name: "CleanUrban Robotics",
      institution: "BMS College of Engineering",
      title: "Certificate of Civic Engineering Excellence",
      code: certCode,
      issued_at: "2026-02-08T00:00:00Z",
      impact_summary: project2.impact_summary,
    });

    // 6. Sample Sponsorships
    const sp1: DBSponsorship = {
      id: "sp000001-0000-0000-0000-000000000001",
      sponsor_id: "u1111111-0000-0000-0000-000000000005",
      sponsor_name: "Vikram Malhotra",
      sponsor_org: "Tata Tech Foundation CSR",
      problem_id: "p0000001-0000-0000-0000-000000000001",
      project_id: project1.id,
      type: "funding",
      amount: 12500,
      note: "Earmarked CSR capital for biological enzyme deployment and laboratory water sensor calibration.",
      status: "accepted",
      created_at: "2026-02-03T00:00:00Z",
    };
    const sp2: DBSponsorship = {
      id: "sp000001-0000-0000-0000-000000000002",
      sponsor_id: "u1111111-0000-0000-0000-000000000006",
      sponsor_name: "Ananya Iyer",
      sponsor_org: "Infosys Foundation",
      problem_id: "p0000001-0000-0000-0000-000000000006",
      project_id: project2.id,
      type: "funding",
      amount: 8000,
      note: "Corporate grant for STEM laboratory apparatus and student textbooks.",
      status: "completed",
      created_at: "2026-01-14T00:00:00Z",
    };
    this.sponsorships.set(sp1.id, sp1);
    this.sponsorships.set(sp2.id, sp2);

    // 7. Sample Comments
    const comment1: DBComment = {
      id: "c0000001-0000-0000-0000-000000000001",
      problem_id: "p0000001-0000-0000-0000-000000000001",
      user_id: "u1111111-0000-0000-0000-000000000004",
      user_name: "Prof. Sudha Sharma",
      user_role: "professor",
      body: "Our IISc environmental chemistry lab has ready bio-enzyme culture batches. We can mentor a student capstone team starting this week.",
      created_at: "2026-02-02T10:00:00Z",
    };
    const comment2: DBComment = {
      id: "c0000001-0000-0000-0000-000000000001",
      problem_id: "p0000001-0000-0000-0000-000000000001",
      user_id: "u1111111-0000-0000-0000-000000000007",
      user_name: "Harish Kumar",
      user_role: "government",
      body: "BBMP Ward 150 will provide boat access and municipal permits for deploying the floating bio-filter rafts.",
      created_at: "2026-02-02T14:30:00Z",
    };
    this.comments.set(comment1.id, comment1);
    this.comments.set(comment2.id, comment2);

    // 8. Sample Verifications
    const v1: DBVerification = {
      id: "v0000001-0000-0000-0000-000000000001",
      problem_id: "p0000001-0000-0000-0000-000000000001",
      verifier_id: "u1111111-0000-0000-0000-000000000008",
      verifier_name: "Kavitha Reddy",
      verifier_role: "citizen",
      note: "Conducted physical perimeter walk at Yamalur outflow weir. Foam spray exceeds 4ft; dissolved oxygen measured 0.8 mg/L. Verified acute severity.",
      created_at: "2026-02-01T15:00:00Z",
    };
    this.verifications.set(v1.id, v1);

    // 9. Sample Notification
    const notif1: DBNotification = {
      id: "n0000001-0000-0000-0000-000000000001",
      user_id: "u1111111-0000-0000-0000-000000000002",
      type: "PROBLEM_VERIFIED",
      payload: {
        problem_id: "p0000001-0000-0000-0000-000000000001",
        problem_title: "Foaming and Heavy Chemical Runoff in Bellandur Lake Outflow",
        verifier_name: "Kavitha Reddy",
      },
      is_read: false,
      created_at: "2026-02-01T15:01:00Z",
    };
    this.notifications.set(notif1.id, notif1);
  }

  // User Operations
  public getUserByEmail(email: string): DBUser | undefined {
    const normalized = email.toLowerCase().trim();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === normalized) return u;
    }
    return undefined;
  }

  public getUserById(id: string): DBUser | undefined {
    return this.users.get(id);
  }

  public createUser(userData: Omit<DBUser, "id" | "created_at" | "reputation" | "can_verify">): DBUser {
    const id = `u${crypto.randomUUID().slice(1)}`;
    const user: DBUser = {
      id,
      ...userData,
      can_verify: false,
      reputation: 10,
      created_at: new Date().toISOString(),
    };
    this.users.set(id, user);
    return user;
  }

  public updateUser(id: string, updates: Partial<DBUser>): DBUser | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  public getAllUsers(): DBUser[] {
    return Array.from(this.users.values());
  }

  // Problem Operations & RLS
  public getProblems(filters: {
    search?: string;
    category?: string;
    status?: string;
    severity?: string;
    verified?: boolean;
    area?: string;
    sort?: string;
    page?: number;
    limit?: number;
    currentUserId?: string;
    currentUserRole?: string;
  }): { problems: DBProblem[]; total: number } {
    const {
      search,
      category,
      status,
      severity,
      verified,
      area,
      sort = "newest",
      page = 1,
      limit = 100,
      currentUserId,
      currentUserRole,
    } = filters;

    let items = Array.from(this.problems.values());

    // RLS Filter:
    // Anyone can read rows with status open, in_progress or solved.
    // The owner and admins can read pending_review and rejected rows.
    items = items.filter((p) => {
      if (["open", "in_progress", "solved"].includes(p.status)) {
        return true;
      }
      if (currentUserRole === "admin") {
        return true;
      }
      if (currentUserId && p.created_by === currentUserId) {
        return true;
      }
      return false;
    });

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.ai_brief && p.ai_brief.toLowerCase().includes(q)) ||
          p.area_name.toLowerCase().includes(q)
      );
    }

    if (category && category !== "all") {
      items = items.filter((p) => p.category === category);
    }

    if (status && status !== "all") {
      items = items.filter((p) => p.status === status);
    }

    if (severity && severity !== "all") {
      items = items.filter((p) => p.severity === severity);
    }

    if (verified !== undefined) {
      items = items.filter((p) => p.verified === verified);
    }

    if (area && area !== "all") {
      items = items.filter((p) => p.area_name.toLowerCase() === area.toLowerCase());
    }

    // Sorting
    if (sort === "most_supported") {
      items.sort((a, b) => b.support_count - a.support_count);
    } else if (sort === "severity") {
      const rank = { critical: 4, high: 3, medium: 2, low: 1 };
      items.sort((a, b) => (rank[b.severity] || 0) - (rank[a.severity] || 0));
    } else {
      // newest
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paginated = items.slice(startIndex, startIndex + limit);

    return { problems: paginated, total };
  }

  public getProblemById(id: string, currentUserId?: string, currentUserRole?: string): DBProblem | undefined {
    const problem = this.problems.get(id);
    if (!problem) return undefined;

    // RLS Check:
    if (!["open", "in_progress", "solved"].includes(problem.status)) {
      if (currentUserRole !== "admin" && (!currentUserId || problem.created_by !== currentUserId)) {
        return undefined; // Not accessible under RLS
      }
    }
    return problem;
  }

  public createProblem(problemData: Omit<DBProblem, "id" | "created_at" | "updated_at" | "support_count">): DBProblem {
    const id = `p${crypto.randomUUID().slice(1)}`;
    const now = new Date().toISOString();
    const hash = crypto
      .createHash("sha256")
      .update(problemData.description.toLowerCase().trim())
      .digest("hex");

    const problem: DBProblem = {
      id,
      ...problemData,
      content_hash: hash,
      support_count: 0,
      created_at: now,
      updated_at: now,
    };
    this.problems.set(id, problem);

    // Award first report badge if user hasn't gotten it
    this.awardBadge(problemData.created_by, "FIRST_REPORT");

    return problem;
  }

  public updateProblem(id: string, updates: Partial<DBProblem>, userId: string, role: string): DBProblem | undefined {
    const problem = this.problems.get(id);
    if (!problem) return undefined;

    // RLS: Only owner (before team claims) or admin can update
    const isOwner = problem.created_by === userId;
    const isAdmin = role === "admin";
    if (!isAdmin && (!isOwner || problem.status === "in_progress" || problem.status === "solved")) {
      throw new Error("Unauthorized to edit this problem under RLS access control");
    }

    const updated: DBProblem = {
      ...problem,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.problems.set(id, updated);
    return updated;
  }

  public deleteProblem(id: string, role: string): boolean {
    // RLS: only admin can delete problems
    if (role !== "admin") {
      throw new Error("Only platform administrators can delete problems under RLS policy");
    }
    return this.problems.delete(id);
  }

  // Supports
  public supportProblem(userId: string, problemId: string): { supported: boolean; count: number } {
    const existing = this.supports.find((s) => s.user_id === userId && s.problem_id === problemId);
    const problem = this.problems.get(problemId);
    if (!problem) throw new Error("Problem not found");

    if (existing) {
      return { supported: true, count: problem.support_count };
    }

    this.supports.push({
      user_id: userId,
      problem_id: problemId,
      created_at: new Date().toISOString(),
    });
    problem.support_count += 1;
    this.problems.set(problemId, problem);

    // Notify problem owner
    if (problem.created_by !== userId) {
      this.createNotification(problem.created_by, "PROBLEM_SUPPORTED", {
        problem_id: problemId,
        problem_title: problem.title,
        supporter_count: problem.support_count,
      });
    }

    return { supported: true, count: problem.support_count };
  }

  public unsupportProblem(userId: string, problemId: string): { supported: boolean; count: number } {
    const index = this.supports.findIndex((s) => s.user_id === userId && s.problem_id === problemId);
    const problem = this.problems.get(problemId);
    if (!problem) throw new Error("Problem not found");

    if (index !== -1) {
      this.supports.splice(index, 1);
      problem.support_count = Math.max(0, problem.support_count - 1);
      this.problems.set(problemId, problem);
    }
    return { supported: false, count: problem.support_count };
  }

  public hasUserSupported(userId: string, problemId: string): boolean {
    return this.supports.some((s) => s.user_id === userId && s.problem_id === problemId);
  }

  // Comments
  public getComments(problemId: string): DBComment[] {
    const items: DBComment[] = [];
    for (const c of this.comments.values()) {
      if (c.problem_id === problemId) {
        items.push(c);
      }
    }
    return items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public addComment(problemId: string, userId: string, body: string): DBComment {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    const id = `c${crypto.randomUUID().slice(1)}`;
    const comment: DBComment = {
      id,
      problem_id: problemId,
      user_id: userId,
      user_name: user.name,
      user_role: user.role,
      body,
      created_at: new Date().toISOString(),
    };
    this.comments.set(id, comment);

    const problem = this.problems.get(problemId);
    if (problem && problem.created_by !== userId) {
      this.createNotification(problem.created_by, "PROBLEM_COMMENT", {
        problem_id: problemId,
        problem_title: problem.title,
        commenter_name: user.name,
      });
    }

    return comment;
  }

  public deleteComment(id: string, userId: string, role: string): boolean {
    const comment = this.comments.get(id);
    if (!comment) return false;
    if (comment.user_id !== userId && role !== "admin") {
      throw new Error("Unauthorized to delete comment");
    }
    return this.comments.delete(id);
  }

  // Ground Verification
  public verifyProblem(problemId: string, verifierId: string, note: string): DBVerification {
    const verifier = this.users.get(verifierId);
    if (!verifier || (!verifier.can_verify && verifier.role !== "admin")) {
      throw new Error("User does not have can_verify credentials to verify problems");
    }

    const problem = this.problems.get(problemId);
    if (!problem) throw new Error("Problem not found");

    problem.verified = true;
    this.problems.set(problemId, problem);

    const id = `v${crypto.randomUUID().slice(1)}`;
    const verification: DBVerification = {
      id,
      problem_id: problemId,
      verifier_id: verifierId,
      verifier_name: verifier.name,
      verifier_role: verifier.role,
      note,
      created_at: new Date().toISOString(),
    };
    this.verifications.set(id, verification);

    // Award verification badge
    this.awardBadge(verifierId, "GROUND_VERIFIED");

    // Notify problem owner
    this.createNotification(problem.created_by, "PROBLEM_VERIFIED", {
      problem_id: problemId,
      problem_title: problem.title,
      verifier_name: verifier.name,
    });

    return verification;
  }

  public getVerifications(problemId: string): DBVerification[] {
    const list: DBVerification[] = [];
    for (const v of this.verifications.values()) {
      if (v.problem_id === problemId) list.push(v);
    }
    return list;
  }

  // Teams & Projects
  public createTeam(name: string, institution: string, leadId: string): DBTeam {
    const id = `t${crypto.randomUUID().slice(1)}`;
    const team: DBTeam = {
      id,
      name,
      institution,
      lead_id: leadId,
      created_at: new Date().toISOString(),
    };
    this.teams.set(id, team);
    this.teamMembers.push({ team_id: id, user_id: leadId, member_role: "lead" });
    return team;
  }

  public getTeamById(id: string): DBTeam | undefined {
    return this.teams.get(id);
  }

  public getTeamMembers(teamId: string): Array<{ user_id: string; name: string; role: string; member_role: string }> {
    return this.teamMembers
      .filter((m) => m.team_id === teamId)
      .map((m) => {
        const u = this.users.get(m.user_id);
        return {
          user_id: m.user_id,
          name: u?.name || "Unknown",
          role: u?.role || "student",
          member_role: m.member_role,
        };
      });
  }

  public addTeamMember(teamId: string, userId: string, memberRole: string = "member"): void {
    const existing = this.teamMembers.find((m) => m.team_id === teamId && m.user_id === userId);
    if (!existing) {
      this.teamMembers.push({ team_id: teamId, user_id: userId, member_role: memberRole });
    }
  }

  // Claim Problem & Projects
  public claimProblem(
    problemId: string,
    teamId: string,
    plan: any[],
    milestonesData: Array<{ title: string; description: string; week?: number }>,
    userId: string
  ): DBProject {
    const problem = this.problems.get(problemId);
    if (!problem) throw new Error("Problem not found");
    if (problem.status === "in_progress" || problem.status === "solved") {
      throw new Error("This problem has already been claimed by a team");
    }

    problem.status = "in_progress";
    this.problems.set(problemId, problem);

    const projectId = `proj${crypto.randomUUID().slice(4)}`;
    const project: DBProject = {
      id: projectId,
      problem_id: problemId,
      team_id: teamId,
      plan,
      status: "active",
      started_at: new Date().toISOString(),
      beneficiaries_count: 500,
      impact_score: 50.0,
    };
    this.projects.set(projectId, project);

    // Create milestones
    milestonesData.forEach((m, idx) => {
      const milestoneId = `m${crypto.randomUUID().slice(1)}`;
      this.milestones.set(milestoneId, {
        id: milestoneId,
        project_id: projectId,
        title: m.title,
        description: m.description,
        status: "pending",
        order_index: idx,
      });
    });

    // Notify problem owner
    const team = this.teams.get(teamId);
    this.createNotification(problem.created_by, "PROBLEM_CLAIMED", {
      problem_id: problemId,
      problem_title: problem.title,
      team_name: team?.name || "Student Team",
      project_id: projectId,
    });

    return project;
  }

  public getProjectById(id: string): (DBProject & { problem?: DBProblem; team?: DBTeam }) | undefined {
    const project = this.projects.get(id);
    if (!project) return undefined;
    const problem = this.problems.get(project.problem_id);
    const team = this.teams.get(project.team_id);
    return {
      ...project,
      problem,
      team,
    };
  }

  public getProjectByProblemId(problemId: string): DBProject | undefined {
    for (const p of this.projects.values()) {
      if (p.problem_id === problemId) return p;
    }
    return undefined;
  }

  public getAllProjects(): DBProject[] {
    return Array.from(this.projects.values());
  }

  public getMilestones(projectId: string): DBMilestone[] {
    const list: DBMilestone[] = [];
    for (const m of this.milestones.values()) {
      if (m.project_id === projectId) list.push(m);
    }
    return list.sort((a, b) => a.order_index - b.order_index);
  }

  public updateMilestone(id: string, updates: Partial<DBMilestone>, userId: string, role: string): DBMilestone {
    const milestone = this.milestones.get(id);
    if (!milestone) throw new Error("Milestone not found");

    const project = this.projects.get(milestone.project_id);
    if (!project) throw new Error("Project not found");

    // Proof upload requirement check: Every milestone needs at least one proof upload before it can be submitted!
    if (updates.status === "submitted") {
      const milestoneProofs = this.getProofs(id);
      if (milestoneProofs.length === 0) {
        throw new Error("Cannot submit milestone without at least one proof upload (photo, PDF, or document)");
      }
    }

    // Verified check: Only verifiers, mentors, and admins can mark milestone verified
    if (updates.status === "verified") {
      const user = this.users.get(userId);
      const isMentor = this.teamMembers.some(
        (m) => m.team_id === project.team_id && m.user_id === userId && m.member_role === "mentor"
      );
      if (!user?.can_verify && !isMentor && role !== "admin") {
        throw new Error("Only verified reviewers, team mentors, or administrators can verify milestones");
      }
    }

    const updated = { ...milestone, ...updates };
    this.milestones.set(id, updated);
    return updated;
  }

  public addProof(milestoneId: string, uploadedBy: string, fileUrl: string, fileType: string, note: string): DBProofUpload {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) throw new Error("Milestone not found");

    const id = `pf${crypto.randomUUID().slice(2)}`;
    const proof: DBProofUpload = {
      id,
      milestone_id: milestoneId,
      uploaded_by: uploadedBy,
      file_url: fileUrl,
      file_type: fileType,
      note,
      created_at: new Date().toISOString(),
    };
    this.proofs.set(id, proof);

    // If milestone was pending, automatically transition to submitted with proof attached
    if (milestone.status === "pending") {
      milestone.status = "submitted";
      this.milestones.set(milestoneId, milestone);
    }

    return proof;
  }

  public getProofs(milestoneId: string): DBProofUpload[] {
    const list: DBProofUpload[] = [];
    for (const p of this.proofs.values()) {
      if (p.milestone_id === milestoneId) list.push(p);
    }
    return list;
  }

  // Complete Project & Certificates
  public completeProject(
    projectId: string,
    impactSummary: string,
    beneficiariesCount: number,
    userId: string,
    role: string
  ): { project: DBProject; certificates: DBCertificate[] } {
    const project = this.projects.get(projectId);
    if (!project) throw new Error("Project not found");

    const problem = this.problems.get(project.problem_id);
    if (!problem) throw new Error("Problem not found");

    project.status = "completed";
    project.completed_at = new Date().toISOString();
    project.impact_summary = impactSummary;
    project.beneficiaries_count = beneficiariesCount;
    project.impact_score = 95.0;
    this.projects.set(projectId, project);

    // Mark problem solved
    problem.status = "solved";
    this.problems.set(problem.id, problem);

    // Mark all sponsorships for this project as completed
    for (const sp of this.sponsorships.values()) {
      if (sp.project_id === projectId || sp.problem_id === problem.id) {
        sp.status = "completed";
        this.sponsorships.set(sp.id, sp);
      }
    }

    // Award PROBLEM_SOLVER badge to team members and issue verifiable certificates
    const issuedCerts: DBCertificate[] = [];
    const team = this.teams.get(project.team_id);
    const members = this.teamMembers.filter((m) => m.team_id === project.team_id);

    for (const m of members) {
      const user = this.users.get(m.user_id);
      if (user) {
        this.awardBadge(user.id, "PROBLEM_SOLVER");

        const certCode = `CB-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
        const cert: DBCertificate = {
          id: `cert${crypto.randomUUID().slice(4)}`,
          user_id: user.id,
          user_name: user.name,
          project_id: projectId,
          problem_title: problem.title,
          team_name: team?.name || "CivicBridge Innovation Team",
          institution: team?.institution || "University Partner",
          title: "Certificate of Societal Innovation & Impact",
          code: certCode,
          issued_at: new Date().toISOString(),
          impact_summary: impactSummary,
        };
        this.certificates.set(certCode, cert);
        issuedCerts.push(cert);

        this.createNotification(user.id, "PROJECT_COMPLETED", {
          project_id: projectId,
          certificate_code: certCode,
          impact_summary: impactSummary,
        });
      }
    }

    return { project, certificates: issuedCerts };
  }

  // Sponsorships
  public createSponsorship(data: {
    sponsor_id: string;
    problem_id: string;
    project_id?: string | null;
    type: "funding" | "mentorship" | "resources";
    amount?: number | null;
    note?: string;
  }): DBSponsorship {
    const sponsor = this.users.get(data.sponsor_id);
    if (!sponsor || (sponsor.role !== "industry" && sponsor.role !== "admin")) {
      throw new Error("Only industry partners and sponsors can create sponsorships");
    }

    const id = `sp${crypto.randomUUID().slice(2)}`;
    const sponsorship: DBSponsorship = {
      id,
      sponsor_id: data.sponsor_id,
      sponsor_name: sponsor.name,
      sponsor_org: sponsor.organisation || "Industry Partner",
      problem_id: data.problem_id,
      project_id: data.project_id || null,
      type: data.type,
      amount: data.amount || null,
      note: data.note || "",
      status: "offered",
      created_at: new Date().toISOString(),
    };
    this.sponsorships.set(id, sponsorship);

    // Award CSR Champion badge
    this.awardBadge(data.sponsor_id, "CSR_CHAMPION");

    // Notify problem owner
    const problem = this.problems.get(data.problem_id);
    if (problem) {
      this.createNotification(problem.created_by, "SPONSORSHIP_RECEIVED", {
        problem_id: problem.id,
        sponsor_name: sponsor.name,
        type: data.type,
        amount: data.amount,
      });
    }

    return sponsorship;
  }

  public getSponsorshipsForProblem(problemId: string, currentUserId?: string, currentUserRole?: string): DBSponsorship[] {
    const list: DBSponsorship[] = [];
    const problem = this.problems.get(problemId);

    for (const sp of this.sponsorships.values()) {
      if (sp.problem_id === problemId) {
        // RLS check on amount:
        // "sponsorships: the sponsor and the problem owner can read amounts; the public sees only that a problem is sponsored"
        const isSponsor = currentUserId && sp.sponsor_id === currentUserId;
        const isProblemOwner = currentUserId && problem && problem.created_by === currentUserId;
        const isAdmin = currentUserRole === "admin";

        if (isSponsor || isProblemOwner || isAdmin) {
          list.push(sp);
        } else {
          // Redact amount for unauthorized viewers
          list.push({
            ...sp,
            amount: null,
          });
        }
      }
    }
    return list;
  }

  public getUserSponsorships(sponsorId: string): DBSponsorship[] {
    const list: DBSponsorship[] = [];
    for (const sp of this.sponsorships.values()) {
      if (sp.sponsor_id === sponsorId) list.push(sp);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public updateSponsorship(id: string, updates: Partial<DBSponsorship>): DBSponsorship {
    const sp = this.sponsorships.get(id);
    if (!sp) throw new Error("Sponsorship not found");
    const updated = { ...sp, ...updates };
    this.sponsorships.set(id, updated);
    return updated;
  }

  // Badges & Certificates
  public awardBadge(userId: string, badgeCode: string): void {
    let badgeId = "";
    for (const b of this.badges.values()) {
      if (b.code === badgeCode) {
        badgeId = b.id;
        break;
      }
    }
    if (!badgeId) return;

    const exists = this.userBadges.some((ub) => ub.user_id === userId && ub.badge_id === badgeId);
    if (!exists) {
      this.userBadges.push({
        user_id: userId,
        badge_id: badgeId,
        awarded_at: new Date().toISOString(),
      });
    }
  }

  public getUserBadges(userId: string): DBBadge[] {
    const badgeIds = this.userBadges.filter((ub) => ub.user_id === userId).map((ub) => ub.badge_id);
    return badgeIds.map((id) => this.badges.get(id)).filter(Boolean) as DBBadge[];
  }

  public getCertificateByCode(code: string): DBCertificate | undefined {
    return this.certificates.get(code);
  }

  public getUserCertificates(userId: string): DBCertificate[] {
    const list: DBCertificate[] = [];
    for (const c of this.certificates.values()) {
      if (c.user_id === userId) list.push(c);
    }
    return list;
  }

  // Notifications
  public createNotification(userId: string, type: string, payload: any): DBNotification {
    const id = `n${crypto.randomUUID().slice(1)}`;
    const notification: DBNotification = {
      id,
      user_id: userId,
      type,
      payload,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  public getNotifications(userId: string): DBNotification[] {
    const list: DBNotification[] = [];
    for (const n of this.notifications.values()) {
      if (n.user_id === userId) list.push(n);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public markNotificationRead(id: string, userId: string): boolean {
    const n = this.notifications.get(id);
    if (!n || n.user_id !== userId) return false;
    n.is_read = true;
    this.notifications.set(id, n);
    return true;
  }

  // CSR Reports
  public createCsrReport(sponsorId: string, periodStart: string, periodEnd: string, content: any, narrative: string): DBCsrReport {
    const id = `csr${crypto.randomUUID().slice(3)}`;
    const report: DBCsrReport = {
      id,
      sponsor_id: sponsorId,
      period_start: periodStart,
      period_end: periodEnd,
      content,
      narrative,
      created_at: new Date().toISOString(),
    };
    this.csrReports.set(id, report);
    return report;
  }

  public getCsrReports(sponsorId: string): DBCsrReport[] {
    const list: DBCsrReport[] = [];
    for (const r of this.csrReports.values()) {
      if (r.sponsor_id === sponsorId) list.push(r);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getCsrReportById(id: string, sponsorId: string): DBCsrReport | undefined {
    const report = this.csrReports.get(id);
    if (!report || report.sponsor_id !== sponsorId) return undefined;
    return report;
  }

  // Analytics & Insights
  public getAnalyticsSummary() {
    const totalProblems = this.problems.size;
    let solvedCount = 0;
    let inProgressCount = 0;
    let openCount = 0;
    let totalBeneficiaries = 0;

    const categoryBreakdown: Record<string, number> = {};
    const severityBreakdown: Record<string, number> = {};

    for (const p of this.problems.values()) {
      if (p.status === "solved") solvedCount++;
      else if (p.status === "in_progress") inProgressCount++;
      else if (p.status === "open") openCount++;

      categoryBreakdown[p.category] = (categoryBreakdown[p.category] || 0) + 1;
      severityBreakdown[p.severity] = (severityBreakdown[p.severity] || 0) + 1;
    }

    for (const proj of this.projects.values()) {
      totalBeneficiaries += proj.beneficiaries_count || 0;
    }

    let totalFundingDeployed = 0;
    for (const sp of this.sponsorships.values()) {
      if (sp.type === "funding" && sp.amount) {
        totalFundingDeployed += Number(sp.amount);
      }
    }

    return {
      total_problems: totalProblems,
      solved_problems: solvedCount,
      in_progress_problems: inProgressCount,
      open_problems: openCount,
      active_teams: this.teams.size,
      total_sponsors: this.sponsorships.size,
      total_beneficiaries: totalBeneficiaries,
      total_funding_deployed: totalFundingDeployed,
      category_breakdown: categoryBreakdown,
      severity_breakdown: severityBreakdown,
    };
  }

  public getHotspots() {
    // Group problems by geographical area
    const areas: Record<
      string,
      {
        area_name: string;
        count: number;
        avg_lat: number;
        avg_lng: number;
        critical_count: number;
        solved_count: number;
        categories: Record<string, number>;
      }
    > = {};

    for (const p of this.problems.values()) {
      if (["pending_review", "rejected"].includes(p.status)) continue;
      const key = p.area_name || "Regional";
      if (!areas[key]) {
        areas[key] = {
          area_name: key,
          count: 0,
          avg_lat: Number(p.latitude) || 12.9716,
          avg_lng: Number(p.longitude) || 77.5946,
          critical_count: 0,
          solved_count: 0,
          categories: {},
        };
      }
      areas[key].count += 1;
      if (p.severity === "critical") areas[key].critical_count += 1;
      if (p.status === "solved") areas[key].solved_count += 1;
      areas[key].categories[p.category] = (areas[key].categories[p.category] || 0) + 1;
    }

    return Object.values(areas);
  }

  public getLeaderboards(type: "teams" | "universities" | "sponsors") {
    if (type === "teams") {
      return Array.from(this.teams.values()).map((t) => {
        const teamProjects = Array.from(this.projects.values()).filter((p) => p.team_id === t.id);
        const solved = teamProjects.filter((p) => p.status === "completed").length;
        const totalBeneficiaries = teamProjects.reduce((sum, p) => sum + (p.beneficiaries_count || 0), 0);
        return {
          id: t.id,
          name: t.name,
          institution: t.institution,
          solved_count: solved,
          active_projects: teamProjects.length,
          total_beneficiaries: totalBeneficiaries,
          points: solved * 100 + teamProjects.length * 20,
        };
      }).sort((a, b) => b.points - a.points);
    }

    if (type === "universities") {
      const uniMap: Record<string, { institution: string; solved_count: number; teams_count: number; beneficiaries: number }> = {};
      for (const t of this.teams.values()) {
        if (!uniMap[t.institution]) {
          uniMap[t.institution] = { institution: t.institution, solved_count: 0, teams_count: 0, beneficiaries: 0 };
        }
        uniMap[t.institution].teams_count += 1;
        const teamProjects = Array.from(this.projects.values()).filter((p) => p.team_id === t.id);
        uniMap[t.institution].solved_count += teamProjects.filter((p) => p.status === "completed").length;
        uniMap[t.institution].beneficiaries += teamProjects.reduce((sum, p) => sum + (p.beneficiaries_count || 0), 0);
      }
      return Object.values(uniMap).sort((a, b) => b.solved_count * 100 + b.beneficiaries - (a.solved_count * 100 + a.beneficiaries));
    }

    // sponsors
    const sponsorMap: Record<string, { id: string; name: string; org: string; total_amount: number; sponsored_count: number }> = {};
    for (const sp of this.sponsorships.values()) {
      if (!sponsorMap[sp.sponsor_id]) {
        sponsorMap[sp.sponsor_id] = {
          id: sp.sponsor_id,
          name: sp.sponsor_name,
          org: sp.sponsor_org,
          total_amount: 0,
          sponsored_count: 0,
        };
      }
      sponsorMap[sp.sponsor_id].sponsored_count += 1;
      sponsorMap[sp.sponsor_id].total_amount += Number(sp.amount || 0);
    }
    return Object.values(sponsorMap).sort((a, b) => b.total_amount - a.total_amount);
  }

  // Admin Queue
  public getAdminQueue(role: string): { pending_review: DBProblem[]; rejected: DBProblem[] } {
    if (role !== "admin") {
      throw new Error("Admin authorization required");
    }
    const pending: DBProblem[] = [];
    const rejected: DBProblem[] = [];
    for (const p of this.problems.values()) {
      if (p.status === "pending_review") pending.push(p);
      else if (p.status === "rejected") rejected.push(p);
    }
    return { pending_review: pending, rejected };
  }
}

export const db = new Store();
