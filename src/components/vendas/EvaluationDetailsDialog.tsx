import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare, Target, TrendingUp, Calendar, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EvaluationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brokerId: string;
  brokerName: string;
  months: string[];
}

function getMonthName(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function EvaluationDetailsDialog({
  open,
  onOpenChange,
  brokerId,
  brokerName,
  months,
}: EvaluationDetailsDialogProps) {
  const queryClient = useQueryClient();
  const [metasText, setMetasText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: evaluation, isLoading } = useQuery({
    queryKey: ["broker-last-evaluation-details", brokerId, months],
    queryFn: async () => {
      if (!brokerId || months.length === 0) return null;
      const { data, error } = await supabase
        .from("broker_evaluations")
        .select("id, year_month, obs_feedbacks, acoes_melhorias_c2s, metas_acoes_futuras, average_score")
        .eq("broker_id", brokerId)
        .in("year_month", months)
        .order("year_month", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open && !!brokerId && months.length > 0,
    staleTime: 0,
  });

  useEffect(() => {
    if (evaluation) {
      setMetasText(evaluation.metas_acoes_futuras || "");
    }
  }, [evaluation]);

  const handleSaveMetas = async () => {
    if (!evaluation?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("broker_evaluations")
        .update({ metas_acoes_futuras: metasText })
        .eq("id", evaluation.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["broker-last-evaluation-details"] });
      queryClient.invalidateQueries({ queryKey: ["broker-evaluations"] });
      toast.success("Metas salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar metas");
    } finally {
      setIsSaving(false);
    }
  };

  const { data: lastVisitData } = useQuery({
    queryKey: ["broker-last-visit", brokerId, months],
    queryFn: async () => {
      if (!brokerId || months.length === 0) return null;
      const { data, error } = await supabase
        .from("monthly_leads")
        .select("last_visit_date")
        .eq("broker_id", brokerId)
        .in("year_month", months)
        .not("last_visit_date", "is", null)
        .order("last_visit_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.last_visit_date;
    },
    enabled: open && !!brokerId && months.length > 0,
    staleTime: 0,
  });

  const hasContent = evaluation?.obs_feedbacks || evaluation?.acoes_melhorias_c2s || evaluation?.metas_acoes_futuras;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Detalhes da Avaliação</DialogTitle>
          <p className="text-sm text-muted-foreground">{brokerName}</p>
          {evaluation?.year_month && (
            <p className="text-xs text-muted-foreground">
              Última avaliação: {getMonthName(evaluation.year_month)}
              {evaluation.average_score !== null && (
                <span className="ml-2 font-medium">
                  (Nota: {evaluation.average_score.toFixed(1)})
                </span>
              )}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-6">Carregando...</p>
          ) : !evaluation && !lastVisitData ? (
            <p className="text-muted-foreground text-center py-6">
              Nenhuma avaliação encontrada para este período.
            </p>
          ) : (
            <>
              {lastVisitData && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                    <Calendar className="h-4 w-4" />
                    Última Visita Registrada
                  </div>
                  <p className="text-sm font-medium">
                    {(() => { const [y,m,d] = lastVisitData.split("-").map(Number); return new Date(y, m-1, d).toLocaleDateString("pt-BR"); })()}
                  </p>
                </div>
              )}

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                  <MessageSquare className="h-4 w-4" />
                  OBS/Feedbacks
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  {evaluation?.obs_feedbacks || <span className="text-muted-foreground italic">Nada preenchido</span>}
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                  <TrendingUp className="h-4 w-4" />
                  Ações para Melhorias C2S
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  {evaluation?.acoes_melhorias_c2s || <span className="text-muted-foreground italic">Nada preenchido</span>}
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                   <Target className="h-4 w-4" />
                   Metas/Ações Futuras
                 </div>
                 <Textarea
                   value={metasText}
                   onChange={(e) => setMetasText(e.target.value)}
                   placeholder="Preencha metas e ações futuras..."
                   rows={3}
                   className="text-sm"
                 />
                 <Button
                   size="sm"
                   className="mt-2"
                   onClick={handleSaveMetas}
                   disabled={isSaving || !evaluation?.id}
                 >
                   {isSaving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                   Salvar Metas
                 </Button>
               </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
