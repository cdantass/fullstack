import { createContext, useContext } from "react";

export type Reserva = {
  id: number;
  solicitante_nome: string; // was solicitante
  data_saida: string;
  horario_saida: string;
  data_retorno: string;
  horario_retorno: string;
  passageiro1?: string;
  passageiro2?: string;
  passageiro3?: string;
  passageiro4?: string;
  municipio: string;
  observacao?: string; // was obsSolicitante
  status: string; // was union type, now string (e.g. "pendente")
  data_criacao: string; // was data_solicitacao
  autorizador_id?: string; // was autorizador
  observacao_autorizador?: string; // was obsAdmin
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

  // Legacy fields or derived fields might need handling if components rely on them.
  // For now I will strictly match the schema.
  // Note: Unidade is missing in new schema. I will remove it or make it optional if not present.
  unidade?: string;
  localidade?: string;
  viagemCompartilhadaId?: string;
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
