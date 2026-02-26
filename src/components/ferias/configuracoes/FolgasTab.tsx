import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Calendar } from "lucide-react";

interface ConfigValue {
  id?: string;
  chave: string;
  valor: string;
  descricao: string;
}

const EMPTY_ARRAY: ConfigValue[] = [];

const FOLGAS_CONFIGS: ConfigValue[] = [
  { chave: "FOLGAS_POR_MES", valor: "1", descricao: "Quantidade de sábados de folga por colaborador por mês" },
  { chave: "FOLGAS_PERIODO_EXPERIENCIA", valor: "45", descricao: "Dias mínimos de admissão para ter direito a folga" },
  { chave: "FOLGAS_PRIORIZAR_FAMILIARES", valor: "true", descricao: "Priorizar que familiares folguem no mesmo sábado" },
  { chave: "FOLGAS_BLOQUEAR_LIDERES_MESMA_UNIDADE", valor: "true", descricao: "Líderes da mesma unidade não podem folgar no mesmo dia" },
  { chave: "FOLGAS_BLOQUEAR_MES_FERIAS", valor: "true", descricao: "Não tem folga em mês que tem férias marcada" },
  { chave: "FOLGAS_FERIAS_DOIS_MESES", valor: "true", descricao: "Se férias pegam dois meses, folga no mês com menos dias de férias" },
  { chave: "FOLGAS_DISTRIBUICAO_JUSTA", valor: "true", descricao: "Garantir que todos colaboradores elegíveis folguem antes de repetir" },
];

export function FolgasTab() {
  const queryClient = useQueryClient();
  const [localConfigs, setLocalConfigs] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: configs, isLoading } = useQuery({
    queryKey: ["ferias-configuracoes-folgas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_configuracoes")
        .select("*")
        .in("chave", FOLGAS_CONFIGS.map(c => c.chave));

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (configs === undefined) return;
    
    const configMap: Record<string, string> = {};
    FOLGAS_CONFIGS.forEach(dc => {
      const existing = configs.find(c => c.chave === dc.chave);
      configMap[dc.chave] = existing?.valor || dc.valor;
    });
    setLocalConfigs(configMap);
    setHasChanges(false);
  }, [configs]);

  const updateConfig = (chave: string, valor: string) => {
    setLocalConfigs(prev => ({ ...prev, [chave]: valor }));
    setHasChanges(true);
  };

  const stableConfigs = configs ?? EMPTY_ARRAY;

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const dc of FOLGAS_CONFIGS) {
        const existing = stableConfigs.find(c => c.chave === dc.chave);
        const newValue = localConfigs[dc.chave];

        if (existing) {
          if (existing.valor !== newValue) {
            const { error } = await supabase
              .from("ferias_configuracoes")
              .update({ valor: newValue, updated_at: new Date().toISOString() })
              .eq("id", existing.id);
            if (error) throw error;
          }
        } else {
          const { error } = await supabase
            .from("ferias_configuracoes")
            .insert({
              chave: dc.chave,
              valor: newValue,
              descricao: dc.descricao,
            });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ferias-configuracoes-folgas"] });
      toast.success("Configurações de folgas salvas!");
      setHasChanges(false);
    },
    onError: (error) => {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Parâmetros Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Parâmetros de Folgas de Sábado
          </CardTitle>
          <CardDescription>
            Configure as regras gerais para geração de folgas de sábado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Folgas por mês</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={localConfigs["FOLGAS_POR_MES"] || "1"}
                onChange={(e) => updateConfig("FOLGAS_POR_MES", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Quantidade de sábados de folga por colaborador a cada mês
              </p>
            </div>

            <div className="space-y-2">
              <Label>Período de experiência (dias)</Label>
              <Input
                type="number"
                min={0}
                max={90}
                value={localConfigs["FOLGAS_PERIODO_EXPERIENCIA"] || "45"}
                onChange={(e) => updateConfig("FOLGAS_PERIODO_EXPERIENCIA", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Dias mínimos de admissão para ter direito a folga de sábado
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regras de Exclusão */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Regras de Exclusão</CardTitle>
          <CardDescription>
            Situações em que o colaborador não terá direito à folga
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Bloquear em mês com férias</Label>
              <p className="text-sm text-muted-foreground">
                Colaborador não tem folga de sábado em mês que está de férias
              </p>
            </div>
            <Switch
              checked={localConfigs["FOLGAS_BLOQUEAR_MES_FERIAS"] === "true"}
              onCheckedChange={(v) => updateConfig("FOLGAS_BLOQUEAR_MES_FERIAS", v ? "true" : "false")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Férias em dois meses</Label>
              <p className="text-sm text-muted-foreground">
                Se férias abrangem dois meses, a folga acontece no mês com menos dias de férias
              </p>
            </div>
            <Switch
              checked={localConfigs["FOLGAS_FERIAS_DOIS_MESES"] === "true"}
              onCheckedChange={(v) => updateConfig("FOLGAS_FERIAS_DOIS_MESES", v ? "true" : "false")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Regras de Distribuição */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Regras de Distribuição</CardTitle>
          <CardDescription>
            Configurações para distribuição justa das folgas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Distribuição justa</Label>
              <p className="text-sm text-muted-foreground">
                Garantir que todos os colaboradores elegíveis folguem antes de repetir alguém
              </p>
            </div>
            <Switch
              checked={localConfigs["FOLGAS_DISTRIBUICAO_JUSTA"] === "true"}
              onCheckedChange={(v) => updateConfig("FOLGAS_DISTRIBUICAO_JUSTA", v ? "true" : "false")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Priorizar familiares juntos</Label>
              <p className="text-sm text-muted-foreground">
                Quando possível, familiares folgarão no mesmo sábado
              </p>
            </div>
            <Switch
              checked={localConfigs["FOLGAS_PRIORIZAR_FAMILIARES"] === "true"}
              onCheckedChange={(v) => updateConfig("FOLGAS_PRIORIZAR_FAMILIARES", v ? "true" : "false")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Líderes da mesma unidade não folgar juntos</Label>
              <p className="text-sm text-muted-foreground">
                Chefes/líderes de setores da mesma unidade não podem folgar no mesmo sábado
              </p>
            </div>
            <Switch
              checked={localConfigs["FOLGAS_BLOQUEAR_LIDERES_MESMA_UNIDADE"] === "true"}
              onCheckedChange={(v) => updateConfig("FOLGAS_BLOQUEAR_LIDERES_MESMA_UNIDADE", v ? "true" : "false")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!hasChanges || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
