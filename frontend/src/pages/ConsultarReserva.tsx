"use client";

import * as React from "react";
import { toast } from "sonner";
import { useReservas, type Reserva } from "@/context/reserva-context-hook";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { ReservaCard } from "@/components/ReservaCard";

import api from "@/api";
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

interface Motorista {
  id: number;
  nome_motorista: string;
}
interface Veiculo {
  id: number;
  placa: string;
  modelo: string;
}

const getStatusBadgeClasses = (status: Reserva["status"]) => {
  switch (status) {
    case "Aprovado":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "Negado":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "Pendente":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "Concluido":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "Viagem compartilhada":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function ConsultarReservaPage() {
  const { reservas, fetchReservas, cancelReserva } = useReservas();
  const { user: authUser } = useAuth();
  const [expanded, setExpanded] = React.useState<number | null>(null);
  const [filter, setFilter] = React.useState<string | null>(null);
  const [motoristas, setMotoristas] = React.useState<Motorista[]>([]);
  const [veiculos, setVeiculos] = React.useState<Veiculo[]>([]);
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortConfig, setSortConfig] = React.useState<SortConfig | null>({
    key: "data_solicitacao",
    direction: "descending",
  });
  const [timeRange, setTimeRange] = React.useState<
    "24h" | "7d" | "30d" | "custom"
  >("24h");
  const perPage = 10;
  const [searchTerm, setSearchTerm] = React.useState("");

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

    if (authUser.usertype !== "gestor") {
      data = data.filter((r) => r.solicitante === authUser.name);
    }

    if (timeRange === "custom") {
      if (startDate) {
        data = data.filter(
          (r) => new Date(r.data_solicitacao) >= new Date(startDate)
        );
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        data = data.filter((r) => new Date(r.data_solicitacao) <= endOfDay);
      }
    } else {
      const now = new Date();
      data = data.filter((r) => {
        const solicitacaoDate = new Date(
          `${r.data_solicitacao}T${r.horario_solicitacao}`
        );
        const diffTime = now.getTime() - solicitacaoDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);

        if (timeRange === "24h") return diffTime <= 24 * 60 * 60 * 1000;
        if (timeRange === "7d") return diffDays <= 7;
        if (timeRange === "30d") return diffDays <= 30;
        return true;
      });
    }

    if (filter) {
      data = data.filter((r) => r.status === filter);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const fieldMatch = lowerSearch.match(/^(\w+):(.+)$/);

      data = data.filter((r) => {
        const motoristaName = r.motorista
          ? motoristaMap[parseInt(r.motorista, 10)] || r.motorista
          : "";
        const veiculoInfo = r.veiculo
          ? veiculoMap[parseInt(r.veiculo, 10)] || r.veiculo
          : "";

        if (fieldMatch) {
          const [, field, value] = fieldMatch;
          const cleanValue = value.trim();

          switch (field) {
            case "passageiros":
              return r.passageiros.some((p) =>
                p.toLowerCase().includes(cleanValue)
              );
            case "motorista":
              return (
                motoristaName &&
                motoristaName.toLowerCase().includes(cleanValue)
              );
            case "veiculo":
              return (
                veiculoInfo && veiculoInfo.toLowerCase().includes(cleanValue)
              );
            case "solicitante":
              return r.solicitante.toLowerCase().includes(cleanValue);
            case "unidade":
              return r.unidade.toLowerCase().includes(cleanValue);
            case "municipio":
              return r.municipio.toLowerCase().includes(cleanValue);
            case "obs":
              return (
                (r.obsSolicitante &&
                  r.obsSolicitante.toLowerCase().includes(cleanValue)) ||
                (r.obsAdmin && r.obsAdmin.toLowerCase().includes(cleanValue))
              );
            case "autorizador":
              return (
                r.autorizador &&
                r.autorizador.toLowerCase().includes(cleanValue)
              );
            case "id":
              return (
                r.id.toString().includes(cleanValue.replace("#", "")) ||
                (r.viagemCompartilhadaId &&
                  r.viagemCompartilhadaId
                    .toString()
                    .includes(cleanValue.replace("#", "")))
              );
            default:
              break;
          }
        }

        return (
          r.solicitante.toLowerCase().includes(lowerSearch) ||
          r.unidade.toLowerCase().includes(lowerSearch) ||
          r.municipio.toLowerCase().includes(lowerSearch) ||
          (motoristaName &&
            motoristaName.toLowerCase().includes(lowerSearch)) ||
          (veiculoInfo && veiculoInfo.toLowerCase().includes(lowerSearch)) ||
          (r.obsSolicitante &&
            r.obsSolicitante.toLowerCase().includes(lowerSearch)) ||
          (r.obsAdmin && r.obsAdmin.toLowerCase().includes(lowerSearch)) ||
          (r.autorizador &&
            r.autorizador.toLowerCase().includes(lowerSearch)) ||
          r.passageiros.some((p) => p.toLowerCase().includes(lowerSearch)) ||
          r.paradas.some((p) => p.toLowerCase().includes(lowerSearch)) ||
          r.id.toString().includes(lowerSearch.replace("#", "")) ||
          (r.viagemCompartilhadaId &&
            r.viagemCompartilhadaId
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
    motoristaMap,
    veiculoMap,
  ]);

  const totalPages = Math.ceil(sortedAndFilteredReservas.length / perPage);
  const pageData = sortedAndFilteredReservas.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const SortableHeader = ({
    columnKey,
    children,
  }: {
    columnKey: keyof Reserva;
    children: React.ReactNode;
  }) => (
    <th className="px-2 py-2 whitespace-nowrap">
      <Button
        variant="ghost"
        onClick={() => requestSort(columnKey)}
        className="px-2 py-1 h-auto w-full justify-start"
      >
        {children}
        <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    </th>
  );

  const filterStatuses = [
    "Todos",
    "Pendente",
    "Aprovado",
    "Negado",
    "Cancelado",
    "Concluido",
    "Viagem compartilhada",
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
            <SelectTrigger className="w-[180px]">
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
                  onClick={() => requestSort("data_solicitacao")}
                  className="px-2 py-1 h-auto w-full justify-start text-left"
                >
                  Data Solicitação
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </th>

              <th className="px-2 py-2 w-[220px]">
                <Button
                  variant="ghost"
                  onClick={() => requestSort("solicitante")}
                  className="px-2 py-1 h-auto w-full justify-start text-left"
                >
                  Solicitante / Unidade
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

              <th className="px-2 py-2 w-[120px]">
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
                  onClick={() => requestSort("autorizador")}
                  className="px-2 py-1 h-auto w-full justify-start text-left"
                >
                  Autorizador
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </th>
            </tr>
          </thead>

          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-4">
                  Nenhuma reserva encontrada.
                </td>
              </tr>
            ) : (
              pageData.map((row) => (
                <React.Fragment key={row.id}>
                  <tr
                    className="border-t cursor-pointer hover:bg-muted/20"
                    onClick={() =>
                      setExpanded(expanded === row.id ? null : row.id)
                    }
                  >
                    <td className="p-2 break-words">
                      <span className="font-mono text-xs">#{row.id}</span>
                      {row.viagemCompartilhadaId && (
                        <div className="text-[10px] text-muted-foreground">
                          #{row.viagemCompartilhadaId}
                        </div>
                      )}
                    </td>
                    <td className="p-2">
                      {formatDateTime(
                        row.data_solicitacao,
                        row.horario_solicitacao
                      )}
                    </td>
                    <td className="p-2 break-words">
                      {row.solicitante} / {row.unidade}
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
                        {row.status}
                      </Badge>
                    </td>
                    <td className="p-2 break-words">
                      {row.autorizador ?? "-"}
                    </td>
                  </tr>

                  {expanded === row.id && (
                    <tr>
                      <td colSpan={8} className="p-4 bg-muted/30">
                        <ReservaCard
                          reserva={row}
                          veiculoMap={veiculoMap}
                          motoristaMap={motoristaMap}
                          onCancel={(id) =>
                            cancelReserva(id, authUser?.name || "Usuário")
                          }
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
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
