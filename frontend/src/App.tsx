import { Routes, Route, Outlet } from "react-router-dom";

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import AutorizarPage from "./pages/AutorizarReserva";
import ConsultarReservaPage from "./pages/ConsultarReserva";
import ReservaPage from "./pages/ReservarVeiculo";
import LoginPage from "./pages/Login";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { MainLayout } from "./components/MainLayout";

import { ThemeProvider } from "./components/ThemeProvider";
import { ReservaProvider } from "./pages/context/ReservaContext";

const ProtectedLayout = () => (
  <ProtectedRoute>
    <MainLayout>
      <Outlet />
    </MainLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ReservaProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedLayout />}>
            <Route index element={<Home />} />
            <Route path="/reservar-veiculo" element={<ReservaPage />} />
            <Route
              path="/consultar-reserva"
              element={<ConsultarReservaPage />}
            />
            <Route
              path="/autorizar-reserva"
              element={
                <AdminRoute>
                  <AutorizarPage />
                </AdminRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ReservaProvider>
    </ThemeProvider>
  );
}

export default App;