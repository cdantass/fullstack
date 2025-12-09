import { Navigate, Outlet } from "react-router-dom";
import { LoadingScreen } from "./LoadingScreen";
import { useAuth } from "../context/auth-context";

function ProtectedRoute() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
