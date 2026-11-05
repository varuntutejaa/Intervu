import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiJson } from "../../lib/api";
import type { NavUser, Role } from "../../types";

export type Session = { user: NavUser; role: Role | null; roles: Role[] };

const sessionKey = ["session"] as const;

async function fetchSession(): Promise<Session | null> {
  try {
    return await apiFetch<Session>("/api/auth/me");
  } catch {
    return null;
  }
}

export function useSessionQuery() {
  return useQuery({ queryKey: sessionKey, queryFn: fetchSession });
}

// Signup also logs the new account in, so the session is refreshed here
// the same way login does.
export function useSignupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; password: string; name: string; role?: Role }) => {
      await apiJson("/api/auth/signup", "POST", input, "Couldn't create your account. Try again.");
      return fetchSession();
    },
    onSuccess: (session) => {
      queryClient.setQueryData(sessionKey, session);
    },
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; password: string; role?: Role }) => {
      await apiJson("/api/auth/login", "POST", input, "Couldn't log in. Try again.");
      return fetchSession();
    },
    onSuccess: (session) => {
      queryClient.setQueryData(sessionKey, session);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiJson<{ status: string }>("/api/auth/logout", "POST"),
    onSuccess: () => {
      queryClient.setQueryData(sessionKey, null);
    },
  });
}

