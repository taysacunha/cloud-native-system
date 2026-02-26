import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Save } from "lucide-react";
import { toast } from "sonner";

const weekdaysMap = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
};

interface DayConfigFormProps {
  periodId: string;
}

export function DayConfigForm({ periodId }: DayConfigFormProps) {
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: configs } = useQuery({
    queryKey: ["period-day-configs", periodId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("period_day_configs")
        .select("*")
        .eq("period_id", periodId);
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("period_day_configs")
        .upsert([data], { onConflict: "period_id,weekday" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["period-day-configs", periodId] });
      toast.success("Configuração salva!");
    },
  });

  const getConfigForDay = (weekday: string) => {
    return (
      configs?.find((c) => c.weekday === weekday) || {
        period_id: periodId,
        weekday,
        max_brokers_count: 1,
        has_morning: false,
        morning_start: "08:00",
        morning_end: "12:00",
        has_afternoon: false,
        afternoon_start: "13:00",
        afternoon_end: "18:00",
      }
    );
  };

  const [formData, setFormData] = useState<{ [key: string]: any }>({});

  const getFormData = (weekday: string) => {
    if (formData[weekday]) return formData[weekday];
    return getConfigForDay(weekday);
  };

  const updateFormData = (weekday: string, field: string, value: any) => {
    const currentData = getFormData(weekday);
    const updatedData = {
      ...currentData,
      [field]: value,
    };

    // Calcular automaticamente max_brokers_count
    if (field === "has_morning" || field === "has_afternoon") {
      const hasMorning = field === "has_morning" ? value : updatedData.has_morning;
      const hasAfternoon = field === "has_afternoon" ? value : updatedData.has_afternoon;
      updatedData.max_brokers_count = (hasMorning && hasAfternoon) ? 2 : (hasMorning || hasAfternoon) ? 1 : 0;
    }

    setFormData({
      ...formData,
      [weekday]: updatedData,
    });
  };

  const handleSave = (weekday: string) => {
    const data = getFormData(weekday);
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-2">
      {Object.entries(weekdaysMap).map(([key, label]) => {
        const isExpanded = expandedDays.includes(key);
        const data = getFormData(key);

        return (
          <Collapsible
            key={key}
            open={isExpanded}
            onOpenChange={() => {
              if (isExpanded) {
                setExpandedDays(expandedDays.filter((d) => d !== key));
              } else {
                setExpandedDays([...expandedDays, key]);
              }
            }}
          >
            <div className="border rounded-lg p-3 bg-background">
              <CollapsibleTrigger className="flex items-center gap-2 w-full hover:text-primary">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="font-medium">{label}</span>
              </CollapsibleTrigger>

              <CollapsibleContent className="pt-4 space-y-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <Label className="text-sm">Quantidade de Corretores (Automático)</Label>
                  <p className="text-2xl font-bold text-primary">{data.max_brokers_count}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.has_morning && data.has_afternoon 
                      ? "2 turnos = 2 corretores" 
                      : (data.has_morning || data.has_afternoon) 
                        ? "1 turno = 1 corretor" 
                        : "Sem turnos = 0 corretores"}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${key}-morning`}
                      checked={data.has_morning}
                      onCheckedChange={(checked) => updateFormData(key, "has_morning", !!checked)}
                    />
                    <Label htmlFor={`${key}-morning`} className="font-semibold">
                      Manhã
                    </Label>
                  </div>

                  {data.has_morning && (
                    <div className="grid grid-cols-2 gap-2 ml-6">
                      <div>
                        <Label className="text-sm">Início</Label>
                        <Input
                          type="time"
                          value={data.morning_start}
                          onChange={(e) => updateFormData(key, "morning_start", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Fim</Label>
                        <Input
                          type="time"
                          value={data.morning_end}
                          onChange={(e) => updateFormData(key, "morning_end", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${key}-afternoon`}
                      checked={data.has_afternoon}
                      onCheckedChange={(checked) => updateFormData(key, "has_afternoon", !!checked)}
                    />
                    <Label htmlFor={`${key}-afternoon`} className="font-semibold">
                      Tarde
                    </Label>
                  </div>

                  {data.has_afternoon && (
                    <div className="grid grid-cols-2 gap-2 ml-6">
                      <div>
                        <Label className="text-sm">Início</Label>
                        <Input
                          type="time"
                          value={data.afternoon_start}
                          onChange={(e) => updateFormData(key, "afternoon_start", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Fim</Label>
                        <Input
                          type="time"
                          value={data.afternoon_end}
                          onChange={(e) => updateFormData(key, "afternoon_end", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button onClick={() => handleSave(key)} size="sm" className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configuração
                </Button>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
