-- ============================================================
-- 207 Analytix — Core Schema Export
-- Generated: April 2026
-- Project: hhyhulqngdkwsxhymmcd (Supabase)
-- ============================================================
-- USAGE: Run this against a fresh Supabase project to scaffold
-- the full 207 Analytix operating schema.
-- ============================================================

-- ENUM: staff role types
DO $$ BEGIN
  CREATE TYPE staff_role_type AS ENUM (
    'founder', 'operator', 'accountant', 'sales_agent'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- CORE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.regions (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT        NOT NULL,
  towns           TEXT[],
  total_pool      INT         NOT NULL,
  status          TEXT        DEFAULT 'active',
  phase           INT         DEFAULT 1,
  unifying_objective TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.regions IS 'Geographic regions for lead segmentation and Westbrook 1300 cohort targeting.';


CREATE TABLE IF NOT EXISTS public.businesses (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT        NOT NULL,
  industry        TEXT,
  neighborhood    TEXT,
  ownership_type  TEXT,
  stage           TEXT        DEFAULT 'prospect',
  city            TEXT        DEFAULT 'Westbrook',
  state_province  TEXT        DEFAULT 'ME',
  country         TEXT        DEFAULT 'US',
  is_active       BOOLEAN     DEFAULT true,
  client_since    DATE,
  monthly_fee     NUMERIC,
  research_tier   BOOLEAN     DEFAULT true,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.businesses IS 'Active businesses in the Westbrook ecosystem. is_active=true counts toward the 1,300 scarcity cap.';


CREATE TABLE IF NOT EXISTS public.leads (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- legacy fields (kept for compatibility)
  name             TEXT        NOT NULL,
  pitch_type       TEXT        NOT NULL DEFAULT 'intake_form',
  -- extended intake fields
  first_name       TEXT,
  last_name        TEXT,
  email            TEXT        NOT NULL,
  phone            TEXT,
  business_name    TEXT,
  city             TEXT,
  neighborhood     TEXT,
  industry         TEXT,
  service_tier     TEXT        CHECK (service_tier IN ('discovery','standard','premium')),
  project_type     TEXT,
  budget_range     TEXT,
  how_did_you_hear TEXT,
  message          TEXT,
  status           TEXT        DEFAULT 'submitted',
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.leads IS '207 Analytix client lead intake. service_tier: discovery|standard|premium. status: submitted|reviewed|converted|archived.';
COMMENT ON COLUMN public.leads.service_tier      IS 'discovery | standard | premium';
COMMENT ON COLUMN public.leads.status            IS 'submitted | reviewed | converted | archived';
COMMENT ON COLUMN public.leads.neighborhood      IS 'downtown | industrial | rural — maps to Westbrook 1300 cohorts';
COMMENT ON COLUMN public.leads.how_did_you_hear  IS 'Referral source for LMO tracking';


CREATE TABLE IF NOT EXISTS public.team_roles (
  id                UUID              NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_type         staff_role_type   NOT NULL,
  role_title        TEXT              NOT NULL,
  tagline           TEXT,
  responsibilities  TEXT[]            NOT NULL DEFAULT '{}',
  ecosystem_impact  TEXT              NOT NULL,
  commission_pct    NUMERIC,
  reports_to        staff_role_type,
  headcount_target  INT               NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ       DEFAULT now()
);
COMMENT ON TABLE public.team_roles IS 'Role definitions: founder | operator | accountant | sales_agent. Drives dashboard access routing.';


CREATE TABLE IF NOT EXISTS public.team_members (
  id           UUID              NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT              NOT NULL DEFAULT 'TBD',
  role_id      UUID              NOT NULL REFERENCES public.team_roles(id),
  email        TEXT,
  status       TEXT              NOT NULL DEFAULT 'pending',
  start_date   DATE,
  notes        TEXT,
  linkedin_url TEXT,
  created_at   TIMESTAMPTZ       DEFAULT now()
);
COMMENT ON TABLE public.team_members IS '207 Analytix team roster. Joined to team_roles for role_type and role_title.';


CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT        NOT NULL,
  priority        INT         NOT NULL,
  allocation_pct  NUMERIC     NOT NULL,
  current_balance NUMERIC     DEFAULT 0,
  description     TEXT,
  updated_at      TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.financial_accounts IS 'Profit First allocation accounts. Priority order defines display sequence across all dashboards.';


-- ============================================================
-- SKUNKWORKS PIPELINE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.skunkworks_projects (
  id                     UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title                  TEXT        NOT NULL,
  description            TEXT,
  sponsor                TEXT,
  approver               TEXT,
  approval_notes         TEXT,
  approved_at            TIMESTAMPTZ,
  status                 TEXT        DEFAULT 'pitched',
  budget_allocated       NUMERIC     DEFAULT 0,
  budget_spent           NUMERIC     DEFAULT 0,
  commoditized           BOOLEAN     DEFAULT false,
  commoditized_at        TIMESTAMPTZ,
  spec_document          TEXT,
  target_commodity_type  TEXT,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.skunkworks_projects IS 'Internal R&D and client deliverable pipeline. Owned by Lead Developer. Status: planning | active | commoditized | archived.';


CREATE TABLE IF NOT EXISTS public.skunkworks_contributors (
  id                UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id        UUID        NOT NULL REFERENCES public.skunkworks_projects(id) ON DELETE CASCADE,
  contributor_name  TEXT        NOT NULL,
  contributor_type  TEXT        DEFAULT 'human',
  role              TEXT,
  contribution_note TEXT,
  added_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS public.skunkworks_deliverables (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id       UUID        NOT NULL REFERENCES public.skunkworks_projects(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  deliverable_type TEXT        DEFAULT 'doc',
  url              TEXT,
  body             TEXT,
  submitted_by     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS public.skunkworks_sessions (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id       UUID        NOT NULL REFERENCES public.skunkworks_projects(id) ON DELETE CASCADE,
  golden_prompt_id UUID,
  agent_name       TEXT,
  prompt_used      TEXT,
  output_summary   TEXT,
  full_output      TEXT,
  session_type     TEXT        DEFAULT 'spec',
  ran_by           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_leads_status          ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at      ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_pitch_type      ON public.leads (pitch_type);
CREATE INDEX IF NOT EXISTS idx_leads_industry        ON public.leads (industry);
CREATE INDEX IF NOT EXISTS idx_leads_service_tier    ON public.leads (service_tier);
CREATE INDEX IF NOT EXISTS idx_leads_neighborhood    ON public.leads (neighborhood);

CREATE INDEX IF NOT EXISTS idx_businesses_is_active    ON public.businesses (is_active);
CREATE INDEX IF NOT EXISTS idx_businesses_neighborhood ON public.businesses (neighborhood);

CREATE INDEX IF NOT EXISTS idx_skunkworks_status     ON public.skunkworks_projects (status);
CREATE INDEX IF NOT EXISTS idx_skunkworks_created_at ON public.skunkworks_projects (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_team_members_role_id  ON public.team_members (role_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status   ON public.team_members (status);

CREATE INDEX IF NOT EXISTS idx_financial_accounts_priority ON public.financial_accounts (priority);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.leads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_roles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skunkworks_projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skunkworks_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skunkworks_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skunkworks_sessions     ENABLE ROW LEVEL SECURITY;

-- leads: public intake, auth full control
CREATE POLICY public_insert_leads  ON public.leads FOR INSERT TO anon    WITH CHECK (true);
CREATE POLICY auth_all_leads       ON public.leads FOR ALL    TO authenticated USING (true);

-- businesses: auth full control
CREATE POLICY auth_all_businesses  ON public.businesses FOR ALL TO authenticated USING (true);

-- financial_accounts: public read
CREATE POLICY public_read_financial_accounts ON public.financial_accounts FOR SELECT TO anon USING (true);

-- team_members / roles: public read
CREATE POLICY anon_read_team_members ON public.team_members FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_team_roles   ON public.team_roles   FOR SELECT TO anon USING (true);

-- regions: public read
CREATE POLICY public_read_regions ON public.regions FOR SELECT TO anon USING (true);

-- skunkworks: anon read/insert/update, auth full
CREATE POLICY anon_select_skunkworks  ON public.skunkworks_projects FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_skunkworks  ON public.skunkworks_projects FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_skunkworks  ON public.skunkworks_projects FOR UPDATE TO anon USING (true);
CREATE POLICY auth_all_skunkworks     ON public.skunkworks_projects FOR ALL TO authenticated USING (true);

CREATE POLICY anon_select_contributors ON public.skunkworks_contributors FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_contributors ON public.skunkworks_contributors FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_contributors ON public.skunkworks_contributors FOR UPDATE TO anon USING (true);
CREATE POLICY anon_delete_contributors ON public.skunkworks_contributors FOR DELETE TO anon USING (true);

CREATE POLICY anon_select_deliverables ON public.skunkworks_deliverables FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_deliverables ON public.skunkworks_deliverables FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_deliverables ON public.skunkworks_deliverables FOR UPDATE TO anon USING (true);
CREATE POLICY anon_delete_deliverables ON public.skunkworks_deliverables FOR DELETE TO anon USING (true);

CREATE POLICY anon_select_sessions ON public.skunkworks_sessions FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_sessions ON public.skunkworks_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_sessions ON public.skunkworks_sessions FOR UPDATE TO anon USING (true);
CREATE POLICY anon_delete_sessions ON public.skunkworks_sessions FOR DELETE TO anon USING (true);
