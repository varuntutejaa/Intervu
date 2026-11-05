import { z } from "zod";

const optionalNumberString = z
  .string()
  .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Enter a valid number.");

export const jobFormSchema = z.object({
  title: z.string().min(1, "Job title is required."),
  company: z.string().min(1, "Company is required."),
  location: z.string().min(1, "Location is required."),
  jobType: z.string().min(1, "Select a job type."),
  workMode: z.string().min(1, "Select a work mode."),
  experience: z.string().min(1, "Select an experience level."),
  salaryMin: optionalNumberString,
  salaryMax: optionalNumberString,
  description: z.string(),
  skills: z.string(),
  applicationDeadline: z.string(),
  travel: z.string(),
  discipline: z.string(),
  responsibilities: z.string(),
  qualifications: z.string(),
  companyLogoUrl: z.string().refine((v) => v === "" || /^https?:\/\//.test(v), "Enter a valid URL."),
});
export type JobFormValues = z.infer<typeof jobFormSchema>;

export const EMPTY_JOB_FORM_VALUES: JobFormValues = {
  title: "",
  company: "",
  location: "",
  jobType: "",
  workMode: "",
  experience: "",
  salaryMin: "",
  salaryMax: "",
  description: "",
  skills: "",
  applicationDeadline: "",
  travel: "",
  discipline: "",
  responsibilities: "",
  qualifications: "",
  companyLogoUrl: "",
};

const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }));

// Select options for the job form, shared by PostJobPage and EditJobModal.
export const JOB_TYPE_OPTIONS = toOptions(["Full-time", "Part-time", "Internship", "Contract"]);
export const WORK_MODE_OPTIONS = toOptions(["Onsite", "Remote", "Hybrid"]);
export const EXPERIENCE_OPTIONS = [
  { value: "Fresher", label: "Fresher" },
  { value: "1-3 Years", label: "1–3 Years" },
  { value: "3-5 Years", label: "3–5 Years" },
  { value: "5-10 Years", label: "5–10 Years" },
];
export const TRAVEL_OPTIONS = toOptions(["None", "Up to 25%", "25-50%", "50-75%", "75-100%"]);
export const DISCIPLINE_OPTIONS = toOptions([
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "Marketing",
  "Operations",
  "Customer Support",
  "Finance",
  "Human Resources",
  "Other",
]);

// Shared by PostJobPage (create) and recruiter-dashboard's EditJobModal
// (edit) — both submit the same shape to the same underlying fields.
export function jobFormValuesToPayload(values: JobFormValues) {
  return {
    title: values.title,
    company: values.company,
    location: values.location,
    jobType: values.jobType,
    workMode: values.workMode,
    experience: values.experience,
    salaryMin: values.salaryMin ? Number(values.salaryMin) : null,
    salaryMax: values.salaryMax ? Number(values.salaryMax) : null,
    description: values.description,
    skills: values.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean),
    applicationDeadline: values.applicationDeadline || null,
    travel: values.travel || null,
    discipline: values.discipline || null,
    responsibilities: values.responsibilities || null,
    qualifications: values.qualifications || null,
    companyLogoUrl: values.companyLogoUrl || null,
  };
}
