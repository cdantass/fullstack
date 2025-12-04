import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useKeycloak } from "@react-keycloak/web";

const LogoutButton = () => {
  const { keycloak } = useKeycloak();

  const handleLogout = () => {
    keycloak.logout({ redirectUri: window.location.origin });
  };

  return (
    <Button variant={"outline"} onClick={handleLogout} className="">
      <LogOut />
    </Button>
  );
};

export default LogoutButton;
