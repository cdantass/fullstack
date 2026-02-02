import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api";
import { Clock, Calendar, Car, ArrowRight, ClipboardList } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ReservaCard } from "@/components/ReservaCard";
import { type Reserva } from "@/hooks/reserva-context-hook";

interface DashboardStats {
  pendingSolicitations: number;
  activeTrips: number;
  totalTripsToday: number;
  availableVehicles: number;
  availableDrivers: number;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    pendingSolicitations: 0,
    activeTrips: 0,
    totalTripsToday: 0,
    availableVehicles: 0,
    availableDrivers: 0,
  });

  const [pendingList, setPendingList] = useState<Reserva[]>([]);
  const [activeList, setActiveList] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const response = await api.get("/api/dashboard/stats/");
      const data = response.data;

      setStats({
        pendingSolicitations: data.pendingSolicitations,
        activeTrips: data.activeTrips,
        totalTripsToday: data.totalTripsToday,
        availableVehicles: data.availableVehicles,
        availableDrivers: data.availableDrivers,
      });

      setPendingList(data.recentPending);
      setActiveList(data.activeList);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (reserva: Reserva) => {
    setSelectedReserva(reserva);
  };

  const handleNavigateToDetails = () => {
    if (!selectedReserva) return;
    if (selectedReserva.status === "pendente") {
      navigate("/autorizar-reserva");
    } else {
      navigate("/consultar-reserva");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-muted-foreground text-sm">
          Carregando dados do sistema...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Painel de Controle
        </h1>
        <p className="text-muted-foreground">
          Visão geral da operação e solicitações recentes.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Solicitações Pendentes
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pendingSolicitations}
            </div>
            <p className="text-xs text-muted-foreground">Aguardando análise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Viagens em Andamento
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTrips}</div>
            <p className="text-xs text-muted-foreground">Acontecendo agora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viagens Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTripsToday}</div>
            <p className="text-xs text-muted-foreground">
              Agendadas para a data atual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recursos Disponíveis
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.availableVehicles}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                Veículos
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.availableDrivers} Motoristas livres
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Pending Requests Table */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Solicitações Pendentes</CardTitle>
              <CardDescription>
                Últimas 5 solicitações aguardando autorização
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex"
              onClick={() => navigate("/autorizar-reserva")}
            >
              Ver todas <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {pendingList.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingList.map((chamado) => (
                    <TableRow
                      key={chamado.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(chamado)}
                    >
                      <TableCell className="font-medium">
                        #{chamado.id}
                      </TableCell>
                      <TableCell
                        className="truncate max-w-[120px]"
                        title={chamado.solicitante_nome}
                      >
                        {chamado.solicitante_nome}
                      </TableCell>
                      <TableCell>{chamado.municipio}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatDateTime(chamado.data_saida, "")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Nenhuma solicitação pendente no momento.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Trips Table */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Em Trânsito</CardTitle>
              <CardDescription>
                Viagens em andamento neste momento
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex"
              onClick={() => navigate("/consultar-reserva")}
            >
              Ver todas <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {activeList.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Destino</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead className="text-right">Retorno</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeList.map((chamado) => (
                    <TableRow
                      key={chamado.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(chamado)}
                    >
                      <TableCell className="font-medium">
                        {chamado.municipio}
                      </TableCell>
                      <TableCell>
                        {chamado.veiculo_designado?.placa || "-"}
                      </TableCell>
                      <TableCell
                        className="truncate max-w-[120px]"
                        title={chamado.motorista_designado?.nome_motorista}
                      >
                        {chamado.motorista_designado?.nome_motorista || "-"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {chamado.horario_retorno.substring(0, 5)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Nenhuma viagem em andamento no momento.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedReserva}
        onOpenChange={(open) => !open && setSelectedReserva(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Reserva #{selectedReserva?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedReserva && <ReservaCard reserva={selectedReserva} />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReserva(null)}>
              Fechar
            </Button>
            <Button onClick={handleNavigateToDetails}>
              {selectedReserva?.status === "pendente"
                ? "Autorizar / Gerenciar"
                : "Ver na Lista"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
