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
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";

type User = {
  id: number;
  name: string;
  email: string;
  usertype: "gestor" | "user";
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authorizeUser: (access: string, refresh: string) => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        setUser(null);
        return;
      }

      const response = await fetch("http://localhost/api/me/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status}`);
      }

      const data = await response.json();
      const mappedUser: User = {
        id: data.id,
        name: data.username,
        email: data.email,
        usertype: data.is_gestor ? "gestor" : "user",
      };
      setUser(mappedUser);
    } catch (error) {
      console.error("Auth Error:", error);
      setUser(null);
      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(REFRESH_TOKEN);
    } finally {
      setLoading(false);
    }
  }, []);

  const authorizeUser = async (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN, accessToken);
    localStorage.setItem(REFRESH_TOKEN, refreshToken);
    await fetchUserData();
  };

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const value = useMemo(
    () => ({
      user,
      loading,
      authorizeUser,
      setUser,
    }),
    [user, loading]
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
