import { createContext, useContext } from "react";

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
  status: "Pendente" | "Aprovado" | "Negado" | "Cancelado" | "Concluido";
  data_solicitacao: string;
  horario_solicitacao: string;
  autorizador?: string;
  data_autorizacao?: string;
  horario_autorizacao?: string;
  viagemCompartilhadaId?: string;
};

export type AddReservaPayload = Omit<Reserva, ""> & {
  id?: number;
};

export type ReservaContextType = {
  reservas: Reserva[];
  loading: boolean;
  fetchReservas: () => Promise<void>;
  addReserva: (r: AddReservaPayload) => void;
  updateReserva: (id: number, updates: Partial<Reserva>) => void;
  cancelReserva: (id: number, autorizador?: string) => Promise<void>;
};

export const ReservaContext = createContext<ReservaContextType | undefined>(
  undefined
);

export const useReservas = () => {
  const ctx = useContext(ReservaContext);
  if (!ctx)
    throw new Error("useReservas deve ser usado dentro do ReservaProvider");
  return ctx;
};
