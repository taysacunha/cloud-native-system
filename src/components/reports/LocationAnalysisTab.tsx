import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Home, MapPin, AlertTriangle, Database } from "lucide-react";
import { ExportButton } from "./ExportButton";
import { exportToExcel, formatLocationPerformanceForExport } from "@/lib/exportUtils";
import { differenceInDays, subDays } from "date-fns";

interface LocationAnalysisTabProps {
  enabled?: boolean;
}

export const LocationAnalysisTab = ({ enabled = true }: LocationAnalysisTabProps) => {
  const [period, setPeriod] = useState("30");
  const [typeFilter, setTypeFilter] = useState("all");
  
  const endDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const startDate = useMemo(() => {
    return subDays(new Date(), parseInt(period)).toISOString().split('T')[0];
  }, [period]);

  // Use hybrid function that supports historical data
  const { data: performance, isLoading } = useQuery({
    queryKey: ["location_performance_hybrid", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_location_performance_hybrid", {
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

  // Check if using historical data
  const { data: isHistorical } = useQuery({
    queryKey: ["is_historical_data_locations", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_assignments")
        .select("id")
        .gte("assignment_date", startDate)
        .lte("assignment_date", endDate)
        .limit(1);
      if (error) throw error;
      return !data || data.length === 0;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });

  const filteredPerformance = useMemo(() => {
    if (!performance) return [];
    if (typeFilter === "all") return performance;
    return performance.filter((loc: any) => loc.location_type === typeFilter);
  }, [performance, typeFilter]);

  const stats = useMemo(() => {
    if (!filteredPerformance || filteredPerformance.length === 0) return null;
    
    const totalDays = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
    const topLocation = filteredPerformance[0];
    const lowCoverageLocation = filteredPerformance.reduce((min, loc) => 
      (!min || (Number(loc.days_covered) < Number(min.days_covered))) ? loc : min
    , filteredPerformance[0]);
    
    const coverageRates = filteredPerformance.map((l: any) => 
      (Number(l.days_covered) / totalDays) * 100
    );
    const avgCoverage = coverageRates.reduce((sum: number, rate: number) => sum + rate, 0) / coverageRates.length;
    
    const externalCount = performance?.filter((l: any) => l.location_type === 'external').length || 0;
    const internalCount = performance?.filter((l: any) => l.location_type === 'internal').length || 0;
    
    return {
      topLocation,
      lowCoverageLocation,
      avgCoverage,
      externalCount,
      internalCount,
      totalDays
    };
  }, [filteredPerformance, performance, startDate, endDate]);

  const handleExport = () => {
    if (filteredPerformance && filteredPerformance.length > 0) {
      const formatted = formatLocationPerformanceForExport(filteredPerformance);
      exportToExcel(formatted, `Performance_Locais_${startDate}_${endDate}`, 'Locais');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-4 items-end">
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
          <div className="w-48">
            <Label>Tipo</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="external">Externos</SelectItem>
                <SelectItem value="internal">Internos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isHistorical && (
            <Badge variant="secondary" className="gap-1 h-8">
              <Database className="h-3 w-3" />
              Dados históricos
            </Badge>
          )}
        </div>
        <ExportButton 
          onClick={handleExport} 
          disabled={!filteredPerformance || filteredPerformance.length === 0}
        />
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Local Mais Ativo</CardTitle>
              <MapPin className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{stats.topLocation.location_name}</div>
              <p className="text-xs text-muted-foreground">
                {stats.topLocation.total_assignments} plantões
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menor Cobertura</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{stats.lowCoverageLocation.location_name}</div>
              <p className="text-xs text-muted-foreground">
                {isHistorical 
                  ? `${stats.lowCoverageLocation.total_assignments} plantões`
                  : `${((Number(stats.lowCoverageLocation.days_covered) / stats.totalDays) * 100).toFixed(1)}% cobertura`
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cobertura Média</CardTitle>
              <MapPin className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isHistorical ? 'N/A' : `${stats.avgCoverage.toFixed(1)}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {isHistorical ? 'Dados históricos' : `Dos ${stats.totalDays} dias do período`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distribuição</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Building2 className="h-3 w-3" />
                  {stats.externalCount}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Home className="h-3 w-3" />
                  {stats.internalCount}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Externos vs Internos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="text-center p-8 text-muted-foreground">Carregando...</div>
      ) : filteredPerformance && filteredPerformance.length > 0 ? (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Local</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead className="text-right">Total Plantões</TableHead>
                {!isHistorical && <TableHead className="text-right">Dias Cobertos</TableHead>}
                {!isHistorical && <TableHead className="text-right">Taxa Cobertura</TableHead>}
                <TableHead className="text-right">Corretores</TableHead>
                <TableHead className="text-right">Manhã</TableHead>
                <TableHead className="text-right">Tarde</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPerformance.map((location: any) => {
                const coverageRate = ((Number(location.days_covered) / stats!.totalDays) * 100);
                
                return (
                  <TableRow key={location.location_id}>
                    <TableCell className="font-medium">{location.location_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {location.location_type === 'external' ? (
                          <>
                            <Building2 className="h-3 w-3" />
                            Externo
                          </>
                        ) : (
                          <>
                            <Home className="h-3 w-3" />
                            Interno
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{location.city}</TableCell>
                    <TableCell className="text-right">{location.total_assignments}</TableCell>
                    {!isHistorical && <TableCell className="text-right">{location.days_covered}</TableCell>}
                    {!isHistorical && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{coverageRate.toFixed(1)}%</span>
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${Math.min(coverageRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right">{location.unique_brokers}</TableCell>
                    <TableCell className="text-right">{location.morning_count}</TableCell>
                    <TableCell className="text-right">{location.afternoon_count}</TableCell>
                    <TableCell>
                      {isHistorical ? (
                        <Badge variant="outline">Histórico</Badge>
                      ) : coverageRate < 50 ? (
                        <Badge variant="destructive">Baixa</Badge>
                      ) : coverageRate < 80 ? (
                        <Badge variant="secondary">Média</Badge>
                      ) : (
                        <Badge className="bg-primary text-primary-foreground">Alta</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 text-muted-foreground">
          Nenhum dado encontrado para o período selecionado
        </div>
      )}
    </div>
  );
};
