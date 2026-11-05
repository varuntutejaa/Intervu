import { useRef } from "react";
import { motion } from "motion/react";
import { Briefcase, ChevronDown, ChevronRight, Eye, EyeOff, Upload, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Role } from "../../types";

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Shared shell for the Aurora-styled pages (signup, login, profile setup):
// a video hero on the left with a staggered reveal, and a
// fading-in form column on the right.
export function AuroraShell({
  brand,
  heroTitle,
  heroDescription,
  children,
}: {
  brand: string;
  heroTitle: string;
  heroDescription: string;
  children: ReactNode;
}) {
  return (
    <main className="font-aurora flex min-h-screen w-full bg-white p-2 selection:bg-black/30 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4">
      <div className="relative hidden h-full w-[52%] flex-col items-center justify-center overflow-hidden rounded-3xl border border-black/10 bg-brand-gray px-12 lg:flex">
        <motion.div
          className="relative z-10 w-full max-w-xs space-y-8"
          initial="hidden"
          animate="visible"
          variants={CONTAINER_VARIANTS}
        >
          <motion.div variants={ITEM_VARIANTS} className="text-center">
            <Link to="/" className="text-7xl font-bold tracking-tight text-black">
              {brand}
            </Link>
            <p className="mt-5 text-xl font-medium tracking-tight text-black">{heroTitle}</p>
            <p className="mt-3 px-4 text-sm leading-relaxed text-black/60">{heroDescription}</p>
          </motion.div>
        </motion.div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-12 sm:px-12 lg:overflow-hidden lg:px-16 lg:py-6 xl:px-24">
        <motion.div
          className="w-full max-w-xl space-y-8 sm:space-y-10 lg:space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </div>
    </main>
  );
}

// Shared first step for Aurora login/signup — asks which kind of account
// this is before showing role-specific content.
export function AuroraRoleQuestion({
  title,
  description,
  onSelect,
}: {
  title: string;
  description: string;
  onSelect: (role: Role) => void;
}) {
  return (
    <>
      <h2 className="text-3xl font-medium tracking-tight text-black">{title}</h2>
      <p className="mt-2 text-sm text-black/40">{description}</p>

      <div className="mt-2 flex flex-col gap-3">
        <AuroraRoleCard
          icon={User}
          title="I'm a candidate"
          description="Reviewing my resume and looking for a role"
          onClick={() => onSelect("candidate")}
        />
        <AuroraRoleCard
          icon={Briefcase}
          title="I'm a recruiter"
          description="Sourcing and evaluating candidates"
          onClick={() => onSelect("recruiter")}
        />
      </div>
    </>
  );
}

function AuroraRoleCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3.5 rounded-xl bg-brand-gray p-4 text-left transition-colors hover:bg-black/10"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-black">{title}</span>
        <span className="mt-0.5 block text-xs text-black/50">{description}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-black/25 transition-transform group-hover:translate-x-0.5 group-hover:text-black/50" />
    </button>
  );
}

type IconComponent = LucideIcon | ((props: { className?: string }) => ReactNode);

function SocialButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  href,
}: {
  icon: IconComponent;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
}) {
  const className =
    "flex h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white text-sm font-medium text-black transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50";

  if (href) {
    return (
      <a href={href} className={className}>
        <Icon className="h-4 w-4" />
        {label}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// A Google link plus the "Or" divider — these always appear together, in
// this order, across every Aurora auth page. This is a plain link to this
// server's OAuth kickoff route, which redirects through Google's own login
// page and back to a callback that creates the same kind of session cookie
// the email/password login route does. A full page navigation, not a popup, so there's no
// client-side token handling here.
//
// `role` is only meaningful on the Login page — it's round-tripped through
// the OAuth `state` param so the callback can reject signing into an
// account that isn't actually set up as that role (see routes/oauth.ts).
// Signup leaves it unset, since adding a new role to an existing account is
// exactly what an unconstrained OAuth signup should allow.
export function SocialAuthOptions({ role }: { role?: Role | null }) {
  const suffix = role ? `?role=${role}` : "";
  return (
    <>
      <SocialButton icon={GoogleLogo} label="Google" href={`/api/auth/google/start${suffix}`} />

      <div className="flex items-center">
        <div className="h-px flex-1 bg-black/10" />
        <span className="bg-white px-4 text-xs font-medium tracking-widest text-black/40 uppercase">
          Or
        </span>
        <div className="h-px flex-1 bg-black/10" />
      </div>
    </>
  );
}

export function PasswordField({
  label = "Password",
  value,
  onChange,
  showPassword,
  onToggleShowPassword,
  error,
  children,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShowPassword: (value: boolean) => void;
  error?: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-black">{label}</label>
      <div className="relative mt-2">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-xl border-none bg-brand-gray px-4 pr-11 text-black placeholder:text-black/20 focus:outline-none focus:ring-2 focus:ring-black/20"
        />
        <button
          type="button"
          onClick={() => onToggleShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 transition-colors hover:text-black"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {children}
    </div>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function InputGroup({
  label,
  placeholder,
  type,
  value,
  onChange,
  error,
}: {
  label: string;
  placeholder: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-black">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-xl border-none bg-brand-gray px-4 text-black placeholder:text-black/20 focus:outline-none focus:ring-2 focus:ring-black/20"
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function TextAreaGroup({
  label,
  placeholder,
  value,
  onChange,
  rows = 3,
  error,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  error?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-black">{label}</label>
      <textarea
        placeholder={placeholder}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full resize-none rounded-xl border-none bg-brand-gray px-4 py-3 text-black placeholder:text-black/20 focus:outline-none focus:ring-2 focus:ring-black/20"
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function SelectGroup({
  label,
  placeholder,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-black">{label}</label>
      <div className="relative mt-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-xl border-none bg-brand-gray px-4 pr-10 text-black focus:outline-none focus:ring-2 focus:ring-black/20"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function FileUploadGroup({
  label,
  file,
  onChange,
  accept,
  existingLabel,
  error,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  existingLabel?: string;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="text-sm font-medium text-black">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-2 flex h-11 w-full items-center gap-2 rounded-xl border-none bg-brand-gray px-4 text-left text-sm text-black/60 transition-colors hover:bg-black/10"
      >
        <Upload className="h-4 w-4 shrink-0 text-black/40" />
        <span className="truncate">{file ? file.name : (existingLabel ?? "Choose a file")}</span>
      </button>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
