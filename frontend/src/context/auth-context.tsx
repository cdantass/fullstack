import { createContext, useContext } from "react";

export type User = {
  id: string;
  name: string;
  email: string;
  usertype: "gestor" | "user"; //mudar role
};

export interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
