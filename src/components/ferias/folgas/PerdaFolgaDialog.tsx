import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

// Motivos padronizados
const MOTIVOS_PERDA = [
  { value: "falta_injustificada", label: "Falta injustificada" },
  { value: "atestado_medico", label: "Atestado médico" },
  { value: "aviso_previo", label: "Aviso prévio" },
  { value: "suspensao", label: "Suspensão disciplinar" },
  { value: "outro", label: "Outro motivo" },
] as const;

interface Colaborador {
  id: string;
  nome: string;
}

interface PerdaFolgaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  selectedSetor?: string;
}

export function PerdaFolgaDialog({ open, onOpenChange, year, month, selectedSetor }: PerdaFolgaDialogProps) {
  const queryClient = useQueryClient();
  const [colaboradorId, setColaboradorId] = useState("");
  const [motivoKey, setMotivoKey] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Query colaboradores
  const { data: colaboradores = [] } = useQuery({
    queryKey: ["ferias-colaboradores-perda", selectedSetor],
    queryFn: async () => {
      let query = supabase
        .from("ferias_colaboradores")
        .select("id, nome")
        .eq("status", "ativo");
      
      if (selectedSetor) {
        query = query.eq("setor_titular_id", selectedSetor);
      }
      
      const { data, error } = await query.order("nome");
      if (error) throw error;
      return data as Colaborador[];
    },
  });

  // Query existing perdas to avoid duplicates
  const { data: existingPerdas = [] } = useQuery({
    queryKey: ["ferias-perdas-check", year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_folgas_perdas")
        .select("colaborador_id")
        .eq("ano", year)
        .eq("mes", month);
      if (error) throw error;
      return data.map(p => p.colaborador_id);
    },
  });

  const addPerdaMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const motivo = MOTIVOS_PERDA.find(m => m.value === motivoKey)?.label || motivoKey;
      
      const { error } = await supabase
        .from("ferias_folgas_perdas")
        .insert({
          colaborador_id: colaboradorId,
          ano: year,
          mes: month,
          motivo,
          observacoes: observacoes || null,
          created_by: user.user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perda de folga registrada!");
      queryClient.invalidateQueries({ queryKey: ["ferias-perdas"] });
      queryClient.invalidateQueries({ queryKey: ["ferias-perdas-check"] });
      handleClose();
    },
    onError: () => toast.error("Erro ao registrar perda"),
  });

  const handleClose = () => {
    setColaboradorId("");
    setMotivoKey("");
    setObservacoes("");
    onOpenChange(false);
  };

  // Filter out colaboradores that already have perda
  const availableColaboradores = colaboradores.filter(c => !existingPerdas.includes(c.id));

  const isFormValid = colaboradorId && motivoKey && (motivoKey !== "outro" || observacoes.trim());

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Registrar Perda de Folga
          </DialogTitle>
          <DialogDescription>
            Registre quando um colaborador perde o direito à folga de sábado do mês.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Colaborador *</Label>
            <Select value={colaboradorId} onValueChange={setColaboradorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o colaborador" />
              </SelectTrigger>
              <SelectContent>
                {availableColaboradores.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Todos os colaboradores já têm perda registrada
                  </div>
                ) : (
                  availableColaboradores.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Motivo *</Label>
            <RadioGroup value={motivoKey} onValueChange={setMotivoKey} className="space-y-2">
              {MOTIVOS_PERDA.map(motivo => (
                <div key={motivo.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={motivo.value} id={motivo.value} />
                  <Label htmlFor={motivo.value} className="font-normal cursor-pointer">
                    {motivo.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>
              Observações {motivoKey === "outro" && "*"}
            </Label>
            <Textarea 
              value={observacoes} 
              onChange={(e) => setObservacoes(e.target.value)} 
              placeholder={motivoKey === "outro" ? "Descreva o motivo..." : "Detalhes adicionais (opcional)"}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button 
            onClick={() => addPerdaMutation.mutate()} 
            disabled={!isFormValid || addPerdaMutation.isPending}
          >
            {addPerdaMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Registrar Perda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
