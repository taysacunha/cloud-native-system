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

interface WeekdaySelectorProps {
  value: string[];
  onChange: (weekdays: string[]) => void;
  label?: string;
}

export function WeekdaySelector({ value, onChange, label = "Disponibilidade Semanal" }: WeekdaySelectorProps) {
  const allWeekdays = Object.keys(weekdaysMap);
  const allSelected = allWeekdays.every((day) => value.includes(day));

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(allWeekdays);
    }
  };

  const toggleDay = (day: string) => {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">{label}</Label>
        <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
          {allSelected ? "Desmarcar Todos" : "Selecionar Todos"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/30">
        {Object.entries(weekdaysMap).map(([key, label]) => (
          <div key={key} className="flex items-center space-x-3">
            <Checkbox
              id={key}
              checked={value.includes(key)}
              onCheckedChange={() => toggleDay(key)}
              className="h-5 w-5"
            />
            <label htmlFor={key} className="text-base cursor-pointer font-medium">
              {label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
