"use client";

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { api } from "../api";
import { ACCESS_TOKEN } from "@/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/pages/context/AdminContext";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { authorizeUser } = useAuth();

const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const res = await api.post("/token/", { username, password }); 

    const accessToken = res.data.access;
    const refreshToken = res.data.refresh;

    await authorizeUser(accessToken, refreshToken);

    navigate("/");

  } catch (err: any) {
    setError(
      err.response?.data?.detail ||
        "Login falhou. Por favor, verifique suas credenciais."
    );
  } finally {
    setLoading(false);
  }
};


  // Fake login
  const handleFakeLogin = () => {
    const fakeToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRldiBVc2VyIiwiZXhwIjoyNTE2MjM5MDIyfQ.5Oq2nLDBiBFp_9H13p-e-oDAN_0zotDXtC9n1z_ST-c";
    localStorage.setItem(ACCESS_TOKEN, fakeToken);
    navigate("/");
  };

  return (
    <div
      className={cn("flex flex-col items-center justify-center", className)}
      {...props}
    >
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Login</CardTitle>
          <CardDescription>Secretaria do Estado da Fazenda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  className="border-gray-300"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="border-gray-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando ..." : "Entrar"}
              </Button>
            </div>
          </form>

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={handleFakeLogin}
          >
            Token LocalStorage
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginForm;
