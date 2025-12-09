import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { LoadingScreen } from "./LoadingScreen";
import { useAuth } from "../context/auth-context";

type AdminRouteProps = {
  children: ReactNode;
};

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || user.usertype !== "gestor") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
