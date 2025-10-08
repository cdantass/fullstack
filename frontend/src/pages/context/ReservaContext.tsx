import React, { createContext, useContext, useState } from "react";
export type Reserva = {
  id: number;
  unidade: string;
  solicitante: string;
  municipio: string;
  localidade?: string;
  paradas: string[];
  passageiros: string[];
  data_saida: string;
  data_retorno: string;
  horario_saida: string;
  horario_retorno: string;
  obsSolicitante?: string;
  motorista?: string;
  veiculo?: string;
  obsAdmin?: string;
  status: "Pendente" | "Aprovado" | "Negado";
  data_solicitacao: string;
  horario_solicitacao: string;
  autorizador?: string;
  data_autorizacao?: string;
  horario_autorizacao?: string;
};

type AddReservaPayload = Omit<Reserva, ""> & {
  id?: number;
};

type ReservaContextType = {
  reservas: Reserva[];
  addReserva: (r: AddReservaPayload) => void;
  updateReserva: (id: number, updates: Partial<Reserva>) => void;
  addTeste: () => void;
};

const ReservaContext = createContext<ReservaContextType | undefined>(undefined);

export const ReservaProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [reservas, setReservas] = useState<Reserva[]>([]);

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
  const addTeste = () => {};

  return (
    <ReservaContext.Provider
      value={{ reservas, addReserva, updateReserva, addTeste }}
    >
      {children}
    </ReservaContext.Provider>
  );
};

export const useReservas = () => {
  const ctx = useContext(ReservaContext);
  if (!ctx)
    throw new Error("useReservas deve ser usado dentro do ReservaProvider");
  return ctx;
};
