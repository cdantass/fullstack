import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AutorizarPage from "./pages/AutorizarReserva";
import ConsultarReservaPage from "./pages/ConsultarReserva";
import ReservaPage from "./pages/ReservarVeiculo";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { MainLayout } from "./components/MainLayout";

import { ThemeProvider } from "./components/ThemeProvider";
import { ReservaProvider } from "./context/ReservaContext";
import { AuthProvider } from "./context/AdminContext";

/**
 * Componente principal da aplicação.
 * Define a hierarquia de Provedores de Contexto e a configuração de rotas.
 */
function App() {
  return (
    // Provedor de Temas (Dark/Light mode)
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      {/* Provedor de Autenticação e Dados do Usuário */}
      <AuthProvider>
        {/* Provedor de Estado das Reservas */}
        <ReservaProvider>
          <BrowserRouter>
            <Routes>
              {/* --- Rotas Públicas --- */}
              <Route path="/login" element={<Login />} />

              {/* --- Rotas Protegidas (Exigem Login) --- */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  {/* Rotas acessíveis por qualquer usuário autenticado */}
                  <Route path="/" element={<Home />} />
                  <Route path="/reservar-veiculo" element={<ReservaPage />} />
                  <Route
                    path="/consultar-reserva"
                    element={<ConsultarReservaPage />}
                  />

                  {/* --- Rotas Privadas (Apenas Administradores) --- */}
                  <Route
                    path="/autorizar-reserva"
                    element={
                      <AdminRoute>
                        <AutorizarPage />
                      </AdminRoute>
                    }
                  />
                </Route>
              </Route>

              {/* Rota de Fallback para páginas não encontradas */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ReservaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
