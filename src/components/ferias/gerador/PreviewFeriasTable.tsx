import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, Users, Heart, CheckSquare, Square } from "lucide-react";
import { GeneratedVacation } from "@/lib/vacationGenerator";

interface PreviewFeriasTableProps {
  vacations: GeneratedVacation[];
  selectedIds: Set<string>;
  onToggleSelection: (colaboradorId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  showConflicts?: boolean;
}

export function PreviewFeriasTable({
  vacations,
  selectedIds,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  showConflicts = false,
}: PreviewFeriasTableProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatPeriodo = (inicio: string, fim: string) => {
    return `${formatDate(inicio)} - ${formatDate(fim)}`;
  };

  const allSelected = vacations.every((v) => selectedIds.has(v.colaborador_id));
  const noneSelected = vacations.every((v) => !selectedIds.has(v.colaborador_id));

  return (
    <div className="space-y-2">
      {/* Bulk actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={allSelected ? onDeselectAll : onSelectAll}
        >
          {allSelected ? (
            <>
              <Square className="h-4 w-4 mr-1" />
              Desmarcar Todos
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4 mr-1" />
              Selecionar Todos
            </>
          )}
        </Button>
        <span className="text-sm text-muted-foreground">
          {vacations.filter((v) => selectedIds.has(v.colaborador_id)).length} de {vacations.length} selecionados
        </span>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Colaborador</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>1º Período</TableHead>
              <TableHead>2º Período</TableHead>
              <TableHead>Venda</TableHead>
              {showConflicts && <TableHead>Conflitos</TableHead>}
              <TableHead>Info</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vacations.map((vacation) => (
              <TableRow
                key={vacation.colaborador_id}
                className={selectedIds.has(vacation.colaborador_id) ? "bg-primary/5" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(vacation.colaborador_id)}
                    onCheckedChange={() => onToggleSelection(vacation.colaborador_id)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {vacation.colaborador_nome}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {vacation.setor_nome || "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {formatPeriodo(vacation.quinzena1_inicio, vacation.quinzena1_fim)}
                </TableCell>
                <TableCell className="text-sm">
                  {formatPeriodo(vacation.quinzena2_inicio, vacation.quinzena2_fim)}
                </TableCell>
                <TableCell>
                  {vacation.vender_dias && vacation.dias_vendidos ? (
                    <Badge variant="outline" className="text-xs">
                      {vacation.dias_vendidos} dias
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                {showConflicts && (
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex flex-wrap gap-1">
                        {vacation.conflicts.map((conflict, idx) => (
                          <Tooltip key={idx}>
                            <TooltipTrigger>
                              <Badge
                                variant="outline"
                                className={
                                  conflict.tipo === "setor"
                                    ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                    : conflict.tipo === "familiar"
                                    ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                    : "bg-red-500/10 text-red-600 border-red-500/20"
                                }
                              >
                                {conflict.tipo === "setor" && <Users className="h-3 w-3 mr-1" />}
                                {conflict.tipo === "familiar" && <Heart className="h-3 w-3 mr-1" />}
                                {conflict.tipo === "mes_bloqueado" && <AlertTriangle className="h-3 w-3 mr-1" />}
                                {conflict.tipo}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{conflict.descricao}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TooltipProvider>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-1">
                    {vacation.familiar_match && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="bg-pink-500/10 text-pink-600 border-pink-500/20">
                              <Heart className="h-3 w-3" />
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Período alinhado com familiar</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {vacation.is_excecao && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                              <AlertTriangle className="h-3 w-3" />
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Será salva como exceção: {vacation.excecao_motivo}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
