import {
  Car,
  Users,
  User,
  MapPin,
  CheckCircle,
  Ban,
  Star,
  MessageSquareText,
  NotebookPen,
  XCircle,
  Share2,
} from "lucide-react";
import { useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import { ShareTripCard } from "./ShareTripCard";
import { toast } from "sonner";
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
  onAvaliar?: (reserva: Reserva) => void;
}

const getStatusBadgeClasses = (status: Reserva["status"]) => {
  switch (status.toLowerCase()) {
    case "aprovado":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "negado":
    case "recusado":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "pendente":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "viagem_compartilhada":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200";
    case "combinado":
      return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function ReservaCard({
  reserva,
  onCancel,
  onAvaliar,
}: ReservaCardProps) {
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

  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = useCallback(() => {
    if (cardRef.current === null) return;

    toast.info("Gerando imagem de compartilhamento...");

    toPng(cardRef.current, {
      cacheBust: true,
      backgroundColor: "#fff",
      pixelRatio: 2, // Modern mobile screens have high DPI
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `viagem-${reserva.id}-${reserva.municipio || "detalhes"}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Imagem baixada com sucesso!");
      })
      .catch((err) => {
        console.error(err);
        toast.error("Erro ao gerar imagem de compartilhamento.");
      });
  }, [reserva]);

  return (
    <Card
      key={reserva.id}
      className="mb-4 overflow-hidden border-l-4 border-l-transparent"
    >
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
              <li key={`passenger-${reserva.id}-${i}`}>{p}</li>
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
                  <Badge
                    key={`stop-${reserva.id}-${i}`}
                    variant="outline"
                    className="bg-muted"
                  >
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
                {reserva.status.toLowerCase() === "recusado" ||
                reserva.status.toLowerCase() === "negado" ? (
                  <>
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="font-medium">Recusa da Viagem</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Autorização da Viagem</span>
                  </>
                )}
              </div>
              <p className="ml-6 text-sm">
                <strong>
                  {reserva.status.toLowerCase() === "recusado" ||
                  reserva.status.toLowerCase() === "negado"
                    ? "Recusado por:"
                    : "Autorizado por:"}
                </strong>{" "}
                {reserva.autorizador_nome ?? "N/A"}
              </p>
              {reserva.data_autorizacao && (
                <p className="ml-6 text-sm">
                  <strong>Data da Autorização:</strong>{" "}
                  {formatDateTime(reserva.data_autorizacao, "")}
                </p>
              )}
            </div>
          )}
          {reserva.data_conclusao && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Conclusão da Viagem</span>
              </div>
              <p className="ml-6 text-sm">
                <strong>Data de Conclusão:</strong>{" "}
                {formatDateTime(reserva.data_conclusao, "")}
              </p>
              <p className="ml-6 text-sm">
                <strong>Concluído por:</strong>{" "}
                {reserva.concluidor_nome ?? "N/A"}
              </p>
            </div>
          )}
          {reserva.data_cancelamento && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Ban className="w-4 h-4 text-gray-600" />
                <span className="font-medium">Cancelamento da Viagem</span>
              </div>
              <p className="ml-6 text-sm">
                <strong>Data de Cancelamento:</strong>{" "}
                {formatDateTime(reserva.data_cancelamento, "")}
              </p>
              <p className="ml-6 text-sm">
                <strong>Cancelado por:</strong>{" "}
                {reserva.cancelador_nome ?? "N/A"}
              </p>
            </div>
          )}
          {reserva.avaliacao && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
                <span className="font-medium">Avaliação da Viagem</span>
              </div>
              <div className="ml-6 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "w-4 h-4",
                        s <= (reserva.avaliacao?.nota || 0)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
                {reserva.avaliacao.comentario && (
                  <div className="flex gap-2 mt-2 bg-muted/50 p-2 rounded text-sm italic">
                    <MessageSquareText className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <p>{reserva.avaliacao.comentario}</p>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  Avaliado em{" "}
                  {formatDateTime(reserva.avaliacao.data_avaliacao, "")}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
            Status:
          </span>
          <Badge
            className={cn(
              getStatusBadgeClasses(
                reserva.status === "combinado" ? "aprovado" : reserva.status
              )
            )}
          >
            {(() => {
              const s = reserva.status.toLowerCase();
              if (s === "aprovado" || s === "combinado") return "Autorizado";
              if (s === "recusado" || s === "negado") return "Negado";
              if (s === "cancelado") return "Cancelado";
              if (s === "concluido") return "Concluído";
              return formatStatusLabel(reserva.status);
            })()}
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
                      onClick={() => onCancel?.(reserva.id)}
                    >
                      Confirmar Cancelamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

        {reserva.status.toLowerCase() === "concluido" &&
          !reserva.avaliacao &&
          onAvaliar && (
            <div className="md:col-span-2 flex justify-end mt-4 border-t pt-4">
              <Button
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                size="sm"
                onClick={() => onAvaliar?.(reserva)}
              >
                <Star className="w-4 h-4 mr-2" />
                Avaliar Viagem
              </Button>
            </div>
          )}

        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
          {["aprovado", "concluido", "viagem_compartilhada"].includes(
            reserva.status.toLowerCase()
          ) && (
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Gerar Imagem Compartilhável
            </Button>
          )}
        </div>

        {/* Hidden card for image generation */}
        <ShareTripCard reserva={reserva} cardRef={cardRef} />
      </CardContent>
    </Card>
  );
}
