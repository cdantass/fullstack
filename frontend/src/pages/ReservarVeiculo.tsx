"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  CalendarIcon,
  Loader2Icon,
  PlusCircleIcon,
  X,
  InfoIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/api";
import { cn } from "@/lib/utils";
import { useReservas } from "@/hooks/reserva-context-hook";
import { useAuth } from "@/context/auth-context";

const formSchema = z
  .object({
    municipio: z.string().min(1, "Selecione um município."),
    paradas: z.array(z.string()).min(1, "Adicione pelo menos uma parada."),
    passageiros: z
      .array(z.string())
      .min(1, "Adicione pelo menos um passageiro.")
      .max(4, "Máximo de 4 passageiros."),
    dataSaida: z.date({ message: "Selecione a data de saída." }),
    dataRetorno: z.date({ message: "Selecione a data de retorno." }),
    horarioSaida: z.string().min(1, "Informe o horário de saída."),
    horarioRetorno: z.string().min(1, "Informe o horário de retorno."),
    observacao: z.string().optional(),
  })
  .refine((data) => data.dataRetorno >= data.dataSaida, {
    message: "A data de retorno não pode ser anterior à data de saída.",
    path: ["dataRetorno"],
  });

function TagInput({
  label,
  field,
  inputValue,
  setInputValue,
  pending,
  setPending,
  onAdd,
  placeholder,
  hasError,
}: {
  label: string;
  field: any;
  inputValue: string;
  setInputValue: (v: string) => void;
  pending: boolean;
  setPending: (v: boolean) => void;
  onAdd: () => void;
  placeholder: string;
  hasError?: boolean;
}) {
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>

      <div className="flex gap-2">
        <Input
          className={cn(
            "bg-white",
            hasError && "ring-2 ring-red-500 focus-visible:ring-red-500",
          )}
          value={inputValue}
          placeholder={placeholder}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!e.target.value.trim()) setPending(false);
          }}
          onBlur={() => setPending(inputValue.trim().length > 0)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />

        <Button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onAdd();
          }}
        >
          <PlusCircleIcon className="w-4 h-4 mr-2" /> Adicionar
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {field.value.map((item: string, i: number) => (
          <Badge key={i} variant="secondary">
            {item}
            <button
              type="button"
              className="ml-2"
              onClick={() => {
                const filtered = field.value.filter(
                  (_: any, idx: number) => idx !== i,
                );
                field.onChange(filtered);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </Badge>
        ))}
      </div>

      {pending && (
        <p className="text-sm font-medium text-destructive mt-1">
          Clique em "Adicionar" para incluir este item.
        </p>
      )}

      <FormMessage />
    </FormItem>
  );
}

