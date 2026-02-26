import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CalendarMinus } from "lucide-react";

interface ReducaoFeriasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ferias: any | null;
  colaboradorNome: string;
  onSuccess: () => void;
}

export function ReducaoFeriasDialog({ open, onOpenChange, ferias, colaboradorNome, onSuccess }: ReducaoFeriasDialogProps) {
  const queryClient = useQueryClient();
  const [diasReduzir, setDiasReduzir] = useState(1);
  const [justificativa, setJustificativa] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!ferias) throw new Error("Férias não encontrada");
      if (!justificativa.trim()) throw new Error("Justificativa é obrigatória");
      if (diasReduzir < 1) throw new Error("Informe pelo menos 1 dia");

      const { data: { user } } = await supabase.auth.getUser();

      // Determine which end date to reduce (quinzena2_fim or gozo_quinzena2_fim)
      const endDateField = ferias.gozo_diferente && ferias.gozo_quinzena2_fim 
        ? "gozo_quinzena2_fim" : "quinzena2_fim";
      const currentEnd = parseISO(ferias[endDateField]);
      const newEnd = subDays(currentEnd, diasReduzir);

      // Insert credit
      const { error: creditError } = await supabase
        .from("ferias_folgas_creditos")
        .insert({
          colaborador_id: ferias.colaborador_id,
          tipo: "ferias",
          origem_data: ferias[endDateField],
          dias: diasReduzir,
          justificativa: justificativa.trim(),
          status: "disponivel",
          created_by: user?.id || null,
        });
      if (creditError) throw creditError;

      // Update ferias end date
      const updatePayload: Record<string, string> = {};
      updatePayload[endDateField] = format(newEnd, "yyyy-MM-dd");

      const { error } = await supabase
        .from("ferias_ferias")
        .update(updatePayload)
        .eq("id", ferias.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${diasReduzir} dia(s) de férias removido(s) e crédito gerado!`);
      queryClient.invalidateQueries({ queryKey: ["ferias-ferias"] });
      queryClient.invalidateQueries({ queryKey: ["ferias-creditos"] });
      onSuccess();
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao reduzir férias");
    },
  });

  const handleClose = () => {
    setDiasReduzir(1);
    setJustificativa("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarMinus className="h-5 w-5 text-warning" />
            Reduzir Dias de Férias
          </DialogTitle>
          <DialogDescription>
            Reduzir dias de férias de <strong>{colaboradorNome}</strong>. 
            Os dias removidos serão registrados como crédito.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Dias a reduzir *</Label>
            <Input
              type="number"
              min={1}
              max={15}
              value={diasReduzir}
              onChange={(e) => setDiasReduzir(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="space-y-2">
            <Label>Justificativa *</Label>
            <Textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Ex: Colaborador precisa retornar 3 dias antes por demanda da imobiliária..."
              rows={3}
            />
          </div>

          <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
            O colaborador receberá {diasReduzir} dia(s) de crédito que poderá(ão) ser utilizado(s) 
            em outras férias ou pago(s). Este registro ficará apenas no controle interno.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!justificativa.trim() || diasReduzir < 1 || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar Redução
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
