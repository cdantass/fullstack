"use client";

import {
  useState,
  useEffect,
  type ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useKeycloak } from "@react-keycloak/web";

import { AuthContext, type User } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { keycloak, initialized } = useKeycloak();
  const [user, setUser] = useState<User | null>(null);

  const fetchUserData = useCallback(async () => {
    if (keycloak && keycloak.authenticated) {
      const profile = await keycloak.loadUserProfile();
      const mappedUser: User = {
        id: profile.id ?? "",
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email ?? "",
        usertype: keycloak.hasRealmRole("gestor") ? "gestor" : "user", //mudar role
      };
      setUser(mappedUser);
    } else {
      setUser(null);
    }
  }, [keycloak]);

  useEffect(() => {
    if (initialized) {
      fetchUserData();
    }
  }, [initialized, fetchUserData]);

  const value = useMemo(
    () => ({
      user,
      loading: !initialized,
    }),
    [user, initialized]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