export default function ReservaPage() {
  const [municipios, setMunicipios] = useState<
    { id: number | string; nome: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadingMunicipios, setLoadingMunicipios] = useState(true);

  const [paradaInput, setParadaInput] = useState("");
  const [passageiroInput, setPassageiroInput] = useState("");
  const [paradaPending, setParadaPending] = useState(false);
  const [passageiroPending, setPassageiroPending] = useState(false);
  const [paradaError, setParadaError] = useState(false);
  const [passageiroError, setPassageiroError] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      municipio: "",
      paradas: [],
      passageiros: [],
      horarioSaida: "",
      horarioRetorno: "",
      observacao: "",
      dataSaida: new Date(),
      dataRetorno: new Date(),
    },
  });

  const { addReserva } = useReservas();
  const { user } = useAuth();

  useEffect(() => {
    const fetchMunicipios = async () => {
      try {
        const res = await api.get("/api/municipios/");
        setMunicipios(res.data);
      } catch (error) {
        console.error("Erro ao carregar municípios:", error);
        toast.error("Erro ao carregar lista de municípios.");
      } finally {
        setLoadingMunicipios(false);
      }
    };

    fetchMunicipios();
  }, []);

  const addItem = (
    fieldName: "paradas" | "passageiros",
    value: string,
    limit?: number,
  ) => {
    if (!value.trim()) {
      if (fieldName === "paradas") setParadaError(true);
      if (fieldName === "passageiros") setPassageiroError(true);
      return false;
    }

    if (fieldName === "paradas") setParadaError(false);
    if (fieldName === "passageiros") setPassageiroError(false);

    const curr = form.getValues(fieldName);

    if (limit && curr.length >= limit) {
      toast.error(`Você pode adicionar no máximo ${limit} ${fieldName}.`);
      return false;
    }

    form.setValue(fieldName, [...curr, value.trim()]);
    return true;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    try {
      const passageiros = values.passageiros || [];
      const passengerFields: Record<string, string> = {};
      for (let i = 0; i < 4; i++) {
        passengerFields[`passageiro${i + 1}`] = passageiros[i]
          ? passageiros[i]
          : "";
      }

      const paradasTransformed = (values.paradas || []).map((p) => ({
        local: p,
      }));

      const municipioNumeric = Number(values.municipio);

      const payload = {
        id: null,
        solicitante_nome: user?.name || "Usuário",
        veiculo_designado: null,
        motorista_designado: null,
        data_saida: format(values.dataSaida, "yyyy-MM-dd"),
        horario_saida: values.horarioSaida,
        data_retorno: format(values.dataRetorno, "yyyy-MM-dd"),
        horario_retorno: values.horarioRetorno,
        ...passengerFields,
        municipio: municipioNumeric,
        observacao: values.observacao || "",
        status: "PENDENTE",
        data_criacao: new Date().toISOString(),
        paradas: paradasTransformed,
      };

      console.log("Payload being sent:", payload);
      await addReserva(payload);

      form.reset({
        municipio: "",
        paradas: [],
        passageiros: [],
        horarioSaida: "",
        horarioRetorno: "",
        observacao: "",
        dataSaida: new Date(),
        dataRetorno: new Date(),
      });
      setParadaInput("");
      setPassageiroInput("");
    } catch (error) {
      console.error(error);
      toast.error(
        (error as any)?.response?.data?.message ||
          "Erro ao enviar solicitação.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 justify-between p-6 max-w-[1600px] mx-auto">
      {/* LEFT COLUMN - MAIN FORM */}
      <div className="flex-1 min-w-0 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Reservar Veículo</CardTitle>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* MUNICÍPIO */}
                <FormField
                  control={form.control}
                  name="municipio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Município de destino</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loadingMunicipios}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue
                              placeholder={
                                loadingMunicipios
                                  ? "Carregando..."
                                  : "Selecione o município"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          {municipios.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PARADAS */}
                <FormField
                  control={form.control}
                  name="paradas"
                  render={({ field }) => (
                    <TagInput
                      label="Paradas"
                      field={field}
                      inputValue={paradaInput}
                      setInputValue={(val) => {
                        setParadaInput(val);
                        if (val.trim()) setParadaError(false);
                      }}
                      pending={paradaPending}
                      setPending={setParadaPending}
                      placeholder="Ex: SergipeTec"
                      hasError={paradaError}
                      onAdd={() => {
                        const success = addItem("paradas", paradaInput);
                        if (success) {
                          setParadaInput("");
                          setParadaPending(false);
                          form.clearErrors("paradas");
                        }
                      }}
                    />
                  )}
                />

                {/* PASSAGEIROS */}
                <FormField
                  control={form.control}
                  name="passageiros"
                  render={({ field }) => (
                    <TagInput
                      label="Passageiros"
                      field={field}
                      inputValue={passageiroInput}
                      setInputValue={(val) => {
                        setPassageiroInput(val);
                        if (val.trim()) setPassageiroError(false);
                      }}
                      pending={passageiroPending}
                      setPending={setPassageiroPending}
                      placeholder="Ex: João da Silva"
                      hasError={passageiroError}
                      onAdd={() => {
                        const success = addItem(
                          "passageiros",
                          passageiroInput,
                          4,
                        );
                        if (success) {
                          setPassageiroInput("");
                          setPassageiroPending(false);
                          form.clearErrors("passageiros");
                        }
                      }}
                    />
                  )}
                />

                {/* DATAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Saída */}
                  <FormField
                    control={form.control}
                    name="dataSaida"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data da saída</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                              >
                                {field.value
                                  ? format(field.value, "PPP", { locale: ptBR })
                                  : "Selecione uma data"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>

                          <PopoverContent align="start" className="p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              locale={ptBR}
                            />
                          </PopoverContent>
                        </Popover>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Retorno */}
                  <FormField
                    control={form.control}
                    name="dataRetorno"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de retorno</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                              >
                                {field.value
                                  ? format(field.value, "PPP", { locale: ptBR })
                                  : "Selecione uma data"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>

                          <PopoverContent align="start" className="p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                const saida = form.getValues("dataSaida");
                                return saida ? date < saida : false;
                              }}
                              locale={ptBR}
                            />
                          </PopoverContent>
                        </Popover>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* HORÁRIOS */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="horarioSaida"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário de saída</FormLabel>
                        <FormControl>
                          <Input type="time" className="bg-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="horarioRetorno"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário de retorno</FormLabel>
                        <FormControl>
                          <Input type="time" className="bg-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* OBSERVAÇÃO */}
                <FormField
                  control={form.control}
                  name="observacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observação</FormLabel>
                      <FormControl>
                        <Textarea
                          className="bg-white"
                          placeholder="Detalhes adicionais..."
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* ENVIAR */}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Enviando...
                    </>
                  ) : (
                    "Enviar solicitação"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-full lg:w-80 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangleIcon className="h-5 w-5" />
              Avisos Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Preencha todos os campos obrigatórios.</p>
            <p>• A data de retorno deve ser posterior à data de saída.</p>
            <p>• Máximo de 4 passageiros por veículo.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <InfoIcon className="h-5 w-5" />
              Guia Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <ol className="list-decimal list-inside space-y-1">
              <li>Selecione o município de destino.</li>
              <li>
                Digite o nome de um destino no campo <strong>paradas</strong> e
                clique em <strong>adicionar</strong>.
              </li>
              <li>
                Digite o nome de um passageiro no campo
                <strong> passageiros</strong> e clique em
                <strong> adicionar</strong>.
              </li>
              <li>Defina datas e horários.</li>
              <li>Clique em "Enviar solicitação".</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
