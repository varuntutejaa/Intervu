import { z } from "zod";
import { APPLICATION_STATUSES, RECOMMENDATIONS } from "../lib/applicationStatus.js";

export const listJobsQuerySchema = z.object({
  q: z.string().trim().optional(),
  jobType: z.string().optional(),
  workMode: z.string().optional(),
  experience: z.string().optional(),
  location: z.string().trim().optional(),
  minSalary: z.coerce.number().int().nonnegative().optional(),
  maxSalary: z.coerce.number().int().nonnegative().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

const jobFieldsCore = {
  title: z.string().trim().min(1),
  company: z.string().trim().min(1),
  location: z.string().trim().min(1),
  jobType: z.string().trim().min(1),
  workMode: z.string().trim().min(1),
  experience: z.string().trim().min(1),
  salaryMin: z.coerce.number().nonnegative().nullish(),
  salaryMax: z.coerce.number().nonnegative().nullish(),
  description: z.string().nullish(),
  skills: z.array(z.string()).optional(),
  applicationDeadline: z.string().nullish(),
  travel: z.string().nullish(),
  discipline: z.string().nullish(),
  responsibilities: z.string().nullish(),
  qualifications: z.string().nullish(),
  companyLogoUrl: z.string().trim().url("companyLogoUrl must be a valid URL.").nullish().or(z.literal("")),
};

export const createJobSchema = z.object(jobFieldsCore);
export type CreateJobInput = z.infer<typeof createJobSchema>;

const jobStatusSchema = z.enum(["open", "closed"]);

// Every field optional — PATCH edits any subset, including just
// { status: "closed" } to close a posting.
export const updateJobSchema = z.object({
  ...Object.fromEntries(Object.entries(jobFieldsCore).map(([key, schema]) => [key, schema.optional()])),
  status: jobStatusSchema.optional(),
}) as z.ZodType<Partial<CreateJobInput> & { status?: "open" | "closed" }>;

const ratingSchema = z.coerce.number().int().min(1).max(5).nullish();

export const updateApplicantSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  feedback: z
    .object({
      technicalRating: ratingSchema,
      communicationRating: ratingSchema,
      overallRating: ratingSchema,
      strengths: z.string().nullish(),
      weaknesses: z.string().nullish(),
      recommendation: z.enum(RECOMMENDATIONS).nullish(),
    })
    .optional(),
});
