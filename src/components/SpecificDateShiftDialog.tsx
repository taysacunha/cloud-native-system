import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Sun, Moon } from "lucide-react";

interface SpecificDateShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  onSave: (config: {
    has_morning: boolean;
    has_afternoon: boolean;
    morning_start: string;
    morning_end: string;
    afternoon_start: string;
    afternoon_end: string;
  }) => void;
  onDelete?: () => void;
  hasExistingConfig?: boolean;
  initialConfig?: {
    has_morning: boolean;
    has_afternoon: boolean;
    morning_start: string;
    morning_end: string;
    afternoon_start: string;
    afternoon_end: string;
  };
}

export function SpecificDateShiftDialog({
  open,
  onOpenChange,
  date,
  onSave,
  onDelete,
  hasExistingConfig,
  initialConfig,
}: SpecificDateShiftDialogProps) {
  const [hasMorning, setHasMorning] = useState(false);
  const [hasAfternoon, setHasAfternoon] = useState(false);
  const [morningStart, setMorningStart] = useState("08:00");
  const [morningEnd, setMorningEnd] = useState("12:00");
  const [afternoonStart, setAfternoonStart] = useState("13:00");
  const [afternoonEnd, setAfternoonEnd] = useState("18:00");

  useEffect(() => {
    if (initialConfig) {
      setHasMorning(initialConfig.has_morning);
      setHasAfternoon(initialConfig.has_afternoon);
      setMorningStart(initialConfig.morning_start || "08:00");
      setMorningEnd(initialConfig.morning_end || "12:00");
      setAfternoonStart(initialConfig.afternoon_start || "13:00");
      setAfternoonEnd(initialConfig.afternoon_end || "18:00");
    } else {
      // Reset to defaults when opening for a new date
      setHasMorning(false);
      setHasAfternoon(false);
      setMorningStart("08:00");
      setMorningEnd("12:00");
      setAfternoonStart("13:00");
      setAfternoonEnd("18:00");
    }
  }, [initialConfig, open, date]);

  const handleSave = () => {
    if (!hasMorning && !hasAfternoon) {
      return; // At least one shift must be selected
    }

    onSave({
      has_morning: hasMorning,
      has_afternoon: hasAfternoon,
      morning_start: morningStart,
      morning_end: morningEnd,
      afternoon_start: afternoonStart,
      afternoon_end: afternoonEnd,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurar Turnos do Dia</DialogTitle>
          <DialogDescription>
            {date && (
              <span className="text-base font-medium">
                {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Morning Shift */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_morning"
                checked={hasMorning}
                onCheckedChange={(checked) => setHasMorning(checked as boolean)}
              />
              <Label
                htmlFor="has_morning"
                className="text-base font-medium cursor-pointer flex items-center gap-2"
              >
                <Sun className="h-4 w-4 text-amber-500" />
                Manhã
              </Label>
            </div>

            {hasMorning && (
              <div className="ml-6 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="morning_start" className="text-sm">
                      Início
                    </Label>
                    <Input
                      id="morning_start"
                      type="time"
                      value={morningStart}
                      onChange={(e) => setMorningStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="morning_end" className="text-sm">
                      Fim
                    </Label>
                    <Input
                      id="morning_end"
                      type="time"
                      value={morningEnd}
                      onChange={(e) => setMorningEnd(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Afternoon Shift */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_afternoon"
                checked={hasAfternoon}
                onCheckedChange={(checked) => setHasAfternoon(checked as boolean)}
              />
              <Label
                htmlFor="has_afternoon"
                className="text-base font-medium cursor-pointer flex items-center gap-2"
              >
                <Moon className="h-4 w-4 text-blue-500" />
                Tarde
              </Label>
            </div>

            {hasAfternoon && (
              <div className="ml-6 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="afternoon_start" className="text-sm">
                      Início
                    </Label>
                    <Input
                      id="afternoon_start"
                      type="time"
                      value={afternoonStart}
                      onChange={(e) => setAfternoonStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="afternoon_end" className="text-sm">
                      Fim
                    </Label>
                    <Input
                      id="afternoon_end"
                      type="time"
                      value={afternoonEnd}
                      onChange={(e) => setAfternoonEnd(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          {hasExistingConfig && onDelete && (
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
              className="mr-auto"
            >
              Remover Dia
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasMorning && !hasAfternoon}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
