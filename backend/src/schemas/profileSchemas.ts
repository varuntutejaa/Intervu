import { z } from "zod";
import { avatarDataUrlSchema, resumeDataUrlSchema, roleSchema } from "./common.js";

// Candidate and recruiter profile fields share one payload shape (nullable
// columns on one `profiles` row per (auth_sub, role)) — every field is
// nullish: a partial save (e.g. "Skip for now") omits fields entirely, and
// the frontend routinely round-trips an unchanged nullable column back as
// an explicit `null` (e.g. a profile with no avatar yet) rather than
// omitting the key, so `.optional()` alone would wrongly reject that.
const profileFieldsSchema = z.object({
  fullName: z.string().nullish(),
  phoneNumber: z.string().nullish(),
  desiredRole: z.string().nullish(),
  location: z.string().nullish(),
  experience: z.string().nullish(),
  currentStatus: z.string().nullish(),
  technicalSkills: z.array(z.string()).nullish(),
  softSkills: z.array(z.string()).nullish(),
  linkedinUrl: z.string().nullish(),
  githubUrl: z.string().nullish(),
  portfolioUrl: z.string().nullish(),
  bio: z.string().nullish(),
  resumeFilename: z.string().nullish(),
  resumeData: resumeDataUrlSchema.nullish(),
  resumeUploadedAt: z.string().nullish(),
  companyName: z.string().nullish(),
  jobTitle: z.string().nullish(),
  companyWebsite: z.string().nullish(),
  companySize: z.string().nullish(),
  industry: z.string().nullish(),
  companyBio: z.string().nullish(),
  companyLogoFilename: z.string().nullish(),
  avatarUrl: avatarDataUrlSchema.nullish(),
});

export const saveProfileSchema = z.object({
  role: roleSchema,
  fields: profileFieldsSchema.optional(),
});
export type SaveProfileInput = z.infer<typeof saveProfileSchema>;
