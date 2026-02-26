import { useState, useEffect, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp } from "lucide-react";
import { WeekdayShiftAvailability, convertFromAvailableWeekdays } from "./WeekdayShiftSelector";
import { Json } from "@/integrations/supabase/types";

interface Broker {
  id: string;
  name: string;
  creci: string;
  available_weekdays?: string[];
  weekday_shift_availability?: WeekdayShiftAvailability | Json;
}

interface BrokerAvailability {
  brokerId: string;
  availableMorning: boolean;
  availableAfternoon: boolean;
  weekday_shift_availability?: WeekdayShiftAvailability;
}

interface BrokerAvailabilityFormProps {
  brokers: Broker[];
  value: BrokerAvailability[];
  onChange: (value: BrokerAvailability[]) => void;
}

const weekdaysMap: Record<string, string> = {
  monday: "Seg",
  tuesday: "Ter",
  wednesday: "Qua",
  thursday: "Qui",
  friday: "Sex",
  saturday: "Sáb",
  sunday: "Dom",
};

export function BrokerAvailabilityForm({ brokers, value, onChange }: BrokerAvailabilityFormProps) {
  const [selectedBrokers, setSelectedBrokers] = useState<BrokerAvailability[]>(value);
  const [expandedBroker, setExpandedBroker] = useState<string | null>(null);

  // Mapear disponibilidade de cada corretor (deve vir antes do useEffect)
  const brokerAvailabilityMap = useMemo(() => {
    const map = new Map<string, WeekdayShiftAvailability>();
    brokers.forEach(broker => {
      // Cast Json para WeekdayShiftAvailability
      const rawAvailability = broker.weekday_shift_availability as WeekdayShiftAvailability | null;
      const availability = rawAvailability || 
        convertFromAvailableWeekdays(broker.available_weekdays || []);
      map.set(broker.id, availability);
    });
    return map;
  }, [brokers]);

  // Validar e filtrar turnos que o corretor não tem mais disponibilidade
  useEffect(() => {
    if (brokerAvailabilityMap.size === 0) {
      setSelectedBrokers(value);
      return;
    }

    const validated = value.map(sb => {
      const brokerAvailability = brokerAvailabilityMap.get(sb.brokerId);
      if (!brokerAvailability || !sb.weekday_shift_availability) return sb;
      
      const validatedShifts: WeekdayShiftAvailability = {};
      Object.entries(sb.weekday_shift_availability).forEach(([day, shifts]) => {
        const allowedShifts = brokerAvailability[day] || [];
        // Manter apenas turnos que o corretor realmente tem disponível
        validatedShifts[day] = (shifts || []).filter(s => allowedShifts.includes(s));
      });
      
      // Atualizar flags de retrocompatibilidade
      const hasMorning = Object.values(validatedShifts).some(shifts => shifts?.includes("morning"));
      const hasAfternoon = Object.values(validatedShifts).some(shifts => shifts?.includes("afternoon"));
      
      return {
        ...sb,
        weekday_shift_availability: validatedShifts,
        availableMorning: hasMorning,
        availableAfternoon: hasAfternoon
      };
    });
    
    setSelectedBrokers(validated);
  }, [value, brokerAvailabilityMap]);

  const allSelected = brokers.every((broker) =>
    selectedBrokers.some((sb) => sb.brokerId === broker.id)
  );

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      const allBrokers = brokers.map((broker) => {
        const brokerAvailability = brokerAvailabilityMap.get(broker.id) || {};
        return {
          brokerId: broker.id,
          availableMorning: true,
          availableAfternoon: true,
          weekday_shift_availability: brokerAvailability,
        };
      });
      onChange(allBrokers);
    }
  };

  const toggleBroker = (brokerId: string) => {
    const exists = selectedBrokers.find((sb) => sb.brokerId === brokerId);
    if (exists) {
      onChange(selectedBrokers.filter((sb) => sb.brokerId !== brokerId));
    } else {
      const brokerAvailability = brokerAvailabilityMap.get(brokerId) || {};
      onChange([
        ...selectedBrokers,
        { 
          brokerId, 
          availableMorning: true, 
          availableAfternoon: true,
          weekday_shift_availability: brokerAvailability 
        },
      ]);
    }
  };

  const toggleShiftForDay = (
    brokerId: string,
    day: string,
    shift: "morning" | "afternoon"
  ) => {
    const brokerAvailability = brokerAvailabilityMap.get(brokerId) || {};
    const allowedShifts = brokerAvailability[day] || [];
    
    // Não permitir marcar turno que o corretor não tem disponível
    if (!allowedShifts.includes(shift)) return;

    onChange(
      selectedBrokers.map((sb) => {
        if (sb.brokerId !== brokerId) return sb;
        
        const current = sb.weekday_shift_availability || {};
        const currentDayShifts = [...(current[day] || [])];
        
        let newDayShifts: ("morning" | "afternoon")[];
        if (currentDayShifts.includes(shift)) {
          newDayShifts = currentDayShifts.filter(s => s !== shift);
        } else {
          newDayShifts = [...currentDayShifts, shift];
        }

        const updated: WeekdayShiftAvailability = {
          ...current,
          [day]: newDayShifts
        };

        // Atualizar availableMorning/Afternoon para retrocompatibilidade
        const hasMorning = Object.values(updated).some(shifts => shifts?.includes("morning"));
        const hasAfternoon = Object.values(updated).some(shifts => shifts?.includes("afternoon"));

        return {
          ...sb,
          weekday_shift_availability: updated,
          availableMorning: hasMorning,
          availableAfternoon: hasAfternoon
        };
      })
    );
  };

  const isShiftSelected = (brokerId: string, day: string, shift: "morning" | "afternoon") => {
    const broker = selectedBrokers.find(sb => sb.brokerId === brokerId);
    if (!broker?.weekday_shift_availability) return false;
    return broker.weekday_shift_availability[day]?.includes(shift) || false;
  };

  const isShiftAvailable = (brokerId: string, day: string, shift: "morning" | "afternoon") => {
    const availability = brokerAvailabilityMap.get(brokerId);
    if (!availability) return false;
    return availability[day]?.includes(shift) || false;
  };

  const getBrokerAvailabilitySummary = (brokerId: string) => {
    const availability = brokerAvailabilityMap.get(brokerId);
    if (!availability) return "Sem disponibilidade";
    
    const days: string[] = [];
    Object.entries(weekdaysMap).forEach(([key, label]) => {
      const shifts = availability[key] || [];
      if (shifts.length > 0) {
        const shiftLabels = shifts.map(s => s === "morning" ? "Manhã" : "Tarde").join("/");
        days.push(`${label}(${shiftLabels})`);
      }
    });
    
    return days.length > 0 ? days.join(", ") : "Sem disponibilidade";
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">Corretores Disponíveis</Label>
        <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
          {allSelected ? "Desmarcar Todos" : "Selecionar Todos"}
        </Button>
      </div>
      <ScrollArea className="h-[400px] border rounded-lg p-4 bg-muted/30">
        <div className="space-y-3">
          {brokers.map((broker) => {
            const selected = selectedBrokers.find((sb) => sb.brokerId === broker.id);
            const isExpanded = expandedBroker === broker.id;
            
            return (
              <div key={broker.id} className="border rounded-lg bg-background overflow-hidden">
                <div className="p-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={!!selected}
                      onCheckedChange={() => toggleBroker(broker.id)}
                      className="h-5 w-5"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{broker.name}</p>
                      <p className="text-sm text-muted-foreground">CRECI: {broker.creci}</p>
                    </div>
                    {selected && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedBroker(isExpanded ? null : broker.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                  
                  {selected && !isExpanded && (
                    <p className="text-xs text-muted-foreground mt-2 ml-8">
                      Disponível: {getBrokerAvailabilitySummary(broker.id)}
                    </p>
                  )}
                </div>
                
                {selected && isExpanded && (
                  <div className="border-t bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      Selecione os turnos para este local (apenas turnos em que o corretor está disponível):
                    </p>
                    <div className="grid grid-cols-8 gap-1 text-xs">
                      <div className="font-medium"></div>
                      {Object.entries(weekdaysMap).map(([key, label]) => (
                        <div key={key} className="text-center font-medium">{label}</div>
                      ))}
                      
                      <div className="font-medium text-right pr-1">Manhã</div>
                      {Object.keys(weekdaysMap).map(day => {
                        const available = isShiftAvailable(broker.id, day, "morning");
                        const checked = isShiftSelected(broker.id, day, "morning");
                        return (
                          <div key={`${day}-morning`} className="flex justify-center">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleShiftForDay(broker.id, day, "morning")}
                              disabled={!available}
                              className="h-4 w-4"
                            />
                          </div>
                        );
                      })}
                      
                      <div className="font-medium text-right pr-1">Tarde</div>
                      {Object.keys(weekdaysMap).map(day => {
                        const available = isShiftAvailable(broker.id, day, "afternoon");
                        const checked = isShiftSelected(broker.id, day, "afternoon");
                        return (
                          <div key={`${day}-afternoon`} className="flex justify-center">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleShiftForDay(broker.id, day, "afternoon")}
                              disabled={!available}
                              className="h-4 w-4"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
