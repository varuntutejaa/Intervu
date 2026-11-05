import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import {
  AuroraRoleQuestion,
  AuroraShell,
  InputGroup,
  PasswordField,
  SocialAuthOptions,
} from "../../../components/aurora/AuroraLayout";
import { useSignupMutation } from "../api";
import { signupSchema, type SignupFormValues } from "../schema";
import { useAuthFlowStore } from "../store";

const STRENGTH_LABELS = ["Weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const strength = getPasswordStrength(password);

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i < strength ? STRENGTH_COLORS[strength] : "bg-black/10"}`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-black/40">{STRENGTH_LABELS[strength]}</p>
    </div>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { pendingRole, setPendingRole } = useAuthFlowStore();
  const [showPassword, setShowPassword] = useState(false);

  const signupMutation = useSignupMutation();

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });
  const password = signupForm.watch("password");

  const onSubmitForm = async (values: SignupFormValues) => {
    try {
      await signupMutation.mutateAsync({
        email: values.email,
        password: values.password,
        name: values.fullName,
        role: pendingRole ?? undefined,
      });
      navigate("/profile-setup");
    } catch {
      // surfaced via signupMutation.error below
    }
  };

  return (
    <AuroraShell
      brand="Intervu"
      heroTitle="Join Intervu"
      heroDescription="AI-reviewed resumes, curated job matches, and one place to track every application."
    >
      {pendingRole === null ? (
        <AuroraRoleQuestion
          title="How will you use Intervu?"
          description="This just tailors what you see next — you can't get this wrong."
          onSelect={setPendingRole}
        />
      ) : (
        <>
          <div>
            <button
              type="button"
              onClick={() => setPendingRole(null)}
              className="text-xs font-medium text-black/40 underline underline-offset-2 transition-colors hover:text-black"
            >
              Change role
            </button>
            <h2 className="mt-3 text-3xl font-medium tracking-tight text-black">
              {pendingRole === "candidate"
                ? "Create your candidate account"
                : "Create your recruiter account"}
            </h2>
            <p className="mt-2 text-sm text-black/40">
              Input your basic details to begin the journey.
            </p>
          </div>

          <SocialAuthOptions />

          <form onSubmit={signupForm.handleSubmit(onSubmitForm)} className="space-y-4">
            <Controller
              name="fullName"
              control={signupForm.control}
              render={({ field }) => (
                <InputGroup
                  label="Full name"
                  placeholder="Jordan Rivera"
                  type="text"
                  value={field.value}
                  onChange={field.onChange}
                  error={signupForm.formState.errors.fullName?.message}
                />
              )}
            />

            <Controller
              name="email"
              control={signupForm.control}
              render={({ field }) => (
                <InputGroup
                  label="Email"
                  placeholder="you@example.com"
                  type="email"
                  value={field.value}
                  onChange={field.onChange}
                  error={signupForm.formState.errors.email?.message}
                />
              )}
            />

            <Controller
              name="password"
              control={signupForm.control}
              render={({ field }) => (
                <PasswordField
                  value={field.value}
                  onChange={field.onChange}
                  showPassword={showPassword}
                  onToggleShowPassword={setShowPassword}
                  error={signupForm.formState.errors.password?.message}
                >
                  <PasswordStrengthBar password={password} />
                </PasswordField>
              )}
            />

            <Controller
              name="confirmPassword"
              control={signupForm.control}
              render={({ field }) => (
                <div>
                  <label className="text-sm font-medium text-black">Confirm password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={field.value}
                    onChange={field.onChange}
                    className="mt-2 h-11 w-full rounded-xl border-none bg-brand-gray px-4 text-black placeholder:text-black/20 focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {signupForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              )}
            />

            {signupMutation.error && (
              <p className="text-sm text-red-600">{signupMutation.error.message}</p>
            )}

            <button
              type="submit"
              disabled={signupMutation.isPending}
              className="mt-4 h-14 w-full rounded-xl bg-black font-semibold text-white transition-all hover:bg-black/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {signupMutation.isPending ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-black/40">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-black underline underline-offset-2">
          Log in
        </Link>
      </p>
    </AuroraShell>
  );
}
