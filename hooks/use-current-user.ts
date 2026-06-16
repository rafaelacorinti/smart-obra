import { useSession } from "next-auth/react";
import { SessionUser } from "@/types";

export function useCurrentUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user as SessionUser | undefined,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
