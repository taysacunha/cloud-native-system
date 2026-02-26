import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const FERIAS_CARGOS_QUERY_KEY = ["ferias-cargos"] as const;

export interface Cargo {
  id: string;
  nome: string;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export const fetchFeriasCargos = async (): Promise<Cargo[]> => {
  const { data, error } = await supabase
    .from("ferias_cargos")
    .select("*")
    .order("nome");
  if (error) throw error;
  return data as Cargo[];
};

export const useFeriasCargos = () => {
  return useQuery({
    queryKey: FERIAS_CARGOS_QUERY_KEY,
    queryFn: fetchFeriasCargos,
  });
};
