import { Outlet } from "react-router-dom";
import { LoadingScreen } from "./LoadingScreen";
import { useAuth } from "../context/auth-context";

function ProtectedRoute() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // For now, allow all access without authentication
  // Replace this with your own auth check if needed
  return <Outlet />;
}

export default ProtectedRoute;
