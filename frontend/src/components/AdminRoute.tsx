import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
import { LoadingScreen } from "./LoadingScreen";

type AdminRouteProps = {
  children: ReactNode;
};

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return <LoadingScreen />;
  }

  if (!keycloak.authenticated || !keycloak.hasRealmRole("gestor")) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
