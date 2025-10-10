"use client";

import * as React from "react";
import { toast } from "sonner";
import { api } from "@/api";
import { useReservas, type Reserva } from "@/pages/context/ReservaContext";
import { useAuth } from "../pages/context/AdminContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, X, ArrowUpDown } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { ReservaCard } from "@/components/ReservaCard";
import { cn } from "@/lib/utils";

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
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function ConsultarReservaPage() {
  const { reservas, fetchReservas } = useReservas();
const { user: authUser, loading } = useAuth();
  if (loading) {
    return (
      <div className="p-6">
        <p>A carregar as suas reservas...</p>
      </div>
    );
  }
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
  const perPage = 10;

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

    if (filter) data = data.filter((r) => r.status === filter);

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

    if (sortConfig !== null) {
      data.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return data;
  }, [reservas, filter, authUser, startDate, endDate, sortConfig]);

  const totalPages = Math.ceil(sortedAndFilteredReservas.length / perPage);
  const pageData = sortedAndFilteredReservas.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const statusSummary = React.useMemo(
    () =>
      sortedAndFilteredReservas.reduce(
        (acc, r) => {
          const statusKey = r.status.toLowerCase() as keyof typeof acc;
          acc[statusKey] = (acc[statusKey] || 0) + 1;
          return acc;
        },
        { aprovado: 0, negado: 0, pendente: 0 }
      ),
    [sortedAndFilteredReservas]
  );

  const SortableHeader = ({
    columnKey,
    children,
  }: {
    columnKey: keyof Reserva;
    children: React.ReactNode;
  }) => (
    <th className="px-2 py-2">
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

  const filterStatuses = ["Pendente", "Aprovado", "Negado"];

  return (
    <div className="p-4 sm:p-6 w-full bg-background text-foreground">
      <div className="flex gap-4 mb-6 items-center flex-wrap">
        {filterStatuses.map((status) => {
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
                  className="ml-1"
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
        <div className="flex gap-2 items-center ml-auto">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-auto"
          />
          <span className="text-sm text-muted-foreground">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr>
                <SortableHeader columnKey="data_solicitacao">
                  Data Solicitação
                </SortableHeader>
                <SortableHeader columnKey="solicitante">
                  Solicitante / Unidade
                </SortableHeader>
                <SortableHeader columnKey="municipio">Município</SortableHeader>
                <SortableHeader columnKey="data_saida">
                  Data Saída
                </SortableHeader>
                <SortableHeader columnKey="data_retorno">
                  Data Retorno
                </SortableHeader>
                <SortableHeader columnKey="status">Status</SortableHeader>
                <SortableHeader columnKey="autorizador">
                  Autorizador
                </SortableHeader>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-4">
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
                      <td className="p-2 whitespace-nowrap">
                        {formatDateTime(
                          row.data_solicitacao,
                          row.horario_solicitacao
                        )}
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {row.solicitante} / {row.unidade}
                      </td>
                      <td className="p-2 whitespace-nowrap">{row.municipio}</td>
                      <td className="p-2 whitespace-nowrap">
                        {formatDateTime(row.data_saida, row.horario_saida)}
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {formatDateTime(row.data_retorno, row.horario_retorno)}
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        <Badge className={getStatusBadgeClasses(row.status)}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {row.autorizador ?? "-"}
                      </td>
                    </tr>
                    {expanded === row.id && (
                      <tr>
                        <td colSpan={7} className="p-4 bg-muted/30">
                          <ReservaCard
                            reserva={row}
                            veiculoMap={veiculoMap}
                            motoristaMap={motoristaMap}
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
      </div>

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
