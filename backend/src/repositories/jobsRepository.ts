import { pool } from "../lib/db.js";

const JOB_FIELDS =
  "id, title, company, location, job_type, work_mode, experience, salary_min, salary_max, description, skills, application_deadline, job_code, status, created_at, travel, discipline, responsibilities, qualifications, company_logo_url";

// Only used on read paths that actually display a count (list/detail) — not
// worth the subquery on write paths (create/update RETURNING), where the
// count would always just be 0 or unchanged.
const JOB_FIELDS_WITH_APPLICANT_COUNT =
  `${JOB_FIELDS}, (SELECT count(*)::int FROM applications a WHERE a.job_id = jobs.id) AS applicant_count`;

export interface JobFilters {
  q?: string;
  // Comma-separated lists (e.g. "Remote,Hybrid") — split into a real array
  // and matched with = ANY(...) so the sidebar's checkbox facets can select
  // more than one value per group.
  jobType?: string;
  workMode?: string;
  experience?: string;
  location?: string;
  minSalary?: number;
  maxSalary?: number;
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function buildPublicWhere(filters: JobFilters): { where: string; params: unknown[] } {
  // Closed postings drop out of the public board entirely — not filterable
  // back in, this isn't a candidate-facing option.
  const conditions: string[] = ["status = 'open'"];
  const params: unknown[] = [];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    conditions.push(
      `(title ILIKE $${params.length} OR company ILIKE $${params.length} OR EXISTS (SELECT 1 FROM unnest(skills) s WHERE s ILIKE $${params.length}))`,
    );
  }
  if (filters.jobType) {
    const values = splitCsv(filters.jobType);
    if (values.length) {
      params.push(values);
      conditions.push(`job_type = ANY($${params.length})`);
    }
  }
  if (filters.workMode) {
    const values = splitCsv(filters.workMode);
    if (values.length) {
      params.push(values);
      conditions.push(`work_mode = ANY($${params.length})`);
    }
  }
  if (filters.experience) {
    const values = splitCsv(filters.experience);
    if (values.length) {
      params.push(values);
      conditions.push(`experience = ANY($${params.length})`);
    }
  }
  if (filters.location) {
    params.push(`%${filters.location}%`);
    conditions.push(`location ILIKE $${params.length}`);
  }
  // Range-overlap semantics: a job qualifies if its own range could reach
  // the requested floor/ceiling, not only if it's fully contained within
  // it — a job with no upper bound listed shouldn't be excluded by a max
  // filter just because it never stated one.
  if (filters.minSalary !== undefined) {
    params.push(filters.minSalary);
    conditions.push(`(salary_max IS NULL OR salary_max >= $${params.length})`);
  }
  if (filters.maxSalary !== undefined) {
    params.push(filters.maxSalary);
    conditions.push(`(salary_min IS NULL OR salary_min <= $${params.length})`);
  }

  return { where: conditions.join(" AND "), params };
}

export async function findJobs(filters: JobFilters, limit: number, offset: number) {
  const { where, params } = buildPublicWhere(filters);
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT ${JOB_FIELDS_WITH_APPLICANT_COUNT} FROM jobs WHERE ${where} ORDER BY id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return result.rows;
}

export async function countJobs(filters: JobFilters): Promise<number> {
  const { where, params } = buildPublicWhere(filters);
  const result = await pool.query(`SELECT count(*)::int AS count FROM jobs WHERE ${where}`, params);
  return result.rows[0].count;
}

