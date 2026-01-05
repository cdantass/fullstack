"use client";

import {
  useState,
  useEffect,
  type ReactNode,
  useMemo,
  useCallback,
} from "react";

import { AuthContext, type User } from "./auth-context";
import api from "../api";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// Helper function to decode JWT and extract user info

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get("/api/me");
      const data = res.data;

      const isGestor =
        data.is_superuser ||
        data.is_staff ||
        (typeof data.is_gestor === "string" &&
          data.is_gestor.toLowerCase() === "true") ||
        data.is_gestor === true; // Handle potential boolean too just in case

      setUser({
        id: String(data.id),
        name: data.username || data.name,
        email: data.email,
        usertype: isGestor ? "gestor" : "user",
      });
    } catch (error) {
      console.error("Failed to fetch user", error);
      // se der um erro 401 talvez deslogar o usuário?
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for existing token on mount
  useEffect(() => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const authorizeUser = useCallback(
    async (accessToken: string, refreshToken: string) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      await fetchUser();
    },
    [fetchUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
    window.location.href = "/login";
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
