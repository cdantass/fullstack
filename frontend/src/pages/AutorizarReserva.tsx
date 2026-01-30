"use client";

import * as React from "react";
import { Fragment } from "react";
import { useReservas, type Reserva } from "@/hooks/reserva-context-hook";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/api";
import { cn, formatDateTime, formatStatusLabel } from "@/lib/utils";
import { ReservaCard } from "@/components/ReservaCard";

import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Download,
  Link,
  MapPin,
  PlusCircleIcon,
  Users,
  X,
} from "lucide-react";
import { exportReservasToExcel } from "@/lib/excel-export-utils";
import { Checkbox } from "@/components/ui/checkbox";

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

const getStatusBadgeClasses = (status: string) => {
  switch ((status || "").toLowerCase()) {
    case "aprovado":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "negado":
    case "recusado":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "pendente":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "concluido":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "viagem_compartilhada":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    case "combinado":
      return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200";
    case "cancelado":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function AutorizarPage() {
  const { user: authUser } = useAuth();
  const { reservas, updateReserva, fetchReservas, concluirReserva } =
    useReservas();

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
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedReservas, setSelectedReservas] = React.useState<number[]>([]);
  const [isCombineModalOpen, setIsCombineModalOpen] = React.useState(false);
  // Separate state for child row expansion (independent from parent)
  const [expandedChild, setExpandedChild] = React.useState<number | null>(null);
  const [combineFormData, setCombineFormData] = React.useState({
    data_saida: "",
    horario_saida: "",
    data_retorno: "",
    horario_retorno: "",
    paradas: [] as string[],
    passageiros: [] as string[],
    motorista_id: "",
    veiculo_id: "",
    observacao: "",
  });
  const [paradaInput, setParadaInput] = React.useState("");
  const [passageiroInput, setPassageiroInput] = React.useState("");

  React.useEffect(() => {
    fetchReservas();
    const fetchOptions = async () => {
      try {
        const [mRes, vRes] = await Promise.all([
          api.get("/api/motoristas/"),
          api.get("/api/veiculos/"),
        ]);
        setMotoristas(mRes.data);
        setVeiculos(vRes.data);
      } catch {
        toast.error("Não foi possível carregar motoristas ou veículos.");
      }
    };
    fetchOptions();
  }, [fetchReservas]);

  const motoristaMap = React.useMemo(
    () =>
      motoristas.reduce(
        (acc, m) => ({ ...acc, [m.id]: m.nome_motorista }),
        {} as Record<number, string>,
      ),
    [motoristas],
  );
  const veiculoMap = React.useMemo(
    () =>
      veiculos.reduce(
        (acc, v) => ({ ...acc, [v.id]: `${v.modelo} - ${v.placa}` }),
        {} as Record<number, string>,
      ),
    [veiculos],
  );

  const handleSelectReserva = (id: number) => {
    setSelectedReservas((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    const pendingIds = filteredReservas
      .filter((r) => r.status === "Pendente")
      .map((r) => r.id);

    if (pendingIds.every((id) => selectedReservas.includes(id))) {
      setSelectedReservas((prev) =>
        prev.filter((id) => !pendingIds.includes(id)),
      );
    } else {
      setSelectedReservas((prev) =>
        Array.from(new Set([...prev, ...pendingIds])),
      );
    }
  };

  const handleCombineReservas = () => {
    if (selectedReservas.length < 2) return;

    const selected = reservas.filter((r) => selectedReservas.includes(r.id));

    // Aggregate unique stops and passengers
    const allParadas = Array.from(
      new Set(selected.flatMap((r) => r.paradas.map((p) => p.local))),
    )
      .filter(Boolean)
      .map((local) => ({ local }));

    const allPassageiros = Array.from(
      new Set(
        selected.flatMap((r) =>
          [r.passageiro1, r.passageiro2, r.passageiro3, r.passageiro4].filter(
            Boolean,
          ),
        ),
      ),
    ).filter(Boolean) as string[];

    // Calculate earliest departure and latest return
    const sortedByDeparture = [...selected].sort((a, b) => {
      const dateA = new Date(`${a.data_saida}T${a.horario_saida}`);
      const dateB = new Date(`${b.data_saida}T${b.horario_saida}`);
      return dateA.getTime() - dateB.getTime();
    });

    const sortedByReturn = [...selected].sort((a, b) => {
      const dateA = new Date(`${a.data_retorno}T${a.horario_retorno}`);
      const dateB = new Date(`${b.data_retorno}T${b.horario_retorno}`);
      return dateB.getTime() - dateA.getTime();
    });

    const earliest = sortedByDeparture[0];
    const latest = sortedByReturn[0];

    setCombineFormData({
      data_saida: earliest?.data_saida || "",
      horario_saida: earliest?.horario_saida || "",
      data_retorno: latest?.data_retorno || "",
      horario_retorno: latest?.horario_retorno || "",
      paradas: allParadas.map((p) => p.local),
      passageiros: allPassageiros,
      motorista_id: "",
      veiculo_id: "",
      observacao: "",
    });

    setIsCombineModalOpen(true);
  };

  const handleConclude = async (id: number) => {
    try {
      await concluirReserva(id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfirmCombine = async () => {
    if (!combineFormData.motorista_id || !combineFormData.veiculo_id) {
      toast.error("Selecione um motorista e um veículo para combinar.");
      return;
    }

    try {
      const response = await api.post("/api/chamados/combinar/", {
        chamados: selectedReservas,
        motorista_id: parseInt(combineFormData.motorista_id, 10),
        veiculo_id: parseInt(combineFormData.veiculo_id, 10),
        data_saida: combineFormData.data_saida,
        horario_saida: combineFormData.horario_saida,
        data_retorno: combineFormData.data_retorno,
        horario_retorno: combineFormData.horario_retorno,
        observacao: combineFormData.observacao,
      });

      // Refresh reservas to get updated data from server
      await fetchReservas();

      toast.success(
        `Viagens combinadas com sucesso! Nova viagem compartilhada #${response.data.id} criada.`,
      );
      setSelectedReservas([]);
      setIsCombineModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao combinar viagens.");
    }
  };

  const handleUpdateReserva = async (
    id: number,
    status: "aprovado" | "recusado",
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

    let idsToUpdate = [id];

    if (reservaOriginal.viagem_compartilhada && status === "aprovado") {
      const linkedReservas = reservas.filter(
        (r) =>
          r.viagem_compartilhada === reservaOriginal.viagem_compartilhada &&
          r.status.toLowerCase() === "pendente",
      );

      if (linkedReservas.length > 1) {
        const confirmShared = window.confirm(
          "Esta reserva faz parte de uma viagem compartilhada. Deseja aplicar a mesma aprovação (motorista/veículo) para todas as reservas vinculadas?",
        );
        if (confirmShared) {
          idsToUpdate = linkedReservas.map((r) => r.id);
        }
      }
    }

    const now = new Date();

    try {
      await Promise.all(
        idsToUpdate.map(async (targetId) => {
          const targetReserva = reservas.find((r) => r.id === targetId);
          if (!targetReserva) return;

          const motoristaObj =
            status === "aprovado"
              ? {
                  id: parseInt(motoristaId, 10),
                  nome_motorista: motoristaMap[parseInt(motoristaId, 10)] || "",
                  status: "indisponivel",
                }
              : undefined;

          const veiculoIdNum = parseInt(veiculoId, 10);
          const veiculoInfo = veiculoMap[veiculoIdNum] || "";
          const [veiculoModelo, veiculoPlaca] = veiculoInfo.split(" - ");
          const veiculoObj =
            status === "aprovado"
              ? {
                  id: veiculoIdNum,
                  placa: veiculoPlaca || "",
                  modelo: veiculoModelo || "",
                  ano: 0,
                  status: "indisponivel",
                }
              : undefined;

          // Send just the IDs to the API
          const apiPayload = {
            ...targetReserva,
            status: status, // "aprovado" or "recusado"
            observacao_autorizador: obs[id] ?? "",
            motorista_designado:
              status === "aprovado" ? parseInt(motoristaId, 10) : null,
            veiculo_designado:
              status === "aprovado" ? parseInt(veiculoId, 10) : null,
            autorizador_nome: authUser?.name,
            data_autorizacao: now.toISOString(),
          };

          await api.put(`/api/chamados/${targetId}/`, apiPayload);

          // Update local state with full objects for immediate UI display
          const localUpdate = {
            ...apiPayload,
            motorista_designado: motoristaObj,
            veiculo_designado: veiculoObj,
          };
          updateReserva(targetId, localUpdate as Partial<Reserva>);
          setObs((s) => ({ ...s, [targetId]: "" }));
        }),
      );

      toast(
        `Reserva(s) ${
          status === "aprovado" ? "aprovada(s)" : "negada(s)"
        } com sucesso!`,
      );
    } catch (error) {
      console.error(error);
      toast.error(
        `Falha ao ${
          status === "aprovado" ? "aprovar" : "recusar"
        } a(s) reserva(s).`,
      );
    }
  };

  const filteredReservas = React.useMemo(() => {
    let data = [...reservas];

    if (filter) {
      if (filter === "Aprovado") {
        data = data.filter((r) =>
          ["aprovado", "combinado"].includes(r.status.toLowerCase()),
        );
      } else {
        const normalizedFilter = filter.toLowerCase().replace(/\s+/g, "_");
        data = data.filter(
          (r) => (r.status || "").toLowerCase() === normalizedFilter,
        );
      }
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const fieldMatch = lowerSearch.match(/^(\w+):(.+)$/);

      data = data.filter((r) => {
        const motoristaName = r.motorista_designado?.nome_motorista || "";
        const veiculoInfo = r.veiculo_designado
          ? `${r.veiculo_designado.modelo} - ${r.veiculo_designado.placa}`
          : "";

        // Helper to check passengers
        const hasPassageiro = (term: string) =>
          [r.passageiro1, r.passageiro2, r.passageiro3, r.passageiro4].some(
            (p) => p && p.toLowerCase().includes(term),
          );

        if (fieldMatch) {
          const [, field, value] = fieldMatch;
          const cleanValue = value.trim();

          switch (field) {
            case "passageiros":
              return hasPassageiro(cleanValue);
            case "motorista":
              return motoristaName.toLowerCase().includes(cleanValue);
            case "veiculo":
              return veiculoInfo.toLowerCase().includes(cleanValue);
            case "solicitante":
              return (r.solicitante_nome || "")
                .toLowerCase()
                .includes(cleanValue);
            case "municipio":
              return (r.municipio || "").toLowerCase().includes(cleanValue);
            case "obs":
              return (
                (r.observacao &&
                  r.observacao.toLowerCase().includes(cleanValue)) ||
                (r.observacao_autorizador &&
                  r.observacao_autorizador.toLowerCase().includes(cleanValue))
              );
            case "autorizador":
              return (
                r.autorizador_nome &&
                r.autorizador_nome.toLowerCase().includes(cleanValue)
              );
            case "id":
              return r.id.toString().includes(cleanValue.replace("#", ""));
            default:
              break;
          }
        }

        const idSearch = lowerSearch.replace("#", "");
        const isIdSearch = /^\d+$/.test(idSearch);

        return (
          (isIdSearch && r.id.toString().includes(idSearch)) ||
          (r.solicitante_nome || "").toLowerCase().includes(lowerSearch) ||
          (r.municipio || "").toLowerCase().includes(lowerSearch) ||
          motoristaName.toLowerCase().includes(lowerSearch) ||
          veiculoInfo.toLowerCase().includes(lowerSearch) ||
          (r.observacao && r.observacao.toLowerCase().includes(lowerSearch)) ||
          (r.observacao_autorizador &&
            r.observacao_autorizador.toLowerCase().includes(lowerSearch)) ||
          (r.autorizador_nome &&
            r.autorizador_nome.toLowerCase().includes(lowerSearch)) ||
          hasPassageiro(lowerSearch) ||
          (r.paradas &&
            r.paradas.some(
              (p) => p.local && p.local.toLowerCase().includes(lowerSearch),
            ))
        );
      });
    }

    return data.sort(
      (a, b) =>
        new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime(),
    );
  }, [reservas, filter, searchTerm]);

  const filterStatuses = [
    "Todos",
    "Pendente",
    "Aprovado",
    "Recusado",
    "Concluido",
    "Viagem Compartilhada",
  ];

  return (
    <div className="p-6 max-w-[95%] mx-auto bg-background text-foreground">
      <div className="flex gap-4 mb-6 items-center flex-wrap">
        <Select
          value={filter || "Todos"}
          onValueChange={(value) => setFilter(value === "Todos" ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {filterStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tooltip delayDuration={500}>
          <TooltipTrigger asChild>
            <div className="w-[150px]">
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p className="font-semibold">Regras de Busca:</p>
              <p>• Geral: Digite qualquer termo</p>
              <p>
                • Específica:{" "}
                <span className="font-mono font-bold text-muted-foreground">
                  campo:valor
                </span>
              </p>
              <p>• Campos: passageiros, motorista, obs, etc.</p>
            </div>
          </TooltipContent>
        </Tooltip>

        {selectedReservas.length >= 2 && (
          <Button onClick={handleCombineReservas} variant="secondary">
            <Link className="mr-2 h-4 w-4" />
            Combinar Viagens ({selectedReservas.length})
          </Button>
        )}

        <Button
          onClick={() => exportReservasToExcel(filteredReservas, reservas)}
          variant="outline"
          className="ml-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr>
                <th className="p-3 w-[50px]"></th>
                <th className="p-3">ID</th>
                <th className="p-3">Data Solicitação</th>
                <th className="p-3">Solicitante</th>
                <th className="p-3">Município</th>
                <th className="p-3">Data Saída</th>
                <th className="p-3">Data Retorno</th>
                <th className="p-3">Status</th>
                <th className="p-3">Responsável</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Filter out 'combinado' rows - they'll show as children of parent
                const mainRows = filteredReservas.filter(
                  (r) => (r.status || "").toLowerCase() !== "combinado",
                );

                if (mainRows.length === 0) {
                  return (
                    <tr>
                      <td colSpan={9} className="text-center p-4">
                        Nenhuma reserva encontrada.
                      </td>
                    </tr>
                  );
                }

                return mainRows.map((row: Reserva, index: number) => {
                  const isViagemCompartilhada =
                    row.is_grupo ||
                    (row.status || "").toLowerCase() === "viagem_compartilhada";
                  const childRows = isViagemCompartilhada
                    ? reservas.filter((r) => r.viagem_compartilhada === row.id)
                    : [];
                  const hasChildren = childRows.length > 0;
                  const isExpanded = expanded === row.id;
                  const isEvenRow = index % 2 === 0;

                  return (
                    <Fragment key={`row-${row.id}`}>
                      <tr
                        className={`border-t cursor-pointer hover:bg-muted/40 ${
                          isEvenRow ? "bg-muted/50" : ""
                        }`}
                        onClick={() =>
                          setExpanded(expanded === row.id ? null : row.id)
                        }
                      >
                        <td
                          className="p-3 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2">
                            {hasChildren ? (
                              isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )
                            ) : (
                              <span className="w-4" />
                            )}
                            {(row.status || "").toLowerCase() ===
                              "pendente" && (
                              <Checkbox
                                checked={selectedReservas.includes(row.id)}
                                onCheckedChange={() =>
                                  handleSelectReserva(row.id)
                                }
                              />
                            )}
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-mono text-xs">#{row.id}</span>
                          {hasChildren && (
                            <span className="ml-1 text-[10px] text-purple-600">
                              ({childRows.length})
                            </span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {formatDateTime(
                            row.data_criacao,
                            "", // Time included in ISO
                          )}
                        </td>
                        <td className="p-3">
                          {row.solicitante_nome}{" "}
                          {row.unidade ? `/ ${row.unidade}` : ""}
                        </td>
                        <td className="p-3">{row.municipio}</td>
                        <td className="p-3 whitespace-nowrap">
                          {formatDateTime(row.data_saida, row.horario_saida)}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {formatDateTime(
                            row.data_retorno,
                            row.horario_retorno,
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <Badge
                            className={cn(
                              getStatusBadgeClasses(
                                row.status === "combinado"
                                  ? "aprovado"
                                  : row.status,
                              ),
                            )}
                          >
                            {(() => {
                              const s = row.status.toLowerCase();
                              if (s === "aprovado" || s === "combinado")
                                return "Autorizado";
                              if (s === "viagem_compartilhada")
                                return "Viagem Compartilhada";
                              if (s === "recusado" || s === "negado")
                                return "Negado";
                              if (s === "cancelado") return "Cancelado";
                              if (s === "concluido") return "Concluído";
                              return formatStatusLabel(row.status);
                            })()}
                          </Badge>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {row.status.toLowerCase() === "concluido"
                            ? row.concluidor_nome
                            : row.status.toLowerCase() === "cancelado"
                              ? row.cancelador_nome
                              : (row.autorizador_nome ?? "-")}
                        </td>
                      </tr>

                      {hasChildren &&
                        childRows.map((child) => (
                          <Fragment key={`child-${child.id}`}>
                            <tr
                              className="bg-muted/15 border-t border-dashed cursor-pointer hover:bg-muted/25"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedChild(
                                  expandedChild === child.id ? null : child.id,
                                );
                              }}
                            >
                              <td className="p-3 pl-8 whitespace-nowrap">
                                <span className="text-muted-foreground">└</span>
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <span className="font-mono text-xs text-muted-foreground">
                                  #{child.id}
                                </span>
                              </td>
                              <td className="p-3 whitespace-nowrap text-muted-foreground text-sm">
                                {formatDateTime(child.data_criacao, "")}
                              </td>
                              <td className="p-3 text-muted-foreground text-sm">
                                {child.solicitante_nome}
                              </td>
                              <td className="p-3 text-muted-foreground text-sm">
                                {child.municipio}
                              </td>
                              <td className="p-3 whitespace-nowrap text-muted-foreground text-sm">
                                {formatDateTime(
                                  child.data_saida,
                                  child.horario_saida,
                                )}
                              </td>
                              <td className="p-3 whitespace-nowrap text-muted-foreground text-sm">
                                {formatDateTime(
                                  child.data_retorno,
                                  child.horario_retorno,
                                )}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <Badge
                                  className={cn(
                                    getStatusBadgeClasses(
                                      row.status === "combinado"
                                        ? "aprovado"
                                        : row.status,
                                    ),
                                  )}
                                >
                                  {(() => {
                                    // Herdar status do pai para fins visuais
                                    const s = row.status.toLowerCase();
                                    if (s === "aprovado" || s === "combinado")
                                      return "Autorizado";
                                    if (s === "viagem_compartilhada")
                                      return "Viagem Compartilhada";
                                    if (s === "recusado" || s === "negado")
                                      return "Negado";
                                    if (s === "cancelado") return "Cancelado";
                                    if (s === "concluido") return "Concluído";
                                    return formatStatusLabel(row.status);
                                  })()}
                                </Badge>
                              </td>
                              <td className="p-3 whitespace-nowrap text-muted-foreground text-sm">
                                {(() => {
                                  const s = row.status.toLowerCase();
                                  if (s === "concluido")
                                    return (
                                      child.concluidor_nome ||
                                      row.concluidor_nome ||
                                      "-"
                                    );
                                  if (s === "cancelado")
                                    return (
                                      child.cancelador_nome ||
                                      row.cancelador_nome ||
                                      "-"
                                    );
                                  return (
                                    child.autorizador_nome ||
                                    row.autorizador_nome ||
                                    "-"
                                  );
                                })()}
                              </td>
                            </tr>
                            {/* Expanded detail for child */}
                            {expandedChild === child.id && (
                              <tr>
                                <td
                                  colSpan={9}
                                  className="p-4 bg-muted/20 pl-10"
                                >
                                  <ReservaCard reserva={child} />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))}

                      {/* Expanded Detail Panel for parent row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="p-4 bg-muted/30">
                            <ReservaCard reserva={row} />
                            {row.status.toLowerCase() === "pendente" && (
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
                                      value={
                                        selectedMotoristas[row.id] ??
                                        (row.motorista_designado
                                          ? String(row.motorista_designado.id)
                                          : "")
                                      }
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
                                      value={
                                        selectedVeiculos[row.id] ??
                                        (row.veiculo_designado
                                          ? String(row.veiculo_designado.id)
                                          : "")
                                      }
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
                                    Recusar
                                  </Button>
                                </div>
                              </div>
                            )}
                            {/* Concluir button for aprovado/viagem_compartilhada */}
                            {["aprovado", "viagem_compartilhada"].includes(
                              (row.status || "").toLowerCase(),
                            ) && (
                              <div className="border-t pt-4 mt-4">
                                <Button
                                  onClick={() => handleConclude(row.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Concluir Viagem
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isCombineModalOpen} onOpenChange={setIsCombineModalOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Combinar Viagens</DialogTitle>
            <DialogDescription>
              Criando viagem compartilhada a partir das solicitações
              selecionadas.
            </DialogDescription>
          </DialogHeader>

          {/* Side-by-side comparison of selected chamados */}
          {(() => {
            const selectedChamados = reservas.filter((r) =>
              selectedReservas.includes(r.id),
            );
            const totalPassengers = combineFormData.passageiros.length;
            const hasPassengerWarning = totalPassengers > 4;

            return (
              <div className="space-y-4">
                {/* Passenger count warning */}
                {hasPassengerWarning && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>Atenção:</strong> O total de passageiros (
                      {totalPassengers}) excede o limite de 4. Apenas os 4
                      primeiros serão incluídos.
                    </span>
                  </div>
                )}

                {/* Summary stats */}
                <div className="flex flex-wrap gap-4 p-3 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>{totalPassengers}</strong> passageiros
                      {hasPassengerWarning && (
                        <span className="text-amber-600 ml-1">(máx: 4)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>{combineFormData.paradas.length}</strong> paradas
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>{selectedChamados.length}</strong> chamados
                    </span>
                  </div>
                </div>

                {/* Side-by-side comparison cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedChamados.map((chamado) => {
                    const passengers = [
                      chamado.passageiro1,
                      chamado.passageiro2,
                      chamado.passageiro3,
                      chamado.passageiro4,
                    ].filter(Boolean);

                    return (
                      <div
                        key={chamado.id}
                        className="border rounded-lg p-3 bg-background space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-sm font-semibold">
                            #{chamado.id}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {formatStatusLabel(chamado.status)}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span className="truncate">
                              {chamado.solicitante_nome}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                              {chamado.municipio}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Saída:{" "}
                            {formatDateTime(
                              chamado.data_saida,
                              chamado.horario_saida,
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Retorno:{" "}
                            {formatDateTime(
                              chamado.data_retorno,
                              chamado.horario_retorno,
                            )}
                          </div>
                          {passengers.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Passageiros: {passengers.length}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="data_saida">Data Saída</Label>
                <Input
                  id="data_saida"
                  type="date"
                  value={combineFormData.data_saida}
                  onChange={(e) =>
                    setCombineFormData((prev) => ({
                      ...prev,
                      data_saida: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="horario_saida">Horário Saída</Label>
                <Input
                  id="horario_saida"
                  type="time"
                  value={combineFormData.horario_saida}
                  onChange={(e) =>
                    setCombineFormData((prev) => ({
                      ...prev,
                      horario_saida: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="data_retorno">Data Retorno</Label>
                <Input
                  id="data_retorno"
                  type="date"
                  value={combineFormData.data_retorno}
                  onChange={(e) =>
                    setCombineFormData((prev) => ({
                      ...prev,
                      data_retorno: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="horario_retorno">Horário Retorno</Label>
                <Input
                  id="horario_retorno"
                  type="time"
                  value={combineFormData.horario_retorno}
                  onChange={(e) =>
                    setCombineFormData((prev) => ({
                      ...prev,
                      horario_retorno: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Paradas */}
            <div className="grid gap-2">
              <Label>Paradas</Label>
              <div className="flex gap-2">
                <Input
                  value={paradaInput}
                  onChange={(e) => setParadaInput(e.target.value)}
                  placeholder="Adicionar parada..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (paradaInput.trim()) {
                        setCombineFormData((prev) => ({
                          ...prev,
                          paradas: [...prev.paradas, paradaInput.trim()],
                        }));
                        setParadaInput("");
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (paradaInput.trim()) {
                      setCombineFormData((prev) => ({
                        ...prev,
                        paradas: [...prev.paradas, paradaInput.trim()],
                      }));
                      setParadaInput("");
                    }
                  }}
                >
                  <PlusCircleIcon className="w-4 h-4 mr-2" /> Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {combineFormData.paradas.map((item, i) => (
                  <Badge key={i} variant="secondary">
                    {item}
                    <button
                      type="button"
                      className="ml-2"
                      onClick={() => {
                        setCombineFormData((prev) => ({
                          ...prev,
                          paradas: prev.paradas.filter((_, idx) => idx !== i),
                        }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Passageiros */}
            <div className="grid gap-2">
              <Label>Passageiros</Label>
              <div className="flex gap-2">
                <Input
                  value={passageiroInput}
                  onChange={(e) => setPassageiroInput(e.target.value)}
                  placeholder="Adicionar passageiro..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (passageiroInput.trim()) {
                        setCombineFormData((prev) => ({
                          ...prev,
                          passageiros: [
                            ...prev.passageiros,
                            passageiroInput.trim(),
                          ],
                        }));
                        setPassageiroInput("");
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (passageiroInput.trim()) {
                      setCombineFormData((prev) => ({
                        ...prev,
                        passageiros: [
                          ...prev.passageiros,
                          passageiroInput.trim(),
                        ],
                      }));
                      setPassageiroInput("");
                    }
                  }}
                >
                  <PlusCircleIcon className="w-4 h-4 mr-2" /> Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {combineFormData.passageiros.map((item, i) => (
                  <Badge key={i} variant="secondary">
                    {item}
                    <button
                      type="button"
                      className="ml-2"
                      onClick={() => {
                        setCombineFormData((prev) => ({
                          ...prev,
                          passageiros: prev.passageiros.filter(
                            (_, idx) => idx !== i,
                          ),
                        }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Motorista</Label>
                <Select
                  value={combineFormData.motorista_id}
                  onValueChange={(value) =>
                    setCombineFormData((prev) => ({
                      ...prev,
                      motorista_id: value,
                    }))
                  }
                >
                  <SelectTrigger>
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
              <div className="grid gap-2">
                <Label>Veículo</Label>
                <Select
                  value={combineFormData.veiculo_id}
                  onValueChange={(value) =>
                    setCombineFormData((prev) => ({
                      ...prev,
                      veiculo_id: value,
                    }))
                  }
                >
                  <SelectTrigger>
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
            <div className="grid gap-2">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea
                id="observacao"
                value={combineFormData.observacao}
                onChange={(e) =>
                  setCombineFormData((prev) => ({
                    ...prev,
                    observacao: e.target.value,
                  }))
                }
                placeholder="Observação para todas as reservas"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCombineModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmCombine}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
