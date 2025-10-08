import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import AutorizarPage from "./pages/autorizar-reserva";
import ConsultarReservaPage from "./pages/consultar-reserva";
import ReservaPage from "./pages/reservar-veiculo";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { MainLayout } from "./components/MainLayout";

import { ThemeProvider } from "./components/theme-provider";
import { ReservaProvider } from "./pages/context/ReservaContext";
import { AuthProvider } from "./pages/context/AdminContext";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
        <ReservaProvider>
          <BrowserRouter>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />

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

export default App;
