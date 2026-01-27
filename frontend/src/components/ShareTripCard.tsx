import React from "react";
import { Car, User, MapPin, Calendar, Clock, Users } from "lucide-react";
import { type Reserva } from "@/hooks/reserva-context-hook";
import { formatDateTime } from "@/lib/utils";

interface ShareTripCardProps {
  reserva: Reserva;
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export const ShareTripCard: React.FC<ShareTripCardProps> = ({
  reserva,
  cardRef,
}) => {
  const veiculoNome = reserva.veiculo_designado
    ? `${reserva.veiculo_designado.modelo} - ${reserva.veiculo_designado.placa}`
    : "-";
  const motoristaNome = reserva.motorista_designado
    ? reserva.motorista_designado.nome_motorista
    : "-";

  const passageirosList = [
    reserva.passageiro1,
    reserva.passageiro2,
    reserva.passageiro3,
    reserva.passageiro4,
  ].filter(Boolean);

  return (
    <div className="absolute -left-[9999px] top-0">
      <div
        ref={cardRef}
        className="w-[450px] bg-white text-slate-900 overflow-hidden shadow-2xl rounded-xl"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white relative">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">
                Detalhes da Viagem
              </h2>
              <p className="text-blue-100 text-sm opacity-90">
                Gestão de Veículos - SEFAZ
              </p>
            </div>
            <img
              src="/images/logo_prevencao_corrupcao.png"
              alt="Logo SEFAZ"
              className="h-12 w-auto brightness-0 invert object-contain"
            />
          </div>

          <div className="mt-6 flex gap-4">
            <div className="flex-1 bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1 opacity-80">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Saída
                </span>
              </div>
              <p className="text-lg font-bold">
                {formatDateTime(reserva.data_saida, reserva.horario_saida)}
              </p>
            </div>
            <div className="flex-1 bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1 opacity-80">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Retorno
                </span>
              </div>
              <p className="text-lg font-bold">
                {formatDateTime(reserva.data_retorno, reserva.horario_retorno)}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Main Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Car className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Veículo
                </span>
              </div>
              <p className="font-bold text-slate-800 break-words">
                {veiculoNome}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <User className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Motorista
                </span>
              </div>
              <p className="font-bold text-slate-800 break-words">
                {motoristaNome}
              </p>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Location & Stops */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <MapPin className="w-4 h-4 font-bold text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Município
                </span>
              </div>
              <p className="text-sm font-medium text-slate-600 ml-6">
                {reserva.municipio || "Não informado"}
              </p>
            </div>

            {reserva.paradas && reserva.paradas.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Roteiro / Paradas
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pr-4">
                  {reserva.paradas.map((p, i) => (
                    <div
                      key={i}
                      className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 flex items-start gap-2"
                    >
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span className="break-words line-clamp-2">
                        {p.local}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-100" />

          {/* Passengers */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-500">
              <Users className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Passageiros
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {passageirosList.length > 0 ? (
                passageirosList.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </div>
                    <span className="text-sm font-bold text-slate-800 truncate">
                      {p}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic ml-2">
                  Nenhum passageiro listado
                </p>
              )}
            </div>
          </div>

          {/* Extra Info */}
          {reserva.observacao && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                Observação do Solicitante
              </p>
              <p className="text-sm text-amber-900 leading-relaxed font-bold">
                {reserva.observacao}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-100 text-slate-500">
          <div className="flex items-center gap-2 text-green-600">
            <span className="text-xs font-bold uppercase tracking-tight">
              Viagem Autorizada
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-tight">
              ID #{reserva.id}
            </p>
            <p className="text-[9px] font-medium tracking-tight">
              Gerado em: {new Date().toLocaleDateString("pt-BR")}{" "}
              {new Date().toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
