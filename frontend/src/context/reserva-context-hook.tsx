import { createContext, useContext } from "react";

export type Reserva = {
  id: number;
  solicitante_nome: string;
  data_saida: string;
  horario_saida: string;
  data_retorno: string;
  horario_retorno: string;
  passageiro1?: string;
  passageiro2?: string;
  passageiro3?: string;
  passageiro4?: string;
  municipio: string;
  observacao?: string;
  status: string;
  data_criacao: string;
  autorizador_nome?: string;
  observacao_autorizador?: string;
  data_autorizacao?: string;
  motorista_designado?: {
    id: number;
    nome_motorista: string;
    status: string;
  };
  veiculo_designado?: {
    id: number;
    placa: string;
    modelo: string;
    ano: number;
    status: string;
  };
  paradas: { local: string }[];
  unidade?: string;
  localidade?: string;
  viagem_compartilhada?: number | null; // FK to parent chamado
  chamados_combinados?: Reserva[]; // Child chamados (only on parent)
};

export type AddReservaPayload = Omit<Reserva, ""> & {
  id?: number;
};

export type ReservaContextType = {
  reservas: Reserva[];
  loading: boolean;
  fetchReservas: () => Promise<void>;
  addReserva: (r: AddReservaPayload) => Promise<void>;
  updateReserva: (id: number, updates: Partial<Reserva>) => void;
  cancelReserva: (id: number, autorizador?: string) => Promise<void>;
  concluirReserva: (id: number) => Promise<void>;
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
