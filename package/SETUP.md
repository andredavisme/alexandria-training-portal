# 207 Analytix — Platform Setup Guide

> Use this guide to deploy a fresh instance of the 207 Analytix platform. Everything here is self-contained — Supabase for the database, GitHub Pages for the front end.

---

## Prerequisites

- A Supabase account (free tier works for staging)
- A GitHub account with Pages enabled
- A fork or copy of the `alexandria-training-portal` repo

---

## Step 1 — Supabase Project

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your **Project URL** and **anon public key** from Settings → API
3. In the SQL Editor, run the full contents of `package/schema.sql`
4. Verify all 10 core tables were created under `public`

---

## Step 2 — Seed Reference Data

Run these inserts in the Supabase SQL Editor to populate `team_roles` and `financial_accounts`.

### Team Roles

```sql
INSERT INTO public.team_roles
  (role_type, role_title, tagline, responsibilities, ecosystem_impact, commission_pct, reports_to, headcount_target)
VALUES
  ('founder',       'Co-Founder',    'Owns the vision and operations',       ARRAY['Strategy','Hiring','Ops oversight'],          'Drives all pillars', NULL, NULL, 3),
  ('operator',      'Operator',      'Executes deliverables for clients',    ARRAY['Client work','Deliverable QA','Time tracking'], 'Direct client value', 20, 'founder', 3),
  ('accountant',    'Accountant',    'Manages Profit First accounts',        ARRAY['Bookkeeping','PF allocations','Tax prep'],       'Financial health',    NULL, 'founder', 1),
  ('sales_agent',   'Sales Agent',   'Generates and qualifies leads',        ARRAY['Outreach','Lead intake','Follow-up'],           'Pipeline growth',     15, 'founder', 3);
```

### Financial Accounts (Profit First)

```sql
INSERT INTO public.financial_accounts (name, priority, allocation_pct, current_balance, description)
VALUES
  ('Income',          1, 100, 0, 'All revenue lands here first'),
  ('Owner Pay',       2,  50, 0, '50% of income to founders'),
  ('Tax Reserve',     3,  15, 0, '15% set aside for taxes'),
  ('Operating Exp.',  4,  20, 0, '20% for business expenses'),
  ('Profit',          5,  15, 0, '15% pure profit hold');
```

### Regions (Westbrook 1300)

```sql
INSERT INTO public.regions (name, towns, total_pool, status, phase, unifying_objective)
VALUES
  ('Westbrook Core', ARRAY['Westbrook','Gorham','Windham'], 1300, 'active', 1,
   'First 1,300 businesses in the Westbrook ecosystem');
```

---

## Step 3 — Configure Front End

Every HTML file that calls Supabase has these two constants near the top of its `<script>` block:

```js
const SUPA_URL = 'https://YOUR-PROJECT-ID.supabase.co';
const SUPA_KEY = 'YOUR-ANON-KEY';
```

Do a project-wide find-and-replace for both values. Files that need updating:

| File | Has Supabase calls |
|---|---|
| `intake.html` | ✅ |
| `skunkworks.html` | ✅ |
| `dashboard-accountant.html` | ✅ |
| `dashboard-sales.html` | ✅ |
| `dashboard-operator.html` | ✅ |
| `dashboard-founder-andre.html` | ✅ |
| `dashboard-founder-jacob.html` | ✅ |
| `dashboard-founder-eraj.html` | ✅ |
| `request-access.html` | ✅ (Alexandria training portal — separate) |

---

## Step 4 — GitHub Pages

1. Push the repo to GitHub
2. Go to repo **Settings → Pages**
3. Set source to `main` branch, root folder
4. GitHub Pages will deploy within ~60 seconds
5. Your live URL: `https://YOUR-GITHUB-USERNAME.github.io/alexandria-training-portal/`

---

## Step 5 — Verify

Check these URLs after deploy:

| URL | Expected |
|---|---|
| `/index.html` | Portal home — role nav hub |
| `/intake.html` | 207 Analytix lead intake form (3-step) |
| `/skunkworks.html` | Skunkworks project board |
| `/dashboard-founder-eraj.html` | Eraj — Skunkworks command |
| `/dashboard-founder-jacob.html` | Jacob — Westbrook 1300 scarcity |
| `/dashboard-founder-andre.html` | André — full ops command |
| `/dashboard-accountant.html` | Accountant — Profit First |
| `/dashboard-sales.html` | Sales — lead pipeline |
| `/dashboard-operator.html` | Operator — active queue |

---

## File Structure Reference

```
alexandria-training-portal/
├── index.html                     # Portal home
├── intake.html                    # 207 Analytix client lead intake
├── request-access.html            # Alexandria training portal invite/access
├── skunkworks.html                # Skunkworks board
├── dashboard-accountant.html
├── dashboard-sales.html
├── dashboard-operator.html
├── dashboard-founder-andre.html
├── dashboard-founder-jacob.html
├── dashboard-founder-eraj.html
├── catalog.html
├── commons.html
├── commodities.html
├── course.html
├── discussion.html
├── discussion-thread.html
├── golden-prompts.html
├── operator-training.html
├── progress.html
├── textbook.html
├── fitness-portal.html
├── demo-job-description-portal.html
├── js/
├── package/
│   ├── schema.sql                 # Full core schema — run on fresh Supabase project
│   └── SETUP.md                   # This file
├── .nojekyll
└── README.md
```

---

## Core Schema Tables

| Table | Purpose |
|---|---|
| `leads` | Client intake — full 207 Analytix intake shape |
| `businesses` | Westbrook ecosystem businesses (1,300 cap) |
| `financial_accounts` | Profit First buckets |
| `team_members` | Org roster |
| `team_roles` | Role definitions + commission structure |
| `regions` | Geographic segments for cohort targeting |
| `skunkworks_projects` | R&D / delivery pipeline |
| `skunkworks_contributors` | Per-project contributors |
| `skunkworks_deliverables` | Per-project deliverables |
| `skunkworks_sessions` | AI + work session logs per project |

---

## Migrations Log

| Migration | Description |
|---|---|
| `schema_cleanup_indexes_drop_orphans` | Dropped orphaned `projects` table. Added indexes on core tables. Added table comments. |
| `leads_extend_schema_207_analytix` | Extended leads table with full 207 Analytix intake shape. Backfilled first/last name from legacy name field. |

---

*207 Analytix — Portland, ME — April 2026*
