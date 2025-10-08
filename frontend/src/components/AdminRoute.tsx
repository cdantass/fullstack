import { type ReactNode } from "react";import { Navigate } from "react-router-dom";
import { useAuth } from "../pages/context/AdminContext";

type AdminRouteProps = {
  children: ReactNode;
};

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();

  console.log("AdminRoute -> loading:", loading, "user:", user);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || user.usertype !== "gestor") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
