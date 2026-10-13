# CivicBridge

> **An AI-Powered Platform to Crowdsource Societal Problems and Connect Universities and Industry**

CivicBridge bridges the historical disconnect between everyday citizens reporting urgent community issues, university students working on theoretical class assignments, and corporate CSR departments seeking transparent, verifiable community impact.

---

## 🏛️ System Architecture

- **Frontend**: React 19, TypeScript, React Router 7, Tailwind CSS v4, Lucide Icons, Leaflet OpenStreetMap, Canvas Confetti.
- **Backend**: Node.js, Express, Zod validation, JWT authentication with httpOnly cookie storage, bcrypt password hashing.
- **AI Triaging & Pipelines**: `@google/genai` TypeScript SDK (server-side only via proxy), powering:
  - Multilingual problem structuring into neutral engineering briefs (max 120 words).
  - Automated spam & fake-post classifier (`spam_score` 0.0–1.0 with rule checks & heuristic flags).
  - Difficulty estimation & 4-to-6 milestone academic project plan generation.
  - Grounded AI matchmaker assistant recommending database-retrieved problems for student skills and CSR focus.
  - Geographic hotspot trends summary.
  - ESG-compliant CSR report narrative synthesis.
  - Project completion impact analysis.
- **Database & Persistence**: Compatible with hosted PostgreSQL (`pg`) with provided `server/db/schema.sql` and `server/db/seed.sql`. Preloaded with an in-memory/resilient store initialized with **41 realistic societal problems** across waste, water, health, agriculture, education, safety, infrastructure, and environment in Bangalore urban and peri-urban wards.

---

## 🚀 Setup & Run Instructions

### 1. Installation
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key variables:
- `GEMINI_API_KEY`: Injected automatically in Google AI Studio Build.
- `DATABASE_URL`: (Optional) PostgreSQL connection string. When left empty, CivicBridge operates on its built-in store initialized with all 41 seed problems.
- `JWT_SECRET`: Secret key for session tokens.

### 3. Launch Development Server
```bash
npm run dev
```
The full-stack application will run on **http://localhost:3000** with Express API mounted on `/api` and React serving the UI.

### 4. Build & Production Start
```bash
npm run build
npm run start
```

---

## 🎭 Pre-Seeded Personas & 1-Click Role Switcher

For seamless demo evaluation, click the **Role** dropdown in the top navigation bar to instantaneously switch between all six platform roles:

| Role | Demo Account | Focus / Capabilities |
| :--- | :--- | :--- |
| **Citizen** | `resident@civicbridge.org` | Report problems with voice/text, support issues with 1 click, comment. |
| **Student** | `student@mit.edu` | Claim problems, receive AI project plans, upload proof, earn certificates. |
| **Professor** | `prof.sharma@iisc.ac.in` | Academic faculty; mentor student capstones and verify milestone proofs. |
| **Industry** | `csr@tcs-foundation.org` | CSR Director; sponsor problems with grants and generate PDF ESG reports. |
| **Government**| `ward.officer@bbmp.gov.in` | Municipal ward official; inspect hotspot maps and infrastructure priorities. |
| **Admin** | `admin@civicbridge.org` | Platform team; review spam moderation queue and grant `can_verify` rights. |

---

## 📋 Complete Demo Script (Step-by-Step)

### Step 1: Citizen Problem Reporting & AI Pre-Review
1. Switch to **Resident Citizen** via the top navbar dropdown.
2. Click **Report Problem** (`/problems/new`).
3. Enter a title and description, or use the **Speak complaint** button to dictate via browser Web Speech in English, Hindi, Kannada, Tamil, Telugu, or Malayalam.
4. Click **Generate AI Brief Preview**:
   - Gemini structures the raw complaint into a clear, concise brief.
   - The spam classifier calculates an integrity score.
   - The duplicate detector flags any existing similar issues.
5. Edit the AI brief if desired and click **Confirm & Submit Problem**.

### Step 2: Community Support & Ground Verification
1. Open any problem detail page (e.g., Bellandur lake or Electronic City plastic dumping).
2. Click **"I face this too"** — the support count increments immediately.
3. Switch persona to **Platform Administrator** (`admin@civicbridge.org`) or **Kavitha Reddy** (`verifier@ngo-arghyam.org`).
4. Click **Verify Problem (Auditor)** and add an on-site inspection note. The **Ground-Verified** badge appears with audit log details.

### Step 3: University Team Claiming & Project Plan
1. Switch persona to **University Student** (`student@mit.edu`).
2. Navigate to an open problem and click **Claim Problem with University Team**.
3. Confirm team name and university.
4. The system launches the project workspace (`/projects/:id`) with an AI-generated 4-to-6 milestone plan.
5. Click **Upload Proof** on a milestone to submit photo or document evidence.
6. Milestones cannot transition to verified without attached proof. An academic mentor or verifier signs off on the milestone.

### Step 4: Project Completion & Verifiable Certificate
1. When all milestones are verified, click **Complete Project & Issue Certificate**.
2. An AI impact summary is generated and the student is awarded the **Campus Innovator (`PROBLEM_SOLVER`)** badge.
3. Access the unique public verification URL (`/certificates/:code`) and click **Download PDF Certificate** to generate a landscape credential suitable for resumes.

### Step 5: Industry Sponsorship & Automated CSR Report
1. Switch persona to **Industry CSR Sponsor** (`csr@tcs-foundation.org`).
2. Visit `/reports` (CSR Reports) or sponsor a problem directly.
3. Select a reporting date range and click **Generate CSR Report**.
4. The AI CSR compliance director drafts an audit narrative linking allocated capital to verified beneficiaries.
5. Click **Download Official PDF** to export an audit-ready disclosure.

### Step 6: Public Impact Map & Matchmaker Assistant
1. Visit **Impact & Map** (`/impact`) to explore live counts, category distributions, and the AI trend forecast.
2. Visit **Matchmaker AI** (`/assistant`) to ask questions such as *"Which problems fit an environmental engineering capstone?"* — candidate problems are retrieved from the database and ranked by Gemini.

---

## 🔮 Intentionally Deferred for Future Versions

1. **pgvector extension**: Real-time high-dimensional vector index on scaled PostgreSQL (currently implemented via server cosine similarity over Gemini text embeddings).
2. **Inbound WhatsApp/SMS Bot**: Ingesting citizen MMS photo attachments directly via Twilio webhook.
3. **Decentralized Verifier Staking**: Cryptographic staking tokens for third-party civic audit NGOs.