// Companies with the most currently-open postings — everything returned
// here (open_positions, titles, has_remote, latest_posted_at) is a real
// aggregate over actual job rows, not fabricated company-profile data
// (Intervu has no employer/company entity, so counts like size or funding
// status don't exist to query).
export async function findTrendingCompanies(limit: number) {
  const result = await pool.query(
    `SELECT
       company,
       (array_agg(company_logo_url ORDER BY id DESC) FILTER (WHERE company_logo_url IS NOT NULL))[1] AS company_logo_url,
       count(*)::int AS open_positions,
       array_agg(DISTINCT title) AS titles,
       bool_or(work_mode = 'Remote') AS has_remote,
       max(created_at) AS latest_posted_at
     FROM jobs
     WHERE status = 'open'
     GROUP BY company
     ORDER BY open_positions DESC, latest_posted_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
}

function buildRecruiterJobsWhere(sub: string, q?: string): { where: string; params: unknown[] } {
  const conditions = ["posted_by = $1"];
  const params: unknown[] = [sub];
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(title ILIKE $${params.length} OR company ILIKE $${params.length} OR job_code ILIKE $${params.length})`);
  }
  return { where: conditions.join(" AND "), params };
}

export async function findJobsByRecruiter(sub: string, q: string | undefined, limit: number, offset: number) {
  const { where, params } = buildRecruiterJobsWhere(sub, q);
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT ${JOB_FIELDS_WITH_APPLICANT_COUNT} FROM jobs WHERE ${where} ORDER BY id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return result.rows;
}

export async function countJobsByRecruiter(sub: string, q: string | undefined): Promise<number> {
  const { where, params } = buildRecruiterJobsWhere(sub, q);
  const result = await pool.query(`SELECT count(*)::int AS count FROM jobs WHERE ${where}`, params);
  return result.rows[0].count;
}

