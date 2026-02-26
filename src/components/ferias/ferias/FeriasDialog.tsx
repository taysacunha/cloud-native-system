import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertTriangle, Calendar, Check, ChevronsUpDown, Users, Info, ShieldAlert } from "lucide-react";
import { format, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const feriasSchema = z.object({
  colaborador_id: z.string().min(1, "Colaborador é obrigatório"),
  quinzena1_inicio: z.string().min(1, "Data de início é obrigatória"),
  quinzena1_fim: z.string().min(1, "Data de fim é obrigatória"),
  quinzena2_inicio: z.string().min(1, "Data de início é obrigatória"),
  quinzena2_fim: z.string().min(1, "Data de fim é obrigatória"),
  gozo_diferente: z.boolean().default(false),
  gozo_periodos: z.enum(["1", "2", "ambos"]).default("ambos"),
  gozo_quinzena1_inicio: z.string().optional(),
  gozo_quinzena1_fim: z.string().optional(),
  gozo_quinzena2_inicio: z.string().optional(),
  gozo_quinzena2_fim: z.string().optional(),
  vender_dias: z.boolean().default(false),
  dias_vendidos: z.number().min(0).max(30).optional(),
  quinzena_venda: z.number().min(1).max(2).optional(),
  dias_periodo1: z.number().min(0).optional(),
  dias_periodo2: z.number().min(0).optional(),
  is_excecao: z.boolean().default(false),
  excecao_motivo: z.string().optional(),
  excecao_justificativa: z.string().optional(),
});

type FeriasFormData = z.infer<typeof feriasSchema>;

interface FeriasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ferias?: any | null;
  anoReferencia?: number;
  onSuccess: () => void;
}

interface ConflictInfo {
  colaborador_nome: string;
  tipo: string;
  periodo: string;
}

