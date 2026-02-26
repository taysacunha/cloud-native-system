import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SaturdayQueueItem {
  broker_id: string;
  broker_name: string;
  queue_position: number;
  last_saturday_date: string | null;
  times_worked: number;
}

export interface BrokerWeeklyStat {
  broker_id: string;
  broker_name: string;
  external_count: number;
  internal_count: number;
  saturday_count: number;
}

/**
 * Hook para gerenciar a fila de rotação de sábado e estatísticas semanais
 */
export function useSaturdayQueue(locationId: string | null) {
  const queryClient = useQueryClient();

  // Buscar fila de sábado ordenada
  const {
    data: saturdayQueue,
    isLoading: isLoadingQueue,
    refetch: refetchQueue,
  } = useQuery({
    queryKey: ["saturday_queue", locationId],
    queryFn: async () => {
      if (!locationId) return [];
      
      const { data, error } = await supabase.rpc("get_saturday_queue", {
        p_location_id: locationId,
      });

      if (error) throw error;
      return data as SaturdayQueueItem[];
    },
    enabled: !!locationId,
    staleTime: 2 * 60 * 1000,
  });

  // Sincronizar fila de sábado
  const syncQueueMutation = useMutation({
    mutationFn: async (locId: string) => {
      const { data, error } = await supabase.rpc("sync_saturday_queue", {
        p_location_id: locId,
      });

      if (error) throw error;
      return data as { success: boolean; added: number; deactivated: number };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["saturday_queue"] });
      if (result.added > 0 || result.deactivated > 0) {
        toast.success(
          `Fila sincronizada: ${result.added} adicionado(s), ${result.deactivated} desativado(s)`
        );
      } else {
        toast.info("Fila já está sincronizada");
      }
    },
    onError: (error: any) => {
      console.error("Erro ao sincronizar fila:", error);
      toast.error("Erro ao sincronizar fila de sábado");
    },
  });

  // Atualizar posições após alocação de sábado
  const updateQueueAfterAllocationMutation = useMutation({
    mutationFn: async ({
      locId,
      brokerIds,
      saturdayDate,
    }: {
      locId: string;
      brokerIds: string[];
      saturdayDate: string;
    }) => {
      const { data, error } = await supabase.rpc(
        "update_saturday_queue_after_allocation",
        {
          p_location_id: locId,
          p_broker_ids: brokerIds,
          p_saturday_date: saturdayDate,
        }
      );

      if (error) throw error;
      return data as { success: boolean; updated_count: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saturday_queue"] });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar fila após alocação:", error);
    },
  });

  return {
    saturdayQueue,
    isLoadingQueue,
    refetchQueue,
    syncQueue: syncQueueMutation.mutate,
    isSyncingQueue: syncQueueMutation.isPending,
    updateQueueAfterAllocation: updateQueueAfterAllocationMutation.mutate,
  };
}

/**
 * Hook para gerenciar estatísticas semanais dos corretores
 */
