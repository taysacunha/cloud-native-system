import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, TrendingUp, TrendingDown, Minus, Check, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EvaluationCardProps {
  broker: {
    id: string;
    name: string;
    is_launch?: boolean;
    sales_teams?: { id: string; name: string } | null;
  };
  evaluation?: {
    id: string;
    average_score: number | null;
    previous_average: number | null;
    classification: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  onClick: () => void;
}

const classificationColors: Record<string, string> = {
  "Excelente": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Bom": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Precisa Melhorar": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Não atualiza": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function EvaluationCard({ broker, evaluation, onClick }: EvaluationCardProps) {
  const isFilled = !!evaluation;
  const variation = evaluation?.average_score != null && evaluation?.previous_average != null
    ? evaluation.average_score - evaluation.previous_average
    : null;

  const renderTrend = () => {
    if (variation === null) return null;
    
    if (variation > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">+{variation.toFixed(1)}</span>
        </div>
      );
    } else if (variation < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <TrendingDown className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{variation.toFixed(1)}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Minus className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">0.0</span>
        </div>
      );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        broker.is_launch && "border-amber-400 dark:border-amber-500 border-2 bg-amber-50/50 dark:bg-amber-950/20",
        !isFilled && "opacity-70"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header with name and launch badge */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight truncate flex-1">
              {broker.name}
            </h3>
            {broker.is_launch && (
              <Rocket className="h-4 w-4 text-amber-500 shrink-0" />
            )}
          </div>
          {broker.sales_teams?.name && (
            <p className="text-xs text-muted-foreground truncate">
              {broker.sales_teams.name}
            </p>
          )}
        </div>

        {/* Status and Score */}
        <div className="space-y-2">
          {isFilled ? (
            <>
              {/* Score with trend */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-lg font-bold">
                    {evaluation.average_score?.toFixed(1) ?? "-"}
                  </span>
                </div>
                {renderTrend()}
              </div>

              {/* Classification */}
              {evaluation.classification && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-[10px] px-2 py-0.5",
                    classificationColors[evaluation.classification]
                  )}
                >
                  {evaluation.classification}
                </Badge>
              )}

              {/* Date */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDate(evaluation.created_at)}
                  {evaluation.updated_at !== evaluation.created_at && (
                    <span className="ml-1">(atualizado: {formatDate(evaluation.updated_at)})</span>
                  )}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-sm">Pendente</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
