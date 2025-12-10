import { LogOut } from "lucide-react";
import { Button } from "./ui/button";

import { useAuth } from "@/context/auth-context";

const LogoutButton = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    console.log("Logout clicked");
    logout();
  };

  return (
    <Button variant={"outline"} onClick={handleLogout} className="">
      <LogOut />
    </Button>
  );
};

export default LogoutButton;