export async function findJobById(id: number) {
  const result = await pool.query(`SELECT ${JOB_FIELDS_WITH_APPLICANT_COUNT} FROM jobs WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function findJobOwner(id: number): Promise<string | null | undefined> {
  const result = await pool.query<{ posted_by: string | null }>("SELECT posted_by FROM jobs WHERE id = $1", [id]);
  if (result.rowCount === 0) return undefined; // not found
  return result.rows[0].posted_by;
}

export async function jobCodeExists(code: string): Promise<boolean> {
  const result = await pool.query("SELECT 1 FROM jobs WHERE job_code = $1", [code]);
  return (result.rowCount ?? 0) > 0;
}

export interface JobWriteFields {
  title?: string | null;
  company?: string | null;
  location?: string | null;
  jobType?: string | null;
  workMode?: string | null;
  experience?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  description?: string | null;
  skills?: string[] | null;
  applicationDeadline?: string | null;
  travel?: string | null;
  discipline?: string | null;
  responsibilities?: string | null;
  qualifications?: string | null;
  companyLogoUrl?: string | null;
}

export async function insertJob(fields: JobWriteFields, jobCode: string, postedBy: string) {
  const result = await pool.query(
    `INSERT INTO jobs (
       title, company, location, job_type, work_mode, experience,
       salary_min, salary_max, description, skills, application_deadline,
       job_code, posted_by, travel, discipline, responsibilities, qualifications, company_logo_url
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
     RETURNING ${JOB_FIELDS}`,
    [
      fields.title,
      fields.company,
      fields.location,
      fields.jobType,
      fields.workMode,
      fields.experience,
      fields.salaryMin ?? null,
      fields.salaryMax ?? null,
      fields.description ?? null,
      fields.skills ?? [],
      fields.applicationDeadline ?? null,
      jobCode,
      postedBy,
      fields.travel ?? null,
      fields.discipline ?? null,
      fields.responsibilities ?? null,
      fields.qualifications ?? null,
      fields.companyLogoUrl ?? null,
    ],
  );
  return result.rows[0];
}

export async function updateJob(id: number, fields: JobWriteFields, status: string | null) {
  const result = await pool.query(
    `UPDATE jobs SET
       title = COALESCE($1, title),
       company = COALESCE($2, company),
       location = COALESCE($3, location),
       job_type = COALESCE($4, job_type),
       work_mode = COALESCE($5, work_mode),
       experience = COALESCE($6, experience),
       salary_min = COALESCE($7, salary_min),
       salary_max = COALESCE($8, salary_max),
       description = COALESCE($9, description),
       skills = COALESCE($10, skills),
       application_deadline = COALESCE($11, application_deadline),
       status = COALESCE($12, status),
       travel = COALESCE($13, travel),
       discipline = COALESCE($14, discipline),
       responsibilities = COALESCE($15, responsibilities),
       qualifications = COALESCE($16, qualifications),
       company_logo_url = COALESCE($17, company_logo_url)
     WHERE id = $18
     RETURNING ${JOB_FIELDS}`,
    [
      fields.title ?? null,
      fields.company ?? null,
      fields.location ?? null,
      fields.jobType ?? null,
      fields.workMode ?? null,
      fields.experience ?? null,
      fields.salaryMin ?? null,
      fields.salaryMax ?? null,
      fields.description ?? null,
      fields.skills ?? null,
      fields.applicationDeadline ?? null,
      status,
      fields.travel ?? null,
      fields.discipline ?? null,
      fields.responsibilities ?? null,
      fields.qualifications ?? null,
      fields.companyLogoUrl ?? null,
      id,
    ],
  );
  return result.rows[0];
}

// Everything the paginated applicant list needs to render a row and the
// expanded detail view — except resume_data, which is a base64-encoded
// file blob. At real scale (the whole point of paginating this), fetching
// that for every row on every page would dwarf the rest of the payload for
// no reason; it's fetched separately, only for the one applicant currently
// expanded, via findApplicantDetail below.
const APPLICANT_LIST_FIELDS = `
  a.id AS application_id, a.status, a.applied_on,
  a.feedback_technical_rating, a.feedback_communication_rating, a.feedback_overall_rating,
  a.feedback_strengths, a.feedback_weaknesses, a.feedback_recommendation,
  p.auth_sub, p.email, p.full_name, p.phone_number, p.desired_role, p.location, p.experience,
  p.current_status, p.technical_skills, p.soft_skills, p.linkedin_url, p.github_url,
  p.portfolio_url, p.bio, p.resume_filename, p.resume_uploaded_at, p.avatar_url
`;

function buildApplicantSearchWhere(jobId: number, q?: string): { where: string; params: unknown[] } {
  const conditions = ["a.job_id = $1"];
  const params: unknown[] = [jobId];
  if (q) {
    params.push(`%${q}%`);
    conditions.push(
      `(p.full_name ILIKE $${params.length} OR p.email ILIKE $${params.length} OR p.desired_role ILIKE $${params.length})`,
    );
  }
  return { where: conditions.join(" AND "), params };
}

export async function findApplicantsForJob(jobId: number, q: string | undefined, limit: number, offset: number) {
  const { where, params } = buildApplicantSearchWhere(jobId, q);
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT ${APPLICANT_LIST_FIELDS}
     FROM applications a
     JOIN profiles p ON p.auth_sub = a.candidate_sub
     WHERE ${where}
     ORDER BY a.applied_on DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return result.rows;
}

export async function countApplicantsForJob(jobId: number, q: string | undefined): Promise<number> {
  const { where, params } = buildApplicantSearchWhere(jobId, q);
  const result = await pool.query(
    `SELECT count(*)::int AS count FROM applications a JOIN profiles p ON p.auth_sub = a.candidate_sub WHERE ${where}`,
    params,
  );
  return result.rows[0].count;
}

// Full detail for exactly one applicant, including the resume blob —
// fetched on demand when a recruiter expands that row, not as part of the
// list.
// The resume shown here is the one actually attached to this application
// (via resume_id, snapshotting a specific pick from the candidate's resume
// library at apply time), falling back to whatever's on their profile for
// applications made before that feature existed or without picking one.
export async function findApplicantDetail(jobId: number, applicationId: number) {
  const result = await pool.query(
    `SELECT a.id AS application_id, a.status, a.applied_on,
            a.feedback_technical_rating, a.feedback_communication_rating, a.feedback_overall_rating,
            a.feedback_strengths, a.feedback_weaknesses, a.feedback_recommendation,
            p.auth_sub, p.email, p.full_name, p.phone_number, p.desired_role, p.location, p.experience,
            p.current_status, p.technical_skills, p.soft_skills, p.linkedin_url, p.github_url,
            p.portfolio_url, p.bio,
            COALESCE(r.filename, p.resume_filename) AS resume_filename,
            COALESCE(r.data, p.resume_data) AS resume_data,
            COALESCE(r.uploaded_at, p.resume_uploaded_at) AS resume_uploaded_at,
            p.avatar_url
     FROM applications a
     JOIN profiles p ON p.auth_sub = a.candidate_sub
     LEFT JOIN resumes r ON r.id = a.resume_id
     WHERE a.job_id = $1 AND a.id = $2`,
    [jobId, applicationId],
  );
  return result.rows[0] ?? null;
}

export interface ApplicantFeedbackFields {
  status: string | null;
  technicalRating: number | null;
  communicationRating: number | null;
  overallRating: number | null;
  strengths: string | null;
  weaknesses: string | null;
  recommendation: string | null;
}

export async function updateApplicant(jobId: number, applicationId: number, fields: ApplicantFeedbackFields) {
  const result = await pool.query(
    `UPDATE applications SET
       status = COALESCE($1, status),
       feedback_technical_rating = COALESCE($2, feedback_technical_rating),
       feedback_communication_rating = COALESCE($3, feedback_communication_rating),
       feedback_overall_rating = COALESCE($4, feedback_overall_rating),
       feedback_strengths = COALESCE($5, feedback_strengths),
       feedback_weaknesses = COALESCE($6, feedback_weaknesses),
       feedback_recommendation = COALESCE($7, feedback_recommendation),
       updated_at = now()
     WHERE id = $8 AND job_id = $9
     RETURNING id, status, feedback_technical_rating, feedback_communication_rating,
               feedback_overall_rating, feedback_strengths, feedback_weaknesses, feedback_recommendation`,
    [
      fields.status,
      fields.technicalRating,
      fields.communicationRating,
      fields.overallRating,
      fields.strengths,
      fields.weaknesses,
      fields.recommendation,
      applicationId,
      jobId,
    ],
  );
  return result.rows[0] ?? null;
}

// --- Recruiter dashboard stats ---

export async function findRecruiterJobsForStats(sub: string) {
  const result = await pool.query("SELECT id, title, status FROM jobs WHERE posted_by = $1 ORDER BY id DESC", [
    sub,
  ]);
  return result.rows;
}

export async function findApplicationCountsByJob(sub: string) {
  const result = await pool.query(
    `SELECT a.job_id, a.status, count(*)::int AS count
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     WHERE j.posted_by = $1
     GROUP BY a.job_id, a.status`,
    [sub],
  );
  return result.rows;
}

export async function countCandidateProfiles(): Promise<number> {
  const result = await pool.query("SELECT count(*)::int AS count FROM profiles WHERE role = 'candidate'");
  return result.rows[0].count;
}

// Counts distinct candidates with a resume anywhere — either the single
// profile-level resume (used for AI autofill) or at least one resume in
// their library (resumes table) — without double-counting someone who has
// both.
export async function countUploadedResumes(): Promise<number> {
  const result = await pool.query(
    `SELECT count(DISTINCT sub)::int AS count FROM (
       SELECT auth_sub AS sub FROM profiles WHERE role = 'candidate' AND resume_data IS NOT NULL
       UNION
       SELECT candidate_sub AS sub FROM resumes
     ) AS resume_owners`,
  );
  return result.rows[0].count;
}

export async function findTopCompanies() {
  const result = await pool.query(
    `SELECT COALESCE(a.company, j.company) AS company, count(*)::int AS count
     FROM applications a
     LEFT JOIN jobs j ON j.id = a.job_id
     WHERE COALESCE(a.company, j.company) IS NOT NULL
     GROUP BY COALESCE(a.company, j.company)
     ORDER BY count DESC
     LIMIT 5`,
  );
  return result.rows;
}

export async function countApplicationsByStatuses(statuses: string[]): Promise<number> {
  const result = await pool.query("SELECT count(*)::int AS count FROM applications WHERE status = ANY($1)", [
    statuses,
  ]);
  return result.rows[0].count;
}
