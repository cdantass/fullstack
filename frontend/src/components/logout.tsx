import { LogOut } from "lucide-react";
import { Button } from "./ui/button";

const LogoutButton = () => {
  const handleLogout = () => {
    console.log("Logout clicked");
    window.location.href = "/";
  };

  return (
    <Button variant={"outline"} onClick={handleLogout} className="">
      <LogOut />
    </Button>
  );
};

// Irrelevante sem keycloak
export default LogoutButton;
