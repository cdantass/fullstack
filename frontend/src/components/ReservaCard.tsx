import {
  Car,
  Users,
  User,
  MapPin,
  NotebookPen,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { type Reserva } from "@/context/reserva-context-hook";
import { formatDateTime } from "@/lib/utils";
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
                {reserva.status.toLowerCase() === "aprovado" ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="font-medium">
                  {reserva.status.toLowerCase() === "aprovado"
                    ? "Aprovado por:"
                    : reserva.status.toLowerCase() === "cancelado"
                    ? "Cancelado por:"
                    : "Negado por:"}
                </span>
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
            {reserva.status}
          </Badge>
        </div>

        {(reserva.status === "Pendente" || reserva.status === "Aprovado") &&
          onCancel && (
            <div className="md:col-span-2 flex justify-end mt-4 border-t pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
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
