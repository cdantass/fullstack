"use client";

import * as React from "react";
import { useReservas, type Reserva } from "@/context/reserva-context-hook";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { formatDateTime } from "@/lib/utils";
import { ReservaCard } from "@/components/ReservaCard";

import { CheckCircle, Link, PlusCircleIcon, X } from "lucide-react";
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
    case "recusado":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "pendente":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "concluido":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "viagem compartilhada":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    case "cancelado":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
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
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedReservas, setSelectedReservas] = React.useState<number[]>([]);
  const [isCombineModalOpen, setIsCombineModalOpen] = React.useState(false);
  const [viewSharedRideId, setViewSharedRideId] = React.useState<string | null>(
    null
  );
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

  const handleSelectReserva = (id: number) => {
    setSelectedReservas((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const pendingIds = filteredReservas
      .filter((r) => r.status === "Pendente")
      .map((r) => r.id);

    if (pendingIds.every((id) => selectedReservas.includes(id))) {
      setSelectedReservas((prev) =>
        prev.filter((id) => !pendingIds.includes(id))
      );
    } else {
      setSelectedReservas((prev) =>
        Array.from(new Set([...prev, ...pendingIds]))
      );
    }
  };

  const handleCombineReservas = () => {
    if (selectedReservas.length < 2) return;

    const selected = reservas.filter((r) => selectedReservas.includes(r.id));
    const firstReserva = selected[0];

    // Aggregate unique stops and passengers
    const allParadas = Array.from(
      new Set(selected.flatMap((r) => r.paradas.map((p) => p.local)))
    )
      .filter(Boolean)
      .map((local) => ({ local }));

    const allPassageiros = Array.from(
      new Set(
        selected.flatMap((r) =>
          [r.passageiro1, r.passageiro2, r.passageiro3, r.passageiro4].filter(
            Boolean
          )
        )
      )
    ).filter(Boolean) as string[];

    if (firstReserva) {
      setCombineFormData({
        data_saida: firstReserva.data_saida,
        horario_saida: firstReserva.horario_saida,
        data_retorno: firstReserva.data_retorno,
        horario_retorno: firstReserva.horario_retorno,
        paradas: allParadas.map((p) => p.local), // keeping internal state as strings for inputs
        passageiros: allPassageiros,
        motorista_id: "",
        veiculo_id: "",
        observacao: "",
      });
    }
    setIsCombineModalOpen(true);
  };

  const handleConfirmCombine = async () => {
    if (!combineFormData.motorista_id || !combineFormData.veiculo_id) {
      toast.error("Selecione um motorista e um veículo para combinar.");
      return;
    }

    // Generate a new sequential ID for the shared ride
    const maxId = reservas.reduce((max, r) => Math.max(max, r.id), 0);
    const sharedId = String(maxId + 1); // Or use UUID if backend supports

    const now = new Date();
    const status = "Viagem compartilhada";

    try {
      await Promise.all(
        selectedReservas.map(async (id) => {
          const reserva = reservas.find((r) => r.id === id);
          if (!reserva) return;

          // Distribute passengers back if needed, or keep them empty/same?
          // For shared ride, usually we might just update the main status and driver.
          // I will keep existing passengers but update status and driver.

          const apiPayload = {
            ...reserva,
            viagemCompartilhadaId: sharedId,
            data_saida: combineFormData.data_saida,
            horario_saida: combineFormData.horario_saida,
            data_retorno: combineFormData.data_retorno,
            horario_retorno: combineFormData.horario_retorno,
            // We usually don't overwrite passengers on individual requests unless splitting?
            // But if we are combining, we might want to ensure they all show the same info?
            // Assuming we just update the ride details:
            status: status,
            motorista_designado: {
              id: parseInt(combineFormData.motorista_id, 10),
              nome_motorista:
                motoristaMap[parseInt(combineFormData.motorista_id, 10)] || "",
              status: "indisponivel", // assuming becomes busy
            },
            veiculo_designado: {
              id: parseInt(combineFormData.veiculo_id, 10),
              placa: "", // fetch details if needed, but for now just ID is crucial for backend often
              modelo:
                veiculoMap[parseInt(combineFormData.veiculo_id, 10)]?.split(
                  " - "
                )[0] || "",
              ano: 0,
              status: "indisponivel",
            },
            observacao_autorizador: combineFormData.observacao,
            autorizador_id: authUser?.name,
            data_autorizacao: now.toISOString(), // Full ISO string
          };

          await api.put(`/api/chamados/${id}/`, apiPayload);

          updateReserva(id, apiPayload as Partial<Reserva>);
        })
      );
      toast.success("Viagens combinadas e atualizadas com sucesso!");
      setSelectedReservas([]);
      setIsCombineModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao combinar viagens.");
    }
  };

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

    let idsToUpdate = [id];

    if (reservaOriginal.viagemCompartilhadaId && status === "aprovado") {
      const linkedReservas = reservas.filter(
        (r) =>
          r.viagemCompartilhadaId === reservaOriginal.viagemCompartilhadaId &&
          r.status.toLowerCase() === "pendente"
      );

      if (linkedReservas.length > 1) {
        const confirmShared = window.confirm(
          "Esta reserva faz parte de uma viagem compartilhada. Deseja aplicar a mesma aprovação (motorista/veículo) para todas as reservas vinculadas?"
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

          const veiculoObj =
            status === "aprovado"
              ? {
                  id: parseInt(veiculoId, 10),
                  placa: "",
                  modelo:
                    veiculoMap[parseInt(veiculoId, 10)]?.split(" - ")[0] || "",
                  ano: 0,
                  status: "indisponivel",
                }
              : undefined;

          const apiPayload = {
            ...targetReserva,
            status: status, // "aprovado" or "recusado"
            observacao_autorizador: obs[id] ?? "",
            motorista_designado: motoristaObj,
            veiculo_designado: veiculoObj,
            autorizador_id: authUser?.email || authUser?.name,
            data_autorizacao: now.toISOString(),
          };

          await api.put(`/api/chamados/${targetId}/`, apiPayload);
          updateReserva(targetId, apiPayload as Partial<Reserva>);
          setObs((s) => ({ ...s, [targetId]: "" }));
        })
      );

      toast(
        `Reserva(s) ${
          status === "aprovado" ? "aprovada(s)" : "negada(s)"
        } com sucesso!`
      );
    } catch (error) {
      console.error(error);
      toast.error(
        `Falha ao ${
          status === "aprovado" ? "aprovar" : "negar"
        } a(s) reserva(s).`
      );
    }
  };

  const handleConcludeReserva = async (id: number) => {
    const reservaOriginal = reservas.find((r) => r.id === id);
    if (!reservaOriginal) return;

    try {
      await api.put(`/api/chamados/${id}/`, {
        ...reservaOriginal,
        status: "Concluido",
      });
      updateReserva(id, { status: "Concluido" });
      toast.success("Reserva concluída com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Falha ao concluir a reserva.");
    }
  };

  const filteredReservas = React.useMemo(() => {
    let data = [...reservas];

    if (filter) {
      data = data.filter(
        (r) => (r.status || "").toLowerCase() === filter.toLowerCase()
      );
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
            (p) => p && p.toLowerCase().includes(term)
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
              return r.solicitante_id.toLowerCase().includes(cleanValue);
            // deleted: case "unidade": (field removed)
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
                r.autorizador_id &&
                r.autorizador_id.toLowerCase().includes(cleanValue)
              );
            default:
              break;
          }
        }

        return (
          r.solicitante_id.toLowerCase().includes(lowerSearch) ||
          r.municipio.toLowerCase().includes(lowerSearch) ||
          motoristaName.toLowerCase().includes(lowerSearch) ||
          veiculoInfo.toLowerCase().includes(lowerSearch) ||
          (r.observacao && r.observacao.toLowerCase().includes(lowerSearch)) ||
          (r.observacao_autorizador &&
            r.observacao_autorizador.toLowerCase().includes(lowerSearch)) ||
          (r.autorizador_id &&
            r.autorizador_id.toLowerCase().includes(lowerSearch)) ||
          hasPassageiro(lowerSearch) ||
          r.paradas.some((p) => p.local.toLowerCase().includes(lowerSearch))
        );
      });
    }

    return data.sort(
      (a, b) =>
        new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()
    );
  }, [reservas, filter, searchTerm]);

  const filterStatuses = [
    "Todos",
    "Pendente",
    "Aprovado",
    "Negado",
    "Negado",
    "Concluido",
    "Viagem compartilhada",
  ];

  return (
    <div className="p-6 max-w-[95%] mx-auto bg-background text-foreground">
      <div className="flex gap-4 mb-6 items-center flex-wrap">
        <Select
          value={filter || "Todos"}
          onValueChange={(value) => setFilter(value === "Todos" ? null : value)}
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
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr>
                <th className="p-3 w-[50px]">
                  <Checkbox
                    checked={
                      filteredReservas.some(
                        (r) => (r.status || "").toLowerCase() === "pendente"
                      ) &&
                      filteredReservas
                        .filter(
                          (r) => (r.status || "").toLowerCase() === "pendente"
                        )
                        .every((r) => selectedReservas.includes(r.id))
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-3">ID</th>
                <th className="p-3">Data Solicitação</th>
                <th className="p-3">Solicitante</th>
                <th className="p-3">Município</th>
                <th className="p-3">Data Saída</th>
                <th className="p-3">Data Retorno</th>
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
                      <td
                        className="p-3 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(row.status || "").toLowerCase() === "pendente" && (
                          <Checkbox
                            checked={selectedReservas.includes(row.id)}
                            onCheckedChange={() => handleSelectReserva(row.id)}
                          />
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-mono text-xs">#{row.id}</span>
                        {row.viagemCompartilhadaId && (
                          <div className="text-[10px] text-muted-foreground">
                            #{row.viagemCompartilhadaId}
                          </div>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {formatDateTime(
                          row.data_criacao,
                          "" // Time included in ISO
                        )}
                      </td>
                      <td className="p-3">
                        {row.solicitante_id}{" "}
                        {row.unidade ? `/ ${row.unidade}` : ""}
                      </td>
                      <td className="p-3">{row.municipio}</td>
                      <td className="p-3 whitespace-nowrap">
                        {formatDateTime(row.data_saida, row.horario_saida)}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {formatDateTime(row.data_retorno, row.horario_retorno)}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusBadgeClasses(row.status)}>
                            {row.status}
                          </Badge>
                          {row.viagemCompartilhadaId && (
                            <Tooltip delayDuration={500}>
                              <TooltipTrigger asChild>
                                <Link
                                  className="h-4 w-4 text-blue-500 cursor-pointer hover:text-blue-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewSharedRideId(
                                      row.viagemCompartilhadaId!
                                    );
                                  }}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                Viagem Compartilhada
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {row.status === "Aprovado" && (
                            <AlertDialog>
                              <Tooltip delayDuration={500}>
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <CheckCircle size={16} />
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Concluir Solicitação</p>
                                </TooltipContent>
                              </Tooltip>
                              <AlertDialogContent
                                onClick={(e) => e.stopPropagation()}
                              >
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Concluir Solicitação?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja concluir esta
                                    solicitação? Esta ação não pode ser
                                    desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleConcludeReserva(row.id)
                                    }
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    Confirmar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded === row.id && (
                      <tr>
                        <td colSpan={8} className="p-4 bg-muted/30">
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

      <Dialog open={isCombineModalOpen} onOpenChange={setIsCombineModalOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Combinar Viagens</DialogTitle>
            <DialogDescription>
              Defina os detalhes da viagem compartilhada. As informações abaixo
              serão aplicadas a todas as reservas selecionadas.
            </DialogDescription>
          </DialogHeader>
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
                            (_, idx) => idx !== i
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
      <Dialog
        open={!!viewSharedRideId}
        onOpenChange={(open) => !open && setViewSharedRideId(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Viagem Compartilhada</DialogTitle>
            <DialogDescription>
              Informações unificadas da viagem #{viewSharedRideId}
            </DialogDescription>
          </DialogHeader>
          {viewSharedRideId &&
            (() => {
              const sharedReservas = reservas.filter(
                (r) => r.viagemCompartilhadaId === viewSharedRideId
              );
              const first = sharedReservas[0];
              if (!first) return null;

              const solicitantes = Array.from(
                new Set(
                  sharedReservas.map(
                    (r) =>
                      `${r.solicitante_id}${r.unidade ? ` / ${r.unidade}` : ""}`
                  )
                )
              );
              const passageiros = Array.from(
                new Set(
                  sharedReservas.flatMap((r) =>
                    [
                      r.passageiro1,
                      r.passageiro2,
                      r.passageiro3,
                      r.passageiro4,
                    ].filter(Boolean)
                  )
                )
              ).filter(Boolean) as string[];

              const paradas = Array.from(
                new Set(
                  sharedReservas.flatMap((r) => r.paradas.map((p) => p.local))
                )
              ).filter(Boolean);

              return (
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Data/Hora Saída
                      </h4>
                      <p className="font-medium">
                        {formatDateTime(first.data_saida, first.horario_saida)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Data/Hora Retorno
                      </h4>
                      <p className="font-medium">
                        {formatDateTime(
                          first.data_retorno,
                          first.horario_retorno
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Motorista
                      </h4>
                      <p className="font-medium">
                        {first.motorista_designado
                          ? first.motorista_designado.nome_motorista
                          : "-"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Veículo
                      </h4>
                      <p className="font-medium">
                        {first.veiculo_designado
                          ? `${first.veiculo_designado.modelo} - ${first.veiculo_designado.placa}`
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Solicitantes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {solicitantes.map((s, i) => (
                        <Badge key={i} variant="secondary">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Passageiros ({passageiros.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {passageiros.map((p, i) => (
                        <Badge key={i} variant="outline">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Paradas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {paradas.map((p, i) => (
                        <Badge key={i} variant="outline" className="bg-muted">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {first.observacao_autorizador && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Observações do Administrador
                      </h4>
                      <p className="text-sm">{first.observacao_autorizador}</p>
                    </div>
                  )}
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
