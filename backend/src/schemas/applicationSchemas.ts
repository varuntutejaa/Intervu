import { z } from "zod";
import { APPLICATION_STATUSES } from "../lib/applicationStatus.js";

const applicationStatusSchema = z.enum(APPLICATION_STATUSES);

export const listApplicationsQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: applicationStatusSchema.optional().or(z.literal("")),
  sort: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

// A jobId applies to a real posting; company+position logs one made
// off-platform — the service picks which of these to validate against
// based on whether `jobId` is present, so each mode keeps its own precise
// error messages instead of a combined union error.
export const jobApplicationSchema = z.object({
  jobId: z.coerce.number({ message: "Invalid jobId." }).int({ message: "Invalid jobId." }).positive({ message: "Invalid jobId." }),
  resumeId: z.coerce
    .number({ message: "Pick a resume to apply with." })
    .int({ message: "Pick a resume to apply with." })
    .positive({ message: "Pick a resume to apply with." }),
});

export const manualApplicationSchema = z.object({
  company: z.string().trim().min(1, "Company and position are required."),
  position: z.string().trim().min(1, "Company and position are required."),
  appliedOn: z.string().optional(),
  status: applicationStatusSchema.optional(),
});

export const updateApplicationSchema = z.object({
  status: applicationStatusSchema.optional(),
  company: z.string().trim().min(1).optional(),
  position: z.string().trim().min(1).optional(),
  appliedOn: z.string().optional(),
});
