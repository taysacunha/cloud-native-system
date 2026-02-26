import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Search, ArrowDownUp, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { normalizeText } from "@/lib/textUtils";

interface SwapAssignment {
  id: string;
  broker_id: string;
  broker_name: string;
  location_id: string;
  location_name: string;
  location_type: string;
}

interface ScheduleSwapDialogProps {
  generatedScheduleId: string;
  currentAssignment: SwapAssignment;
  date: string;
  shiftType: "morning" | "afternoon";
  onConfirmSwap: (assignmentA: SwapAssignment, assignmentB: SwapAssignment) => void;
  onClose: () => void;
}

export const ScheduleSwapDialog = ({
  generatedScheduleId,
  currentAssignment,
  date,
  shiftType,
  onConfirmSwap,
  onClose,
}: ScheduleSwapDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<SwapAssignment | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Buscar TODAS as alocações do mesmo dia/turno (exceto o atual)
  const { data: availableAssignments, isLoading } = useQuery({
    queryKey: ["swap_assignments", generatedScheduleId, date, shiftType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_assignments")
        .select(`
          id,
          broker_id,
          location_id,
          broker:brokers(id, name),
          location:locations(id, name, location_type)
        `)
        .eq("generated_schedule_id", generatedScheduleId)
        .eq("assignment_date", date)
        .eq("shift_type", shiftType)
        .neq("broker_id", currentAssignment.broker_id);

      if (error) throw error;

      return (data || []).map((a: any) => ({
        id: a.id,
        broker_id: a.broker_id,
        broker_name: a.broker?.name || "Desconhecido",
        location_id: a.location_id,
        location_name: a.location?.name || "Desconhecido",
        location_type: a.location?.location_type || "internal",
      })) as SwapAssignment[];
    },
  });

  // Filtrar por busca
  const filteredAssignments = availableAssignments?.filter((a) => {
    if (!searchTerm) return true;
    const normalized = normalizeText(searchTerm);
    return (
      normalizeText(a.broker_name).includes(normalized) ||
      normalizeText(a.location_name).includes(normalized)
    );
  });

  const handleSelectAssignment = (assignment: SwapAssignment) => {
    setSelectedAssignment(assignment);
    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    if (selectedAssignment) {
      onConfirmSwap(currentAssignment, selectedAssignment);
      setConfirmDialogOpen(false);
    }
  };

  const formattedDate = format(new Date(date + "T00:00:00"), "EEEE, dd/MM/yyyy", { locale: ptBR });
  const shiftLabel = shiftType === "morning" ? "Manhã" : "Tarde";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Buscando corretores...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info do plantão atual */}
      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          <strong>{currentAssignment.broker_name}</strong> em{" "}
          <strong>{currentAssignment.location_name}</strong>
          <div className="text-xs text-muted-foreground mt-1">
            {formattedDate} | {shiftLabel}
          </div>
        </AlertDescription>
      </Alert>

      {/* Busca */}
      <div className="space-y-2">
        <Label htmlFor="swap-search">Buscar corretor para trocar</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="swap-search"
            placeholder="Digite o nome do corretor ou local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Lista de corretores disponíveis */}
      {filteredAssignments && filteredAssignments.length === 0 ? (
        <Alert variant="destructive">
          <AlertDescription>
            {searchTerm
              ? "Nenhum corretor encontrado com esse filtro."
              : "Nenhum outro corretor tem plantão neste dia/turno para trocar."}
          </AlertDescription>
        </Alert>
      ) : (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {filteredAssignments?.map((assignment) => (
              <button
                key={assignment.id}
                onClick={() => handleSelectAssignment(assignment)}
                className="w-full p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{assignment.broker_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {assignment.location_name}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      assignment.location_type === "external"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {assignment.location_type === "external" ? "Externo" : "Interno"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* AlertDialog de Confirmação */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ArrowDownUp className="h-5 w-5" />
              Confirmar Troca de Plantões
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Ao confirmar, os dois corretores trocarão de local:
                </p>

                {/* Visual da troca */}
                <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                  {/* Corretor A */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 rounded bg-background border">
                      <p className="font-semibold text-foreground">{currentAssignment.broker_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {currentAssignment.location_name}
                      </p>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex-1 p-3 rounded bg-primary/10 border border-primary/30">
                      <p className="font-semibold text-primary">{selectedAssignment?.location_name}</p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowDownUp className="h-6 w-6 text-primary" />
                  </div>

                  {/* Corretor B */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 rounded bg-background border">
                      <p className="font-semibold text-foreground">{selectedAssignment?.broker_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedAssignment?.location_name}
                      </p>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex-1 p-3 rounded bg-primary/10 border border-primary/30">
                      <p className="font-semibold text-primary">{currentAssignment.location_name}</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  📅 {formattedDate} | ⏰ {shiftLabel}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirmar Troca
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
