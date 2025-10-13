import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { api } from "@/api";

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
  loading: boolean;
  fetchReservas: () => Promise<void>;
  addReserva: (r: AddReservaPayload) => void;
  updateReserva: (id: number, updates: Partial<Reserva>) => void;
};

const ReservaContext = createContext<ReservaContextType | undefined>(undefined);

export const ReservaProvider = ({ children }: { children: ReactNode }) => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchReservas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/chamados/");
      const data: any[] = response.data;

      const mappedReservas = data.map((item: any): Reserva => {
        const dataCriacao = item.data_criacao
          ? new Date(item.data_criacao)
          : null;
        const dataAutorizacao = item.data_autorizacao
          ? new Date(item.data_autorizacao)
          : null;
        return {
          id: item.id,
          solicitante: item.solicitante,
          unidade: "Unidade TESTE", // Placeholder
          municipio: item.municipio,
          data_saida: item.data_saida,
          horario_saida: item.horario_saida?.slice(0, 5) || "00:00",
          data_retorno: item.data_retorno,
          horario_retorno: item.horario_retorno?.slice(0, 5) || "00:00",
          passageiros: [
            item.passageiro1,
            item.passageiro2,
            item.passageiro3,
            item.passageiro4,
          ].filter(Boolean),
          paradas: item.paradas.map((p: any) => p.local),
          obsSolicitante: item.observacao,
          obsAdmin: item.observacao_autorizador,
          status:
            item.status?.toLowerCase() === "aprovado"
              ? "Aprovado"
              : item.status?.toLowerCase() === "recusado"
              ? "Negado"
              : "Pendente",
          motorista: item.motorista_designado?.id ?? item.motorista_designado,
          veiculo: item.veiculo_designado?.id ?? item.veiculo_designado,
          data_solicitacao: dataCriacao
            ? dataCriacao.toISOString().split("T")[0]
            : "",
          horario_solicitacao: dataCriacao
            ? `${String(dataCriacao.getHours()).padStart(2, "0")}:${String(
                dataCriacao.getMinutes()
              ).padStart(2, "0")}`
            : "",
          autorizador: item.autorizador,
          data_autorizacao: dataAutorizacao
            ? dataAutorizacao.toISOString().split("T")[0]
            : undefined,
          horario_autorizacao: dataAutorizacao
            ? `${String(dataAutorizacao.getHours()).padStart(2, "0")}:${String(
                dataAutorizacao.getMinutes()
              ).padStart(2, "0")}`
            : undefined,
        };
      });
      setReservas(mappedReservas);
    } catch (error) {
      console.error(error);
      toast.error("Falha ao buscar os dados das reservas.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <ReservaContext.Provider
      value={{ reservas, loading, fetchReservas, addReserva, updateReserva }}
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
