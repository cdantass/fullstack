import { useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import api from "@/api";

import {
  ReservaContext,
  type Reserva,
  type AddReservaPayload,
} from "./reserva-context-hook";

export const ReservaProvider = ({ children }: { children: ReactNode }) => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  /*
  interface ApiReservaItem {
    id: number;
    solicitante: string;
    municipio: string;
    data_saida: string;
    horario_saida: string;
    data_retorno: string;
    horario_retorno: string;
    passageiro1?: string;
    passageiro2?: string;
    passageiro3?: string;
    passageiro4?: string;
    paradas: { local: string }[];
    observacao?: string;
    observacao_autorizador?: string;
    status?: string;
    motorista_designado?: { id: number } | number | null;
    veiculo_designado?: { id: number } | number | null;
    data_criacao?: string;
    autorizador?: string;
    data_autorizacao?: string;
  }
  */

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
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const cancelReserva = async (id: number, autorizador?: string) => {
    const reserva = reservas.find((r) => r.id === id);
    if (!reserva) return;

    try {
      await api.put(`/api/chamados/${id}/`, {
        ...reserva,
        status: "Cancelado",
        autorizador,
      });
      updateReserva(id, { status: "Cancelado", autorizador });
      toast.success("Reserva cancelada com sucesso.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao cancelar reserva.");
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
      }}
    >
      {children}
    </ReservaContext.Provider>
  );
};