export function FeriasDialog({ open, onOpenChange, ferias, anoReferencia, onSuccess }: FeriasDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!ferias;
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const form = useForm<FeriasFormData>({
    resolver: zodResolver(feriasSchema),
    defaultValues: {
      colaborador_id: "",
      quinzena1_inicio: "",
      quinzena1_fim: "",
      quinzena2_inicio: "",
      quinzena2_fim: "",
      gozo_diferente: false,
      gozo_periodos: "ambos",
      gozo_quinzena1_inicio: "",
      gozo_quinzena1_fim: "",
      gozo_quinzena2_inicio: "",
      gozo_quinzena2_fim: "",
      vender_dias: false,
      dias_vendidos: 0,
      quinzena_venda: 1,
      dias_periodo1: 15,
      dias_periodo2: 15,
      is_excecao: false,
      excecao_motivo: "",
      excecao_justificativa: "",
    },
  });

  // Fetch colaboradores
  const { data: colaboradores = [] } = useQuery({
    queryKey: ["ferias-colaboradores-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_colaboradores")
        .select("id, nome, setor_titular_id, data_admissao, familiar_id")
        .eq("status", "ativo")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch collaborators that already have vacations in the selected year
  const { data: colaboradoresComFerias = [] } = useQuery({
    queryKey: ["ferias-colaboradores-com-ferias", anoReferencia],
    queryFn: async () => {
      if (!anoReferencia) return [];
      const { data, error } = await supabase
        .from("ferias_ferias")
        .select("colaborador_id")
        .gte("quinzena1_inicio", `${anoReferencia}-01-01`)
        .lte("quinzena1_inicio", `${anoReferencia}-12-31`)
        .in("status", ["aprovada", "em_gozo", "pendente"]);
      if (error) throw error;
      return (data || []).map(f => f.colaborador_id).filter(Boolean) as string[];
    },
    enabled: open,
  });

  // Fetch collaborators that already have a form for the selected year
  const { data: colaboradoresComFormulario = [] } = useQuery({
    queryKey: ["ferias-colaboradores-com-formulario-dialog", anoReferencia],
    queryFn: async () => {
      if (!anoReferencia) return [];
      const { data, error } = await supabase
        .from("ferias_formulario_anual")
        .select("colaborador_id")
        .eq("ano_referencia", anoReferencia);
      if (error) throw error;
      return (data || []).map(f => f.colaborador_id).filter(Boolean) as string[];
    },
    enabled: open,
  });

  const colaboradoresDisponiveis = colaboradores.filter(c => {
    if (isEditing && ferias?.colaborador_id === c.id) return true;
    return !colaboradoresComFerias.includes(c.id) && !colaboradoresComFormulario.includes(c.id);
  });

  const selectedColabId = form.watch("colaborador_id");
  const selectedColab = colaboradores.find(c => c.id === selectedColabId);
  const familiarId = selectedColab?.familiar_id;
  const familiarNome = familiarId ? colaboradores.find(c => c.id === familiarId)?.nome : null;

  const { data: feriasFamiliar } = useQuery({
    queryKey: ["ferias-familiar", familiarId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_ferias")
        .select("quinzena1_inicio, quinzena1_fim, quinzena2_inicio, quinzena2_fim, gozo_diferente, gozo_quinzena1_inicio, gozo_quinzena1_fim, gozo_quinzena2_inicio, gozo_quinzena2_fim, status")
        .eq("colaborador_id", familiarId!)
        .in("status", ["aprovada", "em_gozo", "pendente"]);
      if (error) throw error;
      return data;
    },
    enabled: !!familiarId,
  });

  // ===== Watch declarations =====
  const q1Inicio = form.watch("quinzena1_inicio");
  const q2Inicio = form.watch("quinzena2_inicio");
  const q1Fim = form.watch("quinzena1_fim");
  const q2Fim = form.watch("quinzena2_fim");
  const gozoDiferente = form.watch("gozo_diferente");
  const venderDias = form.watch("vender_dias");
  const isExcecao = form.watch("is_excecao");
  const diasVendidos = form.watch("dias_vendidos") || 0;
  const quinzenaVenda = form.watch("quinzena_venda") || 1;
  const diasPeriodo1 = form.watch("dias_periodo1") || 0;
  const diasPeriodo2 = form.watch("dias_periodo2") || 0;
  const gozoQ1Inicio = form.watch("gozo_quinzena1_inicio");
  const gozoQ2Inicio = form.watch("gozo_quinzena2_inicio");
  const gozoPeriodos = form.watch("gozo_periodos");

  // Max days for sale based on type
  const maxDiasVenda = isExcecao ? 30 : 10;

  // Compute remaining days per period
  const restantesP1 = venderDias && diasVendidos >= 1 && diasVendidos <= 29 ? 15 - diasPeriodo1 : 15;
  const restantesP2 = venderDias && diasVendidos >= 1 && diasVendidos <= 29 ? 15 - diasPeriodo2 : 15;

  // ===== Auto-calculate end dates when start dates or distribution changes =====
  useEffect(() => {
    if (q1Inicio) {
      try {
        const restantes = venderDias && diasVendidos >= 1 && diasVendidos <= 29 ? 15 - diasPeriodo1 : 15;
        if (restantes > 0) {
          const endDate = addDays(parseISO(q1Inicio), restantes - 1);
          form.setValue("quinzena1_fim", format(endDate, "yyyy-MM-dd"));
        }
      } catch { /* ignore */ }
    }
  }, [q1Inicio, venderDias, diasVendidos, diasPeriodo1]);

  useEffect(() => {
    if (q2Inicio) {
      try {
        const restantes = venderDias && diasVendidos >= 1 && diasVendidos <= 29 ? 15 - diasPeriodo2 : 15;
        if (restantes > 0) {
          const endDate = addDays(parseISO(q2Inicio), restantes - 1);
          form.setValue("quinzena2_fim", format(endDate, "yyyy-MM-dd"));
        }
      } catch { /* ignore */ }
    }
  }, [q2Inicio, venderDias, diasVendidos, diasPeriodo2]);

  // ===== Auto-calculate gozo end dates =====
  useEffect(() => {
    if (gozoQ1Inicio) {
      try {
        let diasGozo = 14;
        if (venderDias && diasVendidos >= 1 && diasVendidos <= 29) {
          const vendidosP1 = form.getValues("dias_periodo1") || 0;
          if (gozoPeriodos === "ambos") {
            diasGozo = (30 - diasVendidos) - 1;
          } else {
            diasGozo = (15 - vendidosP1) - 1;
          }
        }
        const endDate = addDays(parseISO(gozoQ1Inicio), Math.max(0, diasGozo));
        form.setValue("gozo_quinzena1_fim", format(endDate, "yyyy-MM-dd"));
      } catch { /* ignore */ }
    }
  }, [gozoQ1Inicio, venderDias, diasVendidos, gozoPeriodos, diasPeriodo1]);

  useEffect(() => {
    if (gozoQ2Inicio) {
      try {
        let diasGozo = 14;
        if (venderDias && diasVendidos >= 1 && diasVendidos <= 29) {
          const vendidosP2 = form.getValues("dias_periodo2") || 0;
          diasGozo = (15 - vendidosP2) - 1;
        }
        const endDate = addDays(parseISO(gozoQ2Inicio), Math.max(0, diasGozo));
        form.setValue("gozo_quinzena2_fim", format(endDate, "yyyy-MM-dd"));
      } catch { /* ignore */ }
    }
  }, [gozoQ2Inicio, venderDias, diasVendidos, diasPeriodo2]);

  // ===== Auto-set excecao when > 10 days sold =====
  useEffect(() => {
    if (venderDias && diasVendidos > 10) {
      form.setValue("is_excecao", true);
      form.setValue("excecao_motivo", "venda_acima_limite");
    }
  }, [venderDias, diasVendidos]);

  // ===== Auto-set default distribution when dias_vendidos changes =====
  useEffect(() => {
    if (venderDias && diasVendidos >= 1 && diasVendidos <= 29) {
      const currentP1 = form.getValues("dias_periodo1") || 0;
      const currentP2 = form.getValues("dias_periodo2") || 0;
      if (currentP1 + currentP2 !== diasVendidos) {
        const qv = form.getValues("quinzena_venda") || 1;
        if (qv === 1) {
          const vendidosP1 = Math.min(diasVendidos, 15);
          form.setValue("dias_periodo1", vendidosP1);
          form.setValue("dias_periodo2", Math.min(diasVendidos - vendidosP1, 15));
        } else {
          const vendidosP2 = Math.min(diasVendidos, 15);
          form.setValue("dias_periodo2", vendidosP2);
          form.setValue("dias_periodo1", Math.min(diasVendidos - vendidosP2, 15));
        }
      }
    }
  }, [diasVendidos, venderDias]);

  // ===== Reset gozo diferente fields when switching to Padrão =====
  useEffect(() => {
    if (!isExcecao) {
      form.setValue("gozo_diferente", false);
      form.setValue("gozo_quinzena1_inicio", "");
      form.setValue("gozo_quinzena1_fim", "");
      form.setValue("gozo_quinzena2_inicio", "");
      form.setValue("gozo_quinzena2_fim", "");
      // Limit dias_vendidos to 10 for Padrão
      if (venderDias && diasVendidos > 10) {
        form.setValue("dias_vendidos", 10);
      }
    }
  }, [isExcecao]);

  // Reset form when ferias changes
  useEffect(() => {
    if (ferias) {
      const diasVend = ferias.dias_vendidos || 0;
      form.reset({
        colaborador_id: ferias.colaborador_id || "",
        quinzena1_inicio: ferias.quinzena1_inicio || "",
        quinzena1_fim: ferias.quinzena1_fim || "",
        quinzena2_inicio: ferias.quinzena2_inicio || "",
        quinzena2_fim: ferias.quinzena2_fim || "",
        gozo_diferente: ferias.gozo_diferente || false,
        gozo_periodos: ferias.gozo_quinzena1_inicio && ferias.gozo_quinzena2_inicio ? "ambos" : ferias.gozo_quinzena1_inicio ? "1" : ferias.gozo_quinzena2_inicio ? "2" : "ambos",
        gozo_quinzena1_inicio: ferias.gozo_quinzena1_inicio || "",
        gozo_quinzena1_fim: ferias.gozo_quinzena1_fim || "",
        gozo_quinzena2_inicio: ferias.gozo_quinzena2_inicio || "",
        gozo_quinzena2_fim: ferias.gozo_quinzena2_fim || "",
        vender_dias: ferias.vender_dias || false,
        dias_vendidos: diasVend,
        quinzena_venda: ferias.quinzena_venda || 1,
        dias_periodo1: ferias.dias_periodo1 ?? Math.min(diasVend, 15),
        dias_periodo2: ferias.dias_periodo2 ?? Math.max(0, diasVend - Math.min(diasVend, 15)),
        is_excecao: ferias.is_excecao || false,
        excecao_motivo: ferias.excecao_motivo || "",
        excecao_justificativa: ferias.excecao_justificativa || "",
      });
    } else {
      form.reset({
        colaborador_id: "",
        quinzena1_inicio: "",
        quinzena1_fim: "",
        quinzena2_inicio: "",
        quinzena2_fim: "",
        gozo_diferente: false,
        gozo_periodos: "ambos",
        gozo_quinzena1_inicio: "",
        gozo_quinzena1_fim: "",
        gozo_quinzena2_inicio: "",
        gozo_quinzena2_fim: "",
        vender_dias: false,
        dias_vendidos: 0,
        quinzena_venda: 1,
        dias_periodo1: 15,
        dias_periodo2: 15,
        is_excecao: false,
        excecao_motivo: "",
        excecao_justificativa: "",
      });
    }
    setConflicts([]);
  }, [ferias, open]);

  // Check conflicts (including substitute sectors)
  const checkConflicts = async (data: FeriasFormData) => {
    if (!data.colaborador_id) return;
    setCheckingConflicts(true);
    const foundConflicts: ConflictInfo[] = [];
    try {
      const selectedColab = colaboradores.find((c) => c.id === data.colaborador_id);
      if (!selectedColab) return;

      // Get substitute sectors for this collaborator
      const { data: substituteSectors } = await supabase
        .from("ferias_colaborador_setores_substitutos")
        .select("setor_id")
        .eq("colaborador_id", data.colaborador_id);
      
      const allSectorIds = [selectedColab.setor_titular_id];
      if (substituteSectors) {
        substituteSectors.forEach(s => { if (s.setor_id) allSectorIds.push(s.setor_id); });
      }

      // Fetch collaborators from all relevant sectors
      const { data: sameSetorColabs } = await supabase
        .from("ferias_colaboradores")
        .select("id, nome, setor_titular_id")
        .in("setor_titular_id", allSectorIds)
        .eq("status", "ativo")
        .neq("id", data.colaborador_id);

      if (sameSetorColabs && sameSetorColabs.length > 0) {
        const colabIds = sameSetorColabs.map((c) => c.id);
        const { data: existingFerias } = await supabase
          .from("ferias_ferias")
          .select("*, colaborador:ferias_colaboradores!colaborador_id(nome, setor_titular_id)")
          .in("colaborador_id", colabIds)
          .in("status", ["pendente", "aprovada", "em_gozo"]);

        if (existingFerias) {
          const q1Start = parseISO(data.gozo_diferente && data.gozo_quinzena1_inicio ? data.gozo_quinzena1_inicio : data.quinzena1_inicio);
          const q1End = parseISO(data.gozo_diferente && data.gozo_quinzena1_fim ? data.gozo_quinzena1_fim : data.quinzena1_fim);
          const q2Start = parseISO(data.gozo_diferente && data.gozo_quinzena2_inicio ? data.gozo_quinzena2_inicio : data.quinzena2_inicio);
          const q2End = parseISO(data.gozo_diferente && data.gozo_quinzena2_fim ? data.gozo_quinzena2_fim : data.quinzena2_fim);

          for (const ef of existingFerias) {
            if (ferias && ef.id === ferias.id) continue;
            const efQ1Start = parseISO(ef.gozo_diferente && ef.gozo_quinzena1_inicio ? ef.gozo_quinzena1_inicio : ef.quinzena1_inicio);
            const efQ1End = parseISO(ef.gozo_diferente && ef.gozo_quinzena1_fim ? ef.gozo_quinzena1_fim : ef.quinzena1_fim);
            const efQ2Start = parseISO(ef.gozo_diferente && ef.gozo_quinzena2_inicio ? ef.gozo_quinzena2_inicio : ef.quinzena2_inicio);
            const efQ2End = parseISO(ef.gozo_diferente && ef.gozo_quinzena2_fim ? ef.gozo_quinzena2_fim : ef.quinzena2_fim);

            const q1Overlap = (q1Start <= efQ1End && q1End >= efQ1Start) || (q1Start <= efQ2End && q1End >= efQ2Start);
            const q2Overlap = (q2Start <= efQ1End && q2End >= efQ1Start) || (q2Start <= efQ2End && q2End >= efQ2Start);

            if (q1Overlap || q2Overlap) {
              const isSubstitute = (ef.colaborador as any)?.setor_titular_id !== selectedColab.setor_titular_id;
              foundConflicts.push({
                colaborador_nome: (ef.colaborador as any)?.nome || "Desconhecido",
                tipo: isSubstitute ? "Setor substituto" : "Mesmo setor",
                periodo: `${format(efQ1Start, "dd/MM")} - ${format(efQ1End, "dd/MM")} / ${format(efQ2Start, "dd/MM")} - ${format(efQ2End, "dd/MM")}`,
              });
            }
          }
        }
      }

      const { data: familyConflicts } = await supabase
        .from("ferias_conflitos")
        .select("*, colaborador1:colaborador1_id(id, nome), colaborador2:colaborador2_id(id, nome)")
        .or(`colaborador1_id.eq.${data.colaborador_id},colaborador2_id.eq.${data.colaborador_id}`);

      if (familyConflicts && familyConflicts.length > 0) {
        for (const fc of familyConflicts) {
          const relatedId = fc.colaborador1_id === data.colaborador_id ? fc.colaborador2_id : fc.colaborador1_id;
          const relatedName = fc.colaborador1_id === data.colaborador_id ? (fc.colaborador2 as any)?.nome : (fc.colaborador1 as any)?.nome;

          const { data: relatedFerias } = await supabase
            .from("ferias_ferias")
            .select("*")
            .eq("colaborador_id", relatedId)
            .in("status", ["pendente", "aprovada", "em_gozo"]);

          if (relatedFerias) {
            const q1Start = parseISO(data.gozo_diferente && data.gozo_quinzena1_inicio ? data.gozo_quinzena1_inicio : data.quinzena1_inicio);
            const q1End = parseISO(data.gozo_diferente && data.gozo_quinzena1_fim ? data.gozo_quinzena1_fim : data.quinzena1_fim);

            for (const rf of relatedFerias) {
              if (ferias && rf.id === ferias.id) continue;
              const rfQ1Start = parseISO(rf.gozo_diferente && rf.gozo_quinzena1_inicio ? rf.gozo_quinzena1_inicio : rf.quinzena1_inicio);
              const rfQ1End = parseISO(rf.gozo_diferente && rf.gozo_quinzena1_fim ? rf.gozo_quinzena1_fim : rf.quinzena1_fim);
              const overlap = (q1Start <= rfQ1End && q1End >= rfQ1Start);
              if (!overlap) {
                foundConflicts.push({
                  colaborador_nome: relatedName || "Familiar",
                  tipo: "Familiar sem coincidência",
                  periodo: `${format(rfQ1Start, "dd/MM")} - ${format(rfQ1End, "dd/MM")}`,
                });
              }
            }
          }
        }
      }

      setConflicts(foundConflicts);
    } catch (error) {
      console.error("Error checking conflicts:", error);
    } finally {
      setCheckingConflicts(false);
    }
  };

  const watchedFields = form.watch(["colaborador_id", "quinzena1_inicio", "quinzena1_fim", "quinzena2_inicio", "quinzena2_fim", "gozo_diferente", "gozo_quinzena1_inicio", "gozo_quinzena1_fim"]);
  
  useEffect(() => {
    const values = form.getValues();
    if (values.colaborador_id && values.quinzena1_inicio && values.quinzena1_fim) {
      const debounce = setTimeout(() => checkConflicts(values), 500);
      return () => clearTimeout(debounce);
    }
  }, [watchedFields]);

  const periodoAquisitivo = (() => {
    if (!selectedColab?.data_admissao || !q1Inicio) return null;
    try {
      const admissao = parseISO(selectedColab.data_admissao);
      const feriasYear = parseISO(q1Inicio).getFullYear();
      const admDay = admissao.getDate();
      const admMonth = admissao.getMonth();
      let startYear = feriasYear;
      const cycleStart = new Date(startYear, admMonth, admDay);
      if (cycleStart > parseISO(q1Inicio)) startYear--;
      const inicio = format(new Date(startYear, admMonth, admDay), "yyyy-MM-dd");
      const fimDate = new Date(startYear + 1, admMonth, admDay);
      fimDate.setDate(fimDate.getDate() - 1);
      const fim = format(fimDate, "yyyy-MM-dd");
      return { inicio, fim };
    } catch { return null; }
  })();

  const formatDateBR = (dateStr: string) => {
    try { return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR }); } catch { return dateStr; }
  };

  // Save mutation
  const mutation = useMutation({
    mutationFn: async (data: FeriasFormData) => {
      const dv = data.dias_vendidos || 0;

      let gozoQ1Inicio = null;
      let gozoQ1Fim = null;
      let gozoQ2Inicio = null;
      let gozoQ2Fim = null;

      if (data.gozo_diferente) {
        const hasSale = data.vender_dias && dv >= 1 && dv <= 15;
        const isSingleBlock = hasSale && data.gozo_periodos === "ambos";

        if (isSingleBlock) {
          gozoQ1Inicio = data.gozo_quinzena1_inicio || null;
          gozoQ1Fim = data.gozo_quinzena1_fim || null;
        } else {
          if (data.gozo_periodos === "1" || data.gozo_periodos === "ambos") {
            gozoQ1Inicio = data.gozo_quinzena1_inicio || null;
            gozoQ1Fim = data.gozo_quinzena1_fim || null;
          }
          if (data.gozo_periodos === "2" || data.gozo_periodos === "ambos") {
            gozoQ2Inicio = data.gozo_quinzena2_inicio || null;
            gozoQ2Fim = data.gozo_quinzena2_fim || null;
          }
        }
      }

      const payload = {
        colaborador_id: data.colaborador_id,
        quinzena1_inicio: data.quinzena1_inicio,
        quinzena1_fim: data.quinzena1_fim,
        quinzena2_inicio: data.quinzena2_inicio,
        quinzena2_fim: data.quinzena2_fim,
        gozo_diferente: data.gozo_diferente,
        gozo_quinzena1_inicio: gozoQ1Inicio,
        gozo_quinzena1_fim: gozoQ1Fim,
        gozo_quinzena2_inicio: gozoQ2Inicio,
        gozo_quinzena2_fim: gozoQ2Fim,
        vender_dias: data.vender_dias,
        dias_vendidos: data.vender_dias ? data.dias_vendidos : null,
        quinzena_venda: data.vender_dias ? data.quinzena_venda : null,
        status: isEditing ? ferias.status : "aprovada",
        is_excecao: data.is_excecao,
        excecao_motivo: data.is_excecao ? data.excecao_motivo : null,
        excecao_justificativa: data.is_excecao ? data.excecao_justificativa : null,
        periodo_aquisitivo_inicio: periodoAquisitivo?.inicio || null,
        periodo_aquisitivo_fim: periodoAquisitivo?.fim || null,
      };

      if (isEditing) {
        const { error } = await supabase.from("ferias_ferias").update(payload).eq("id", ferias.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ferias_ferias").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Férias atualizada com sucesso!" : "Férias cadastrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["ferias-colaboradores-com-ferias"] });
      onSuccess();
    },
    onError: (error) => {
      console.error("Error saving férias:", error);
      toast.error("Erro ao salvar férias");
    },
  });

  const validateVacation = (data: FeriasFormData) => {
    const errors: string[] = [];
    let requiresException = false;
    let exceptionReason = "";

    const q1Start = data.gozo_diferente && data.gozo_quinzena1_inicio ? parseISO(data.gozo_quinzena1_inicio) : parseISO(data.quinzena1_inicio);
    const q2Start = data.gozo_diferente && data.gozo_quinzena2_inicio ? parseISO(data.gozo_quinzena2_inicio) : parseISO(data.quinzena2_inicio);
    const q1Month = q1Start.getMonth() + 1;
    const q2Month = q2Start.getMonth() + 1;

    if (q1Month === 1 || q1Month === 12 || q2Month === 1 || q2Month === 12) {
      requiresException = true;
      exceptionReason = "mes_bloqueado";
      errors.push("Férias em janeiro ou dezembro requerem exceção");
    }
    if (data.vender_dias && data.dias_vendidos && data.dias_vendidos > 10) {
      requiresException = true;
      exceptionReason = "venda_acima_limite";
      errors.push("Venda acima de 10 dias requer exceção");
    }
    if (conflicts.length > 0 && !data.is_excecao) {
      requiresException = true;
      exceptionReason = "conflito_setor";
    }
    return { isValid: errors.length === 0 || data.is_excecao, errors, requiresException, exceptionReason };
  };

  const onSubmit = (data: FeriasFormData) => {
    const validation = validateVacation(data);
    if (validation.requiresException && !data.is_excecao) {
      toast.error(validation.errors[0] || "Esta operação requer marcar como exceção");
      return;
    }
    if (data.is_excecao && (!data.excecao_motivo || !data.excecao_justificativa)) {
      toast.error("Preencha o motivo e justificativa da exceção");
      return;
    }
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isEditing ? "Editar Férias" : "Nova Férias"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* ===== SEÇÃO 1: Tipo de Cadastro (Padrão / Exceção) ===== */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Tipo de cadastro</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={!isExcecao ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    form.setValue("is_excecao", false);
                    form.setValue("excecao_motivo", "");
                    form.setValue("excecao_justificativa", "");
                  }}
                >
                  Padrão
                </Button>
                <Button
                  type="button"
                  variant={isExcecao ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => form.setValue("is_excecao", true)}
                >
                  <ShieldAlert className="h-4 w-4 mr-1" />
                  Exceção
                </Button>
              </div>

              {isExcecao && (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="pt-4 space-y-3">
                    <FormField control={form.control} name="excecao_motivo" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo da exceção *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="mes_bloqueado">Férias em janeiro/dezembro</SelectItem>
                            <SelectItem value="venda_acima_limite">Venda acima de 10 dias</SelectItem>
                            <SelectItem value="conflito_setor">Conflito de setor</SelectItem>
                            <SelectItem value="conflito_equipe">Conflito de equipe</SelectItem>
                            <SelectItem value="ajuste_setor">Ajuste de setor</SelectItem>
                            <SelectItem value="periodo_aquisitivo">Período aquisitivo irregular</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="excecao_justificativa" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Justificativa *</FormLabel>
                        <FormControl><Textarea placeholder="Descreva a justificativa para a exceção..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
              )}
            </div>

            <Separator />

            {/* ===== SEÇÃO 2: Colaborador e Períodos Oficiais ===== */}
            <div className="space-y-4">
              {/* Combobox Colaborador */}
              <FormField
                control={form.control}
                name="colaborador_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Colaborador *</FormLabel>
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={comboboxOpen}
                            className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                            disabled={isEditing}
                          >
                            {field.value ? colaboradores.find(c => c.id === field.value)?.nome || "Selecione..." : "Buscar colaborador..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar por nome..." />
                          <CommandList>
                            <CommandEmpty>Nenhum colaborador encontrado.</CommandEmpty>
                            {colaboradoresDisponiveis.map((c) => (
                              <CommandItem key={c.id} value={c.nome} onSelect={() => { field.onChange(c.id); setComboboxOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", field.value === c.id ? "opacity-100" : "opacity-0")} />
                                {c.nome}
                              </CommandItem>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Family member vacation info */}
              {familiarId && feriasFamiliar && feriasFamiliar.length > 0 && (
                <Alert className="border-blue-500/30 bg-blue-500/5">
                  <Users className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-600">Familiar vinculado: {familiarNome || "—"}</AlertTitle>
                  <AlertDescription className="text-sm">
                    <p className="font-medium mt-1">Férias cadastradas:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {feriasFamiliar.map((ff, i) => {
                        const q1i = ff.gozo_diferente && ff.gozo_quinzena1_inicio ? ff.gozo_quinzena1_inicio : ff.quinzena1_inicio;
                        const q1f = ff.gozo_diferente && ff.gozo_quinzena1_fim ? ff.gozo_quinzena1_fim : ff.quinzena1_fim;
                        const q2i = ff.gozo_diferente && ff.gozo_quinzena2_inicio ? ff.gozo_quinzena2_inicio : ff.quinzena2_inicio;
                        const q2f = ff.gozo_diferente && ff.gozo_quinzena2_fim ? ff.gozo_quinzena2_fim : ff.quinzena2_fim;
                        return (
                          <li key={i}>1º: {formatDateBR(q1i)} a {formatDateBR(q1f)} | 2º: {formatDateBR(q2i)} a {formatDateBR(q2f)}</li>
                        );
                      })}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {familiarId && (!feriasFamiliar || feriasFamiliar.length === 0) && (
                <Alert className="border-muted">
                  <Users className="h-4 w-4" />
                  <AlertTitle>Familiar vinculado: {familiarNome || "—"}</AlertTitle>
                  <AlertDescription className="text-sm text-muted-foreground">Nenhuma férias cadastrada para o familiar ainda.</AlertDescription>
                </Alert>
              )}

              {/* Periodo Aquisitivo (auto) */}
              {periodoAquisitivo && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      Período Aquisitivo (automático)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{formatDateBR(periodoAquisitivo.inicio)} a {formatDateBR(periodoAquisitivo.fim)}</p>
                  </CardContent>
                </Card>
              )}

              {/* 1º Período */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">1º Período {venderDias && diasVendidos >= 1 && diasVendidos <= 29 && restantesP1 > 0 ? `(${restantesP1} dias)` : "(15 dias)"}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quinzena1_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início *</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Data de Fim (automático)</FormLabel>
                    <Input type="date" value={q1Fim} readOnly className="bg-muted cursor-not-allowed" />
                    {q1Inicio && q1Fim && (
                      <p className="text-xs text-muted-foreground mt-1">{restantesP1} dias a partir de {formatDateBR(q1Inicio)}</p>
                    )}
                  </FormItem>
                </CardContent>
              </Card>

              {/* 2º Período - show when there are remaining days */}
              {restantesP2 > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">2º Período {venderDias && diasVendidos >= 1 && diasVendidos <= 29 ? `(${restantesP2} dias)` : "(15 dias)"}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quinzena2_inicio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Início *</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel>Data de Fim (automático)</FormLabel>
                      <Input type="date" value={q2Fim} readOnly className="bg-muted cursor-not-allowed" />
                      {q2Inicio && q2Fim && (
                        <p className="text-xs text-muted-foreground mt-1">{restantesP2} dias a partir de {formatDateBR(q2Inicio)}</p>
                      )}
                    </FormItem>
                  </CardContent>
                </Card>
              )}
            </div>

            <Separator />

            {/* ===== SEÇÃO 3: Venda de Dias (inline expandível) ===== */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="vender_dias"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none"><FormLabel className="text-base font-medium">Vender dias de férias</FormLabel></div>
                  </FormItem>
                )}
              />

              {venderDias && (
                <div className="space-y-4 pl-7">
                  {/* Referência dos períodos cadastrados */}
                  {q1Inicio && q1Fim && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md space-y-0.5">
                      <p>📋 Períodos cadastrados:</p>
                      <p>1º: {formatDateBR(q1Inicio)} a {formatDateBR(q1Fim)} (15 dias)</p>
                      {restantesP2 > 0 && q2Inicio && q2Fim && (
                        <p>2º: {formatDateBR(q2Inicio)} a {formatDateBR(q2Fim)} (15 dias)</p>
                      )}
                    </div>
                  )}

                  {/* Days input */}
                  <FormField control={form.control} name="dias_vendidos" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de dias a vender {!isExcecao && "(máx. 10)"}</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={maxDiasVenda} {...field}
                          onChange={(e) => field.onChange(Math.min(maxDiasVenda, Math.max(0, parseInt(e.target.value) || 0)))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Distribution for 1-29 days */}
                  {diasVendidos >= 1 && diasVendidos <= 29 && (
                    <Card className="border-muted">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Distribuição da venda ({diasVendidos} dias)</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="dias_periodo1" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vendidos do 1º Período</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} max={Math.min(diasVendidos, 15)} {...field}
                                  value={field.value ?? 0}
                                  onChange={(e) => {
                                    const v = Math.min(Math.min(diasVendidos, 15), Math.max(0, parseInt(e.target.value) || 0));
                                    field.onChange(v);
                                    form.setValue("dias_periodo2", Math.min(diasVendidos - v, 15));
                                    form.trigger(["dias_periodo1", "dias_periodo2"]);
                                  }}
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">Restam {15 - (field.value ?? 0)} dias</p>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="dias_periodo2" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vendidos do 2º Período</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} max={Math.min(diasVendidos, 15)} {...field}
                                  value={field.value ?? 0}
                                  onChange={(e) => {
                                    const v = Math.min(Math.min(diasVendidos, 15), Math.max(0, parseInt(e.target.value) || 0));
                                    field.onChange(v);
                                    form.setValue("dias_periodo1", Math.min(diasVendidos - v, 15));
                                    form.trigger(["dias_periodo1", "dias_periodo2"]);
                                  }}
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">Restam {15 - (field.value ?? 0)} dias</p>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        {(diasPeriodo1 + diasPeriodo2) !== diasVendidos && (
                          <p className="text-xs text-destructive">A soma deve ser igual a {diasVendidos} ({diasPeriodo1} + {diasPeriodo2} = {diasPeriodo1 + diasPeriodo2})</p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Inline gozo date cards per period */}
                  {diasVendidos >= 1 && diasVendidos <= 29 && (diasPeriodo1 + diasPeriodo2) === diasVendidos && (
                    <div className="space-y-3">
                      {restantesP1 > 0 && (
                        <Card className="border-primary/20 bg-primary/5">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-primary">1º Período — Gozo de {restantesP1} dias</CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Início</p>
                              <Input type="date" value={q1Inicio} readOnly className="bg-muted cursor-not-allowed text-sm" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Fim (automático)</p>
                              <Input type="date" value={q1Fim} readOnly className="bg-muted cursor-not-allowed text-sm" />
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {restantesP2 > 0 && (
                        <Card className="border-primary/20 bg-primary/5">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-primary">2º Período — Gozo de {restantesP2} dias</CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Início</p>
                              <Input type="date" value={q2Inicio} readOnly className="bg-muted cursor-not-allowed text-sm" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Fim (automático)</p>
                              <Input type="date" value={q2Fim} readOnly className="bg-muted cursor-not-allowed text-sm" />
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* 30 days - full sale */}
                  {diasVendidos === 30 && (
                    <Alert variant="destructive" className="border-destructive/30">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Venda integral — sem período de gozo</AlertTitle>
                      <AlertDescription className="text-sm">
                        Todos os 30 dias serão vendidos. Exige justificativa obrigatória.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Visual summary */}
                  <Card className="border-muted bg-muted/30">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Dias totais de férias:</span>
                        <span className="font-semibold">30 dias</span>
                      </div>
                      <div className="flex justify-between text-sm text-destructive">
                        <span>Dias vendidos:</span>
                        <span className="font-semibold">-{diasVendidos} dias</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between text-sm font-bold">
                        <span>Dias restantes:</span>
                        <span>{30 - diasVendidos} dias</span>
                      </div>
                      {diasVendidos >= 1 && diasVendidos <= 29 && (
                        <div className="border-t pt-2 text-xs text-muted-foreground space-y-0.5">
                          <p>1º: {diasPeriodo1} vendidos → {restantesP1} dias {q1Inicio && q1Fim ? `(${formatDateBR(q1Inicio)} a ${formatDateBR(q1Fim)})` : ""}</p>
                          {restantesP2 > 0 && (
                            <p>2º: {diasPeriodo2} vendidos → {restantesP2} dias {q2Inicio && q2Fim ? `(${formatDateBR(q2Inicio)} a ${formatDateBR(q2Fim)})` : ""}</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {diasVendidos > 10 && (
                    <Alert variant="destructive" className="border-destructive/30">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Atenção</AlertTitle>
                      <AlertDescription className="text-sm">
                        Venda acima de 10 dias será registrada como exceção. A tabela do contador exibirá no máximo 10 dias vendidos.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* ===== SEÇÃO 4: Gozo em Datas Diferentes (only for Exceção) ===== */}
            {isExcecao && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="gozo_diferente"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <div className="space-y-1 leading-none"><FormLabel className="text-base font-medium">Gozo Realizado em Datas Diferentes</FormLabel></div>
                    </FormItem>
                  )}
                />

                {gozoDiferente && (
                  <div className="space-y-4 pl-7">
                    {/* Referência dos períodos oficiais */}
                    {q1Inicio && q1Fim && (
                      <Alert className="border-muted bg-muted/30">
                        <Info className="h-4 w-4" />
                        <AlertTitle className="text-sm">Períodos oficiais cadastrados</AlertTitle>
                        <AlertDescription className="text-xs">
                          1º: {formatDateBR(q1Inicio)} a {formatDateBR(q1Fim)}
                          {q2Inicio && q2Fim && ` | 2º: ${formatDateBR(q2Inicio)} a ${formatDateBR(q2Fim)}`}
                        </AlertDescription>
                      </Alert>
                    )}

                    <FormField
                      control={form.control}
                      name="gozo_periodos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qual período tem gozo diferente?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="1">1º Período</SelectItem>
                              <SelectItem value="2">2º Período</SelectItem>
                              <SelectItem value="ambos">Ambos</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {(gozoPeriodos === "1" || gozoPeriodos === "ambos") && (
                      <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm">1º Período (Gozo Realizado)</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="gozo_quinzena1_inicio" render={({ field }) => (
                            <FormItem><FormLabel>Data de Início</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormItem>
                            <FormLabel>Data de Fim (automático)</FormLabel>
                            <Input type="date" value={form.watch("gozo_quinzena1_fim") || ""} readOnly className="bg-muted cursor-not-allowed" />
                          </FormItem>
                        </CardContent>
                      </Card>
                    )}

                    {(gozoPeriodos === "2" || gozoPeriodos === "ambos") && (
                      <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm">2º Período (Gozo Realizado)</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="gozo_quinzena2_inicio" render={({ field }) => (
                            <FormItem><FormLabel>Data de Início</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormItem>
                            <FormLabel>Data de Fim (automático)</FormLabel>
                            <Input type="date" value={form.watch("gozo_quinzena2_fim") || ""} readOnly className="bg-muted cursor-not-allowed" />
                          </FormItem>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ===== SEÇÃO 5: Conflitos (automático) ===== */}
            {conflicts.length > 0 && (
              <>
                <Separator />
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Conflitos Detectados</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {conflicts.map((c, i) => (
                        <li key={i}><strong>{c.colaborador_nome}</strong> ({c.tipo}): {c.periodo}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-sm">Marque como "Exceção" no topo se deseja prosseguir.</p>
                  </AlertDescription>
                </Alert>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
