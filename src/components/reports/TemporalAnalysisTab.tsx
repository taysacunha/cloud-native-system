import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Database, AlertCircle } from "lucide-react";
import { ExportButton } from "./ExportButton";
import { exportToExcel, formatWeekdayDistributionForExport } from "@/lib/exportUtils";
import { subDays } from "date-fns";

interface TemporalAnalysisTabProps {
  enabled?: boolean;
}

export const TemporalAnalysisTab = ({ enabled = true }: TemporalAnalysisTabProps) => {
  const [period, setPeriod] = useState("30");
  
  const endDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const startDate = useMemo(() => {
    return subDays(new Date(), parseInt(period)).toISOString().split('T')[0];
  }, [period]);

  // Use hybrid function that supports historical data
  const { data: weekdayData, isLoading } = useQuery({
    queryKey: ["weekday_distribution_hybrid", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_weekday_distribution_hybrid", {
        start_date: startDate,
        end_date: endDate,
      });
      if (error) throw error;
      return data || [];
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Check if using historical data (no weekday distribution available for historical)
  const isHistorical = useMemo(() => {
    if (!weekdayData || weekdayData.length === 0) return false;
    // If all totals are 0, it means we're using historical data
    return weekdayData.every((d: any) => Number(d.total_assignments) === 0);
  }, [weekdayData]);

  const stats = useMemo(() => {
    if (!weekdayData || weekdayData.length === 0) return null;
    if (isHistorical) return null;
    
    const total = weekdayData.reduce((sum: number, d: any) => sum + Number(d.total_assignments), 0);
    if (total === 0) return null;
    
    const mostActiveDay = weekdayData.reduce((max: any, d: any) => 
      (!max || Number(d.total_assignments) > Number(max.total_assignments)) ? d : max
    , null);
    
    const morningTotal = weekdayData.reduce((sum: number, d: any) => sum + Number(d.morning_count), 0);
    const afternoonTotal = weekdayData.reduce((sum: number, d: any) => sum + Number(d.afternoon_count), 0);
    const preferredShift = morningTotal > afternoonTotal ? 'Manhã' : 'Tarde';
    
    return {
      total,
      mostActiveDay,
      preferredShift,
      morningTotal,
      afternoonTotal
    };
  }, [weekdayData, isHistorical]);

  const handleExport = () => {
    if (weekdayData && weekdayData.length > 0 && !isHistorical) {
      const formatted = formatWeekdayDistributionForExport(weekdayData);
      exportToExcel(formatted, `Analise_Temporal_${startDate}_${endDate}`, 'Distribuição');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-48">
            <Label>Período</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isHistorical && (
            <Badge variant="secondary" className="gap-1 mt-5">
              <Database className="h-3 w-3" />
              Dados históricos
            </Badge>
          )}
        </div>
        <ExportButton 
          onClick={handleExport} 
          disabled={!weekdayData || weekdayData.length === 0 || isHistorical}
        />
      </div>

      {isHistorical && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-amber-700">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Análise Temporal Indisponível</p>
                <p className="text-sm">
                  A distribuição por dia da semana não está disponível para dados históricos agregados.
                  Selecione um período com escalas ativas para visualizar esta análise.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {stats && !isHistorical && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dia Mais Ativo</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mostActiveDay?.weekday_name}</div>
              <p className="text-xs text-muted-foreground">
                {stats.mostActiveDay?.total_assignments} plantões (
                {((Number(stats.mostActiveDay?.total_assignments) / stats.total) * 100).toFixed(1)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turno Preferido</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.preferredShift}</div>
              <p className="text-xs text-muted-foreground">
                {stats.preferredShift === 'Manhã' ? stats.morningTotal : stats.afternoonTotal} plantões
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total do Período</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Plantões realizados
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="text-center p-8 text-muted-foreground">Carregando...</div>
      ) : !isHistorical && weekdayData && weekdayData.length > 0 && stats ? (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dia da Semana</TableHead>
                <TableHead className="text-right">Total Plantões</TableHead>
                <TableHead className="text-right">% do Total</TableHead>
                <TableHead className="text-right">Manhã</TableHead>
                <TableHead className="text-right">Tarde</TableHead>
                <TableHead>Distribuição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weekdayData.map((day: any) => {
                const percentage = ((Number(day.total_assignments) / stats.total) * 100);
                const morningPerc = Number(day.total_assignments) > 0 
                  ? ((Number(day.morning_count) / Number(day.total_assignments)) * 100)
                  : 0;
                
                return (
                  <TableRow key={day.weekday}>
                    <TableCell className="font-medium">{day.weekday_name}</TableCell>
                    <TableCell className="text-right">{day.total_assignments}</TableCell>
                    <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        ☀️ {day.morning_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        🌙 {day.afternoon_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden flex">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${morningPerc}%` }}
                          />
                          <div 
                            className="h-full bg-secondary"
                            style={{ width: `${100 - morningPerc}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {morningPerc.toFixed(0)}% / {(100 - morningPerc).toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : !isHistorical && (
        <div className="text-center p-8 text-muted-foreground">
          Nenhum dado encontrado para o período selecionado
        </div>
      )}
    </div>
  );
};
