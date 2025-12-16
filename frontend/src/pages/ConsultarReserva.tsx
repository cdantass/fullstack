"use client";

import * as React from "react";
import { useReservas, type Reserva } from "@/context/reserva-context-hook";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, ChevronDown, ChevronRight } from "lucide-react";
import { formatDateTime, formatStatusLabel } from "@/lib/utils";
import { ReservaCard } from "@/components/ReservaCard";

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

type SortConfig = {
  key: keyof Reserva;
  direction: "ascending" | "descending";
};

const getStatusBadgeClasses = (status: string) => {
  switch ((status || "").toLowerCase()) {
    case "aprovado":
      return "bg-green-100 text-green-800 hover:bg-green-200";
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

export default function ConsultarReservaPage() {
  const { reservas, fetchReservas, cancelReserva } = useReservas();
  const { user: authUser } = useAuth();
  const [expanded, setExpanded] = React.useState<number | null>(null);
  const [expandedChild, setExpandedChild] = React.useState<number | null>(null);
  const [filter, setFilter] = React.useState<string | null>(null);
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortConfig, setSortConfig] = React.useState<SortConfig | null>({
    key: "data_criacao",
    direction: "descending",
  });
  const [timeRange, setTimeRange] = React.useState<
    "24h" | "7d" | "30d" | "custom"
  >("24h");
  const perPage = 10;
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    fetchReservas();
    // No need to fetch motoristas/veiculos for this page anymore
    // as they are embedded in the reserva object for display purposes
  }, [fetchReservas]);

  const requestSort = (key: keyof Reserva) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredReservas = React.useMemo(() => {
    let data = [...reservas];
    if (!authUser) return [];

    // Gestor can see everything (or specific filters), regular user only theirs
    if (authUser.usertype !== "gestor") {
      data = data.filter(
        (r) => String(r.solicitante_nome) === String(authUser.id)
      );
    }

    // Date filtering
    if (timeRange === "custom") {
      if (startDate) {
        data = data.filter(
          (r) => new Date(r.data_criacao) >= new Date(startDate)
        );
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        data = data.filter((r) => new Date(r.data_criacao) <= endOfDay);
      }
    } else {
      const now = new Date();
      data = data.filter((r) => {
        // data_criacao is full ISO string now
        const solicitacaoDate = new Date(r.data_criacao);
        const diffTime = now.getTime() - solicitacaoDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);

        if (timeRange === "24h") return diffTime <= 24 * 60 * 60 * 1000;
        if (timeRange === "7d") return diffDays <= 7;
        if (timeRange === "30d") return diffDays <= 30;
        return true;
      });
    }

    // Status filtering
    if (filter) {
      // Normalize filter: "Viagem Compartilhada" -> "viagem_compartilhada"
      const normalizedFilter = filter.toLowerCase().replace(/\s+/g, "_");
      data = data.filter((r) => r.status.toLowerCase() === normalizedFilter);
    }

    // Search term filtering
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const fieldMatch = lowerSearch.match(/^(\w+):(.+)$/);

      data = data.filter((r) => {
        const motoristaName = r.motorista_designado?.nome_motorista || "";
        const veiculoInfo = r.veiculo_designado
          ? `${r.veiculo_designado.modelo} ${r.veiculo_designado.placa}`
          : "";
        const passageiros = [
          r.passageiro1,
          r.passageiro2,
          r.passageiro3,
          r.passageiro4,
        ]
          .filter(Boolean)
          .join(" ");

        if (fieldMatch) {
          const [, field, value] = fieldMatch;
          const cleanValue = value.trim();

          switch (field) {
            case "passageiros":
              return passageiros.toLowerCase().includes(cleanValue);
            case "motorista":
              return motoristaName.toLowerCase().includes(cleanValue);
            case "veiculo":
              return veiculoInfo.toLowerCase().includes(cleanValue);
            case "solicitante":
              return r.solicitante_nome.toLowerCase().includes(cleanValue);
            case "municipio":
              return r.municipio.toLowerCase().includes(cleanValue);
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
              return (
                r.id.toString().includes(cleanValue.replace("#", "")) ||
                (r.viagem_compartilhada &&
                  r.viagem_compartilhada
                    .toString()
                    .includes(cleanValue.replace("#", "")))
              );
            default:
              break;
          }
        }

        return (
          r.solicitante_nome.toLowerCase().includes(lowerSearch) ||
          r.municipio.toLowerCase().includes(lowerSearch) ||
          motoristaName.toLowerCase().includes(lowerSearch) ||
          veiculoInfo.toLowerCase().includes(lowerSearch) ||
          (r.observacao && r.observacao.toLowerCase().includes(lowerSearch)) ||
          (r.observacao_autorizador &&
            r.observacao_autorizador.toLowerCase().includes(lowerSearch)) ||
          (r.autorizador_nome &&
            r.autorizador_nome.toLowerCase().includes(lowerSearch)) ||
          passageiros.toLowerCase().includes(lowerSearch) ||
          r.paradas.some((p) => p.local.toLowerCase().includes(lowerSearch)) ||
          r.id.toString().includes(lowerSearch.replace("#", "")) ||
          (r.viagem_compartilhada &&
            r.viagem_compartilhada
              .toString()
              .includes(lowerSearch.replace("#", "")))
        );
      });
    }

    if (sortConfig !== null) {
      data.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue)
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue)
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [
    reservas,
    filter,
    authUser,
    startDate,
    endDate,
    sortConfig,
    timeRange,
    searchTerm,
  ]);

  const totalPages = Math.ceil(sortedAndFilteredReservas.length / perPage);
  const pageData = sortedAndFilteredReservas.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const filterStatuses = [
    "Todos",
    "Pendente",
    "Aprovado",
    "Recusado",
    "Cancelado",
    "Concluido",
    "Viagem Compartilhada",
  ];

  return (
    <div className="p-4 sm:p-6 w-full mx-auto bg-background text-foreground overflow-x-hidden">
      {/* FILTER BAR */}
      <div className="flex flex-col gap-4 mb-6 min-w-0">
        <div className="flex gap-4 items-center flex-wrap min-w-0">
          <Select
            value={filter || "Todos"}
            onValueChange={(value) =>
              setFilter(value === "Todos" ? null : value)
            }
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

          <Tooltip delayDuration={2000}>
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
                  <span className="font-mono font-bold">campo:valor</span>
                </p>
                <p>• Campos: passageiros, motorista, obs, etc.</p>
              </div>
            </TooltipContent>
          </Tooltip>

          <div className="flex gap-2 items-center ml-auto flex-wrap min-w-0">
            <div className="flex bg-muted rounded-md p-1 gap-1">
              {(["24h", "7d", "30d"] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setTimeRange(range);
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="h-8"
                >
                  {range === "24h"
                    ? "24h"
                    : range === "7d"
                    ? "7 dias"
                    : "30 dias"}
                </Button>
              ))}
            </div>

            <div className="h-4 w-px bg-border mx-2" />

            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setTimeRange("custom");
              }}
              className="w-auto h-9"
            />
            <span className="text-sm text-muted-foreground">-</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setTimeRange("custom");
              }}
              className="w-auto h-9"
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="border rounded-md overflow-x-auto w-full">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-muted text-left text-muted-foreground">
            <tr>
              <th className="px-2 py-2 w-[60px]">
                <Button
                  variant="ghost"
                  onClick={() => requestSort("id")}
                  className="px-2 py-1 h-auto w-full justify-start text-left"
                >
                  ID
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </th>

              <th className="px-2 py-2 w-[150px] whitespace-nowrap">
                <Button
                  variant="ghost"
                  onClick={() => requestSort("data_criacao")}
                  className="px-2 py-1 h-auto w-full justify-start text-left"
                >
                  Data Criação
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </th>

              <th className="px-2 py-2 w-[220px]">
                <Button
                  variant="ghost"
                  onClick={() => requestSort("solicitante_nome")}
                  className="px-2 py-1 h-auto w-full justify-start text-left"
                >
                  Solicitante
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </th>

              <th className="px-2 py-2 w-[140px]">
                <Button
                  variant="ghost"
                  onClick={() => requestSort("municipio")}
                  className="px-2 py-1 h-auto w-full justify-start text-left"
                >
                  Município
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </th>

              <th className="px-2 py-2 w-[150px] whitespace-nowrap">
                <Button
                  variant="ghost"
                  onClick={() => requestSort("data_saida")}
                  className="px-2 py-1 h-auto w-full justify-start text-left"
                >
                  Data Saída
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </th>

              <th className="px-2 py-2 w-[150px] whitespace-nowrap">
                <Button
                  variant="ghost"
                  onClick={() => requestSort("data_retorno")}
                  className="px-2 py-1 h-auto w-full justify-start text-left"
                >
                  Data Retorno
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </th>

              <th className="px-2 py-2 w-[160px]">
                <Button
                  variant="ghost"
                  onClick={() => requestSort("status")}
                  className="px-2 py-1 h-auto w-full justify-start text-left"
                >
                  Status
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </th>

              <th className="px-2 py-2 w-[140px]">
                <Button
                  variant="ghost"
                  onClick={() => requestSort("autorizador_nome")}
                  className="px-2 py-1 h-auto w-full justify-start text-left"
                >
                  Autorizador
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </th>
            </tr>
          </thead>

          <tbody>
            {(() => {
              // Filter out 'combinado' rows - they'll show as children of parent
              const mainRows = pageData.filter(
                (r) => (r.status || "").toLowerCase() !== "combinado"
              );

              if (mainRows.length === 0) {
                return (
                  <tr>
                    <td colSpan={8} className="text-center p-4">
                      Nenhuma reserva encontrada.
                    </td>
                  </tr>
                );
              }

              return mainRows.map((row, index) => {
                const isViagemCompartilhada =
                  (row.status || "").toLowerCase() === "viagem_compartilhada";
                const childRows = isViagemCompartilhada
                  ? reservas.filter((r) => r.viagem_compartilhada === row.id)
                  : [];
                const hasChildren = childRows.length > 0;
                const isExpanded = expanded === row.id;
                const isEvenRow = index % 2 === 0;

                return (
                  <React.Fragment key={row.id}>
                    <tr
                      className={`border-t cursor-pointer hover:bg-muted/40 ${
                        isEvenRow ? "bg-muted/50" : ""
                      }`}
                      onClick={() =>
                        setExpanded(expanded === row.id ? null : row.id)
                      }
                    >
                      <td className="p-2 break-words">
                        <div className="flex items-center gap-1">
                          {hasChildren ? (
                            isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )
                          ) : (
                            <span className="w-4" />
                          )}
                          <span className="font-mono text-xs">#{row.id}</span>
                          {hasChildren && (
                            <span className="text-[10px] text-purple-600">
                              ({childRows.length})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        {formatDateTime(row.data_criacao, "")}
                      </td>
                      <td className="p-2 break-words">
                        {row.solicitante_nome}
                      </td>
                      <td className="p-2">{row.municipio}</td>
                      <td className="p-2">
                        {formatDateTime(row.data_saida, row.horario_saida)}
                      </td>
                      <td className="p-2">
                        {formatDateTime(row.data_retorno, row.horario_retorno)}
                      </td>
                      <td className="p-2">
                        <Badge className={getStatusBadgeClasses(row.status)}>
                          {formatStatusLabel(row.status)}
                        </Badge>
                      </td>
                      <td className="p-2 break-words">
                        {row.autorizador_nome ?? "-"}
                      </td>
                    </tr>

                    {/* Nested Children Rows (for viagem_compartilhada) */}
                    {isExpanded &&
                      hasChildren &&
                      childRows.map((child) => (
                        <React.Fragment key={`child-${child.id}`}>
                          <tr
                            className="bg-muted/10 border-t border-dashed cursor-pointer hover:bg-muted/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedChild(
                                expandedChild === child.id ? null : child.id
                              );
                            }}
                          >
                            <td className="p-2 pl-6">
                              <span className="text-muted-foreground">└</span>
                              <span className="font-mono text-xs text-muted-foreground ml-1">
                                #{child.id}
                              </span>
                            </td>
                            <td className="p-2 text-muted-foreground text-sm">
                              {formatDateTime(child.data_criacao, "")}
                            </td>
                            <td className="p-2 text-muted-foreground text-sm">
                              {child.solicitante_nome}
                            </td>
                            <td className="p-2 text-muted-foreground text-sm">
                              {child.municipio}
                            </td>
                            <td className="p-2 text-muted-foreground text-sm">
                              {formatDateTime(
                                child.data_saida,
                                child.horario_saida
                              )}
                            </td>
                            <td className="p-2 text-muted-foreground text-sm">
                              {formatDateTime(
                                child.data_retorno,
                                child.horario_retorno
                              )}
                            </td>
                            <td className="p-2">
                              <Badge
                                className={getStatusBadgeClasses(child.status)}
                              >
                                {formatStatusLabel(child.status)}
                              </Badge>
                            </td>
                            <td className="p-2 text-muted-foreground text-sm">
                              {child.autorizador_nome ?? "-"}
                            </td>
                          </tr>
                          {/* Expanded detail for child */}
                          {expandedChild === child.id && (
                            <tr>
                              <td colSpan={8} className="p-4 bg-muted/20 pl-10">
                                <ReservaCard reserva={child} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="p-4 bg-muted/30">
                          <ReservaCard
                            reserva={row}
                            onCancel={(id) =>
                              cancelReserva(id, authUser?.name || "Usuário")
                            }
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              });
            })()}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm font-medium">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  );
}
