import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiJson } from "../../lib/api";
import type { Role } from "../../types";

export type ProfileRow = {
  email: string;
  role: Role;
  full_name: string | null;
  phone_number: string | null;
  desired_role: string | null;
  location: string | null;
  experience: string | null;
  current_status: string | null;
  technical_skills: string[] | null;
  soft_skills: string[] | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  bio: string | null;
  resume_filename: string | null;
  resume_data: string | null;
  resume_uploaded_at: string | null;
  company_name: string | null;
  job_title: string | null;
  company_website: string | null;
  company_size: string | null;
  industry: string | null;
  company_bio: string | null;
  company_logo_filename: string | null;
  avatar_url: string | null;
};

const profileKey = ["profile"] as const;

export function useProfileQuery() {
  return useQuery({
    queryKey: profileKey,
    queryFn: () => apiFetch<{ profile: ProfileRow | null }>("/api/profile"),
  });
}

export function useSaveProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { role: Role; fields: Record<string, unknown> }) =>
      apiJson<{ status: string }>(
        "/api/profile",
        "POST",
        input,
        "Couldn't save your profile. Try again.",
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKey });
      // Saving sets the account's activeRole cookie server-side.
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

export function useDeleteResumeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiJson<{ status: string }>(
        "/api/profile/resume",
        "DELETE",
        undefined,
        "Couldn't delete resume. Try again.",
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey }),
  });
}

export type ParsedResumeFields = {
  fullName: string;
  phoneNumber: string;
  location: string;
  desiredRole: string;
  experience: string;
  technicalSkills: string[];
  softSkills: string[];
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  bio: string;
};

export function useParseResumeMutation() {
  return useMutation({
    mutationFn: (resumeData: string) =>
      apiJson<{ fields: ParsedResumeFields }>(
        "/api/resume/parse",
        "POST",
        { resumeData },
        "Couldn't read that resume. Try again.",
      ),
  });
}
