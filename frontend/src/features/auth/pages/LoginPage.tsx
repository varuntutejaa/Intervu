import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AuroraRoleQuestion,
  AuroraShell,
  InputGroup,
  PasswordField,
  SocialAuthOptions,
} from "../../../components/aurora/AuroraLayout";
import { useLoginMutation } from "../api";
import { loginSchema, type LoginFormValues } from "../schema";
import { useAuthFlowStore } from "../store";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get("error");
  const { pendingRole, setPendingRole } = useAuthFlowStore();
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLoginMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const session = await loginMutation.mutateAsync({ ...values, role: pendingRole ?? undefined });
      if (session?.role && !session.roles.includes(session.role)) {
        navigate(`/profile-setup?role=${session.role}`);
      } else {
        navigate("/");
      }
    } catch {
      // surfaced via loginMutation.error below
    }
  };

  return (
    <AuroraShell
      brand="Intervu"
      heroTitle="Welcome back"
      heroDescription="Sign in to pick up right where you left off."
    >
      {pendingRole === null ? (
        <AuroraRoleQuestion
          title="Log in as..."
          description="So we can take you to the right place."
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
              {pendingRole === "candidate" ? "Welcome back, candidate" : "Welcome back, recruiter"}
            </h2>
            <p className="mt-2 text-sm text-black/40">
              {pendingRole === "candidate"
                ? "Log in to keep working on your resume."
                : "Log in to keep sourcing great candidates."}
            </p>
          </div>

          <SocialAuthOptions role={pendingRole} />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <InputGroup
                  label="Email"
                  placeholder="you@example.com"
                  type="email"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <PasswordField
                  value={field.value}
                  onChange={field.onChange}
                  showPassword={showPassword}
                  onToggleShowPassword={setShowPassword}
                  error={errors.password?.message}
                />
              )}
            />

            {(loginMutation.error ?? oauthError) && (
              <p className="text-sm text-red-600">
                {loginMutation.error?.message ?? oauthError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="mt-4 h-14 w-full rounded-xl bg-black font-semibold text-white transition-all hover:bg-black/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loginMutation.isPending ? "Logging in…" : "Log in"}
            </button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-black/40">
        Don't have an account?{" "}
        <Link to="/signup" className="font-medium text-black underline underline-offset-2">
          Sign up
        </Link>
      </p>
    </AuroraShell>
  );
}
