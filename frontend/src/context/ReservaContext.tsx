import { useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
// import api from "@/api";

import {
  ReservaContext,
  type Reserva,
  type AddReservaPayload,
} from "./reserva-context-hook";
import { mockReservas } from "@/mocks/data";

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
    // If we already have data, don't overwrite it with mocks
    if (reservas.length > 0) return;

    setLoading(true);
    try {
      // Simulating API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setReservas(mockReservas);
    } catch (error) {
      console.error(error);
      toast.error("Falha ao buscar os dados das reservas.");
    } finally {
      setLoading(false);
    }
  }, [reservas.length]);

  const addReserva = (reserva: AddReservaPayload) => {
    const now = new Date();
    const pad = (num: number) => String(num).padStart(2, "0");

    const newReserva: Reserva = {
      ...reserva,
      id: reserva.id ?? Date.now(),
      status: reserva.status ?? "Pendente",
      data_solicitacao:
        reserva.data_solicitacao ??
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      horario_solicitacao:
        reserva.horario_solicitacao ??
        `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    };

    setReservas((prev) => {
      if (prev.some((r) => r.id === newReserva.id)) {
        return prev.map((r) => (r.id === newReserva.id ? newReserva : r));
      }
      return [newReserva, ...prev];
    });
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
      // Mocking API call
      // await api.put(`/api/chamados/${id}/`, {
      //   ...reserva,
      //   status: "Cancelado",
      //   autorizador,
      // });
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate delay
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
