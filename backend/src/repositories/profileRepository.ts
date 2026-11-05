import { pool } from "../lib/db.js";
import type { SaveProfileInput } from "../schemas/profileSchemas.js";

export async function findProfile(sub: string, role: "candidate" | "recruiter") {
  const result = await pool.query("SELECT * FROM profiles WHERE auth_sub = $1 AND role = $2", [sub, role]);
  return result.rows[0] ?? null;
}

// One email can only ever be one role — a candidate profile blocks that
// same address from ever becoming a recruiter, and vice versa. Checked by
// email (not auth_sub) since email/password and Google OAuth each mint a
// different sub for the same person.
export async function hasProfileForOtherRole(email: string, role: "candidate" | "recruiter"): Promise<boolean> {
  const result = await pool.query("SELECT 1 FROM profiles WHERE lower(email) = lower($1) AND role != $2 LIMIT 1", [
    email,
    role,
  ]);
  return (result.rowCount ?? 0) > 0;
}

export async function upsertProfile(
  sub: string,
  email: string,
  input: SaveProfileInput,
): Promise<void> {
  const f = input.fields ?? {};

  await pool.query(
    `INSERT INTO profiles (
       auth_sub, email, role,
       full_name, phone_number, desired_role, location, experience, current_status,
       technical_skills, soft_skills, linkedin_url, github_url, portfolio_url, bio,
       resume_filename, resume_data, resume_uploaded_at,
       company_name, job_title, company_website, company_size, industry, company_bio, company_logo_filename,
       avatar_url,
       updated_at
     ) VALUES (
       $1, $2, $3,
       $4, $5, $6, $7, $8, $9,
       $10, $11, $12, $13, $14, $15,
       $16, $17, $18,
       $19, $20, $21, $22, $23, $24, $25,
       $26,
       now()
     )
     ON CONFLICT (auth_sub, role) DO UPDATE SET
       email = EXCLUDED.email,
       full_name = EXCLUDED.full_name,
       phone_number = EXCLUDED.phone_number,
       desired_role = EXCLUDED.desired_role,
       location = EXCLUDED.location,
       experience = EXCLUDED.experience,
       current_status = EXCLUDED.current_status,
       technical_skills = EXCLUDED.technical_skills,
       soft_skills = EXCLUDED.soft_skills,
       linkedin_url = EXCLUDED.linkedin_url,
       github_url = EXCLUDED.github_url,
       portfolio_url = EXCLUDED.portfolio_url,
       bio = EXCLUDED.bio,
       resume_filename = EXCLUDED.resume_filename,
       resume_data = EXCLUDED.resume_data,
       resume_uploaded_at = EXCLUDED.resume_uploaded_at,
       company_name = EXCLUDED.company_name,
       job_title = EXCLUDED.job_title,
       company_website = EXCLUDED.company_website,
       company_size = EXCLUDED.company_size,
       industry = EXCLUDED.industry,
       company_bio = EXCLUDED.company_bio,
       company_logo_filename = EXCLUDED.company_logo_filename,
       avatar_url = EXCLUDED.avatar_url,
       updated_at = now()`,
    [
      sub,
      email,
      input.role,
      f.fullName ?? null,
      f.phoneNumber ?? null,
      f.desiredRole ?? null,
      f.location ?? null,
      f.experience ?? null,
      f.currentStatus ?? null,
      f.technicalSkills ?? null,
      f.softSkills ?? null,
      f.linkedinUrl ?? null,
      f.githubUrl ?? null,
      f.portfolioUrl ?? null,
      f.bio ?? null,
      f.resumeFilename ?? null,
      f.resumeData ?? null,
      f.resumeUploadedAt ?? null,
      f.companyName ?? null,
      f.jobTitle ?? null,
      f.companyWebsite ?? null,
      f.companySize ?? null,
      f.industry ?? null,
      f.companyBio ?? null,
      f.companyLogoFilename ?? null,
      f.avatarUrl ?? null,
    ],
  );
}

export async function findCandidateResumeData(sub: string): Promise<string | null> {
  const result = await pool.query<{ resume_data: string | null }>(
    "SELECT resume_data FROM profiles WHERE auth_sub = $1 AND role = 'candidate'",
    [sub],
  );
  return result.rows[0]?.resume_data ?? null;
}

export async function clearResume(sub: string): Promise<void> {
  await pool.query(
    `UPDATE profiles SET resume_filename = NULL, resume_data = NULL, resume_uploaded_at = NULL, updated_at = now()
     WHERE auth_sub = $1 AND role = 'candidate'`,
    [sub],
  );
}
