import { z } from "zod";
import { roleSchema } from "./common.js";

export const signupSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().trim().optional(),
  role: roleSchema.optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email and password are required."),
  password: z.string().min(1, "Email and password are required."),
  role: roleSchema.optional(),
});

export const switchRoleSchema = z.object({
  role: roleSchema,
});
