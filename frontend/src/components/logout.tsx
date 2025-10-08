import { LogOut } from "lucide-react";
import { ACCESS_TOKEN } from "../constants";
import { Button } from "./ui/button";

const LogoutButton = () => {
  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    window.location.href = "/login";
  };

  return (
    <Button variant={"outline"} onClick={handleLogout} className="">
      <LogOut />
    </Button>
  );
};

export default LogoutButton;
