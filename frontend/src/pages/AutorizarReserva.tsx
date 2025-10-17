"use client";

import * as React from "react";
import { useReservas, type Reserva } from "@/pages/context/ReservaContext";
import { useAuth } from "@/pages/context/AdminContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "../api";
import { formatDateTime } from "@/lib/utils";
import { ReservaCard } from "@/components/ReservaCard";
import { cn } from "@/lib/utils";

interface Motorista {
  id: number;
  nome_motorista: string;
  status: string;
}

interface Veiculo {
  id: number;
  placa: string;
  modelo: string;
  ano: number;
  status: string;
}

const getStatusBadgeClasses = (status: Reserva["status"]) => {
  switch (status) {
    case "Aprovado":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "Negado":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "Pendente":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function AutorizarPage() {
  const { user: authUser } = useAuth();
  const { reservas, updateReserva, fetchReservas } = useReservas();

  const [expanded, setExpanded] = React.useState<number | null>(null);
  const [obs, setObs] = React.useState<Record<number, string>>({});
  const [filter, setFilter] = React.useState<string | null>(null);
  const [motoristas, setMotoristas] = React.useState<Motorista[]>([]);
  const [veiculos, setVeiculos] = React.useState<Veiculo[]>([]);
  const [selectedMotoristas, setSelectedMotoristas] = React.useState<
    Record<number, string>
  >({});
  const [selectedVeiculos, setSelectedVeiculos] = React.useState<
    Record<number, string>
  >({});

  React.useEffect(() => {
    fetchReservas();
    const fetchOptions = async () => {
      try {
        const [mRes, vRes] = await Promise.all([
          api.get("/motoristas/"),
          api.get("/veiculos/"),
        ]);
        setMotoristas(mRes.data);
        setVeiculos(vRes.data);
      } catch (err) {
        toast.error("Não foi possível carregar motoristas ou veículos.");
      }
    };
    fetchOptions();
  }, [fetchReservas]);

  const motoristaMap = React.useMemo(
    () =>
      motoristas.reduce(
        (acc, m) => ({ ...acc, [m.id]: m.nome_motorista }),
        {} as Record<number, string>
      ),
    [motoristas]
  );
  const veiculoMap = React.useMemo(
    () =>
      veiculos.reduce(
        (acc, v) => ({ ...acc, [v.id]: `${v.modelo} - ${v.placa}` }),
        {} as Record<number, string>
      ),
    [veiculos]
  );

  const handleUpdateReserva = async (
    id: number,
    status: "aprovado" | "recusado"
  ) => {
    const reservaOriginal = reservas.find((r) => r.id === id);
    if (!reservaOriginal) {
      toast.error("Erro: Reserva original não encontrada.");
      return;
    }

    const motoristaId = selectedMotoristas[id];
    const veiculoId = selectedVeiculos[id];
    if (status === "aprovado" && (!motoristaId || !veiculoId)) {
      toast.error("Selecione um motorista e um veículo para aprovar.");
      return;
    }

    const now = new Date();
    const apiPayload = {
      ...reservaOriginal,
      status: status,
      observacao_autorizador: obs[id] ?? "",
      motorista_id: status === "aprovado" ? parseInt(motoristaId, 10) : null,
      veiculo_id: status === "aprovado" ? parseInt(veiculoId, 10) : null,
      autorizador: authUser?.name,
    };

    try {
      await api.put(`/chamados/${id}/`, apiPayload);
      updateReserva(id, {
        status: status === "aprovado" ? "Aprovado" : "Negado",
        obsAdmin: obs[id] ?? "",
        motorista:
          status === "aprovado" && motoristaId
            ? motoristaMap[parseInt(motoristaId, 10)]
            : undefined,
        veiculo:
          status === "aprovado" && veiculoId
            ? veiculoMap[parseInt(veiculoId, 10)]
            : undefined,
        autorizador: authUser?.name,
        data_autorizacao: now.toISOString().split("T")[0],
        horario_autorizacao: `${String(now.getHours()).padStart(
          2,
          "0"
        )}:${String(now.getMinutes()).padStart(2, "0")}`,
      });
      setObs((s) => ({ ...s, [id]: "" }));
      toast(
        `Reserva ${status === "aprovado" ? "aprovada" : "negada"} com sucesso!`
      );
    } catch (error) {
      console.error(error);
      toast.error(
        `Falha ao ${status === "aprovado" ? "aprovar" : "negar"} a reserva.`
      );
    }
  };

  const statusSummary = React.useMemo(
    () =>
      reservas.reduce(
        (acc, r) => {
          const statusKey = r.status.toLowerCase() as keyof typeof acc;
          acc[statusKey] = (acc[statusKey] || 0) + 1;
          return acc;
        },
        { aprovado: 0, negado: 0, pendente: 0 }
      ),
    [reservas]
  );

  const filteredReservas = React.useMemo(
    () =>
      [...reservas]
        .sort(
          (a, b) =>
            new Date(b.data_solicitacao).getTime() -
            new Date(a.data_solicitacao).getTime()
        )
        .filter((r) => !filter || r.status === filter),
    [reservas, filter]
  );

  return (
    <div className="p-6 max-w-6xl mx-auto bg-background text-foreground">
      <div className="flex gap-4 mb-6 items-center flex-wrap">
        {["Pendente", "Aprovado", "Negado"].map((status) => {
          const count =
            statusSummary[status.toLowerCase() as keyof typeof statusSummary];
          return (
            <Badge
              key={status}
              className={cn(
                "cursor-pointer flex items-center gap-2 font-semibold transition-all p-2",
                getStatusBadgeClasses(status as Reserva["status"]),
                filter === status ? "ring-2 ring-offset-2" : ""
              )}
              onClick={() => setFilter(filter === status ? null : status)}
            >
              {count || 0} {status}
              {filter === status && (
                <X
                  size={14}
                  className="ml-1 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilter(null);
                  }}
                />
              )}
            </Badge>
          );
        })}
        <Button
          onClick={fetchReservas}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} /> Atualizar
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr>
                <th className="p-3">Data Solicitação</th>
                <th className="p-3">Solicitante / Unidade</th>
                <th className="p-3">Município</th>
                <th className="p-3">Data Saída</th>
                <th className="p-3">Data Retorno</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-4">
                    Nenhuma reserva encontrada.
                  </td>
                </tr>
              ) : (
                filteredReservas.map((row: Reserva) => (
                  <React.Fragment key={row.id}>
                    <tr
                      className="border-t cursor-pointer hover:bg-muted/20"
                      onClick={() =>
                        setExpanded(expanded === row.id ? null : row.id)
                      }
                    >
                      <td className="p-3 whitespace-nowrap">
                        {formatDateTime(
                          row.data_solicitacao,
                          row.horario_solicitacao
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {row.solicitante} / {row.unidade}
                      </td>
                      <td className="p-3 whitespace-nowrap">{row.municipio}</td>
                      <td className="p-3 whitespace-nowrap">
                        {formatDateTime(row.data_saida, row.horario_saida)}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {formatDateTime(row.data_retorno, row.horario_retorno)}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge className={getStatusBadgeClasses(row.status)}>
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                    {expanded === row.id && (
                      <tr>
                        <td colSpan={6} className="p-4 bg-muted/30">
                          <ReservaCard
                            reserva={row}
                            veiculoMap={veiculoMap}
                            motoristaMap={motoristaMap}
                          />
                          {row.status === "Pendente" && (
                            <div className="border-t pt-4 mt-4 space-y-4">
                              <div>
                                <label className="text-sm font-medium block mb-1">
                                  Observação do aprovador
                                </label>
                                <Textarea
                                  className="bg-white"
                                  placeholder="Escreva sua observação..."
                                  value={obs[row.id] ?? ""}
                                  onChange={(e) =>
                                    setObs((s) => ({
                                      ...s,
                                      [row.id]: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium block mb-1">
                                    Escolher Motorista
                                  </label>
                                  <Select
                                    value={selectedMotoristas[row.id] ?? ""}
                                    onValueChange={(value) =>
                                      setSelectedMotoristas((prev) => ({
                                        ...prev,
                                        [row.id]: value,
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Selecione um motorista" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {motoristas.map((m) => (
                                        <SelectItem
                                          key={m.id}
                                          value={String(m.id)}
                                          disabled={m.status !== "disponivel"}
                                        >
                                          {m.nome_motorista}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium block mb-1">
                                    Escolher Veículo
                                  </label>
                                  <Select
                                    value={selectedVeiculos[row.id] ?? ""}
                                    onValueChange={(value) =>
                                      setSelectedVeiculos((prev) => ({
                                        ...prev,
                                        [row.id]: value,
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Selecione um veículo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {veiculos.map((v) => (
                                        <SelectItem
                                          key={v.id}
                                          value={String(v.id)}
                                          disabled={v.status !== "disponivel"}
                                        >
                                          #{v.id} - {v.modelo} - {v.placa}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() =>
                                    handleUpdateReserva(row.id, "aprovado")
                                  }
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Aprovar
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleUpdateReserva(row.id, "recusado")
                                  }
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Negar
                                </Button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
