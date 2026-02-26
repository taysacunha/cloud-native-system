import { supabase } from "@/integrations/supabase/client";

export interface LocationRotationQueueItem {
  broker_id: string;
  broker_name: string;
  queue_position: number;
  last_assignment_date: string | null;
  times_assigned: number;
}

/**
 * Sincroniza a fila de rotação para um local específico
 * Adiciona novos corretores e remove os que não estão mais associados
 */
export async function syncLocationRotationQueue(locationId: string): Promise<{ success: boolean; added?: number }> {
  try {
    const { data, error } = await supabase.rpc('sync_location_rotation_queue', {
      p_location_id: locationId
    });

    if (error) {
      console.error('Erro ao sincronizar fila de rotação:', error);
      return { success: false };
    }

    return data as { success: boolean; added?: number };
  } catch (error) {
    console.error('Erro ao sincronizar fila de rotação:', error);
    return { success: false };
  }
}

/**
 * Busca a fila de rotação de um local, ordenada por posição
 */
export async function getLocationRotationQueue(locationId: string): Promise<LocationRotationQueueItem[]> {
  try {
    const { data, error } = await supabase.rpc('get_location_rotation_queue', {
      p_location_id: locationId
    });

    if (error) {
      console.error('Erro ao buscar fila de rotação:', error);
      return [];
    }

    return (data || []) as LocationRotationQueueItem[];
  } catch (error) {
    console.error('Erro ao buscar fila de rotação:', error);
    return [];
  }
}

/**
 * Atualiza a fila após uma alocação, movendo o corretor para o final
 */
export async function updateLocationQueueAfterAllocation(
  locationId: string,
  brokerId: string,
  assignmentDate: string
): Promise<{ success: boolean }> {
  try {
    const { data, error } = await supabase.rpc('update_location_queue_after_allocation', {
      p_location_id: locationId,
      p_broker_id: brokerId,
      p_assignment_date: assignmentDate
    });

    if (error) {
      console.error('Erro ao atualizar fila após alocação:', error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar fila após alocação:', error);
    return { success: false };
  }
}

/**
 * Atualiza múltiplas filas de uma vez após geração de escala
 */
export async function bulkUpdateLocationQueuesAfterAllocation(
  allocations: Array<{ location_id: string; broker_id: string; assignment_date: string }>
): Promise<{ success: boolean; updated?: number }> {
  try {
    const { data, error } = await supabase.rpc('bulk_update_location_queues_after_allocation', {
      p_allocations: allocations
    });

    if (error) {
      console.error('Erro ao atualizar filas em lote:', error);
      return { success: false };
    }

    return data as { success: boolean; updated?: number };
  } catch (error) {
    console.error('Erro ao atualizar filas em lote:', error);
    return { success: false };
  }
}

/**
 * Sincroniza filas de todos os locais externos ativos
 */
export async function syncAllLocationRotationQueues(): Promise<{ success: boolean; synced: number }> {
  try {
    // Buscar todos os locais externos ativos
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id')
      .eq('location_type', 'external')
      .eq('is_active', true);

    if (locError || !locations) {
      console.error('Erro ao buscar locais externos:', locError);
      return { success: false, synced: 0 };
    }

    let synced = 0;
    for (const location of locations) {
      const result = await syncLocationRotationQueue(location.id);
      if (result.success) synced++;
    }

    console.log(`✅ Sincronizadas ${synced} filas de rotação`);
    return { success: true, synced };
  } catch (error) {
    console.error('Erro ao sincronizar todas as filas:', error);
    return { success: false, synced: 0 };
  }
}

/**
 * Busca filas de rotação para múltiplos locais de uma vez
 */
export async function getMultipleLocationRotationQueues(
  locationIds: string[]
): Promise<Map<string, LocationRotationQueueItem[]>> {
  const result = new Map<string, LocationRotationQueueItem[]>();
  
  if (locationIds.length === 0) return result;

  try {
    // Buscar todas as filas em uma única query
    const { data, error } = await supabase
      .from('location_rotation_queue')
      .select(`
        location_id,
        broker_id,
        queue_position,
        last_assignment_date,
        times_assigned,
        brokers!inner(name)
      `)
      .in('location_id', locationIds)
      .order('queue_position', { ascending: true });

    if (error) {
      console.error('Erro ao buscar filas de rotação:', error);
      return result;
    }

    // Organizar por local
    for (const row of data || []) {
      const locationId = row.location_id;
      if (!result.has(locationId)) {
        result.set(locationId, []);
      }
      result.get(locationId)!.push({
        broker_id: row.broker_id,
        broker_name: (row.brokers as any)?.name || 'Desconhecido',
        queue_position: row.queue_position,
        last_assignment_date: row.last_assignment_date,
        times_assigned: row.times_assigned
      });
    }

    return result;
  } catch (error) {
    console.error('Erro ao buscar múltiplas filas de rotação:', error);
    return result;
  }
}
