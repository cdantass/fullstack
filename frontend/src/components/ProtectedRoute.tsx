import { useKeycloak } from "@react-keycloak/web";
import { Outlet } from "react-router-dom";
import { LoadingScreen } from "./LoadingScreen";

function ProtectedRoute() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return <LoadingScreen />;
  }

  if (!keycloak.authenticated) {
    keycloak.login({ redirectUri: window.location.origin });
    return <LoadingScreen />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
