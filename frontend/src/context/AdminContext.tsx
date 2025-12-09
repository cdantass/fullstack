"use client";

import {
  useState,
  useEffect,
  type ReactNode,
  useMemo,
  useCallback,
} from "react";

import { AuthContext, type User } from "./auth-context";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// Helper function to decode JWT and extract user info
function decodeToken(token: string): User | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return {
      id: decoded.sub || decoded.user_id || "1",
      name: decoded.name || decoded.username || "Usuário",
      email: decoded.email || "",
      usertype: decoded.is_staff || decoded.is_superuser ? "gestor" : "user",
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
      const decodedUser = decodeToken(accessToken);
      setUser(decodedUser);
    }
    setLoading(false);
  }, []);

  const authorizeUser = useCallback(
    async (accessToken: string, refreshToken: string) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      const decodedUser = decodeToken(accessToken);
      setUser(decodedUser);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
  }, []);

  const isAuthenticated = !!user;

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      authorizeUser,
      logout,
    }),
    [user, loading, isAuthenticated, authorizeUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
