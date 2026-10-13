-- CivicBridge Seed Data SQL Migration
-- Preloads platform roles, badges, teams, sponsorships, and 40+ realistic societal problems

-- 1. Seed Badges
INSERT INTO badges (id, code, name, description) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'FIRST_REPORT', 'Civic Voice', 'Reported your first societal problem on CivicBridge'),
  ('b2222222-2222-2222-2222-222222222222', 'GROUND_VERIFIED', 'Truth Seeker', 'Conducted on-site verification of a reported civic issue'),
  ('b3333333-3333-3333-3333-333333333333', 'PROBLEM_SOLVER', 'Campus Innovator', 'Completed a university capstone project solving a real community issue'),
  ('b4444444-4444-4444-4444-444444444444', 'CSR_CHAMPION', 'Impact Patron', 'Sponsored and funded societal initiatives addressing acute local needs'),
  ('b5555555-5555-5555-5555-555555555555', 'COMMUNITY_BACKER', 'Local Ally', 'Supported 10 or more community problems faced by fellow citizens')
ON CONFLICT (code) DO NOTHING;
