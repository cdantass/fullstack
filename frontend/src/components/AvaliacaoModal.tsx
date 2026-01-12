"use client";

import * as React from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type Reserva } from "@/context/reserva-context-hook";
import api from "@/api";
import { toast } from "sonner";

interface AvaliacaoModalProps {
  reserva: Reserva;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AvaliacaoModal({
  reserva,
  isOpen,
  onClose,
  onSuccess,
}: AvaliacaoModalProps) {
  const [nota, setNota] = React.useState<number>(0);
  const [comentario, setComentario] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (nota === 0) {
      toast.error("Por favor, selecione uma nota de 1 a 5.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/avaliacoes/", {
        chamado: reserva.id,
        nota,
        comentario,
      });
      toast.success("Avaliação enviada com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      toast.error("Ocorreu um erro ao enviar a avaliação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Avaliar Viagem #{reserva.id}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="bg-muted/30 p-3 rounded-md text-sm space-y-1">
            <p>
              <strong>Motorista:</strong>{" "}
              {reserva.motorista_designado?.nome_motorista || "N/A"}
            </p>
            <p>
              <strong>Veículo:</strong>{" "}
              {reserva.veiculo_designado
                ? `${reserva.veiculo_designado.modelo} (${reserva.veiculo_designado.placa})`
                : "N/A"}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium">
              Sua nota para esta viagem:
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNota(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= nota
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Comentário (opcional):</span>
            <Textarea
              placeholder="Conte como foi sua experiência..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
