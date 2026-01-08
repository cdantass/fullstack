import * as XLSX from "xlsx";
import type { Reserva } from "@/context/reserva-context-hook";
import { formatDateTime, formatStatusLabel } from "./utils";

export function exportReservasToExcel(
  reservas: Reserva[],
  allReservas: Reserva[]
) {
  // Sort and group reservations to match UI logic:
  // Parent rows (not 'combinado') at top level,
  // with their children ('combinado' and matching viagem_compartilhada) immediately following.

  const rows: any[] = [];

  // Filter for main rows (not children of a shared trip)
  const mainRows = reservas.filter(
    (r) => (r.status || "").toLowerCase() !== "combinado"
  );

  mainRows.forEach((parent) => {
    // Add parent row
    rows.push(prepareReservaRow(parent, false));

    // Find children in allReservas
    const isViagemCompartilhada =
      (parent.status || "").toLowerCase() === "viagem_compartilhada";
    if (isViagemCompartilhada) {
      const childRows = allReservas.filter(
        (r) => r.viagem_compartilhada === parent.id
      );
      childRows.forEach((child) => {
        rows.push(prepareReservaRow(child, true));
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reservas");

  // Column widths
  const wscols = [
    { wch: 10 }, // ID
    { wch: 18 }, // Data Solicitação
    { wch: 25 }, // Solicitante
    { wch: 20 }, // Município
    { wch: 18 }, // Data Saída
    { wch: 18 }, // Data Retorno
    { wch: 15 }, // Status
    { wch: 25 }, // Motorista
    { wch: 25 }, // Veículo
    { wch: 20 }, // Autorizador
    { wch: 30 }, // Passageiros
    { wch: 30 }, // Paradas
    { wch: 30 }, // Observação
    { wch: 30 }, // Obs Aprovador
  ];
  worksheet["!cols"] = wscols;

  XLSX.writeFile(
    workbook,
    `reservas_${new Date().toISOString().split("T")[0]}.xlsx`
  );
}

function prepareReservaRow(r: Reserva, isChild: boolean) {
  const motorista = r.motorista_designado?.nome_motorista || "-";
  const veiculo = r.veiculo_designado
    ? `${r.veiculo_designado.modelo} - ${r.veiculo_designado.placa}`
    : "-";

  const passageiros = [
    r.passageiro1,
    r.passageiro2,
    r.passageiro3,
    r.passageiro4,
  ]
    .filter(Boolean)
    .join(", ");

  const paradas = (r.paradas || [])
    .map((p) => p.local)
    .filter(Boolean)
    .join(" -> ");

  return {
    ID: isChild ? `  └ #${r.id}` : `#${r.id}`,
    "Data Solicitação": formatDateTime(r.data_criacao, ""),
    Solicitante: r.solicitante_nome + (r.unidade ? ` / ${r.unidade}` : ""),
    Município: r.municipio,
    "Data Saída": formatDateTime(r.data_saida, r.horario_saida),
    "Data Retorno": formatDateTime(r.data_retorno, r.horario_retorno),
    Status: formatStatusLabel(r.status),
    Motorista: motorista,
    Veículo: veiculo,
    Autorizador: r.autorizador_nome || "-",
    Passageiros: passageiros,
    Paradas: paradas,
    Observação: r.observacao || "",
    "Obs Aprovador": r.observacao_autorizador || "",
  };
}
