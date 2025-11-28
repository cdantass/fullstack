import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import api from "../../api";

type User = {
  id: number;
  username: string;
  email: string;
  is_gestor: boolean;
  is_superuser: boolean;
  is_staff: boolean;
};


interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem("access");

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await api.get("/me/");
      const data = res.data;

      const mapped: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        is_gestor: data.is_gestor,
        is_superuser: data.is_superuser,
        is_staff: data.is_staff,
      };


      setUser(mapped);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const value = useMemo(
    () => ({ user, loading }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
