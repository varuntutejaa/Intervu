import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { InputGroup, SelectGroup, TextAreaGroup } from "../../../components/aurora/AuroraLayout";
import { useUpdateJobMutation, type Job } from "../../jobs/api";
import {
  DISCIPLINE_OPTIONS,
  EXPERIENCE_OPTIONS,
  JOB_TYPE_OPTIONS,
  TRAVEL_OPTIONS,
  WORK_MODE_OPTIONS,
  jobFormSchema,
  jobFormValuesToPayload,
  type JobFormValues,
} from "../../jobs/schema";

export function EditJobModal({
  job,
  onClose,
  onSaved,
}: {
  job: Job;
  onClose: () => void;
  onSaved: () => void;
}) {
  const updateJobMutation = useUpdateJobMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: job.title,
      company: job.company,
      location: job.location,
      jobType: job.job_type,
      workMode: job.work_mode,
      experience: job.experience,
      salaryMin: job.salary_min?.toString() ?? "",
      salaryMax: job.salary_max?.toString() ?? "",
      description: job.description ?? "",
      skills: job.skills.join(", "),
      applicationDeadline: job.application_deadline ? job.application_deadline.slice(0, 10) : "",
      travel: job.travel ?? "",
      discipline: job.discipline ?? "",
      responsibilities: job.responsibilities ?? "",
      qualifications: job.qualifications ?? "",
      companyLogoUrl: job.company_logo_url ?? "",
    },
  });

  const onSubmit = async (values: JobFormValues) => {
    try {
      await updateJobMutation.mutateAsync({ id: job.id, payload: jobFormValuesToPayload(values) });
      onSaved();
    } catch {
      // surfaced via updateJobMutation.error below
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 bg-black/70" />

      <div className="relative h-[80vh] w-[90vw] overflow-y-auto rounded-2xl border border-black/10 bg-[#f7f7f8] p-6 shadow-2xl sm:h-[70vh] sm:w-[70vw]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/10 hover:text-black"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="pr-8 font-fustat text-2xl font-bold text-black">Edit job</h2>
        <p className="mt-1 text-sm text-black/50">#{job.job_code}</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <InputGroup
                  label="Job title"
                  placeholder=""
                  type="text"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.title?.message}
                />
              )}
            />
            <Controller
              name="company"
              control={control}
              render={({ field }) => (
                <InputGroup
                  label="Company"
                  placeholder=""
                  type="text"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.company?.message}
                />
              )}
            />

            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <InputGroup
                  label="Location"
                  placeholder=""
                  type="text"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.location?.message}
                />
              )}
            />
            <Controller
              name="jobType"
              control={control}
              render={({ field }) => (
                <SelectGroup
                  label="Job type"
                  placeholder="Select a type"
                  value={field.value}
                  onChange={field.onChange}
                  options={JOB_TYPE_OPTIONS}
                  error={errors.jobType?.message}
                />
              )}
            />

            <Controller
              name="workMode"
              control={control}
              render={({ field }) => (
                <SelectGroup
                  label="Work mode"
                  placeholder="Select a mode"
                  value={field.value}
                  onChange={field.onChange}
                  options={WORK_MODE_OPTIONS}
                  error={errors.workMode?.message}
                />
              )}
            />
            <Controller
              name="experience"
              control={control}
              render={({ field }) => (
                <SelectGroup
                  label="Experience"
                  placeholder="Select a level"
                  value={field.value}
                  onChange={field.onChange}
                  options={EXPERIENCE_OPTIONS}
                  error={errors.experience?.message}
                />
              )}
            />

            <Controller
              name="salaryMin"
              control={control}
              render={({ field }) => (
                <InputGroup
                  label="Salary min (₹ per annum)"
                  placeholder=""
                  type="number"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.salaryMin?.message}
                />
              )}
            />
            <Controller
              name="salaryMax"
              control={control}
              render={({ field }) => (
                <InputGroup
                  label="Salary max (₹ per annum)"
                  placeholder=""
                  type="number"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.salaryMax?.message}
                />
              )}
            />

            <Controller
              name="skills"
              control={control}
              render={({ field }) => (
                <InputGroup
                  label="Skills (comma separated)"
                  placeholder=""
                  type="text"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.skills?.message}
                />
              )}
            />
            <Controller
              name="applicationDeadline"
              control={control}
              render={({ field }) => (
                <InputGroup
                  label="Application deadline"
                  placeholder=""
                  type="date"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.applicationDeadline?.message}
                />
              )}
            />

            <Controller
              name="discipline"
              control={control}
              render={({ field }) => (
                <SelectGroup
                  label="Discipline"
                  placeholder="Select a discipline"
                  value={field.value}
                  onChange={field.onChange}
                  options={DISCIPLINE_OPTIONS}
                  error={errors.discipline?.message}
                />
              )}
            />
            <Controller
              name="travel"
              control={control}
              render={({ field }) => (
                <SelectGroup
                  label="Travel"
                  placeholder="Select travel requirement"
                  value={field.value}
                  onChange={field.onChange}
                  options={TRAVEL_OPTIONS}
                  error={errors.travel?.message}
                />
              )}
            />
            <Controller
              name="companyLogoUrl"
              control={control}
              render={({ field }) => (
                <InputGroup
                  label="Company logo URL (optional)"
                  placeholder="https://logo.clearbit.com/yourcompany.com"
                  type="text"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.companyLogoUrl?.message}
                />
              )}
            />
          </div>

          <div className="mt-4 space-y-4">
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextAreaGroup
                  label="Job description / overview"
                  placeholder=""
                  value={field.value}
                  onChange={field.onChange}
                  rows={4}
                  error={errors.description?.message}
                />
              )}
            />
            <Controller
              name="responsibilities"
              control={control}
              render={({ field }) => (
                <TextAreaGroup
                  label="Responsibilities"
                  placeholder=""
                  value={field.value}
                  onChange={field.onChange}
                  rows={4}
                  error={errors.responsibilities?.message}
                />
              )}
            />
            <Controller
              name="qualifications"
              control={control}
              render={({ field }) => (
                <TextAreaGroup
                  label="Qualifications"
                  placeholder=""
                  value={field.value}
                  onChange={field.onChange}
                  rows={4}
                  error={errors.qualifications?.message}
                />
              )}
            />
          </div>

          {updateJobMutation.error && (
            <p className="mt-4 text-sm text-red-600">{updateJobMutation.error.message}</p>
          )}

          <button
            type="submit"
            disabled={updateJobMutation.isPending}
            className="mt-6 h-12 w-full rounded-xl bg-black font-semibold text-white transition-all hover:bg-black/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {updateJobMutation.isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
