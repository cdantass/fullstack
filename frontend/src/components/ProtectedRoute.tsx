import { Navigate } from "react-router-dom";
import { useAuth } from "../pages/context/AdminContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Carregando...</p>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
