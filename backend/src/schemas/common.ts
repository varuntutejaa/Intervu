import { z } from "zod";
import { dataUrlByteSize, dataUrlMimeType } from "../lib/dataUrl.js";

export const roleSchema = z.enum(["candidate", "recruiter"]);

// Mirrors the frontend's own limits (lib/files.ts) — enforced here too since
// a direct API call bypasses whatever the browser checks.
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_RESUME_BYTES = 4 * 1024 * 1024;

export const resumeDataUrlSchema = z
  .string()
  .refine((v) => v.startsWith("data:"), "resumeData must be a data URL.")
  .refine((v) => dataUrlMimeType(v) === "application/pdf", "Resume must be a PDF.")
  .refine((v) => dataUrlByteSize(v) <= MAX_RESUME_BYTES, "Resume must be under 4MB.");

export const avatarDataUrlSchema = z
  .string()
  .refine((v) => v.startsWith("data:"), "avatarUrl must be a data URL.")
  .refine((v) => dataUrlMimeType(v).startsWith("image/"), "Avatar must be an image.")
  .refine((v) => dataUrlByteSize(v) <= MAX_AVATAR_BYTES, "Avatar must be under 2MB.");
