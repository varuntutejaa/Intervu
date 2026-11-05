import { FileText, Sparkles } from "lucide-react";
import { Controller, useWatch, type Control, type FieldErrors } from "react-hook-form";
import {
  FileUploadGroup,
  InputGroup,
  SelectGroup,
  TextAreaGroup,
} from "../../../components/aurora/AuroraLayout";
import { TagInput } from "../../../components/aurora/TagInput";
import { CURRENT_STATUS_OPTIONS, type CandidateProfileFormValues } from "../schema";

const EXPERIENCE_OPTIONS = [
  { value: "0-1", label: "0–1 years" },
  { value: "1-3", label: "1–3 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "5-10", label: "5–10 years" },
  { value: "10+", label: "10+ years" },
];

function formatUploadDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="font-fustat text-lg font-semibold text-black">{title}</h2>;
}

export function CandidateProfileFields({
  control,
  errors,
  existingResumeFilename,
  existingResumeData,
  existingResumeUploadedAt,
  onDeleteResume,
  isDeletingResume,
  deleteResumeError,
  onAutofillFromResume,
  isAutofilling,
  autofillError,
}: {
  control: Control<CandidateProfileFormValues>;
  errors: FieldErrors<CandidateProfileFormValues>;
  existingResumeFilename?: string;
  existingResumeData?: string;
  existingResumeUploadedAt?: string | null;
  onDeleteResume?: () => void;
  isDeletingResume?: boolean;
  deleteResumeError?: string;
  onAutofillFromResume?: (file: File) => void;
  isAutofilling?: boolean;
  autofillError?: string;
}) {
  const resumeFile = useWatch({ control, name: "resume" });
  const canAutofill = resumeFile && isPdf(resumeFile) && onAutofillFromResume;

  return (
    // Two columns on large screens so ~15 fields don't stack into one long
    // scroll — Resume spans both columns since a file picker reads
    // awkwardly at half width, and comes first: picking it is what powers
    // the autofill below, so it makes sense before the fields it fills in.
    <div className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-2">
      <section className="space-y-3 lg:col-span-2">
        <SectionHeading title="Resume" />
        <Controller
          name="resume"
          control={control}
          render={({ field }) => (
            <FileUploadGroup
              label="Upload resume (PDF)"
              file={field.value}
              onChange={field.onChange}
              accept=".pdf,.doc,.docx"
              existingLabel={existingResumeFilename}
              error={errors.resume?.message}
            />
          )}
        />

        {canAutofill && (
          <div>
            <button
              type="button"
              onClick={() => onAutofillFromResume(resumeFile)}
              disabled={isAutofilling}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-black/5 px-3.5 py-1.5 text-xs font-medium text-black transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isAutofilling ? "Reading resume…" : "Autofill from resume"}
            </button>
            {autofillError && <p className="mt-1.5 text-xs text-red-600">{autofillError}</p>}
          </div>
        )}

        {existingResumeData && !resumeFile && (
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={existingResumeData}
              download={existingResumeFilename ?? "resume"}
              className="inline-flex items-center gap-1 text-xs font-medium text-black/60 underline underline-offset-2 hover:text-black"
            >
              <FileText className="h-3 w-3" />
              View current resume
            </a>
            {existingResumeUploadedAt && (
              <span className="text-xs text-black/30">
                Uploaded {formatUploadDate(existingResumeUploadedAt)}
              </span>
            )}
            {onDeleteResume && (
              <button
                type="button"
                onClick={onDeleteResume}
                disabled={isDeletingResume}
                className="text-xs font-medium text-red-600 underline underline-offset-2 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isDeletingResume ? "Removing…" : "Delete resume"}
              </button>
            )}
          </div>
        )}
        {deleteResumeError && <p className="text-xs text-red-600">{deleteResumeError}</p>}
      </section>

      <div className="space-y-6">
        <section className="space-y-3">
          <SectionHeading title="Basic information" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <InputGroup
                  label="Full name"
                  placeholder="Jordan Rivera"
                  type="text"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.fullName?.message}
                />
              )}
            />
            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <InputGroup
                  label="Phone number"
                  placeholder="+1 555 123 4567"
                  type="tel"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.phoneNumber?.message}
                />
              )}
            />
          </div>

          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <InputGroup
                label="Location"
                placeholder="San Francisco, CA"
                type="text"
                value={field.value}
                onChange={field.onChange}
                error={errors.location?.message}
              />
            )}
          />
        </section>

        <section className="space-y-3">
          <SectionHeading title="Professional information" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="desiredRole"
              control={control}
              render={({ field }) => (
                <InputGroup
                  label="Desired role"
                  placeholder="Backend Engineer"
                  type="text"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.desiredRole?.message}
                />
              )}
            />
            <Controller
              name="experience"
              control={control}
              render={({ field }) => (
                <SelectGroup
                  label="Years of experience"
                  placeholder="Select a range"
                  value={field.value}
                  onChange={field.onChange}
                  options={EXPERIENCE_OPTIONS}
                  error={errors.experience?.message}
                />
              )}
            />
          </div>

          <Controller
            name="currentStatus"
            control={control}
            render={({ field }) => (
              <SelectGroup
                label="Current status"
                placeholder="Select your status"
                value={field.value}
                onChange={field.onChange}
                options={CURRENT_STATUS_OPTIONS}
                error={errors.currentStatus?.message}
              />
            )}
          />

          <Controller
            name="bio"
            control={control}
            render={({ field }) => (
              <TextAreaGroup
                label="Professional summary"
                placeholder="A couple sentences about your experience and what you're looking for."
                value={field.value}
                onChange={field.onChange}
                rows={2}
                error={errors.bio?.message}
              />
            )}
          />
        </section>
      </div>

      <div className="space-y-6">
        <section className="space-y-3">
          <SectionHeading title="Skills" />
          <Controller
            name="technicalSkills"
            control={control}
            render={({ field }) => (
              <TagInput
                label="Technical skills"
                placeholder="Type a skill and press Enter"
                value={field.value}
                onChange={field.onChange}
                error={errors.technicalSkills?.message}
              />
            )}
          />
          <Controller
            name="softSkills"
            control={control}
            render={({ field }) => (
              <TagInput
                label="Soft skills (optional)"
                placeholder="Type a skill and press Enter"
                value={field.value}
                onChange={field.onChange}
                error={errors.softSkills?.message}
              />
            )}
          />
        </section>

        <section className="space-y-3">
          <SectionHeading title="Links" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="linkedinUrl"
              control={control}
              render={({ field }) => (
                <InputGroup
                  label="LinkedIn"
                  placeholder="https://linkedin.com/in/you"
                  type="url"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.linkedinUrl?.message}
                />
              )}
            />
            <Controller
              name="githubUrl"
              control={control}
              render={({ field }) => (
                <InputGroup
                  label="GitHub"
                  placeholder="https://github.com/you"
                  type="url"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.githubUrl?.message}
                />
              )}
            />
          </div>
          <Controller
            name="portfolioUrl"
            control={control}
            render={({ field }) => (
              <InputGroup
                label="Portfolio website"
                placeholder="https://you.dev"
                type="url"
                value={field.value}
                onChange={field.onChange}
                error={errors.portfolioUrl?.message}
              />
            )}
          />
        </section>
      </div>
    </div>
  );
}
