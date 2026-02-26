import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ClipboardList, BarChart3, Trash2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useSystemAccess } from "@/hooks/useSystemAccess";
import { TeamFilter } from "@/components/vendas/TeamFilter";
import { YearMonthSelector } from "@/components/vendas/YearMonthSelector";
import { EvaluationCard } from "@/components/vendas/EvaluationCard";
import { EvaluationDialog, EvaluationFormData } from "@/components/vendas/EvaluationDialog";
import { EvaluationRanking } from "@/components/vendas/EvaluationRanking";
import { EvaluationSummaryDialog } from "@/components/vendas/EvaluationSummaryDialog";

export default function Evaluations() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useUserRole();
  // ✅ USAR PERMISSÃO DE SISTEMA para controlar edição
  const { canEdit } = useSystemAccess();
  const canEditVendas = canEdit("vendas");
  
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string | null>(() => String(new Date().getMonth() + 1).padStart(2, "0"));
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [activeTab, setActiveTab] = useState("evaluations");
  
  // Dialog state
  const [selectedBroker, setSelectedBroker] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingEvaluationId, setDeletingEvaluationId] = useState<string | null>(null);

  // Get current yearMonth for creating new evaluations
  const currentYearMonth = selectedMonth 
    ? `${selectedYear}-${selectedMonth}` 
    : `${selectedYear}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  // Fetch all active brokers (excluding managers and rental brokers)
  const { data: brokers = [] } = useQuery({
    queryKey: ["sales-brokers-active-non-managers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_brokers")
        .select("id, name, team_id, is_launch, is_active, hire_date, deactivated_month, broker_type, sales_teams(id, name)")
        .eq("is_manager", false) // Excluir gerentes
        .eq("broker_type", "venda") // Excluir corretores de locação
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch evaluations for the selected period
  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ["broker-evaluations", selectedYear, selectedMonth],
    queryFn: async () => {
      let query = supabase
        .from("broker_evaluations")
        .select(`*, sales_brokers(id, name, sales_teams(id, name))`)
        .order("created_at", { ascending: false });
      
      if (selectedMonth === null) {
        query = query.like("year_month", `${selectedYear}-%`);
      } else {
        query = query.eq("year_month", `${selectedYear}-${selectedMonth}`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch launch status history (to inherit status for pending evaluations)
  const { data: launchHistory = [] } = useQuery({
    queryKey: ["broker-launch-history", currentYearMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broker_evaluations")
        .select("broker_id, year_month, is_launch")
        .lte("year_month", currentYearMonth)
        .order("year_month", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: selectedMonth !== null, // Only for month view
  });

  // Build a map: broker_id -> is_launch (latest known status up to current month)
  const launchStatusMap = useMemo(() => {
    const map = new Map<string, boolean>();
    // launchHistory comes ordered by year_month desc, so first occurrence per broker is the latest
    launchHistory.forEach((e: any) => {
      if (!map.has(e.broker_id)) {
        map.set(e.broker_id, e.is_launch ?? false);
      }
    });
    return map;
  }, [launchHistory]);

  // Filter brokers by team
  const filteredByTeam = useMemo(() => {
    if (selectedTeam === "all") return brokers;
    return brokers.filter((b: any) => b.sales_teams?.id === selectedTeam);
  }, [brokers, selectedTeam]);

  // Filter brokers by hire_date and active status
  const filteredBrokers = useMemo(() => {
    // Create date for the end of the selected month
    const [year, month] = selectedMonth 
      ? [parseInt(selectedYear), parseInt(selectedMonth)]
      : [parseInt(selectedYear), 12];
    const evaluationEndDate = new Date(year, month, 0); // Last day of the selected month
    
    const currentYM = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const selectedYM = selectedMonth ? `${selectedYear}-${selectedMonth}` : null;
    
    return filteredByTeam.filter((broker: any) => {
      // Filtro por hire_date
      if (broker.hire_date) {
        const hireDate = new Date(broker.hire_date);
        if (hireDate > evaluationEndDate) return false;
      }
      
      // Se inativo, mostrar apenas para meses anteriores ao mês de desativação
      if (!broker.is_active) {
        if (!broker.deactivated_month) return false; // Sem data de desativação: não mostrar
        if (selectedYM === null) return true; // Visão anual: incluir
        return selectedYM < broker.deactivated_month;
      }
      
      return true;
    });
  }, [filteredByTeam, selectedYear, selectedMonth]);

  // Map evaluations by broker_id for quick lookup
  const evaluationsByBroker = useMemo(() => {
    const map = new Map<string, any>();
    evaluations.forEach((e: any) => {
      // For month view, store the evaluation directly
      // For year view, store the most recent one
      const existing = map.get(e.broker_id);
      if (!existing || new Date(e.year_month) > new Date(existing.year_month)) {
        map.set(e.broker_id, e);
      }
    });
    return map;
  }, [evaluations]);

  // Get evaluation for the selected month specifically (for dialog)
  const getMonthEvaluation = (brokerId: string) => {
    if (!selectedMonth) return null;
    return evaluations.find((e: any) => 
      e.broker_id === brokerId && e.year_month === currentYearMonth
    );
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: EvaluationFormData) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      if (!data.broker_id) throw new Error("Corretor não selecionado");

      const { error } = await supabase.from("broker_evaluations").insert([{ 
        broker_id: data.broker_id,
        is_launch: data.is_launch,
        c2s_perfil_cliente: data.c2s_perfil_cliente,
        c2s_atualiza_atividades: data.c2s_atualiza_atividades,
        c2s_atende_rapido: data.c2s_atende_rapido,
        c2s_cliente_remanejado: data.c2s_cliente_remanejado,
        c2s_bolsao: data.c2s_bolsao,
        c2s_agendamento_chaves: data.c2s_agendamento_chaves,
        c2s_agendamento_sem_chaves: data.c2s_agendamento_sem_chaves,
        c2s_cliente_potencial: data.c2s_cliente_potencial,
        c2s_justifica_arquivamento: data.c2s_justifica_arquivamento,
        c2s_insere_etiquetas: data.c2s_insere_etiquetas,
        c2s_etiqueta_construtora: data.c2s_etiqueta_construtora,
        c2s_feedback_visita: data.c2s_feedback_visita,
        c2s_cadastra_proposta: data.c2s_cadastra_proposta,
        c2s_negocio_fechado: data.c2s_negocio_fechado,
        obs_feedbacks: data.obs_feedbacks,
        acoes_melhorias_c2s: data.acoes_melhorias_c2s,
        metas_acoes_futuras: data.metas_acoes_futuras,
        year_month: currentYearMonth, 
        evaluated_by: user.id 
      }]);
      if (error) throw error;
      
      // Atualizar is_launch no corretor para persistência
      await supabase
        .from("sales_brokers")
        .update({ is_launch: data.is_launch })
        .eq("id", data.broker_id);
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["broker-evaluations"] }); 
      queryClient.invalidateQueries({ queryKey: ["sales-brokers-active"] }); 
      queryClient.invalidateQueries({ queryKey: ["sales-brokers-active-non-managers"] }); 
      toast.success("Avaliação registrada!"); 
      handleCloseDialog(); 
    },
    onError: () => toast.error("Erro ao registrar avaliação"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ data, evaluationId }: { data: EvaluationFormData; evaluationId: string }) => {
      const { error } = await supabase
        .from("broker_evaluations")
        .update({
          is_launch: data.is_launch,
          c2s_perfil_cliente: data.c2s_perfil_cliente,
          c2s_atualiza_atividades: data.c2s_atualiza_atividades,
          c2s_atende_rapido: data.c2s_atende_rapido,
          c2s_cliente_remanejado: data.c2s_cliente_remanejado,
          c2s_bolsao: data.c2s_bolsao,
          c2s_agendamento_chaves: data.c2s_agendamento_chaves,
          c2s_agendamento_sem_chaves: data.c2s_agendamento_sem_chaves,
          c2s_cliente_potencial: data.c2s_cliente_potencial,
          c2s_justifica_arquivamento: data.c2s_justifica_arquivamento,
          c2s_insere_etiquetas: data.c2s_insere_etiquetas,
          c2s_etiqueta_construtora: data.c2s_etiqueta_construtora,
          c2s_feedback_visita: data.c2s_feedback_visita,
          c2s_cadastra_proposta: data.c2s_cadastra_proposta,
          c2s_negocio_fechado: data.c2s_negocio_fechado,
          obs_feedbacks: data.obs_feedbacks,
          acoes_melhorias_c2s: data.acoes_melhorias_c2s,
          metas_acoes_futuras: data.metas_acoes_futuras,
        })
        .eq("id", evaluationId);
      if (error) throw error;
      
      // Atualizar is_launch no corretor para persistência
      await supabase
        .from("sales_brokers")
        .update({ is_launch: data.is_launch })
        .eq("id", data.broker_id);
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["broker-evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["sales-brokers-active"] }); 
      queryClient.invalidateQueries({ queryKey: ["sales-brokers-active-non-managers"] }); 
      toast.success("Avaliação atualizada!"); 
      handleCloseDialog(); 
    },
    onError: () => toast.error("Erro ao atualizar avaliação"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("broker_evaluations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["broker-evaluations"] }); 
      toast.success("Avaliação excluída!"); 
      setIsDeleteDialogOpen(false); 
    },
    onError: () => toast.error("Erro ao excluir avaliação"),
  });

  // Handlers
  const handleOpenBrokerEvaluation = (broker: any) => {
    setSelectedBroker(broker);
    if (selectedMonth === null) {
      // Year view: open read-only summary dialog
      setIsSummaryDialogOpen(true);
    } else {
      // Month view: open edit dialog
      setIsDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsSummaryDialogOpen(false);
    setSelectedBroker(null);
  };

  const handleSubmitEvaluation = (data: EvaluationFormData, isEdit: boolean) => {
    if (isEdit) {
      const existingEvaluation = getMonthEvaluation(data.broker_id);
      if (existingEvaluation) {
        updateMutation.mutate({ data, evaluationId: existingEvaluation.id });
      }
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteEvaluation = (evaluationId: string) => {
    setDeletingEvaluationId(evaluationId);
    setIsDeleteDialogOpen(true);
  };

  // Stats
  const totalBrokers = filteredBrokers.length;
  const filledEvaluations = filteredBrokers.filter((b: any) => 
    selectedMonth ? getMonthEvaluation(b.id) : evaluationsByBroker.has(b.id)
  ).length;
  const pendingEvaluations = totalBrokers - filledEvaluations;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Avaliações C2S</h1>
          <p className="text-muted-foreground">Avalie o desempenho dos corretores</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <YearMonthSelector
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
            allowFullYear
          />
          <TeamFilter value={selectedTeam} onChange={setSelectedTeam} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalBrokers}</div>
            <p className="text-xs text-muted-foreground">Corretores Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{filledEvaluations}</div>
            <p className="text-xs text-muted-foreground">Avaliações Preenchidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingEvaluations}</div>
            <p className="text-xs text-muted-foreground">Avaliações Pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="evaluations" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Avaliações
          </TabsTrigger>
          <TabsTrigger value="ranking" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Ranking
          </TabsTrigger>
        </TabsList>

        {/* Evaluations Tab - Grid of Broker Cards */}
        <TabsContent value="evaluations" className="mt-6">
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : filteredBrokers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum corretor encontrado.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredBrokers.map((broker: any) => {
                const evaluation = selectedMonth 
                  ? getMonthEvaluation(broker.id) 
                  : evaluationsByBroker.get(broker.id);
                
                // Determine launch status for this card:
                // 1. If evaluation exists for this month, use its is_launch
                // 2. Otherwise, inherit from the last known evaluation
                const isLaunchForCard = selectedMonth
                  ? (evaluation?.is_launch ?? launchStatusMap.get(broker.id) ?? false)
                  : (evaluation?.is_launch ?? false);
                
                // Create broker object with correct is_launch for the period
                const brokerWithLaunchStatus = { ...broker, is_launch: isLaunchForCard };
                
                return (
                  <div key={broker.id} className="relative group">
                    <EvaluationCard
                      broker={brokerWithLaunchStatus}
                      evaluation={evaluation}
                      onClick={() => handleOpenBrokerEvaluation(broker)}
                    />
                    {/* Delete button for admins on filled evaluations */}
                    {isAdmin && evaluation && selectedMonth && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvaluation(evaluation.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="mt-6">
          <EvaluationRanking 
            evaluations={selectedMonth ? evaluations.filter((e: any) => e.year_month === currentYearMonth) : evaluations} 
            brokers={filteredBrokers} 
          />
        </TabsContent>
      </Tabs>

      {/* Evaluation Dialog (month view) */}
      {selectedBroker && selectedMonth && (
        <EvaluationDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          broker={selectedBroker}
          yearMonth={currentYearMonth}
          existingEvaluation={getMonthEvaluation(selectedBroker.id)}
          onSubmit={handleSubmitEvaluation}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Summary Dialog (year view) */}
      {selectedBroker && !selectedMonth && (
        <EvaluationSummaryDialog
          open={isSummaryDialogOpen}
          onOpenChange={setIsSummaryDialogOpen}
          broker={selectedBroker}
          year={selectedYear}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Avaliação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingEvaluationId && deleteMutation.mutate(deletingEvaluationId)} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
