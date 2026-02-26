import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const weekdaysMap = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

export type WeekdayShiftAvailability = {
  [key: string]: ("morning" | "afternoon")[];
};

interface WeekdayShiftSelectorProps {
  value: WeekdayShiftAvailability;
  onChange: (availability: WeekdayShiftAvailability) => void;
  label?: string;
  disabledShifts?: WeekdayShiftAvailability; // Para limitar quais turnos podem ser selecionados
}

export function WeekdayShiftSelector({ 
  value, 
  onChange, 
  label = "Disponibilidade Semanal",
  disabledShifts 
}: WeekdayShiftSelectorProps) {
  const allWeekdays = Object.keys(weekdaysMap);
  
  const hasAnyShift = (day: string) => {
    return value[day]?.length > 0;
  };

  const allSelected = allWeekdays.every((day) => 
    value[day]?.includes("morning") && value[day]?.includes("afternoon")
  );

  const toggleAll = () => {
    if (allSelected) {
      // Desmarcar todos
      const empty: WeekdayShiftAvailability = {};
      allWeekdays.forEach(day => empty[day] = []);
      onChange(empty);
    } else {
      // Selecionar todos (respeitando disabledShifts)
      const full: WeekdayShiftAvailability = {};
      allWeekdays.forEach(day => {
        const shifts: ("morning" | "afternoon")[] = [];
        if (!disabledShifts || disabledShifts[day]?.includes("morning") !== false) {
          if (!disabledShifts || !disabledShifts[day] || disabledShifts[day].length === 0 || disabledShifts[day].includes("morning")) {
            shifts.push("morning");
          }
        }
        if (!disabledShifts || disabledShifts[day]?.includes("afternoon") !== false) {
          if (!disabledShifts || !disabledShifts[day] || disabledShifts[day].length === 0 || disabledShifts[day].includes("afternoon")) {
            shifts.push("afternoon");
          }
        }
        full[day] = disabledShifts ? shifts.filter(s => !disabledShifts[day] || disabledShifts[day].includes(s)) : ["morning", "afternoon"];
      });
      onChange(full);
    }
  };

  const toggleAllMorning = () => {
    const allMorningSelected = allWeekdays.every(day => value[day]?.includes("morning"));
    const updated: WeekdayShiftAvailability = { ...value };
    allWeekdays.forEach(day => {
      const currentShifts = [...(value[day] || [])];
      if (allMorningSelected) {
        updated[day] = currentShifts.filter(s => s !== "morning");
      } else {
        if (!currentShifts.includes("morning")) {
          updated[day] = [...currentShifts, "morning"];
        }
      }
    });
    onChange(updated);
  };

  const toggleAllAfternoon = () => {
    const allAfternoonSelected = allWeekdays.every(day => value[day]?.includes("afternoon"));
    const updated: WeekdayShiftAvailability = { ...value };
    allWeekdays.forEach(day => {
      const currentShifts = [...(value[day] || [])];
      if (allAfternoonSelected) {
        updated[day] = currentShifts.filter(s => s !== "afternoon");
      } else {
        if (!currentShifts.includes("afternoon")) {
          updated[day] = [...currentShifts, "afternoon"];
        }
      }
    });
    onChange(updated);
  };

  const toggleShift = (day: string, shift: "morning" | "afternoon") => {
    const currentShifts = [...(value[day] || [])];
    const updated: WeekdayShiftAvailability = { ...value };
    
    if (currentShifts.includes(shift)) {
      updated[day] = currentShifts.filter(s => s !== shift);
    } else {
      updated[day] = [...currentShifts, shift];
    }
    
    onChange(updated);
  };

  const isShiftDisabled = (day: string, shift: "morning" | "afternoon") => {
    if (!disabledShifts) return false;
    const allowedShifts = disabledShifts[day] || [];
    return allowedShifts.length > 0 && !allowedShifts.includes(shift);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">{label}</Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={toggleAllMorning}>
            Todas Manhãs
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={toggleAllAfternoon}>
            Todas Tardes
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
            {allSelected ? "Limpar" : "Todos"}
          </Button>
        </div>
      </div>
      
      <div className="border rounded-lg bg-muted/30 overflow-hidden">
        <div className="grid grid-cols-3 gap-0 bg-muted/50 p-2 border-b">
          <div className="font-medium text-sm">Dia</div>
          <div className="font-medium text-sm text-center">Manhã</div>
          <div className="font-medium text-sm text-center">Tarde</div>
        </div>
        
        {Object.entries(weekdaysMap).map(([key, dayLabel]) => {
          const morningDisabled = isShiftDisabled(key, "morning");
          const afternoonDisabled = isShiftDisabled(key, "afternoon");
          
          return (
            <div 
              key={key} 
              className={`grid grid-cols-3 gap-0 p-2 border-b last:border-b-0 ${
                hasAnyShift(key) ? 'bg-accent/5' : ''
              }`}
            >
              <div className="flex items-center">
                <span className="text-sm font-medium">{dayLabel}</span>
              </div>
              <div className="flex justify-center">
                <Checkbox
                  id={`${key}-morning`}
                  checked={value[key]?.includes("morning") || false}
                  onCheckedChange={() => toggleShift(key, "morning")}
                  disabled={morningDisabled}
                  className="h-5 w-5"
                />
              </div>
              <div className="flex justify-center">
                <Checkbox
                  id={`${key}-afternoon`}
                  checked={value[key]?.includes("afternoon") || false}
                  onCheckedChange={() => toggleShift(key, "afternoon")}
                  disabled={afternoonDisabled}
                  className="h-5 w-5"
                />
              </div>
            </div>
          );
        })}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Selecione os turnos disponíveis para cada dia da semana.
      </p>
    </div>
  );
}

// Função utilitária para converter de available_weekdays para WeekdayShiftAvailability
export function convertFromAvailableWeekdays(weekdays: string[]): WeekdayShiftAvailability {
  const result: WeekdayShiftAvailability = {};
  const allDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  
  allDays.forEach(day => {
    result[day] = weekdays.includes(day) ? ["morning", "afternoon"] : [];
  });
  
  return result;
}

// Função utilitária para converter de WeekdayShiftAvailability para available_weekdays (retrocompatibilidade)
export function convertToAvailableWeekdays(availability: WeekdayShiftAvailability): string[] {
  return Object.entries(availability)
    .filter(([_, shifts]) => shifts && shifts.length > 0)
    .map(([day]) => day);
}
