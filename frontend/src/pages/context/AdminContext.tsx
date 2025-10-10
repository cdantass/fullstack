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
  usertype: "gestor" | "user";
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
    if (keycloak?.authenticated) {
      try {
        const profile = await keycloak.loadUserProfile();
        const mappedUser: User = {
          id: profile.id ?? "",
          name:
            `${profile.firstName} ${profile.lastName}`.trim() ||
            profile.username ||
            "",
          email: profile.email ?? "",
          usertype: keycloak.hasRealmRole("gestor") ? "gestor" : "user",
        };
        setUser(mappedUser);
      } catch (error) {
        console.error("Failed to load user profile:", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [keycloak]);

  useEffect(() => {
    if (initialized) {
      fetchUserData();
    }
  }, [initialized, fetchUserData, keycloak.token]);

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