"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useKeycloak } from "@react-keycloak/web";

type User = {
  id: string;
  name: string;
  email: string;
  usertype: "gestor" | "user"; //mudar role
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
