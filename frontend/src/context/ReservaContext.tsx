import { useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import api from "@/api";

import {
  ReservaContext,
  type Reserva,
  type AddReservaPayload,
} from "../hooks/reserva-context-hook";

export const ReservaProvider = ({ children }: { children: ReactNode }) => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchReservas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/chamados/");
      setReservas(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Falha ao buscar os dados das reservas.");
    } finally {
      setLoading(false);
    }
  }, []);

  const addReserva = async (reserva: AddReservaPayload) => {
    try {
      const response = await api.post("/api/chamados/", reserva);
      setReservas((prev) => [response.data, ...prev]);
      toast.success("Reserva criada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar reserva.");
      throw error;
    }
  };

  const updateReserva = (id: number, updates: Partial<Reserva>) => {
    setReservas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    );
  };

  const cancelReserva = async (id: number, autorizador?: string) => {
    const reserva = reservas.find((r) => r.id === id);
    if (!reserva) return;

    try {
      await api.put(`/api/chamados/${id}/`, {
        ...reserva,
        status: "cancelado",
        autorizador_nome: autorizador,
      });
      updateReserva(id, { status: "cancelado", autorizador_nome: autorizador });
      await fetchReservas();
      toast.success("Reserva cancelada com sucesso.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao cancelar reserva.");
      throw error;
    }
  };

  const concluirReserva = async (id: number) => {
    const reserva = reservas.find((r) => r.id === id);
    if (!reserva) return;

    try {
      await api.put(`/api/chamados/${id}/`, {
        ...reserva,
        status: "concluido",
      });
      updateReserva(id, { status: "concluido" });
      await fetchReservas();
      toast.success("Reserva concluída com sucesso.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao concluir reserva.");
      throw error;
    }
  };

  return (
    <ReservaContext.Provider
      value={{
        reservas,
        loading,
        fetchReservas,
        addReserva,
        updateReserva,
        cancelReserva,
        concluirReserva,
      }}
    >
      {children}
    </ReservaContext.Provider>
  );
};
