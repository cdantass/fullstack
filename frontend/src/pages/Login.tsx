import { useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");
  if (token) {
    return <Navigate to="/" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/api/token/", {
        username,
        password,
      });

      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);

      setRedirect(true);
    } catch {
      setError("Usuário ou senha inválidos");
    }
  };

  if (redirect) return <Navigate to="/" />;

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Sistema de Gestão de Frota</h1>
      <p>Faça login para acessar o sistema.</p>

      <form onSubmit={handleLogin} style={{ marginTop: "20px" }}>
        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: "10px", fontSize: "16px", width: "250px" }}
          required
        /><br /><br />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "10px", fontSize: "16px", width: "250px" }}
          required
        /><br /><br />

        <button
          type="submit"
          style={{ padding: "10px 25px", fontSize: "18px", cursor: "pointer" }}
        >
          Entrar
        </button>

        {error && (
          <p style={{ color: "red", marginTop: "15px" }}>{error}</p>
        )}
      </form>
    </div>
  );
}

export default LoginPage;
