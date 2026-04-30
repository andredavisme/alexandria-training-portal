# 207 Analytix — Alexandria Portal

> Internal operating platform for 207 Analytix. Built on Supabase + GitHub Pages. All files deployed flat at root. Do not restructure without updating nav links.

---

## Live URL

**https://andredavisme.github.io/alexandria-training-portal/**

---

## File Map

### Core (207 Analytix)

| File | Purpose |
|---|---|
| `index.html` | Main portal entry — role-based nav hub |
| `request-access.html` | Public-facing intake / lead capture form |
| `skunkworks.html` | Skunkworks project management board |

### Dashboards

| File | Role | Color |
|---|---|---|
| `dashboard-accountant.html` | Accountant | Gold |
| `dashboard-sales.html` | Sales Agent | Green |
| `dashboard-operator.html` | Operator | Blue |
| `dashboard-founder-andre.html` | André Davis — Co-Founder / LOO (Pre-Day 0 Command Center) | Violet |
| `dashboard-founder-jacob.html` | Jacob Hutton — Co-Founder / LMO (Scarcity Command) | Green |
| `dashboard-founder-eraj.html` | Eraj Ismatulloev — Co-Founder / Lead Dev (Skunkworks Command) | Gold |

### Training Portal

| File | Purpose |
|---|---|
| `catalog.html` | Course catalog browser |
| `commons.html` | Commons milestone and role tracker |
| `commodities.html` | Commoditized deliverables library |
| `course.html` | Individual course viewer |
| `discussion.html` | Discussion board index |
| `discussion-thread.html` | Individual thread view |
| `golden-prompts.html` | Golden prompt library (community-sourced) |
| `operator-training.html` | Operator onboarding and training modules |
| `progress.html` | Student progress tracker |
| `textbook.html` | Internal knowledge base / textbook |

### Standalone / Demo

| File | Purpose |
|---|---|
| `fitness-portal.html` | Fitness incentive portal (multi-tenant) |
| `demo-job-description-portal.html` | Job description builder demo |

### Infra

| File | Purpose |
|---|---|
| `.nojekyll` | Disables Jekyll processing on GitHub Pages |
| `js/` | Shared JavaScript utilities |
| `.github/` | GitHub Actions / workflow configs |

---

## Supabase Schema — Core 207 Tables

| Table | Purpose |
|---|---|
| `leads` | Lead intake. Cols: name, email, business_name, city, pitch_type, message, status, created_at |
| `businesses` | Westbrook ecosystem businesses. `is_active=true` counts toward 1,300 cap |
| `financial_accounts` | Profit First buckets. Ordered by `priority` |
| `team_members` | Org roster. Joined to `team_roles` |
| `team_roles` | Role defs: `founder`, `operator`, `accountant`, `sales_agent` |
| `regions` | Geographic segments for lead cohort targeting |
| `skunkworks_projects` | Project pipeline. Status: `planning`, `active`, `commoditized`, `archived` |
| `skunkworks_contributors` | Contributors per project |
| `skunkworks_deliverables` | Deliverables per project |
| `skunkworks_sessions` | Work sessions per project |

### Training Portal Tables

`activities`, `class_courses`, `classes`, `commodities`, `commons_milestones`, `commons_progress`, `commons_roles`, `course_modules`, `courses`, `discussion_posts`, `discussion_threads`, `golden_prompts`, `journal_prompts`, `modules`, `schools`, `student_sessions`, `students`, `teachers`, `thread_replies`, `training_manuals`

### Fitness Tables

`fitness_activity_logs`, `fitness_employees`, `fitness_reward_events`, `fitness_reward_rules`, `fitness_tenants`

### Shared Utility

`application_log`, `faq_answered`, `messages`, `questions_inbox`

---

## ⚠️ Known Schema Gap

The `leads` table currently stores: `name, email, business_name, city, pitch_type, message, status`.

Dashboards are designed to display: `first_name`, `last_name`, `industry`, `service_tier`, `project_type`, `budget_range`, `how_did_you_hear`.

**Next action:** Migrate `leads` to the extended schema or add these columns before go-live.

---

## Founders

| Name | Role | Domain |
|---|---|---|
| André Davis | Co-Founder / Lead Operating Officer | Operations (Pre-Day 0: covering all) |
| Jacob Hutton | Co-Founder / Lead Marketing Officer | Marketing / Westbrook 1300 |
| Eraj Ismatulloev | Co-Founder / Lead Developer | Dev / Skunkworks |

---

## Migrations Applied

| Migration | Description |
|---|---|
| `schema_cleanup_indexes_drop_orphans` | Dropped orphaned `projects` table. Added indexes on leads, businesses, skunkworks_projects, team_members, financial_accounts. Added table comments. |

---

*Last updated: April 2026*
