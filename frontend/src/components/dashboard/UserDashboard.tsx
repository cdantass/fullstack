import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api";
import { Clock, ClipboardList, PlusCircle, Star, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReservaCard } from "@/components/ReservaCard";
import { type Reserva } from "@/hooks/reserva-context-hook";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { AvaliacaoModal } from "@/components/AvaliacaoModal";

interface DashboardStats {
  pendingSolicitations: number;
  activeTrips: number;
  totalTripsToday: number;
  availableVehicles: number;
  availableDrivers: number;
  unratedTrips: number;
}

export function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pendingSolicitations: 0,
    activeTrips: 0,
    totalTripsToday: 0,
    availableVehicles: 0,
    availableDrivers: 0,
    unratedTrips: 0,
  });

  const [pendingList, setPendingList] = useState<Reserva[]>([]);
  const [activeList, setActiveList] = useState<Reserva[]>([]);
  const [unratedList, setUnratedList] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  // Evaluation Modal State
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedReservaForEval, setSelectedReservaForEval] =
    useState<Reserva | null>(null);

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
        unratedTrips: data.unratedTrips,
      });

      setPendingList(data.recentPending);
      setActiveList(data.activeList);
      setUnratedList(data.unratedTrips || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvaliarClick = (reserva: Reserva) => {
    setSelectedReservaForEval(reserva);
    setEvalModalOpen(true);
  };

  const handleEvaluationSuccess = () => {
    fetchDashboardData(); // Refresh data to remove key from unrated list
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 space-y-8 max-w-[1200px] mx-auto">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[400px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Olá, {user?.name || "Usuário"}
          </h1>
          <p className="text-muted-foreground">
            Acompanhe suas solicitações e viagens ativas.
          </p>
        </div>
        <Button onClick={() => navigate("/reservar-veiculo")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Solicitação
        </Button>
      </div>

      {/* KPI Cards - Simplified */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Viagens Ativas
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTrips}</div>
            <p className="text-xs text-muted-foreground">Em andamento agora</p>
          </CardContent>
        </Card>

        {/* We can add a "Total Trips" or similiar if needed, but keeping it simple */}
      </div>

      <div className="space-y-8">
        {/* Avaliações Pendentes - High Priority */}
        {unratedList.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-yellow-600">
              <Star className="h-5 w-5 fill-yellow-600" />
              Avaliações Pendentes
            </h2>
            <div className="p-4 bg-yellow-50/50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-4">
                Você tem {unratedList.length} viagem(ns) concluída(s) aguardando
                sua avaliação. Seu feedback é importante!
              </p>
              <div className="grid gap-6">
                {unratedList.map((reserva) => (
                  <ReservaCard
                    key={reserva.id}
                    reserva={reserva}
                    onAvaliar={handleAvaliarClick}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Trips Section */}
        {activeList.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Viagens em Andamento
            </h2>
            <div className="grid gap-6">
              {activeList.map((reserva) => (
                <ReservaCard key={reserva.id} reserva={reserva} />
              ))}
            </div>
          </div>
        )}

        {/* Pending / Recent Requests Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Solicitações Recentes
            </h2>
            <Button
              variant="link"
              onClick={() => navigate("/consultar-reserva")}
            >
              Ver histórico completo
            </Button>
          </div>

          {pendingList.length > 0 ? (
            <div className="grid gap-6">
              {pendingList.map((reserva) => (
                <ReservaCard
                  key={reserva.id}
                  reserva={reserva}
                  onCancel={() => {
                    navigate("/consultar-reserva");
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">
                Você não tem solicitações recentes.
              </p>
              <Button
                variant="link"
                onClick={() => navigate("/reservar-veiculo")}
                className="mt-2"
              >
                Fazer uma reserva
              </Button>
            </div>
          )}
        </div>
      </div>

      {selectedReservaForEval && (
        <AvaliacaoModal
          isOpen={evalModalOpen}
          onClose={() => setEvalModalOpen(false)}
          reserva={selectedReservaForEval}
          onSuccess={handleEvaluationSuccess}
        />
      )}
    </div>
  );
}
