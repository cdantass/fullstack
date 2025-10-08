"use client";

import * as React from "react";
import { useReservas, type Reserva } from "@/pages/context/ReservaContext";
import { useAuth } from "@/pages/context/AdminContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Car,
  Users,
  User,
  MapPin,
  NotebookPen,
  X,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/api";

/* ---------------- HELPERS ---------------- */
const formatDateTime = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(`${dateStr}T${timeStr || "00:00"}`);
    if (isNaN(d.getTime())) return `${dateStr} ${timeStr || ""}`.trim();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return `${dateStr} ${timeStr || ""}`.trim();
  }
};

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

/* ---------------- COMPONENT ---------------- */
export default function AutorizarPage() {
  const { user: authUser } = useAuth();
  const { reservas, updateReserva, addReserva } = useReservas();
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

  const fetchReservas = async () => {
    try {
      const response = await api.get("/chamados/");
      const data: any[] = response.data;

      data.forEach((item: any) => {
        const dataCriacao = item.data_criacao
          ? new Date(item.data_criacao)
          : null;
        const dataAutorizacao = item.data_autorizacao
          ? new Date(item.data_autorizacao)
          : null;

        addReserva({
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
        });
      });
    } catch (error) {
      console.error(error);
      toast.error("Falha ao buscar dados.");
    }
  };

  React.useEffect(() => {
    if (reservas.length === 0) {
      fetchReservas();
    }
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
  }, []);

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

  const handleAprovar = async (id: number) => {
    const motoristaId = selectedMotoristas[id];
    const veiculoId = selectedVeiculos[id];

    if (!motoristaId || !veiculoId) {
      toast.error("Selecione um motorista e um veículo para aprovar.");
      return;
    }

    const reservaOriginal = reservas.find((r) => r.id === id);
    if (!reservaOriginal) {
      toast.error("Erro: Reserva original não encontrada.");
      return;
    }

    const motoristaObj = motoristas.find((m) => String(m.id) === motoristaId);
    const veiculoObj = veiculos.find((v) => String(v.id) === veiculoId);

    if (!motoristaObj || !veiculoObj) {
      toast.error("Erro: Motorista ou veículo selecionado não é válido.");
      return;
    }

    const now = new Date();

    const apiPayload = {
      data_saida: reservaOriginal.data_saida,
      horario_saida: reservaOriginal.horario_saida,
      data_retorno: reservaOriginal.data_retorno,
      horario_retorno: reservaOriginal.horario_retorno,
      observacao: reservaOriginal.obsSolicitante,
      solicitante: reservaOriginal.solicitante,
      passageiro1: reservaOriginal.passageiros[0] || "",
      passageiro2: reservaOriginal.passageiros[1] || "",
      passageiro3: reservaOriginal.passageiros[2] || "",
      passageiro4: reservaOriginal.passageiros[3] || "",
      paradas: reservaOriginal.paradas.map((local) => ({ local })),
      status: "aprovado",
      observacao_autorizador: obs[id] ?? "",
      motorista_id: parseInt(motoristaId),
      veiculo_id: parseInt(veiculoId),
      autorizador: authUser?.name,
    };

    try {
      await api.put(`/chamados/${id}/`, apiPayload);

      const localUpdatePayload: Partial<Reserva> = {
        status: "Aprovado",
        obsAdmin: obs[id] ?? "",
        motorista: motoristaObj.nome_motorista,
        veiculo: `${veiculoObj.modelo} - ${veiculoObj.placa}`,
        autorizador: authUser?.name,
        data_autorizacao: now.toISOString().split("T")[0],
        horario_autorizacao: `${String(now.getHours()).padStart(
          2,
          "0"
        )}:${String(now.getMinutes()).padStart(2, "0")}`,
      };

      updateReserva(id, localUpdatePayload);
      setObs((s) => ({ ...s, [id]: "" }));
      toast.success("Reserva aprovada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Falha ao aprovar a reserva.");
    }
  };

  const handleNegar = async (id: number) => {
    const reservaOriginal = reservas.find((r) => r.id === id);
    if (!reservaOriginal) {
      toast.error("Erro: Reserva original não encontrada.");
      return;
    }
    const now = new Date();

    const apiPayload = {
      data_saida: reservaOriginal.data_saida,
      horario_saida: reservaOriginal.horario_saida,
      data_retorno: reservaOriginal.data_retorno,
      horario_retorno: reservaOriginal.horario_retorno,
      observacao: reservaOriginal.obsSolicitante,
      solicitante: reservaOriginal.solicitante,
      passageiro1: reservaOriginal.passageiros[0] || "",
      passageiro2: reservaOriginal.passageiros[1] || "",
      passageiro3: reservaOriginal.passageiros[2] || "",
      passageiro4: reservaOriginal.passageiros[3] || "",
      paradas: reservaOriginal.paradas.map((local) => ({ local })),
      status: "recusado",
      observacao_autorizador: obs[id] ?? "",
      motorista_id: null,
      veiculo_id: null,
      autorizador: authUser?.name,
    };

    try {
      await api.put(`/chamados/${id}/`, apiPayload);

      updateReserva(id, {
        status: "Negado",
        obsAdmin: obs[id] ?? "",
        autorizador: authUser?.name,
        data_autorizacao: now.toISOString().split("T")[0],
        horario_autorizacao: `${String(now.getHours()).padStart(
          2,
          "0"
        )}:${String(now.getMinutes()).padStart(2, "0")}`,
      });
      setObs((s) => ({ ...s, [id]: "" }));
      toast.success("Reserva negada!");
    } catch (error) {
      console.error(error);
      toast.error("Falha ao negar a reserva.");
    }
  };

  const statusSummary = React.useMemo(
    () =>
      reservas.reduce(
        (acc, r) => {
          if (r.status === "Pendente") acc.pendente++;
          else if (r.status === "Aprovado") acc.aprovado++;
          else if (r.status === "Negado") acc.negado++;
          return acc;
        },
        { pendente: 0, aprovado: 0, negado: 0 }
      ),
    [reservas]
  );

  const filteredReservas = React.useMemo(
    () =>
      [...reservas]
        .sort(
          (a: Reserva, b: Reserva) =>
            new Date(
              `${b.data_solicitacao}T${b.horario_solicitacao || "00:00"}`
            ).getTime() -
            new Date(
              `${a.data_solicitacao}T${a.horario_solicitacao || "00:00"}`
            ).getTime()
        )
        .filter((r: Reserva) => !filter || r.status === filter),
    [reservas, filter]
  );

  const renderCard = (row: Reserva) => {
    const veiculoNome = row.veiculo
      ? veiculoMap[row.veiculo as any] || row.veiculo
      : "-";
    const motoristaNome = row.motorista
      ? motoristaMap[row.motorista as any] || row.motorista
      : "-";
    return (
      <Card key={row.id} className="mb-4">
        <CardContent className="grid md:grid-cols-2 gap-6 p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Veículo:</span>
            </div>
            <p className="ml-6">{veiculoNome}</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Passageiros:</span>
            </div>
            <ul className="list-disc list-inside ml-6">
              {row.passageiros.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Motorista:</span>
            </div>
            <p className="ml-6">{motoristaNome}</p>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Paradas:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {row.paradas.map((p, i) => (
                  <Badge key={i} variant="outline" className="bg-muted">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <NotebookPen className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Observações</span>
              </div>
              <p className="text-sm">
                <strong>Solicitante:</strong> {row.obsSolicitante ?? "-"}
              </p>
              <p className="text-sm mt-1">
                <strong>Administrador:</strong> {row.obsAdmin ?? "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-background text-foreground">
      <div className="flex gap-4 mb-6 items-center flex-wrap">
        {["Pendente", "Aprovado", "Negado"].map((status) => {
          const count =
            statusSummary[status.toLowerCase() as keyof typeof statusSummary];
          const statusStyles = {
            Pendente: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
            Aprovado: "bg-green-100 text-green-800 hover:bg-green-200",
            Negado: "bg-red-100 text-red-800 hover:bg-red-200",
          };
          return (
            <Badge
              key={status}
              className={`cursor-pointer flex items-center gap-2 font-semibold transition-all p-2 ${
                statusStyles[status as keyof typeof statusStyles]
              } ${filter === status ? "ring-2 ring-offset-2" : ""}`}
              onClick={() => setFilter(filter === status ? null : status)}
            >
              {count} {status}
              {count !== 1 ? "s" : ""}
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
          <RefreshCw size={16} /> Atualizar Lista
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
                <th className="p-3">Veículo</th>
                <th className="p-3">Motorista</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-4">
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
                      <td className="p-3">
                        {formatDateTime(
                          row.data_solicitacao,
                          row.horario_solicitacao
                        )}
                      </td>
                      <td className="p-3">
                        {row.solicitante} / {row.unidade}
                      </td>
                      <td className="p-3">{row.municipio}</td>
                      <td className="p-3">
                        {formatDateTime(row.data_saida, row.horario_saida)}
                      </td>
                      <td className="p-3">
                        {formatDateTime(row.data_retorno, row.horario_retorno)}
                      </td>
                      <td className="p-3">
                        {row.veiculo
                          ? veiculoMap[row.veiculo as any] || row.veiculo
                          : "-"}
                      </td>
                      <td className="p-3">
                        {row.motorista
                          ? motoristaMap[row.motorista as any] || row.motorista
                          : "-"}
                      </td>
                      <td className="p-3">
                        <Badge
                          className={
                            row.status === "Aprovado"
                              ? "bg-green-100 text-green-800"
                              : row.status === "Negado"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                    {expanded === row.id && (
                      <tr>
                        <td colSpan={8} className="p-4 bg-muted/30">
                          {renderCard(row)}
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
                                  onClick={() => handleAprovar(row.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Aprovar
                                </Button>
                                <Button
                                  onClick={() => handleNegar(row.id)}
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
