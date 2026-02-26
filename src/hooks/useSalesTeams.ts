import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SalesTeam {
  id: string;
  name: string;
}

export function useSalesTeams() {
  return useQuery({
    queryKey: ["sales-teams-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_teams")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as SalesTeam[];
    },
    staleTime: 1000 * 60 * 5,
  });
}