export function useBrokerWeeklyStats() {
  const queryClient = useQueryClient();

  // Buscar estatísticas da semana anterior
  const getPreviousWeekStats = async (
    weekStart: string
  ): Promise<BrokerWeeklyStat[]> => {
    const { data, error } = await supabase.rpc("get_previous_week_stats", {
      p_week_start: weekStart,
    });

    if (error) {
      console.error("Erro ao buscar stats da semana anterior:", error);
      return [];
    }

    return data as BrokerWeeklyStat[];
  };

  // Salvar estatísticas semanais
  const saveWeeklyStatsMutation = useMutation({
    mutationFn: async ({
      brokerId,
      weekStart,
      weekEnd,
      externalCount,
      internalCount,
      saturdayCount,
    }: {
      brokerId: string;
      weekStart: string;
      weekEnd: string;
      externalCount: number;
      internalCount: number;
      saturdayCount: number;
    }) => {
      const { data, error } = await supabase.rpc("save_broker_weekly_stats", {
        p_broker_id: brokerId,
        p_week_start: weekStart,
        p_week_end: weekEnd,
        p_external_count: externalCount,
        p_internal_count: internalCount,
        p_saturday_count: saturdayCount,
      });

      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      console.error("Erro ao salvar stats semanais:", error);
    },
  });

  // Deletar estatísticas de um período (para substituição)
  const deleteStatsForPeriodMutation = useMutation({
    mutationFn: async ({
      startDate,
      endDate,
    }: {
      startDate: string;
      endDate: string;
    }) => {
      const { data, error } = await supabase.rpc(
        "delete_weekly_stats_for_period",
        {
          p_start_date: startDate,
          p_end_date: endDate,
        }
      );

      if (error) throw error;
      return data as { success: boolean; deleted: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker_weekly_stats"] });
    },
    onError: (error: any) => {
      console.error("Erro ao deletar stats do período:", error);
    },
  });

  return {
    getPreviousWeekStats,
    saveWeeklyStats: saveWeeklyStatsMutation.mutateAsync,
    deleteStatsForPeriod: deleteStatsForPeriodMutation.mutateAsync,
  };
}

/**
 * Funções utilitárias para uso no gerador de escalas
 */
export async function syncSaturdayQueueForLocation(
  locationId: string
): Promise<{ success: boolean; added: number; deactivated: number }> {
  const { data, error } = await supabase.rpc("sync_saturday_queue", {
    p_location_id: locationId,
  });

  if (error) {
    console.error("Erro ao sincronizar fila de sábado:", error);
    return { success: false, added: 0, deactivated: 0 };
  }

  return data as { success: boolean; added: number; deactivated: number };
}

export async function getSaturdayQueueForLocation(
  locationId: string
): Promise<SaturdayQueueItem[]> {
  const { data, error } = await supabase.rpc("get_saturday_queue", {
    p_location_id: locationId,
  });

  if (error) {
    console.error("Erro ao buscar fila de sábado:", error);
    return [];
  }

  return data as SaturdayQueueItem[];
}

export async function updateSaturdayQueueAfterAllocation(
  locationId: string,
  brokerIds: string[],
  saturdayDate: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc(
    "update_saturday_queue_after_allocation",
    {
      p_location_id: locationId,
      p_broker_ids: brokerIds,
      p_saturday_date: saturdayDate,
    }
  );

  if (error) {
    console.error("Erro ao atualizar fila após alocação:", error);
    return false;
  }

  return (data as { success: boolean }).success;
}

/**
 * Busca estatísticas da semana anterior diretamente das schedule_assignments reais
 * Esta é a fonte primária de dados - usa as escalas geradas reais
 */
export async function getStatsFromPreviousSchedule(
  weekStart: string
): Promise<BrokerWeeklyStat[]> {
  try {
    // 1. Buscar a última escala anterior à data informada
    const { data: previousSchedule, error: scheduleError } = await supabase
      .from("generated_schedules")
      .select("id, week_start_date, week_end_date")
      .lt("week_start_date", weekStart)
      .order("week_start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (scheduleError) {
      console.error("Erro ao buscar escala anterior:", scheduleError);
      return [];
    }

    if (!previousSchedule) {
      console.log("📊 Nenhuma escala anterior encontrada");
      return [];
    }

    console.log(`📊 Escala anterior encontrada: ${previousSchedule.week_start_date} a ${previousSchedule.week_end_date}`);

    // 2. Buscar todas as alocações dessa escala
    const { data: assignments, error: assignError } = await supabase
      .from("schedule_assignments")
      .select(`
        broker_id,
        assignment_date,
        location_id,
        locations!inner(location_type)
      `)
      .eq("generated_schedule_id", previousSchedule.id);

    if (assignError) {
      console.error("Erro ao buscar alocações da escala anterior:", assignError);
      return [];
    }

    if (!assignments || assignments.length === 0) {
      console.log("📊 Escala anterior sem alocações");
      return [];
    }

    // 3. Buscar nomes dos corretores
    const brokerIds = [...new Set(assignments.map(a => a.broker_id))];
    const { data: brokers, error: brokerError } = await supabase
      .from("brokers")
      .select("id, name")
      .in("id", brokerIds);

    if (brokerError) {
      console.error("Erro ao buscar nomes dos corretores:", brokerError);
      return [];
    }

    const brokerNameMap = new Map(brokers?.map(b => [b.id, b.name]) || []);

    // 4. Contar externos, internos e sábados por corretor
    const statsMap = new Map<string, { external: number; internal: number; saturday: number }>();

    for (const assignment of assignments) {
      const brokerId = assignment.broker_id;
      if (!statsMap.has(brokerId)) {
        statsMap.set(brokerId, { external: 0, internal: 0, saturday: 0 });
      }

      const stats = statsMap.get(brokerId)!;
      const locationType = (assignment.locations as any)?.location_type;

      // Contar por tipo de local
      if (locationType === "external") {
        stats.external++;
      } else {
        stats.internal++;
      }

      // Contar sábados
      const assignDate = new Date(assignment.assignment_date + "T00:00:00");
      if (assignDate.getDay() === 6) {
        stats.saturday++;
      }
    }

    // 5. Converter para o formato esperado
    const result: BrokerWeeklyStat[] = [];
    for (const [brokerId, stats] of statsMap.entries()) {
      result.push({
        broker_id: brokerId,
        broker_name: brokerNameMap.get(brokerId) || "Desconhecido",
        external_count: stats.external,
        internal_count: stats.internal,
        saturday_count: stats.saturday,
      });
    }

    console.log(`📊 Stats da escala anterior: ${result.length} corretores`);
    return result;
  } catch (error) {
    console.error("Erro ao buscar stats da escala anterior:", error);
    return [];
  }
}

/**
 * Busca estatísticas da semana anterior da tabela broker_weekly_stats (backup/fallback)
 */
export async function getPreviousWeekBrokerStats(
  weekStart: string
): Promise<BrokerWeeklyStat[]> {
  const { data, error } = await supabase.rpc("get_previous_week_stats", {
    p_week_start: weekStart,
  });

  if (error) {
    console.error("Erro ao buscar stats da semana anterior (fallback):", error);
    return [];
  }

  return data as BrokerWeeklyStat[];
}

/**
 * Busca estatísticas da semana anterior com fallback seguro:
 * 1. Primeiro tenta buscar das schedule_assignments reais
 * 2. Se não encontrar, usa broker_weekly_stats como backup
 */
export async function getPreviousWeekStatsWithFallback(
  weekStart: string
): Promise<BrokerWeeklyStat[]> {
  // Tentar buscar das escalas reais primeiro
  const realStats = await getStatsFromPreviousSchedule(weekStart);
  
  if (realStats.length > 0) {
    console.log("✅ Usando estatísticas das schedule_assignments reais");
    return realStats;
  }

  // Fallback para tabela auxiliar
  console.log("📊 Nenhuma escala anterior encontrada, usando broker_weekly_stats como fallback");
  return getPreviousWeekBrokerStats(weekStart);
}

export async function saveBrokerWeeklyStats(
  brokerId: string,
  weekStart: string,
  weekEnd: string,
  externalCount: number,
  internalCount: number,
  saturdayCount: number
): Promise<boolean> {
  const { error } = await supabase.rpc("save_broker_weekly_stats", {
    p_broker_id: brokerId,
    p_week_start: weekStart,
    p_week_end: weekEnd,
    p_external_count: externalCount,
    p_internal_count: internalCount,
    p_saturday_count: saturdayCount,
  });

  if (error) {
    console.error("Erro ao salvar stats semanais:", error);
    return false;
  }

  return true;
}

export async function deleteWeeklyStatsForPeriod(
  startDate: string,
  endDate: string
): Promise<number> {
  const { data, error } = await supabase.rpc("delete_weekly_stats_for_period", {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error("Erro ao deletar stats do período:", error);
    return 0;
  }

  return (data as { success: boolean; deleted: number }).deleted;
}
