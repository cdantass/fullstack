"use client";

import * as React from "react";
import { toast } from "sonner";
import { api } from "@/api";
import { useReservas, type Reserva } from "@/pages/context/ReservaContext";
import { useAuth } from "@/pages/context/AdminContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Car,
  Users,
  User,
  MapPin,
  NotebookPen,
  X,
  RefreshCw,
  CheckCircle,
  XCircle,
  ArrowUpDown,
} from "lucide-react";

/* ---------------- TYPES ---------------- */
type SortConfig = {
  key: keyof Reserva;
  direction: "ascending" | "descending";
};

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
}
interface Veiculo {
  id: number;
  placa: string;
  modelo: string;
}

/* ------------------------------------------- */
/* MAIN PAGE COMPONENT                         */
/* ------------------------------------------- */
export default function ConsultarReservaPage() {
  const { reservas, addReserva } = useReservas();
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
  const perPage = 10;

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
          if (r.status === "Aprovado") acc.aprovado++;
          else if (r.status === "Negado") acc.negado++;
          else if (r.status === "Pendente") acc.pendente++;
          return acc;
        },
        { aprovado: 0, negado: 0, pendente: 0 }
      ),
    [sortedAndFilteredReservas]
  );

  const renderCard = (row: Reserva) => (
    <Card key={row.id} className="mb-4">
      <CardContent className="grid md:grid-cols-2 gap-6 p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Veículo:</span>
          </div>
          <p className="ml-6">
            {row.veiculo ? veiculoMap[row.veiculo as any] || row.veiculo : "-"}
          </p>
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
          <p className="ml-6">
            {row.motorista
              ? motoristaMap[row.motorista as any] || row.motorista
              : "-"}
          </p>
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

          {row.status !== "Pendente" && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                {row.status === "Aprovado" ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="font-medium">
                  {row.status === "Aprovado" ? "Aprovado por:" : "Negado por:"}
                </span>
              </div>
              <p className="ml-6 text-sm">
                <strong>Autorizador:</strong> {row.autorizador ?? "N/A"}
              </p>
              <p className="ml-6 text-sm">
                <strong>Data:</strong>{" "}
                {formatDateTime(row.data_autorizacao, row.horario_autorizacao)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
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
          const styles = {
            Aprovado: "bg-green-100 text-green-800 hover:bg-green-200",
            Negado: "bg-red-100 text-red-800 hover:bg-red-200",
            Pendente: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
          };

          if (count === 0 && authUser?.usertype !== "gestor") {
            return null;
          }

          return (
            <Badge
              key={status}
              className={`cursor-pointer flex items-center gap-2 font-semibold transition-all p-2 ${
                styles[status as keyof typeof styles]
              } ${filter === status ? "ring-2 ring-offset-2" : ""}`}
              onClick={() => setFilter(filter === status ? null : status)}
            >
              {count} {status}
              {count !== 1 && "s"}
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
                <SortableHeader columnKey="veiculo">Veículo</SortableHeader>
                <SortableHeader columnKey="motorista">Motorista</SortableHeader>
                <SortableHeader columnKey="status">Status</SortableHeader>
                <SortableHeader columnKey="data_autorizacao">
                  Data Resposta
                </SortableHeader>
                <SortableHeader columnKey="autorizador">
                  Autorizador
                </SortableHeader>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center p-4">
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
                        {row.veiculo
                          ? veiculoMap[row.veiculo as any] || row.veiculo
                          : "-"}
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {row.motorista
                          ? motoristaMap[row.motorista as any] || row.motorista
                          : "-"}
                      </td>
                      <td className="p-2 whitespace-nowrap">
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
                      <td className="p-2 whitespace-nowrap">
                        {row.data_autorizacao
                          ? formatDateTime(
                              row.data_autorizacao,
                              row.horario_autorizacao
                            )
                          : "-"}
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {row.autorizador ?? "-"}
                      </td>
                    </tr>
                    {expanded === row.id && (
                      <tr>
                        <td colSpan={10} className="p-4 bg-muted/30">
                          {renderCard(row)}
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
