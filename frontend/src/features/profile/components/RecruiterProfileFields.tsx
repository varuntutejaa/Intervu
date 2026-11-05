import { Controller, type Control, type FieldErrors } from "react-hook-form";
import {
  FileUploadGroup,
  InputGroup,
  SelectGroup,
  TextAreaGroup,
} from "../../../components/aurora/AuroraLayout";
import type { RecruiterProfileFormValues } from "../schema";

const COMPANY_SIZE_OPTIONS = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-500", label: "201–500 employees" },
  { value: "500+", label: "500+ employees" },
];

export function RecruiterProfileFields({
  control,
  errors,
  existingCompanyLogoFilename,
}: {
  control: Control<RecruiterProfileFormValues>;
  errors: FieldErrors<RecruiterProfileFormValues>;
  existingCompanyLogoFilename?: string;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="companyName"
          control={control}
          render={({ field }) => (
            <InputGroup
              label="Company name"
              placeholder="Northwind"
              type="text"
              value={field.value}
              onChange={field.onChange}
              error={errors.companyName?.message}
            />
          )}
        />
        <Controller
          name="jobTitle"
          control={control}
          render={({ field }) => (
            <InputGroup
              label="Your job title"
              placeholder="Head of Talent"
              type="text"
              value={field.value}
              onChange={field.onChange}
              error={errors.jobTitle?.message}
            />
          )}
        />
      </div>

      <Controller
        name="companyWebsite"
        control={control}
        render={({ field }) => (
          <InputGroup
            label="Company website"
            placeholder="https://northwind.com"
            type="url"
            value={field.value}
            onChange={field.onChange}
            error={errors.companyWebsite?.message}
          />
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="companySize"
          control={control}
          render={({ field }) => (
            <SelectGroup
              label="Company size"
              placeholder="Select a size"
              value={field.value}
              onChange={field.onChange}
              options={COMPANY_SIZE_OPTIONS}
              error={errors.companySize?.message}
            />
          )}
        />
        <Controller
          name="industry"
          control={control}
          render={({ field }) => (
            <InputGroup
              label="Industry"
              placeholder="Software"
              type="text"
              value={field.value}
              onChange={field.onChange}
              error={errors.industry?.message}
            />
          )}
        />
      </div>

      <Controller
        name="companyBio"
        control={control}
        render={({ field }) => (
          <TextAreaGroup
            label="Company description"
            placeholder="A couple sentences about what your company does."
            value={field.value}
            onChange={field.onChange}
            error={errors.companyBio?.message}
          />
        )}
      />

      <Controller
        name="companyLogo"
        control={control}
        render={({ field }) => (
          <FileUploadGroup
            label="Company logo"
            file={field.value}
            onChange={field.onChange}
            accept="image/*"
            existingLabel={existingCompanyLogoFilename}
            error={errors.companyLogo?.message}
          />
        )}
      />
    </>
  );
}
