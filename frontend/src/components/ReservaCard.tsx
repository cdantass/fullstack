import {
  Car,
  Users,
  User,
  MapPin,
  NotebookPen,
  CheckCircle,
  XCircle,
  Link2,
  Ban,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { type Reserva } from "@/context/reserva-context-hook";
import { formatDateTime, formatStatusLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";

interface ReservaCardProps {
  reserva: Reserva;
  onCancel?: (id: number) => void;
}

const getStatusBadgeClasses = (status: Reserva["status"]) => {
  switch (status.toLowerCase()) {
    case "aprovado":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "negado":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "pendente":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusInfo = (status: string) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "aprovado":
      return {
        label: "Aprovado por:",
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
      };
    case "concluido":
      return {
        label: "Concluído por:",
        icon: <CheckCircle className="w-4 h-4 text-blue-600" />,
      };
    case "viagem_compartilhada":
      return {
        label: "Combinado por:",
        icon: <Link2 className="w-4 h-4 text-purple-600" />,
      };
    case "cancelado":
      return {
        label: "Cancelado por:",
        icon: <Ban className="w-4 h-4 text-gray-600" />,
      };
    case "recusado":
    case "negado":
      return {
        label: "Recusado por:",
        icon: <XCircle className="w-4 h-4 text-red-600" />,
      };
    default:
      return {
        label: "Atualizado por:",
        icon: <CheckCircle className="w-4 h-4 text-muted-foreground" />,
      };
  }
};

export function ReservaCard({ reserva, onCancel }: ReservaCardProps) {
  const veiculoNome = reserva.veiculo_designado
    ? `${reserva.veiculo_designado.modelo} - ${reserva.veiculo_designado.placa}`
    : "-";
  const motoristaNome = reserva.motorista_designado
    ? reserva.motorista_designado.nome_motorista
    : "-";

  // Aggregate passengers
  const passageirosList = [
    reserva.passageiro1,
    reserva.passageiro2,
    reserva.passageiro3,
    reserva.passageiro4,
  ].filter(Boolean);

  const statusInfo = getStatusInfo(reserva.status);

  return (
    <Card key={reserva.id} className="mb-4">
      <CardContent className="grid md:grid-cols-2 gap-6 p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Veículo:</span>
          </div>
          <p className="ml-6">{veiculoNome}</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Passageiros:</span>
          </div>
          <ul className="list-disc list-inside ml-6">
            {passageirosList.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
            {passageirosList.length === 0 && <li>-</li>}
          </ul>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Motorista:</span>
          </div>
          <p className="ml-6">{motoristaNome}</p>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Paradas:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {Array.isArray(reserva.paradas) &&
                reserva.paradas.map((p, i) => (
                  <Badge key={i} variant="outline" className="bg-muted">
                    {p.local}
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
              <strong>Solicitante:</strong> {reserva.observacao ?? "-"}
            </p>
            <p className="text-sm mt-1">
              <strong>Administrador:</strong>{" "}
              {reserva.observacao_autorizador ?? "-"}
            </p>
          </div>
          {reserva.status.toLowerCase() !== "pendente" && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                {statusInfo.icon}
                <span className="font-medium">{statusInfo.label}</span>
              </div>
              <p className="ml-6 text-sm">
                <strong>Autorizador:</strong> {reserva.autorizador_id ?? "N/A"}
              </p>
              <p className="ml-6 text-sm">
                <strong>Data:</strong>{" "}
                {formatDateTime(reserva.data_autorizacao, "")}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          <Badge className={cn(getStatusBadgeClasses(reserva.status))}>
            {formatStatusLabel(reserva.status)}
          </Badge>
        </div>

        {["pendente", "aprovado"].includes(
          (reserva.status || "").toLowerCase()
        ) &&
          onCancel && (
            <div className="md:col-span-2 flex justify-end mt-4 border-t pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    Cancelar Reserva
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar Reserva</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja cancelar esta reserva? Esta ação
                      não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => onCancel(reserva.id)}
                    >
                      Confirmar Cancelamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
