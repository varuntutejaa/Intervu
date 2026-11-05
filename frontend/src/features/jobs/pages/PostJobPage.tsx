import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NavBar } from "../../../components/chrome/NavBar";
import { InputGroup, SelectGroup, TextAreaGroup } from "../../../components/aurora/AuroraLayout";
import { useProfileQuery } from "../../profile/api";
import { useCreateJobMutation } from "../api";
import {
  DISCIPLINE_OPTIONS,
  EMPTY_JOB_FORM_VALUES,
  EXPERIENCE_OPTIONS,
  JOB_TYPE_OPTIONS,
  TRAVEL_OPTIONS,
  WORK_MODE_OPTIONS,
  jobFormSchema,
  jobFormValuesToPayload,
  type JobFormValues,
} from "../schema";

export default function PostJobPage() {
  const profileQuery = useProfileQuery();
  const createJobMutation = useCreateJobMutation();
  const [jobCode, setJobCode] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: EMPTY_JOB_FORM_VALUES,
  });

  // Autofill from the recruiter's own profile so they aren't retyping their
  // company name on every posting.
  useEffect(() => {
    const companyName = profileQuery.data?.profile?.company_name;
    if (companyName) reset((prev) => ({ ...prev, company: companyName }));
  }, [profileQuery.data, reset]);

  const onSubmit = async (values: JobFormValues) => {
    setJobCode("");
    try {
      const result = await createJobMutation.mutateAsync(jobFormValuesToPayload(values));
      reset(EMPTY_JOB_FORM_VALUES);
      setJobCode(result.job_code);
    } catch {
      // surfaced via createJobMutation.error below
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="fixed inset-x-0 top-0 z-20">
        <NavBar />
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-10 pt-28 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
        <h1 className="font-fustat text-3xl font-bold text-black">Post a job</h1>
        <p className="mt-2 text-sm text-black/40">
          This goes straight into the public jobs board candidates browse.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <InputGroup
                  label="Job title"
                  placeholder="Software Engineer Intern"
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
                  placeholder="Hewlett Packard Enterprise"
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
                  placeholder="Bangalore, India"
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
                  placeholder="600000"
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
                  placeholder="900000"
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
                  placeholder="React, Node.js, AWS"
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

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextAreaGroup
                label="Job description / overview"
                placeholder="A brief overview of the role."
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
                placeholder="What this person will actually do, day to day."
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
                placeholder="What a candidate needs to bring to the role."
                value={field.value}
                onChange={field.onChange}
                rows={4}
                error={errors.qualifications?.message}
              />
            )}
          />

          {createJobMutation.error && (
            <p className="text-sm text-red-600">{createJobMutation.error.message}</p>
          )}
          {jobCode && (
            <p className="text-sm text-emerald-600">
              Job posted. Reference code: <span className="font-semibold">{jobCode}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={createJobMutation.isPending}
            className="h-14 w-full rounded-xl bg-black font-semibold text-white transition-all hover:bg-black/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {createJobMutation.isPending ? "Posting…" : "Post job"}
          </button>
        </form>
      </div>
    </div>
  );
}
