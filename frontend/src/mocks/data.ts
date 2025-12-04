import { type Reserva } from "@/context/reserva-context-hook";

export const mockMotoristas = [
  { id: 1, nome_motorista: "João Silva", status: "disponivel" },
  { id: 2, nome_motorista: "Maria Oliveira", status: "disponivel" },
  { id: 3, nome_motorista: "Carlos Santos", status: "indisponivel" },
];

export const mockVeiculos = [
  {
    id: 1,
    placa: "ABC-1234",
    modelo: "Fiat Uno",
    ano: 2020,
    status: "disponivel",
  },
  {
    id: 2,
    placa: "XYZ-5678",
    modelo: "Volkswagen Gol",
    ano: 2021,
    status: "disponivel",
  },
  {
    id: 3,
    placa: "DEF-9012",
    modelo: "Toyota Corolla",
    ano: 2022,
    status: "manutencao",
  },
];

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const lastWeek = new Date(today);
lastWeek.setDate(lastWeek.getDate() - 7);
const lastMonth = new Date(today);
lastMonth.setDate(lastMonth.getDate() - 30);

const formatDate = (date: Date) => date.toISOString().split("T")[0];
const formatTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;

export const mockReservas: Reserva[] = [
  {
    id: 1,
    unidade: "Unidade Central",
    solicitante: "Ana Souza",
    municipio: "São Paulo",
    paradas: ["Sede", "Filial Norte"],
    passageiros: ["Ana Souza", "Pedro Lima"],
    data_saida: formatDate(today),
    horario_saida: "08:00",
    data_retorno: formatDate(today),
    horario_retorno: "18:00",
    obsSolicitante: "Reunião urgente",
    status: "Pendente",
    data_solicitacao: formatDate(today),
    horario_solicitacao: formatTime(today),
  },
  {
    id: 2,
    unidade: "Unidade Sul",
    solicitante: "Roberto Costa",
    municipio: "Campinas",
    paradas: ["Centro"],
    passageiros: ["Roberto Costa"],
    data_saida: formatDate(yesterday),
    horario_saida: "09:00",
    data_retorno: formatDate(yesterday),
    horario_retorno: "17:00",
    status: "Aprovado",
    motorista: "1",
    veiculo: "1",
    autorizador: "Gestor Admin",
    data_autorizacao: formatDate(yesterday),
    horario_autorizacao: "08:30",
    data_solicitacao: formatDate(yesterday),
    horario_solicitacao: "08:00",
  },
  {
    id: 3,
    unidade: "Unidade Leste",
    solicitante: "Fernanda Alves",
    municipio: "Santos",
    paradas: ["Porto"],
    passageiros: ["Fernanda Alves"],
    data_saida: formatDate(lastWeek),
    horario_saida: "10:00",
    data_retorno: formatDate(lastWeek),
    horario_retorno: "16:00",
    status: "Negado",
    obsAdmin: "Veículo indisponível",
    autorizador: "Gestor Admin",
    data_autorizacao: formatDate(lastWeek),
    horario_autorizacao: "09:00",
    data_solicitacao: formatDate(lastWeek),
    horario_solicitacao: "08:00",
  },
  {
    id: 4,
    unidade: "Unidade Oeste",
    solicitante: "Lucas Pereira",
    municipio: "Osasco",
    paradas: ["Prefeitura"],
    passageiros: ["Lucas Pereira"],
    data_saida: formatDate(lastMonth),
    horario_saida: "14:00",
    data_retorno: formatDate(lastMonth),
    horario_retorno: "18:00",
    status: "Cancelado",
    data_solicitacao: formatDate(lastMonth),
    horario_solicitacao: "10:00",
  },
  {
    id: 5,
    unidade: "Unidade Central",
    solicitante: "Juliana Martins",
    municipio: "São Paulo",
    paradas: ["Sede"],
    passageiros: ["Juliana Martins"],
    data_saida: formatDate(today),
    horario_saida: "13:00",
    data_retorno: formatDate(today),
    horario_retorno: "15:00",
    status: "Pendente",
    data_solicitacao: formatDate(today),
    horario_solicitacao: formatTime(
      new Date(today.getTime() - 2 * 60 * 60 * 1000)
    ), // 2 hours ago
  },
  {
    id: 6,
    unidade: "Unidade Norte",
    solicitante: "Carlos Eduardo",
    municipio: "Ribeirão Preto",
    paradas: ["Centro"],
    passageiros: ["Carlos Eduardo"],
    data_saida: formatDate(lastWeek),
    horario_saida: "07:00",
    data_retorno: formatDate(lastWeek),
    horario_retorno: "19:00",
    status: "Concluido",
    motorista: "2",
    veiculo: "2",
    autorizador: "Gestor Admin",
    data_autorizacao: formatDate(lastWeek),
    horario_autorizacao: "06:30",
    data_solicitacao: formatDate(lastWeek),
    horario_solicitacao: "06:00",
  },
];
