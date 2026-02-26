import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";

interface RemoverFolgaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folga: {
    id: string;
    data_sabado: string;
    colaborador_id: string;
    colaborador?: { nome: string; nome_exibicao?: string | null } | null;
  } | null;
}

export function RemoverFolgaDialog({ open, onOpenChange, folga }: RemoverFolgaDialogProps) {
  const queryClient = useQueryClient();
  const [justificativa, setJustificativa] = useState("");
  const [gerarCredito, setGerarCredito] = useState(true);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!folga) throw new Error("Folga não encontrada");
      if (!justificativa.trim()) throw new Error("Justificativa é obrigatória");

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // If generating credit, insert into credits table
      if (gerarCredito) {
        const { error: creditError } = await supabase
          .from("ferias_folgas_creditos")
          .insert({
            colaborador_id: folga.colaborador_id,
            tipo: "folga",
            origem_data: folga.data_sabado,
            dias: 1,
            justificativa: justificativa.trim(),
            status: "disponivel",
            created_by: user?.id || null,
          });
        if (creditError) throw creditError;
      }

      // Delete the folga
      const { error } = await supabase.from("ferias_folgas").delete().eq("id", folga.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(gerarCredito ? "Folga removida e crédito gerado!" : "Folga removida!");
      queryClient.invalidateQueries({ queryKey: ["ferias-folgas"] });
      queryClient.invalidateQueries({ queryKey: ["ferias-folgas-table"] });
      queryClient.invalidateQueries({ queryKey: ["ferias-folgas-pdf"] });
      queryClient.invalidateQueries({ queryKey: ["ferias-creditos"] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover folga");
    },
  });

  const handleClose = () => {
    setJustificativa("");
    setGerarCredito(true);
    onOpenChange(false);
  };

  const displayName = folga?.colaborador?.nome_exibicao || folga?.colaborador?.nome || "Colaborador";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Remover Folga
          </DialogTitle>
          <DialogDescription>
            Remover a folga de <strong>{displayName}</strong> em{" "}
            {folga ? format(new Date(folga.data_sabado + "T12:00:00"), "dd/MM/yyyy (EEEE)", { locale: ptBR }) : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Justificativa *</Label>
            <Textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Informe o motivo da remoção da folga..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="gerar-credito"
              checked={gerarCredito}
              onCheckedChange={(checked) => setGerarCredito(!!checked)}
            />
            <Label htmlFor="gerar-credito" className="text-sm">
              Gerar crédito de folga para o colaborador
            </Label>
          </div>

          {gerarCredito && (
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
              O colaborador receberá 1 crédito de folga que poderá ser utilizado em meses futuros
              (folgando 2 sábados) ou convertido em dias de férias.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={!justificativa.trim() || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Remover Folga
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
