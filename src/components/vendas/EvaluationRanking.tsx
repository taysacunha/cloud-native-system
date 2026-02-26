import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const c2sCriteria = [
  { name: "c2s_perfil_cliente", label: "Perfil Cliente" },
  { name: "c2s_atualiza_atividades", label: "Atualiza Atividades" },
  { name: "c2s_atende_rapido", label: "Atende Rápido" },
  { name: "c2s_cliente_remanejado", label: "Cliente Remanejado" },
  { name: "c2s_bolsao", label: "Bolsão" },
  { name: "c2s_agendamento_chaves", label: "Agend. Chaves" },
  { name: "c2s_agendamento_sem_chaves", label: "Agend. s/ Chaves" },
  { name: "c2s_cliente_potencial", label: "Cliente Potencial" },
  { name: "c2s_justifica_arquivamento", label: "Just. Arquivamento" },
  { name: "c2s_insere_etiquetas", label: "Etiquetas" },
  { name: "c2s_etiqueta_construtora", label: "Etiq. Construtora" },
  { name: "c2s_feedback_visita", label: "Feedback Visita" },
  { name: "c2s_cadastra_proposta", label: "Cadastra Proposta" },
  { name: "c2s_negocio_fechado", label: "Negócio Fechado" },
];

const classificationColors: Record<string, string> = {
  "Excelente": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Bom": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Precisa Melhorar": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Não atualiza": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

type SortDirection = "asc" | "desc" | null;
type SortField = "name" | "average_score" | string;

interface EvaluationRankingProps {
  evaluations: any[];
  brokers: any[];
}

export function EvaluationRanking({ evaluations, brokers }: EvaluationRankingProps) {
  const [sortField, setSortField] = useState<SortField>("average_score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Create ranking data by merging brokers with their evaluations
  const rankingData = useMemo(() => {
    return brokers.map((broker) => {
      const evaluation = evaluations.find((e: any) => e.broker_id === broker.id);
      return {
        broker_id: broker.id,
        broker_name: broker.name,
        team_name: broker.sales_teams?.name || "-",
        is_launch: broker.is_launch,
        average_score: evaluation?.average_score ?? null,
        classification: evaluation?.classification ?? null,
        ...c2sCriteria.reduce((acc, c) => {
          acc[c.name] = evaluation?.[c.name] ?? null;
          return acc;
        }, {} as Record<string, number | null>),
      };
    });
  }, [brokers, evaluations]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) return rankingData;

    return [...rankingData].sort((a, b) => {
      let aValue = a[sortField as keyof typeof a];
      let bValue = b[sortField as keyof typeof b];

      // Handle name sorting
      if (sortField === "name" || sortField === "broker_name") {
        aValue = a.broker_name;
        bValue = b.broker_name;
        return sortDirection === "asc" 
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      }

      // Handle numeric sorting (nulls go to the end)
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      const numA = Number(aValue);
      const numB = Number(bValue);

      return sortDirection === "asc" ? numA - numB : numB - numA;
    });
  }, [rankingData, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction or reset
      if (sortDirection === "desc") {
        setSortDirection("asc");
      } else if (sortDirection === "asc") {
        setSortDirection(null);
        setSortField("average_score");
        setSortDirection("desc");
      }
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    if (sortDirection === "desc") {
      return <ArrowDown className="h-3 w-3 ml-1" />;
    }
    return <ArrowUp className="h-3 w-3 ml-1" />;
  };

  const SortableHeader = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <TableHead 
      className={cn("cursor-pointer hover:bg-muted/50 select-none whitespace-nowrap", className)}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {label}
        {renderSortIcon(field)}
      </div>
    </TableHead>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de Avaliações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <SortableHeader field="broker_name" label="Corretor" className="min-w-[150px]" />
                <SortableHeader field="average_score" label="Média" className="text-center" />
                <TableHead className="text-center">Classificação</TableHead>
                {c2sCriteria.map((c) => (
                  <SortableHeader 
                    key={c.name} 
                    field={c.name} 
                    label={c.label} 
                    className="text-center min-w-[100px]" 
                  />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4 + c2sCriteria.length} className="text-center text-muted-foreground py-8">
                    Nenhuma avaliação encontrada para o período selecionado.
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((row, index) => (
                  <TableRow key={row.broker_id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {sortField === "average_score" && sortDirection === "desc" ? index + 1 : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{row.broker_name}</span>
                        {row.is_launch && (
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{row.team_name}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "font-bold text-lg",
                        row.average_score === null && "text-muted-foreground"
                      )}>
                        {row.average_score?.toFixed(1) ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.classification ? (
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-[10px] px-2",
                            classificationColors[row.classification]
                          )}
                        >
                          {row.classification}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {c2sCriteria.map((c) => {
                      const value = row[c.name as keyof typeof row] as number | null;
                      return (
                        <TableCell key={c.name} className="text-center">
                          <span className={cn(
                            "text-sm",
                            value === null && "text-muted-foreground",
                            value !== null && value >= 7 && "text-green-600 dark:text-green-400 font-medium",
                            value !== null && value < 4 && "text-red-600 dark:text-red-400 font-medium"
                          )}>
                            {value?.toFixed(1) ?? "-"}
                          </span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
