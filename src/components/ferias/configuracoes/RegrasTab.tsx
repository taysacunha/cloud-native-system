import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Settings, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConfigValue {
  id?: string;
  chave: string;
  valor: string;
  descricao: string;
}

// Stable empty array to prevent re-render loops
const EMPTY_ARRAY: ConfigValue[] = [];

const DEFAULT_CONFIGS: ConfigValue[] = [
  { chave: "INICIO_SEGUNDA_FEIRA", valor: "true", descricao: "Férias devem iniciar em segunda-feira" },
  { chave: "BLOQUEAR_VESPERA_FERIADO", valor: "true", descricao: "Bloquear início de férias na véspera de feriado" },
  { chave: "BLOQUEAR_SABADO", valor: "true", descricao: "Bloquear início de férias no sábado" },
  { chave: "BLOQUEAR_JANEIRO", valor: "true", descricao: "Bloquear férias em janeiro (exceto exceção)" },
  { chave: "BLOQUEAR_DEZEMBRO", valor: "true", descricao: "Bloquear férias em dezembro (exceto exceção)" },
  { chave: "CONFLITO_POR", valor: "setor", descricao: "Verificar conflito por setor ou equipe" },
  { chave: "DIAS_ALERTA_PERIODO_AQUISITIVO", valor: "60", descricao: "Dias de antecedência para alertar vencimento do período aquisitivo" },
  { chave: "MAX_COLABORADORES_FERIAS_SETOR", valor: "1", descricao: "Máximo de colaboradores de férias por setor ao mesmo tempo" },
  { chave: "PRIORIZAR_FAMILIARES", valor: "true", descricao: "Priorizar férias de familiares juntos" },
];

export function RegrasTab() {
  const queryClient = useQueryClient();
  const [localConfigs, setLocalConfigs] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: configs, isLoading } = useQuery({
    queryKey: ["ferias-configuracoes-regras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_configuracoes")
        .select("*")
        .in("chave", DEFAULT_CONFIGS.map(c => c.chave));

      if (error) throw error;
      return data;
    },
  });

  // Initialize local state from fetched configs
  useEffect(() => {
    // Only run when data is available (not undefined)
    if (configs === undefined) return;
    
    const configMap: Record<string, string> = {};
    DEFAULT_CONFIGS.forEach(dc => {
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
      for (const dc of DEFAULT_CONFIGS) {
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
      queryClient.invalidateQueries({ queryKey: ["ferias-configuracoes-regras"] });
      toast.success("Configurações salvas com sucesso!");
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
      {/* Regras de Início de Férias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Regras de Início de Férias
          </CardTitle>
          <CardDescription>
            Configure as restrições para o início do período de férias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Início em segunda-feira</Label>
              <p className="text-sm text-muted-foreground">
                Férias devem obrigatoriamente iniciar em uma segunda-feira
              </p>
            </div>
            <Switch
              checked={localConfigs["INICIO_SEGUNDA_FEIRA"] === "true"}
              onCheckedChange={(v) => updateConfig("INICIO_SEGUNDA_FEIRA", v ? "true" : "false")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Bloquear véspera de feriado</Label>
              <p className="text-sm text-muted-foreground">
                Não permitir início de férias na véspera de um feriado
              </p>
            </div>
            <Switch
              checked={localConfigs["BLOQUEAR_VESPERA_FERIADO"] === "true"}
              onCheckedChange={(v) => updateConfig("BLOQUEAR_VESPERA_FERIADO", v ? "true" : "false")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Bloquear sábado</Label>
              <p className="text-sm text-muted-foreground">
                Não permitir início de férias no sábado
              </p>
            </div>
            <Switch
              checked={localConfigs["BLOQUEAR_SABADO"] === "true"}
              onCheckedChange={(v) => updateConfig("BLOQUEAR_SABADO", v ? "true" : "false")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bloqueio de Meses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bloqueio de Meses</CardTitle>
          <CardDescription>
            Meses em que férias são bloqueadas por padrão (exceto exceção)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Bloquear Janeiro</Label>
              <p className="text-sm text-muted-foreground">
                Não permitir férias em janeiro (apenas admin pode criar exceção)
              </p>
            </div>
            <Switch
              checked={localConfigs["BLOQUEAR_JANEIRO"] === "true"}
              onCheckedChange={(v) => updateConfig("BLOQUEAR_JANEIRO", v ? "true" : "false")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Bloquear Dezembro</Label>
              <p className="text-sm text-muted-foreground">
                Não permitir férias em dezembro (apenas admin pode criar exceção)
              </p>
            </div>
            <Switch
              checked={localConfigs["BLOQUEAR_DEZEMBRO"] === "true"}
              onCheckedChange={(v) => updateConfig("BLOQUEAR_DEZEMBRO", v ? "true" : "false")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Conflitos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Regras de Conflito</CardTitle>
          <CardDescription>
            Configure como os conflitos de férias são verificados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Verificar conflito por</Label>
              <Select
                value={localConfigs["CONFLITO_POR"] || "setor"}
                onValueChange={(v) => updateConfig("CONFLITO_POR", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="setor">Setor</SelectItem>
                  <SelectItem value="equipe">Equipe</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define se a validação de conflito considera setor ou equipe
              </p>
            </div>

            <div className="space-y-2">
              <Label>Máximo de colaboradores de férias</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={localConfigs["MAX_COLABORADORES_FERIAS_SETOR"] || "1"}
                onChange={(e) => updateConfig("MAX_COLABORADORES_FERIAS_SETOR", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Quantidade máxima de colaboradores do mesmo setor/equipe de férias simultaneamente
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Priorizar familiares</Label>
              <p className="text-sm text-muted-foreground">
                Tentar agendar férias de familiares para o mesmo período
              </p>
            </div>
            <Switch
              checked={localConfigs["PRIORIZAR_FAMILIARES"] === "true"}
              onCheckedChange={(v) => updateConfig("PRIORIZAR_FAMILIARES", v ? "true" : "false")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Período Aquisitivo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Período Aquisitivo</CardTitle>
          <CardDescription>
            Configurações de alerta para vencimento do período aquisitivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Dias de antecedência para alerta</Label>
            <Input
              type="number"
              min={7}
              max={180}
              value={localConfigs["DIAS_ALERTA_PERIODO_AQUISITIVO"] || "60"}
              onChange={(e) => updateConfig("DIAS_ALERTA_PERIODO_AQUISITIVO", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Quantos dias antes do vencimento do período aquisitivo o sistema deve alertar
            </p>
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
