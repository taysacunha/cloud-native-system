import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, AlertCircle, Users, Palmtree } from "lucide-react";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Ferias {
  id: string;
  colaborador_id: string;
  quinzena1_inicio: string;
  quinzena1_fim: string;
  quinzena2_inicio: string;
  quinzena2_fim: string;
  gozo_diferente: boolean;
  gozo_quinzena1_inicio: string | null;
  gozo_quinzena1_fim: string | null;
  gozo_quinzena2_inicio: string | null;
  gozo_quinzena2_fim: string | null;
  status: string;
  is_excecao: boolean;
  dias_vendidos: number | null;
  vender_dias: boolean;
  origem: string | null;
  colaborador?: {
    nome: string;
    setor?: { id: string; nome: string } | null;
    unidade?: { nome: string } | null;
  } | null;
}

interface Setor {
  id: string;
  nome: string;
}

interface Unidade {
  id: string;
  nome: string;
}

export function CalendarioFeriasTab() {
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedUnidade, setSelectedUnidade] = useState<string>("all");
  const [selectedSetor, setSelectedSetor] = useState<string>("all");
  const [selectedFerias, setSelectedFerias] = useState<Ferias | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Buscar férias
  const { data: ferias = [], isLoading: loadingFerias } = useQuery({
    queryKey: ["ferias-calendario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_ferias")
        .select(`
          id,
          colaborador_id,
          quinzena1_inicio,
          quinzena1_fim,
          quinzena2_inicio,
          quinzena2_fim,
          gozo_diferente,
          gozo_quinzena1_inicio,
          gozo_quinzena1_fim,
          gozo_quinzena2_inicio,
          gozo_quinzena2_fim,
          status,
          is_excecao,
          dias_vendidos,
          vender_dias,
          origem,
          colaborador:ferias_colaboradores!ferias_ferias_colaborador_id_fkey(
            nome,
            setor:ferias_setores!ferias_colaboradores_setor_titular_id_fkey(id, nome),
            unidade:ferias_unidades(nome)
          )
        `)
        .in("status", ["aprovada", "em_gozo", "concluida"])
        .order("quinzena1_inicio");

      if (error) throw error;
      return data as Ferias[];
    },
  });

  // Buscar setores
  const { data: setores = [] } = useQuery({
    queryKey: ["ferias-setores-calendario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_setores")
        .select("id, nome")
        .eq("is_active", true)
        .order("nome");
      if (error) throw error;
      return data as Setor[];
    },
  });

  // Buscar unidades
  const { data: unidades = [] } = useQuery({
    queryKey: ["ferias-unidades-calendario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_unidades")
        .select("id, nome")
        .eq("is_active", true)
        .order("nome");
      if (error) throw error;
      return data as Unidade[];
    },
  });

  // Filtrar férias
  const feriasFiltradas = useMemo(() => {
    return ferias.filter((f) => {
      if (selectedSetor !== "all" && f.colaborador?.setor?.id !== selectedSetor) {
        return false;
      }
      if (selectedUnidade !== "all") {
        // Não temos unidade_id diretamente, seria necessário ajustar a query
        return true;
      }
      return true;
    });
  }, [ferias, selectedSetor, selectedUnidade]);

  // Calcular datas efetivas de gozo
  const getGozoDates = (f: Ferias) => {
    if (f.gozo_diferente) {
      return {
        q1Start: f.gozo_quinzena1_inicio ? parseISO(f.gozo_quinzena1_inicio) : null,
        q1End: f.gozo_quinzena1_fim ? parseISO(f.gozo_quinzena1_fim) : null,
        q2Start: f.gozo_quinzena2_inicio ? parseISO(f.gozo_quinzena2_inicio) : null,
        q2End: f.gozo_quinzena2_fim ? parseISO(f.gozo_quinzena2_fim) : null,
      };
    }
    return {
      q1Start: parseISO(f.quinzena1_inicio),
      q1End: parseISO(f.quinzena1_fim),
      q2Start: parseISO(f.quinzena2_inicio),
      q2End: parseISO(f.quinzena2_fim),
    };
  };

  // Dias com férias no mês do calendário
  const diasComFerias = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    const allDays = eachDayOfInterval({ start, end });

    return allDays.filter((day) => {
      return feriasFiltradas.some((f) => {
        const dates = getGozoDates(f);
        // Verificar quinzena 1
        if (dates.q1Start && dates.q1End) {
          if (isWithinInterval(day, { start: dates.q1Start, end: dates.q1End })) {
            return true;
          }
        }
        // Verificar quinzena 2
        if (dates.q2Start && dates.q2End) {
          if (isWithinInterval(day, { start: dates.q2Start, end: dates.q2End })) {
            return true;
          }
        }
        return false;
      });
    });
  }, [feriasFiltradas, calendarMonth]);

  // Férias no mês selecionado
  const feriasDoMes = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);

    return feriasFiltradas.filter((f) => {
      const dates = getGozoDates(f);
      // Verificar se alguma quinzena está no mês
      if (dates.q1Start && dates.q1End) {
        if (
          isWithinInterval(monthStart, { start: dates.q1Start, end: dates.q1End }) ||
          isWithinInterval(monthEnd, { start: dates.q1Start, end: dates.q1End }) ||
          isWithinInterval(dates.q1Start, { start: monthStart, end: monthEnd })
        ) {
          return true;
        }
      }
      if (dates.q2Start && dates.q2End) {
        if (
          isWithinInterval(monthStart, { start: dates.q2Start, end: dates.q2End }) ||
          isWithinInterval(monthEnd, { start: dates.q2Start, end: dates.q2End }) ||
          isWithinInterval(dates.q2Start, { start: monthStart, end: monthEnd })
        ) {
          return true;
        }
      }
      return false;
    });
  }, [feriasFiltradas, calendarMonth]);

  const handleDayClick = (day: Date) => {
    // Encontrar férias neste dia
    const feriasNoDia = feriasFiltradas.filter((f) => {
      const dates = getGozoDates(f);
      if (dates.q1Start && dates.q1End) {
        if (isWithinInterval(day, { start: dates.q1Start, end: dates.q1End })) {
          return true;
        }
      }
      if (dates.q2Start && dates.q2End) {
        if (isWithinInterval(day, { start: dates.q2Start, end: dates.q2End })) {
          return true;
        }
      }
      return false;
    });

    if (feriasNoDia.length > 0) {
      setSelectedFerias(feriasNoDia[0]);
      setDetailsOpen(true);
    }
  };

  // Stats
  const totalFeriasAno = ferias.filter((f) => {
    const dates = getGozoDates(f);
    const currentYear = new Date().getFullYear();
    return (
      (dates.q1Start && dates.q1Start.getFullYear() === currentYear) ||
      (dates.q2Start && dates.q2Start.getFullYear() === currentYear)
    );
  }).length;

  const feriasEmGozo = ferias.filter((f) => f.status === "em_gozo").length;
  const feriasComExcecao = ferias.filter((f) => f.is_excecao).length;

  const loading = loadingFerias;

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total no Ano</CardTitle>
            <Palmtree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{totalFeriasAno}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Gozo</CardTitle>
            <CalendarIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-primary">{feriasEmGozo}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{feriasDoMes.length}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Exceção</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-orange-500">{feriasComExcecao}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendário */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Calendário de Férias</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              locale={ptBR}
              className="rounded-md border pointer-events-auto"
              modifiers={{
                vacation: diasComFerias,
              }}
              modifiersStyles={{
                vacation: {
                  backgroundColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  fontWeight: "bold",
                  borderRadius: "50%",
                },
              }}
              onDayClick={handleDayClick}
            />
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 rounded-full bg-primary" />
              <span>Dias com férias</span>
            </div>
          </CardContent>
        </Card>

        {/* Lista filtrada */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">
                Férias em {format(calendarMonth, "MMMM yyyy", { locale: ptBR })}
              </CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={selectedSetor} onValueChange={setSelectedSetor}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os setores</SelectItem>
                    {setores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as unidades</SelectItem>
                    {unidades.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : feriasDoMes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Palmtree className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhuma férias neste mês</p>
                <p className="text-sm text-muted-foreground/70">
                  Navegue pelo calendário para ver outros meses
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {feriasDoMes.map((f) => {
                  const dates = getGozoDates(f);
                  return (
                    <div
                      key={f.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                        f.is_excecao ? "border-orange-300 bg-orange-50/50" : ""
                      }`}
                      onClick={() => {
                        setSelectedFerias(f);
                        setDetailsOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <p className="font-medium flex items-center gap-2">
                            {f.colaborador?.nome || "Colaborador"}
                            {f.is_excecao && (
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                Exceção
                              </Badge>
                            )}
                            {f.origem === "gerada" && (
                              <Badge variant="secondary" className="text-xs">
                                Gerada
                              </Badge>
                            )}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            {dates.q1Start && dates.q1End && (
                              <span>
                                1ª: {format(dates.q1Start, "dd/MM")} - {format(dates.q1End, "dd/MM")}
                              </span>
                            )}
                            {dates.q2Start && dates.q2End && (
                              <>
                                <span>•</span>
                                <span>
                                  2ª: {format(dates.q2Start, "dd/MM")} - {format(dates.q2End, "dd/MM")}
                                </span>
                              </>
                            )}
                            {f.vender_dias && f.dias_vendidos && (
                              <>
                                <span>•</span>
                                <span className="text-primary">{f.dias_vendidos} dias vendidos</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          f.status === "em_gozo"
                            ? "default"
                            : f.status === "aprovada"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {f.status === "em_gozo"
                          ? "Em Gozo"
                          : f.status === "aprovada"
                          ? "Aprovada"
                          : f.status === "concluida"
                          ? "Concluída"
                          : f.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de detalhes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Férias</DialogTitle>
          </DialogHeader>
          {selectedFerias && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Colaborador</Label>
                <p className="font-medium">{selectedFerias.colaborador?.nome}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Setor</Label>
                  <p className="font-medium">
                    {selectedFerias.colaborador?.setor?.nome || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className="mt-1">
                    {selectedFerias.status === "em_gozo"
                      ? "Em Gozo"
                      : selectedFerias.status === "aprovada"
                      ? "Aprovada"
                      : selectedFerias.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">1ª Quinzena (Gozo)</Label>
                <p className="font-medium">
                  {(() => {
                    const dates = getGozoDates(selectedFerias);
                    if (dates.q1Start && dates.q1End) {
                      return `${format(dates.q1Start, "dd/MM/yyyy")} a ${format(
                        dates.q1End,
                        "dd/MM/yyyy"
                      )}`;
                    }
                    return "-";
                  })()}
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground">2ª Quinzena (Gozo)</Label>
                <p className="font-medium">
                  {(() => {
                    const dates = getGozoDates(selectedFerias);
                    if (dates.q2Start && dates.q2End) {
                      return `${format(dates.q2Start, "dd/MM/yyyy")} a ${format(
                        dates.q2End,
                        "dd/MM/yyyy"
                      )}`;
                    }
                    return "-";
                  })()}
                </p>
              </div>

              {selectedFerias.gozo_diferente && (
                <div>
                  <Label className="text-muted-foreground">Período Contador</Label>
                  <p className="text-sm text-muted-foreground">
                    1ª: {format(parseISO(selectedFerias.quinzena1_inicio), "dd/MM")} -{" "}
                    {format(parseISO(selectedFerias.quinzena1_fim), "dd/MM")} | 2ª:{" "}
                    {format(parseISO(selectedFerias.quinzena2_inicio), "dd/MM")} -{" "}
                    {format(parseISO(selectedFerias.quinzena2_fim), "dd/MM")}
                  </p>
                </div>
              )}

              {selectedFerias.vender_dias && selectedFerias.dias_vendidos && (
                <div>
                  <Label className="text-muted-foreground">Dias Vendidos</Label>
                  <p className="font-medium text-primary">
                    {selectedFerias.dias_vendidos} dias
                  </p>
                </div>
              )}

              {selectedFerias.is_excecao && (
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <Label className="text-orange-600">⚠️ Exceção</Label>
                  <p className="text-sm text-orange-700">
                    Esta férias foi cadastrada como exceção às regras.
                  </p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Origem</Label>
                <Badge variant="outline">
                  {selectedFerias.origem === "gerada" ? "Geração Automática" : "Cadastro Manual"}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
