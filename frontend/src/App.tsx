import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ReactKeycloakProvider, useKeycloak } from "@react-keycloak/web";
import keycloak from "./keycloak";

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import AutorizarPage from "./pages/AutorizarReserva";
import ConsultarReservaPage from "./pages/ConsultarReserva";
import ReservaPage from "./pages/ReservarVeiculo";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { MainLayout } from "./components/MainLayout";
import { LoadingScreen } from "./components/LoadingScreen";

import { ThemeProvider } from "./components/ThemeProvider";
import { ReservaProvider } from "./pages/context/ReservaContext";
import { AuthProvider } from "./pages/context/AdminContext";

function AppContent() {
  const { initialized } = useKeycloak();

  if (!initialized) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
        <ReservaProvider>
          <BrowserRouter>
            <Routes>
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  {/* General Protected Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/reservar-veiculo" element={<ReservaPage />} />
                  <Route
                    path="/consultar-reserva"
                    element={<ConsultarReservaPage />}
                  />

                  {/* Private Routes */}
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

              {/* Fallback 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ReservaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ReactKeycloakProvider authClient={keycloak}>
      <AppContent />
    </ReactKeycloakProvider>
  );
}

export default App;
