"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2Icon, PlusCircleIcon, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/api";
type FormErrors = {
  [key: string]: boolean;
};

export default function ReservaPage() {
  // --- FORM STATE ---
  const [municipios, setMunicipios] = useState<{ id: number; nome: string }[]>(
    []
  );
  const [municipio, setMunicipio] = useState<string>("");
  const [paradas, setParadas] = useState<string[]>([]);
  const [parada, setParada] = useState("");
  const [passageiros, setPassageiros] = useState<string[]>([]);
  const [passageiro, setPassageiro] = useState("");
  const [dataSaida, setDataSaida] = useState<Date | undefined>(new Date());
  const [dataRetorno, setDataRetorno] = useState<Date | undefined>(new Date());
  const [horarioSaida, setHorarioSaida] = useState("");
  const [horarioRetorno, setHorarioRetorno] = useState("");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const fetchMunicipios = async () => {
      try {
        const res = await api.get("/api/municipios/");
        setMunicipios(res.data);
        if (res.data.length > 0) {
          setMunicipio(String(res.data[0].id));
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar municípios.");
      }
    };
    fetchMunicipios();
  }, []);

  const handleAddParada = () => {
    if (parada.trim()) {
      setParadas([...paradas, parada.trim()]);
      setParada("");
      setErrors((prev) => ({ ...prev, parada: false, paradas: false }));
    } else {
      setErrors((prev) => ({ ...prev, parada: true }));
    }
  };

  const handleAddPassageiro = () => {
    if (passageiros.length >= 4) {
      toast.error("Você pode adicionar no máximo 4 passageiros.");
      return;
    }
    if (passageiro.trim()) {
      setPassageiros([...passageiros, passageiro.trim()]);
      setPassageiro("");
      setErrors((prev) => ({ ...prev, passageiro: false, passageiros: false }));
    } else {
      setErrors((prev) => ({ ...prev, passageiro: true }));
    }
  };

  const resetForm = () => {
    setMunicipio(municipios.length > 0 ? String(municipios[0].id) : "");
    setParadas([]);
    setParada("");
    setPassageiros([]);
    setPassageiro("");
    setDataSaida(new Date());
    setDataRetorno(new Date());
    setHorarioSaida("");
    setHorarioRetorno("");
    setObservacao("");
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!municipio) newErrors.municipio = true;
    if (paradas.length === 0) newErrors.paradas = true;
    if (passageiros.length === 0) newErrors.passageiros = true;
    if (!dataSaida) newErrors.dataSaida = true;
    if (!dataRetorno) newErrors.dataRetorno = true;
    if (!horarioSaida) newErrors.horarioSaida = true;
    if (!horarioRetorno) newErrors.horarioRetorno = true;
    if (dataRetorno && dataSaida && dataRetorno < dataSaida) {
      newErrors.dataRetorno = true;
      toast.error("A data de retorno não pode ser anterior à data de saída.");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Por favor, preencha todos os campos destacados.");
      return;
    }

    setLoading(true);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    const payload = {
      data_saida: formatDate(dataSaida!),
      horario_saida: horarioSaida,
      data_retorno: formatDate(dataRetorno!),
      horario_retorno: horarioRetorno,
      passageiro1: passageiros[0] || "",
      passageiro2: passageiros[1] || "",
      passageiro3: passageiros[2] || "",
      passageiro4: passageiros[3] || "",
      municipio: Number(municipio),
      observacao,
      paradas: paradas.map((p) => ({ local: p })),
    };

    try {
      await api.post("/api/chamados/", payload);
      toast.success("Solicitação de reserva enviada com sucesso!");
      resetForm();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Erro ao enviar solicitação."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-3xl w-full">
      <Card>
        <CardHeader>
          <CardTitle>Reservar Veículo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Município de destino</Label>
            <Select
              value={municipio}
              onValueChange={(value) => {
                setMunicipio(value);
                setErrors((prev) => ({ ...prev, municipio: false }));
              }}
            >
              <SelectTrigger
                className={`bg-white ${
                  errors.municipio ? "ring-2 ring-red-500" : ""
                }`}
              >
                <SelectValue placeholder="Selecione o município" />
              </SelectTrigger>
              <SelectContent>
                {municipios.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Paradas</Label>
            <div className="flex gap-2">
              <Input
                className={`bg-white ${
                  errors.parada || errors.paradas ? "ring-2 ring-red-500" : ""
                }`}
                value={parada}
                onChange={(e) => setParada(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddParada();
                  }
                }}
                placeholder="Ex: SergipeTec"
              />
              <Button type="button" onClick={handleAddParada}>
                <PlusCircleIcon className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {paradas.map((p, i) => (
                <Badge key={i} variant="secondary">
                  {p}
                  <button
                    type="button"
                    onClick={() =>
                      setParadas(paradas.filter((_, idx) => idx !== i))
                    }
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Passageiros</Label>
            <div className="flex gap-2">
              <Input
                className={`bg-white ${
                  errors.passageiro || errors.passageiros
                    ? "ring-2 ring-red-500"
                    : ""
                }`}
                value={passageiro}
                onChange={(e) => setPassageiro(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPassageiro();
                  }
                }}
                placeholder="Ex: Alberto dos Santos Carvalho"
              />
              <Button type="button" onClick={handleAddPassageiro}>
                <PlusCircleIcon className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {passageiros.map((p, i) => (
                <Badge key={i} variant="secondary">
                  {p}
                  <button
                    type="button"
                    onClick={() =>
                      setPassageiros(passageiros.filter((_, idx) => idx !== i))
                    }
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data da saída</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      errors.dataSaida ? "ring-2 ring-red-500" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataSaida ? (
                      format(dataSaida, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataSaida}
                    onSelect={setDataSaida}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Data de retorno</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      errors.dataRetorno ? "ring-2 ring-red-500" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataRetorno ? (
                      format(dataRetorno, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataRetorno}
                    onSelect={setDataRetorno}
                    locale={ptBR}
                    disabled={{ before: dataSaida || new Date() }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="saida">Horário de saída</Label>
              <Input
                className={`bg-white ${
                  errors.horarioSaida ? "ring-2 ring-red-500" : ""
                }`}
                type="time"
                id="saida"
                value={horarioSaida}
                onChange={(e) => {
                  setHorarioSaida(e.target.value);
                  setErrors((prev) => ({ ...prev, horarioSaida: false }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retorno">Horário de retorno</Label>
              <Input
                className={`bg-white ${
                  errors.horarioRetorno ? "ring-2 ring-red-500" : ""
                }`}
                type="time"
                id="retorno"
                value={horarioRetorno}
                onChange={(e) => {
                  setHorarioRetorno(e.target.value);
                  setErrors((prev) => ({ ...prev, horarioRetorno: false }));
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="obs">Observação</Label>
            <Textarea
              className="bg-white"
              id="obs"
              placeholder="Detalhes da viagem, etc."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />{" "}
                Enviando...
              </>
            ) : (
              "Enviar solicitação"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
