import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
import { useSessionQuery } from "../features/auth/api";
import LoginPage from "../features/auth/pages/LoginPage";
import SignupPage from "../features/auth/pages/SignupPage";
import ViewCandidatesPage from "../features/candidates/pages/ViewCandidatesPage";
import LandingPage from "../features/landing/pages/LandingPage";
import ApplicationsPage from "../features/applications/pages/ApplicationsPage";
import JobDetailPage from "../features/jobs/pages/JobDetailPage";
import JobsPage from "../features/jobs/pages/JobsPage";
import PostJobPage from "../features/jobs/pages/PostJobPage";
import ProfilePage from "../features/profile/pages/ProfilePage";
import ProfileSetupPage from "../features/profile/pages/ProfileSetupPage";
import RecruiterDashboardPage from "../features/recruiter-dashboard/pages/RecruiterDashboardPage";
import type { Role } from "../types";

function FullPageLoader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white">
      <p className="text-sm text-black/50">Loading…</p>
    </div>
  );
}

// Any authenticated user — mirrors the backend's getAuthUser-only checks
// (profile.ts's GET/POST /api/profile).
function RequireAuth() {
  const { data: session, isPending } = useSessionQuery();
  if (isPending) return <FullPageLoader />;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Authenticated AND holding a profile for the given role — mirrors the
// backend's requireRole(req, res, role) gate. An authenticated account that
// simply hasn't set up this role yet gets sent to set it up, not a dead end,
// matching the existing switch-role/login product behavior.
function RequireRole({ role }: { role: Role }) {
  const { data: session, isPending } = useSessionQuery();
  if (isPending) return <FullPageLoader />;
  if (!session) return <Navigate to="/login" replace />;
  if (!session.roles.includes(role)) {
    return <Navigate to={`/profile-setup?role=${role}`} replace />;
  }
  return <Outlet />;
}

// "/" doubles as the recruiter dashboard entry point once logged in, so a
// recruiter always lands on their dashboard instead of the marketing/chat page.
//
// It's also where every OAuth login/signup (Google) lands — the
// backend callback always redirects to PUBLIC_URL (a bare "/"), a full page
// load, not a client-side navigation. So this is the one place that has to
// catch "just authenticated but this role has no profile yet" (e.g. a brand
// new Google signup) and send them to set one up, same as RequireRole does
// for routes that are actually guarded.
function HomeRoute() {
  const { data: session, isPending } = useSessionQuery();
  if (isPending) return <FullPageLoader />;
  if (session?.role && !session.roles.includes(session.role)) {
    return <Navigate to={`/profile-setup?role=${session.role}`} replace />;
  }
  if (session?.role === "recruiter") return <Navigate to="/recruiter/dashboard" replace />;
  // The jobs board is the landing page — the AI resume assistant lives at
  // /assistant now (still linked from the nav), not the root.
  return <JobsPage />;
}

export const router = createBrowserRouter([
  { path: "/", element: <HomeRoute /> },
  { path: "/assistant", element: <LandingPage /> },
  { path: "/jobs", element: <JobsPage /> },
  { path: "/jobs/:id", element: <JobDetailPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: "/profile-setup", element: <ProfileSetupPage /> },
      { path: "/profile", element: <ProfilePage /> },
    ],
  },
  {
    element: <RequireRole role="candidate" />,
    children: [{ path: "/applications", element: <ApplicationsPage /> }],
  },
  {
    element: <RequireRole role="recruiter" />,
    children: [
      { path: "/recruiter/dashboard", element: <RecruiterDashboardPage /> },
      { path: "/recruiter/post-job", element: <PostJobPage /> },
      { path: "/recruiter/candidates", element: <ViewCandidatesPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
