import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Calendar, AlertCircle } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WeekInfo {
  weekStart: Date;
  weekEnd: Date;
  weekStartStr: string;
  status: 'new' | 'existing' | 'locked';
  scheduleId?: string;
  hasAssignments: boolean;
}

interface WeekSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: number;
  year: number;
  onConfirm: (selectedWeeks: WeekInfo[], lockedWeekIds: string[]) => void;
}

export function WeekSelectionDialog({ 
  open, 
  onOpenChange, 
  month, 
  year, 
  onConfirm 
}: WeekSelectionDialogProps) {
  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());
  const [lockedWeeks, setLockedWeeks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadWeeksForMonth();
    }
  }, [open, month, year]);

  const loadWeeksForMonth = async () => {
    setIsLoading(true);
    try {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);

      // Calculate all weeks that intersect with the month
      const firstDayOfWeek = monthStart.getDay();
      const daysToSubtractFirst = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
      const firstWeekStart = addDays(monthStart, -daysToSubtractFirst);
      
      const lastDayOfWeek = monthEnd.getDay();
      const daysToSubtractLast = lastDayOfWeek === 0 ? 6 : lastDayOfWeek - 1;
      const lastWeekStart = addDays(monthEnd, -daysToSubtractLast);

      const mondays: Date[] = [];
      let currentMonday = new Date(firstWeekStart);
      while (currentMonday <= lastWeekStart) {
        mondays.push(new Date(currentMonday));
        currentMonday = addDays(currentMonday, 7);
      }

      // Fetch existing schedules
      const { data: existingSchedules } = await supabase
        .from("generated_schedules")
        .select("id, week_start_date, week_end_date")
        .gte("week_start_date", format(addDays(monthStart, -7), "yyyy-MM-dd"))
        .lte("week_end_date", format(addDays(monthEnd, 7), "yyyy-MM-dd"));

      // Fetch locked schedules
      const scheduleIds = existingSchedules?.map(s => s.id) || [];
      const { data: locks } = await supabase
        .from("schedule_locks")
        .select("schedule_id")
        .in("schedule_id", scheduleIds);

      const lockedScheduleIds = new Set(locks?.map(l => l.schedule_id) || []);

      // Check assignment counts
      const weekInfoList: WeekInfo[] = [];
      const newSelectedWeeks = new Set<string>();
      const newLockedWeeks = new Set<string>();

      for (const monday of mondays) {
        const weekStart = monday;
        const weekEnd = addDays(weekStart, 6);
        const weekStartStr = format(weekStart, "yyyy-MM-dd");

        const existingSchedule = existingSchedules?.find(s => s.week_start_date === weekStartStr);
        
        let status: 'new' | 'existing' | 'locked' = 'new';
        let hasAssignments = false;

        if (existingSchedule) {
          const { count } = await supabase
            .from("schedule_assignments")
            .select("*", { count: 'exact', head: true })
            .eq("generated_schedule_id", existingSchedule.id);
          
          hasAssignments = (count ?? 0) > 0;

          if (lockedScheduleIds.has(existingSchedule.id)) {
            status = 'locked';
            newLockedWeeks.add(weekStartStr);
          } else if (hasAssignments) {
            status = 'existing';
          }
        }

        // Pre-select new weeks
        if (status === 'new') {
          newSelectedWeeks.add(weekStartStr);
        }

        weekInfoList.push({
          weekStart,
          weekEnd,
          weekStartStr,
          status,
          scheduleId: existingSchedule?.id,
          hasAssignments
        });
      }

      setWeeks(weekInfoList);
      setSelectedWeeks(newSelectedWeeks);
      setLockedWeeks(newLockedWeeks);
    } catch (error) {
      console.error("Error loading weeks:", error);
      toast.error("Erro ao carregar semanas");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWeekSelection = (weekStartStr: string) => {
    const week = weeks.find(w => w.weekStartStr === weekStartStr);
    if (week?.status === 'locked') return; // Can't select locked weeks

    setSelectedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekStartStr)) {
        newSet.delete(weekStartStr);
      } else {
        newSet.add(weekStartStr);
      }
      return newSet;
    });
  };

  const toggleLock = async (week: WeekInfo) => {
    if (!week.scheduleId) {
      toast.error("Só é possível travar semanas já geradas");
      return;
    }

    try {
      if (lockedWeeks.has(week.weekStartStr)) {
        // Unlock
        await supabase
          .from("schedule_locks")
          .delete()
          .eq("schedule_id", week.scheduleId);
        
        setLockedWeeks(prev => {
          const newSet = new Set(prev);
          newSet.delete(week.weekStartStr);
          return newSet;
        });
        
        // Update week status
        setWeeks(prev => prev.map(w => 
          w.weekStartStr === week.weekStartStr 
            ? { ...w, status: w.hasAssignments ? 'existing' : 'new' as const }
            : w
        ));
        
        toast.success("Semana destravada!");
      } else {
        // Lock
        const { error } = await supabase
          .from("schedule_locks")
          .insert({ schedule_id: week.scheduleId });
        
        if (error) throw error;

        setLockedWeeks(prev => {
          const newSet = new Set(prev);
          newSet.add(week.weekStartStr);
          return newSet;
        });
        
        // Remove from selected if it was selected
        setSelectedWeeks(prev => {
          const newSet = new Set(prev);
          newSet.delete(week.weekStartStr);
          return newSet;
        });
        
        // Update week status
        setWeeks(prev => prev.map(w => 
          w.weekStartStr === week.weekStartStr 
            ? { ...w, status: 'locked' as const }
            : w
        ));
        
        toast.success("Semana travada! Não será sobrescrita na regeneração.");
      }
    } catch (error) {
      console.error("Error toggling lock:", error);
      toast.error("Erro ao alterar trava");
    }
  };

  const handleConfirm = () => {
    const selectedWeeksList = weeks.filter(w => selectedWeeks.has(w.weekStartStr));
    const lockedWeekIds = weeks
      .filter(w => lockedWeeks.has(w.weekStartStr) && w.scheduleId)
      .map(w => w.scheduleId!);
    
    onConfirm(selectedWeeksList, lockedWeekIds);
    onOpenChange(false);
  };

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gerar Escalas de {monthName}
          </DialogTitle>
          <DialogDescription>
            Selecione as semanas que deseja (re)gerar. Semanas travadas não serão modificadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            weeks.map((week) => {
              const isLocked = week.status === 'locked';
              const isSelected = selectedWeeks.has(week.weekStartStr);
              const canLock = week.scheduleId && week.hasAssignments;

              return (
                <div 
                  key={week.weekStartStr}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    isLocked 
                      ? 'bg-muted/50 border-muted-foreground/20' 
                      : isSelected 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-card border-border hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      disabled={isLocked}
                      onCheckedChange={() => toggleWeekSelection(week.weekStartStr)}
                    />
                    <div>
                      <div className="font-medium">
                        {format(week.weekStart, "dd/MM")} a {format(week.weekEnd, "dd/MM")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(week.weekStart, "EEEE", { locale: ptBR })} - {format(week.weekEnd, "EEEE", { locale: ptBR })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {week.status === 'new' && (
                      <Badge variant="outline" className="text-xs">Nova</Badge>
                    )}
                    {week.status === 'existing' && (
                      <Badge variant="secondary" className="text-xs">Existente</Badge>
                    )}
                    {week.status === 'locked' && (
                      <Badge variant="default" className="text-xs bg-amber-500 hover:bg-amber-600">
                        <Lock className="h-3 w-3 mr-1" />
                        Travada
                      </Badge>
                    )}

                    {canLock && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleLock(week)}
                        title={isLocked ? "Destravar semana" : "Travar semana"}
                      >
                        {isLocked ? (
                          <Unlock className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {lockedWeeks.size > 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {lockedWeeks.size} semana(s) travada(s) serão preservadas e usadas como referência histórica para rotação.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedWeeks.size === 0}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Gerar {selectedWeeks.size} Semana(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
