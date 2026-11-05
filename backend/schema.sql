CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'Full-time',
  work_mode TEXT NOT NULL DEFAULT 'Onsite',
  experience TEXT NOT NULL DEFAULT 'Fresher',
  salary_min INTEGER,
  salary_max INTEGER,
  description TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  application_deadline DATE,
  -- random 6-digit reference code, allotted when a recruiter posts a job
  job_code TEXT,
  -- auth_sub of the recruiter who posted it
  posted_by TEXT,
  -- 'open' or 'closed' — closed jobs drop out of the public listing but stay
  -- visible (and editable) to the recruiter who posted them
  status TEXT NOT NULL DEFAULT 'open'
);

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS posted_by TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_code TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type TEXT NOT NULL DEFAULT 'Full-time';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_mode TEXT NOT NULL DEFAULT 'Onsite';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience TEXT NOT NULL DEFAULT 'Fresher';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_min INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_max INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_deadline DATE;
-- Superseded by salary_min/salary_max — a single free-text range can't be
-- filtered or sorted on.
ALTER TABLE jobs DROP COLUMN IF EXISTS salary;

-- "Date posted" on the job detail page. Backfills to now() for existing rows
-- rather than NULL since every job was posted at some point.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
-- How much travel the role expects (e.g. "None", "Up to 25%") — free text,
-- constrained to a fixed option list client-side, same convention as
-- job_type/work_mode/experience above.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS travel TEXT;
-- Job family/category (e.g. "Engineering", "Sales") shown alongside
-- employment type on the job detail page.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS discipline TEXT;
-- Longer-form sections shown on the job detail page, separate from the
-- free-form `description` overview.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS responsibilities TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS qualifications TEXT;
-- Shown next to the listing/detail view — a URL, not an upload (jobs have
-- no file-storage need otherwise), so any publicly reachable image works.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('Applied', 'Interviewing', 'Offer', 'Rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- One row per candidate application to a specific job — job details and
-- applicant identity are looked up via job_id/candidate_sub rather than
-- duplicated here.
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_sub TEXT NOT NULL,
  status application_status NOT NULL DEFAULT 'Applied',
  applied_on DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE applications ADD COLUMN IF NOT EXISTS job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS candidate_sub TEXT;
-- The table predates this file's CREATE TABLE ... DEFAULT clauses, so those
-- defaults never applied to the existing status/applied_on columns.
ALTER TABLE applications ALTER COLUMN status SET DEFAULT 'Applied';
ALTER TABLE applications ALTER COLUMN applied_on SET DEFAULT CURRENT_DATE;

-- Candidates can also log applications made outside the platform (no
-- job_id), so job_id is nullable and company/position_title carry the
-- details directly for those rows. For applications to a real posting on
-- this platform, these stay NULL and the values are looked up via job_id
-- instead — see the COALESCE(a.company, j.company) pattern in the routes.
ALTER TABLE applications ALTER COLUMN job_id DROP NOT NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS position_title TEXT;

-- Replaces the original 4-stage pipeline with the full hiring pipeline
-- (Applied -> Interview Scheduled -> Technical Round -> HR Round ->
-- Offer Received / Rejected). Postgres can't drop/rename enum values
-- in place, so this builds a new type, migrates the column across
-- (mapping old labels to their closest new stage), then swaps the name in
-- — safe to re-run since the USING mapping also passes new-format values
-- through unchanged.
DO $$ BEGIN
  CREATE TYPE application_status_v2 AS ENUM (
    'Applied', 'Interview Scheduled', 'Technical Round', 'HR Round', 'Offer Received', 'Rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE applications ALTER COLUMN status DROP DEFAULT;
ALTER TABLE applications ALTER COLUMN status TYPE application_status_v2 USING (
  CASE status::text
    WHEN 'Scheduled' THEN 'Interview Scheduled'
    WHEN 'Interviewing' THEN 'Technical Round'
    WHEN 'Offer' THEN 'Offer Received'
    WHEN 'Applied' THEN 'Applied'
    WHEN 'Rejected' THEN 'Rejected'
    WHEN 'Interview Scheduled' THEN 'Interview Scheduled'
    WHEN 'Technical Round' THEN 'Technical Round'
    WHEN 'HR Round' THEN 'HR Round'
    WHEN 'Offer Received' THEN 'Offer Received'
    ELSE 'Applied'
  END
)::application_status_v2;
ALTER TABLE applications ALTER COLUMN status SET DEFAULT 'Applied';
DROP TYPE IF EXISTS application_status;
ALTER TYPE application_status_v2 RENAME TO application_status;

-- A candidate can withdraw their own application to a real posting (see
-- applications.ts's PATCH /:id/withdraw) instead of deleting the row
-- outright, so the recruiter still sees what happened to it.
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'Withdrawn';

-- Structured post-interview feedback, replacing the old single free-text
-- note — a recruiter fills these in from an applicant's card. Ratings are
-- 1-5; recommendation is one of RECOMMENDATIONS in applicationStatus.ts.
ALTER TABLE applications DROP COLUMN IF EXISTS feedback;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS feedback_technical_rating SMALLINT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS feedback_communication_rating SMALLINT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS feedback_overall_rating SMALLINT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS feedback_strengths TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS feedback_weaknesses TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS feedback_recommendation TEXT;

-- Tracks when a recruiter last changed status/feedback — applied_on only
-- ever records the original application date, so there was no way to know
-- when a candidate's status last moved (needed for the notification bell's
-- "recruiter responded" events).
ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Enforced in the DB, not just checked in the route, so two near-simultaneous
-- "Apply" submissions can't race past a check-then-insert into two rows.
-- Manually-logged applications (job_id NULL) never collide here — Postgres
-- treats every NULL as distinct from every other NULL in a unique index.
CREATE UNIQUE INDEX IF NOT EXISTS applications_job_candidate_unique
  ON applications (job_id, candidate_sub);

-- Email/password accounts. Passwords are stored only as salted scrypt
-- hashes (see src/lib/password.ts). Google sign-ins don't get a row here;
-- their identity is "google:<id>".
CREATE TABLE IF NOT EXISTS users (
  sub TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (lower(email));

-- One row per (person, role) — a single login can hold both a candidate and
-- a recruiter profile at once and switch between them (see activeRole in
-- the session), keyed by their auth identity's `sub` — users.sub for an
-- email/password account, or "google:<id>" for Google sign-in. Candidate and
-- recruiter fields share one table (nullable columns) since the two field
-- sets never overlap within a single row.
DO $$ BEGIN
  CREATE TYPE profile_role AS ENUM ('candidate', 'recruiter');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  auth_sub TEXT NOT NULL,
  email TEXT NOT NULL,
  role profile_role NOT NULL,

  -- candidate fields
  desired_role TEXT,
  location TEXT,
  experience TEXT,
  portfolio_url TEXT,
  skills TEXT,
  bio TEXT,
  resume_filename TEXT,
  -- the resume file itself, stored as a data: URL
  resume_data TEXT,

  -- recruiter fields
  company_name TEXT,
  job_title TEXT,
  company_website TEXT,
  company_size TEXT,
  industry TEXT,
  company_bio TEXT,
  company_logo_filename TEXT,

  -- profile picture, stored as a data: URL
  avatar_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (auth_sub, role)
);

-- Re-running this file against a database created before avatar_url existed
-- (CREATE TABLE IF NOT EXISTS won't retroactively add columns) should still
-- pick it up.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_data TEXT;

-- Databases created before dual-role support had auth_sub alone as the
-- primary key — widen it so the same login can hold one row per role.
-- Safe to re-run: dropping+re-adding an already-composite key is a no-op.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE profiles ADD PRIMARY KEY (auth_sub, role);

-- Expanded candidate profile: contact details, employment status, a
-- proper technical/soft skill list (was a single free-text field), split
-- LinkedIn/GitHub links (was one generic portfolio_url), and a timestamp
-- for the resume so the UI can show "uploaded on <date>".
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS technical_skills TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS soft_skills TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_uploaded_at TIMESTAMPTZ;

-- One-time backfill from the old comma-separated `skills` text field into
-- the new technical_skills array, then drop it. Guarded on the column still
-- existing — once dropped, a later re-run of this file would otherwise fail
-- with "column skills does not exist" instead of being a no-op.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'skills'
  ) THEN
    UPDATE profiles
    SET technical_skills = (
      SELECT array_remove(array_agg(NULLIF(trim(s), '')), NULL)
      FROM unnest(string_to_array(skills, ',')) AS s
    )
    WHERE skills IS NOT NULL AND technical_skills IS NULL;
  END IF;
END $$;
ALTER TABLE profiles DROP COLUMN IF EXISTS skills;

-- A candidate's resume library — separate from profiles.resume_data (which
-- stays as the single resume used for AI parsing/autofill on the profile
-- form). This is what lets someone keep multiple named resumes and choose
-- which one to attach to a given application.
CREATE TABLE IF NOT EXISTS resumes (
  id SERIAL PRIMARY KEY,
  candidate_sub TEXT NOT NULL,
  filename TEXT NOT NULL,
  data TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS resumes_candidate_sub_idx ON resumes (candidate_sub);

-- Snapshots which resume (if any) was actually submitted with this
-- application — a candidate's library can change after applying, so this
-- has to be recorded per-application, not looked up live off the profile.
ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL;
