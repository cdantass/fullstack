import { Navigate } from "react-router-dom";
import { useAuth } from "../pages/context/AdminContext";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Carregando...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.usertype !== "gestor") return <Navigate to="/" replace />;

  return <>{children}</>;
}
