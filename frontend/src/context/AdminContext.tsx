"use client";

import { useState, useEffect, type ReactNode, useMemo } from "react";

import { AuthContext, type User } from "./auth-context";

// Mock user for development - no lugar do keycloak
const mockUser: User = {
  id: "1",
  name: "Usuário Teste",
  email: "usuario@example.com",
  usertype: "gestor", // mudar para "user" ou "gestor" para testar roles
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(mockUser);
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
