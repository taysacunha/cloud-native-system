import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cake, Users, CalendarDays, Gift, List, Briefcase, FileText } from "lucide-react";
import { format, parseISO, getMonth, getDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import CalendarioAniversariantesTab from "@/components/ferias/calendario/CalendarioAniversariantesTab";
import { AniversariantesPDFGenerator } from "@/components/ferias/relatorios/AniversariantesPDFGenerator";
import { AniversariantesCelebrePDFGenerator } from "@/components/ferias/relatorios/AniversariantesCelebrePDFGenerator";

const MONTHS = [
  { value: "all", label: "Todos os meses" },
  { value: "0", label: "Janeiro" },
  { value: "1", label: "Fevereiro" },
  { value: "2", label: "Março" },
  { value: "3", label: "Abril" },
  { value: "4", label: "Maio" },
  { value: "5", label: "Junho" },
  { value: "6", label: "Julho" },
  { value: "7", label: "Agosto" },
  { value: "8", label: "Setembro" },
  { value: "9", label: "Outubro" },
  { value: "10", label: "Novembro" },
  { value: "11", label: "Dezembro" },
];

const SETOR_COLORS: Record<string, string> = {
  "Vendas": "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  "Locação": "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  "Administração": "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  "Financeiro": "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  "RH": "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
  "Comercial": "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  "Marketing": "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  "TI": "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  "Jurídico": "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  "Operacional": "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800",
};

const getSetorColor = (setorNome: string | undefined): string => {
  if (!setorNome) return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  
  if (SETOR_COLORS[setorNome]) return SETOR_COLORS[setorNome];
  
  for (const [key, value] of Object.entries(SETOR_COLORS)) {
    if (setorNome.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
};

interface Colaborador {
  id: string;
  nome: string;
  data_nascimento: string;
  setor_titular_id: string;
  setor?: { id: string; nome: string } | null;
  cargo?: { nome: string } | null;
  status: string | null;
  is_broker?: boolean;
}

interface Setor {
  id: string;
  nome: string;
}

interface GrupoMes {
  month: number;
  monthName: string;
  colaboradores: Colaborador[];
}

interface SalesBroker {
  id: string;
  name: string;
  birth_date: string | null;
  is_active: boolean;
}

export default function FeriasAniversariantes() {
  const currentMonth = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth.toString());
  const [selectedSetor, setSelectedSetor] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("lista");

  // Buscar colaboradores ativos
  const { data: colaboradores, isLoading: loadingColaboradores } = useQuery({
    queryKey: ["ferias-colaboradores-aniversarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_colaboradores")
        .select(`
          id,
          nome,
          data_nascimento,
          setor_titular_id,
          status,
          setor:ferias_setores!ferias_colaboradores_setor_titular_id_fkey(id, nome),
          cargo:ferias_cargos(nome)
        `)
        .eq("status", "ativo")
        .order("nome");

      if (error) throw error;
      return data as Colaborador[];
    },
  });

  // Buscar setores
  const { data: setores, isLoading: loadingSetores } = useQuery({
    queryKey: ["ferias-setores-aniversarios"],
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

  // Buscar corretores do sistema de vendas com data de nascimento
  const { data: salesBrokers, isLoading: loadingBrokers } = useQuery({
    queryKey: ["sales-brokers-birthdays"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_brokers")
        .select("id, name, birth_date, is_active")
        .eq("is_active", true)
        .not("birth_date", "is", null);
      if (error) throw error;
      return data as SalesBroker[];
    },
  });

  // Mesclar colaboradores e corretores
  const allPeople = useMemo(() => {
    const colabs: Colaborador[] = (colaboradores || []).map(c => ({ ...c, is_broker: false }));
    const brokers: Colaborador[] = (salesBrokers || [])
      .filter(b => b.birth_date)
      .map(b => ({
        id: `broker-${b.id}`,
        nome: b.name,
        data_nascimento: b.birth_date!,
        setor_titular_id: "",
        setor: { id: "vendas", nome: "Corretores" },
        cargo: null,
        status: "ativo",
        is_broker: true,
      }));
    return [...colabs, ...brokers];
  }, [colaboradores, salesBrokers]);

  // Filtrar e ordenar aniversariantes (MÊS primeiro, DIA depois)
  const aniversariantes = useMemo(() => {
    if (allPeople.length === 0) return [];

    return allPeople.filter((col) => {
      const birthDate = parseISO(col.data_nascimento);
      const birthMonth = getMonth(birthDate);

      if (selectedMonth !== "all" && birthMonth !== parseInt(selectedMonth)) {
        return false;
      }

      // Filtro por setor - corretores só aparecem se "all" ou "vendas"
      if (selectedSetor !== "all") {
        if (col.is_broker) {
          if (selectedSetor !== "vendas") return false;
        } else if (col.setor_titular_id !== selectedSetor) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const dateA = parseISO(a.data_nascimento);
      const dateB = parseISO(b.data_nascimento);
      const monthA = getMonth(dateA);
      const monthB = getMonth(dateB);
      
      if (monthA !== monthB) {
        return monthA - monthB;
      }
      return getDate(dateA) - getDate(dateB);
    });
  }, [colaboradores, selectedMonth, selectedSetor]);

  // Agrupar aniversariantes por mês quando "Todos os meses" está selecionado
  const aniversariantesAgrupados = useMemo((): GrupoMes[] | null => {
    if (selectedMonth !== "all") return null;

    const grupos: Record<number, Colaborador[]> = {};

    aniversariantes.forEach((col) => {
      const month = getMonth(parseISO(col.data_nascimento));
      if (!grupos[month]) grupos[month] = [];
      grupos[month].push(col);
    });

    return Object.entries(grupos)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([month, cols]) => ({
        month: Number(month),
        monthName: MONTHS[Number(month) + 1].label,
        colaboradores: cols
      }));
  }, [aniversariantes, selectedMonth]);

  // Aniversariantes de hoje
  const aniversariantesHoje = useMemo(() => {
    if (allPeople.length === 0) return [];

    const today = new Date();
    return allPeople.filter((col) => {
      const birthDate = parseISO(col.data_nascimento);
      return getDate(birthDate) === getDate(today) && getMonth(birthDate) === getMonth(today);
    });
  }, [allPeople]);

  // Próximos aniversariantes (próximos 30 dias)
  const proximosAniversariantes = useMemo(() => {
    if (allPeople.length === 0) return [];

    const today = new Date();
    const todayMonth = getMonth(today);
    const todayDay = getDate(today);

    return allPeople
      .map((col) => {
        const birthDate = parseISO(col.data_nascimento);
        const birthMonth = getMonth(birthDate);
        const birthDay = getDate(birthDate);

        let daysUntil: number;
        if (birthMonth > todayMonth || (birthMonth === todayMonth && birthDay > todayDay)) {
          const nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
          daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        } else if (birthMonth === todayMonth && birthDay === todayDay) {
          daysUntil = 0;
        } else {
          const nextBirthday = new Date(today.getFullYear() + 1, birthMonth, birthDay);
          daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }

        return { ...col, daysUntil };
      })
      .filter((col) => col.daysUntil <= 30 && col.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [allPeople]);

  const loading = loadingColaboradores || loadingSetores || loadingBrokers;

  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = parseISO(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  const renderColaboradorCard = (col: Colaborador) => {
    const birthDate = parseISO(col.data_nascimento);
    const isTodays = getDate(birthDate) === getDate(new Date()) && 
                     getMonth(birthDate) === getMonth(new Date());
    const idade = calcularIdade(col.data_nascimento);

    return (
      <div
        key={col.id}
        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${col.is_broker ? "border-l-4 border-l-amber-500" : ""} ${
          isTodays 
            ? "bg-primary/10 border-primary/30" 
            : "hover:bg-muted/50"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isTodays ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}>
            <span className="text-lg font-bold">
              {getDate(birthDate)}
            </span>
          </div>
          <div>
            <p className="font-medium flex items-center gap-2">
              {col.nome}
              {isTodays && <span className="text-lg">🎂</span>}
              {col.is_broker && (
                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
                  <Briefcase className="h-3 w-3 mr-1" />
                  Corretor
                </Badge>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{format(birthDate, "dd 'de' MMMM", { locale: ptBR })}</span>
              <span>•</span>
              <span>{idade} anos</span>
              {col.cargo?.nome && (
                <>
                  <span>•</span>
                  <span>{col.cargo.nome}</span>
                </>
              )}
            </div>
          </div>
        </div>
        {!col.is_broker && (
          <Badge 
            variant="outline" 
            className={`hidden sm:inline-flex border ${getSetorColor(col.setor?.nome)}`}
          >
            {col.setor?.nome || "Sem setor"}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Cake className="h-8 w-8 text-primary" />
          Aniversariantes
        </h1>
        <p className="text-muted-foreground">
          Visualize os aniversariantes por mês e setor
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aniversariantes Hoje</CardTitle>
            <Gift className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-primary">{aniversariantesHoje.length}</div>
                {aniversariantesHoje.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {aniversariantesHoje.slice(0, 3).map((col) => (
                      <p key={col.id} className="text-xs text-muted-foreground truncate">
                        🎂 {col.nome}
                      </p>
                    ))}
                    {aniversariantesHoje.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{aniversariantesHoje.length - 3} mais
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {colaboradores?.filter((col) => {
                    const birthDate = parseISO(col.data_nascimento);
                    return getMonth(birthDate) === new Date().getMonth();
                  }).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  aniversariantes em {format(new Date(), "MMMM", { locale: ptBR })}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos 30 dias</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{proximosAniversariantes.length}</div>
                <p className="text-xs text-muted-foreground">
                  aniversários chegando
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Card principal com abas */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">Aniversariantes</CardTitle>
              <TabsList>
                <TabsTrigger value="lista" className="gap-2">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Lista</span>
                </TabsTrigger>
                <TabsTrigger value="calendario" className="gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendário</span>
                </TabsTrigger>
                <TabsTrigger value="pdf" className="gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Gerar PDF</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <TabsContent value="lista" className="m-0">
              {/* Filtros */}
              <div className="flex flex-col gap-3 sm:flex-row mb-6">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSetor} onValueChange={setSelectedSetor}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os setores</SelectItem>
                    {setores?.map((setor) => (
                      <SelectItem key={setor.id} value={setor.id}>
                        {setor.nome}
                      </SelectItem>
                    ))}
                    <SelectItem value="vendas" className="text-amber-700 dark:text-amber-400">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        Corretores
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lista de aniversariantes */}
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : aniversariantes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Cake className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhum aniversariante encontrado</p>
                  <p className="text-sm text-muted-foreground/70">
                    Ajuste os filtros para ver mais resultados
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {selectedMonth === "all" && aniversariantesAgrupados ? (
                    aniversariantesAgrupados.map((grupo) => (
                      <div key={grupo.month} className="space-y-3">
                        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 px-3 rounded-md border-b">
                          <Badge variant="secondary" className="text-sm font-semibold gap-1">
                            <Cake className="h-3.5 w-3.5" />
                            {grupo.monthName} ({grupo.colaboradores.length})
                          </Badge>
                        </div>
                        {grupo.colaboradores.map((col) => renderColaboradorCard(col))}
                      </div>
                    ))
                  ) : (
                    aniversariantes.map((col) => renderColaboradorCard(col))
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendario" className="m-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Skeleton className="h-[400px] w-full" />
                </div>
              ) : (
                <CalendarioAniversariantesTab colaboradores={colaboradores} />
              )}
            </TabsContent>

            <TabsContent value="pdf" className="m-0 space-y-6">
              <AniversariantesPDFGenerator initialMonth={selectedMonth === "all" ? "_all_" : selectedMonth} />
              <AniversariantesCelebrePDFGenerator />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Próximos aniversariantes */}
      {proximosAniversariantes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Próximos Aniversários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {proximosAniversariantes.slice(0, 8).map((col) => {
                const birthDate = parseISO(col.data_nascimento);
                const idade = calcularIdade(col.data_nascimento) + (col.daysUntil > 0 ? 1 : 0);

                return (
                  <div
                    key={col.id}
                    className={`p-4 rounded-lg border ${
                      col.daysUntil === 0
                        ? "bg-primary/10 border-primary/30"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={col.daysUntil === 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {col.daysUntil === 0
                          ? "Hoje! 🎉"
                          : col.daysUntil === 1
                          ? "Amanhã"
                          : `Em ${col.daysUntil} dias`}
                      </Badge>
                    </div>
                    <p className="font-medium truncate">{col.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(birthDate, "dd/MM", { locale: ptBR })} • {idade} anos
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
