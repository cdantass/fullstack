import { LogOut } from "lucide-react";
import { Button } from "./ui/button";

const LogoutButton = () => {

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    window.location.href = "/login";
  };

  return (
    <Button variant="outline" onClick={handleLogout}>
      <LogOut />
    </Button>
  );
};

export default LogoutButton;
