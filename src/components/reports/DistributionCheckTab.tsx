import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportButton } from "./ExportButton";
import { exportToExcel } from "@/lib/exportUtils";
import { AlertTriangle, CheckCircle, Users, Building2, Calendar, Sun, Moon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

interface DistributionCheckTabProps {
  enabled: boolean;
}

interface BrokerDistribution {
  broker_id: string;
  broker_name: string;
  total: number;
  external_count: number;
  internal_count: number;
  morning_count: number;
  afternoon_count: number;
  saturday_count: number;
  sunday_count: number;
}

interface BrokerLocationMatrix {
  broker_id: string;
  broker_name: string;
  location_id: string;
  location_name: string;
  location_type: string;
  times: number;
}

interface WeeklyDistribution {
  week_number: number;
  week_start: string;
  week_end: string;
  total: number;
  external_count: number;
  internal_count: number;
  saturday_count: number;
  sunday_count: number;
}

interface Alert {
  type: 'error' | 'warning' | 'info';
  message: string;
  broker?: string;
}

export const DistributionCheckTab = ({ enabled }: DistributionCheckTabProps) => {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [showLocationMatrix, setShowLocationMatrix] = useState(false);

  // Generate month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: ptBR })
      });
    }
    return options;
  }, []);

  const startDate = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
  }, [selectedMonth]);

  const endDate = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
  }, [selectedMonth]);

  // Query 1: Broker distribution
  const { data: brokerDistribution, isLoading: loadingBrokers } = useQuery({
    queryKey: ['distribution-brokers', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_assignments')
        .select(`
          broker_id,
          broker:brokers!inner(name),
          location:locations!inner(location_type),
          shift_type,
          assignment_date
        `)
        .gte('assignment_date', startDate)
        .lte('assignment_date', endDate);

      if (error) throw error;

      const brokerMap = new Map<string, BrokerDistribution>();

      data?.forEach((row: any) => {
        const brokerId = row.broker_id;
        const brokerName = row.broker?.name || 'N/A';
        const locationType = row.location?.location_type;
        const shiftType = row.shift_type;
        const dayOfWeek = getDay(new Date(row.assignment_date + 'T12:00:00'));

        if (!brokerMap.has(brokerId)) {
          brokerMap.set(brokerId, {
            broker_id: brokerId,
            broker_name: brokerName,
            total: 0,
            external_count: 0,
            internal_count: 0,
            morning_count: 0,
            afternoon_count: 0,
            saturday_count: 0,
            sunday_count: 0
          });
        }

        const broker = brokerMap.get(brokerId)!;
        broker.total++;
        if (locationType === 'external') broker.external_count++;
        if (locationType === 'internal') broker.internal_count++;
        if (shiftType === 'morning') broker.morning_count++;
        if (shiftType === 'afternoon') broker.afternoon_count++;
        if (dayOfWeek === 6) broker.saturday_count++;
        if (dayOfWeek === 0) broker.sunday_count++;
      });

      return Array.from(brokerMap.values()).sort((a, b) => a.broker_name.localeCompare(b.broker_name));
    },
    enabled
  });

  // Query 2: Broker x Location matrix (lazy loaded)
  const { data: locationMatrix, isLoading: loadingMatrix } = useQuery({
    queryKey: ['distribution-matrix', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_assignments')
        .select(`
          broker_id,
          broker:brokers!inner(name),
          location_id,
          location:locations!inner(name, location_type)
        `)
        .gte('assignment_date', startDate)
        .lte('assignment_date', endDate);

      if (error) throw error;

      const matrixMap = new Map<string, BrokerLocationMatrix>();

      data?.forEach((row: any) => {
        const key = `${row.broker_id}-${row.location_id}`;
        if (!matrixMap.has(key)) {
          matrixMap.set(key, {
            broker_id: row.broker_id,
            broker_name: row.broker?.name || 'N/A',
            location_id: row.location_id,
            location_name: row.location?.name || 'N/A',
            location_type: row.location?.location_type || 'N/A',
            times: 0
          });
        }
        matrixMap.get(key)!.times++;
      });

      return Array.from(matrixMap.values());
    },
    enabled: enabled && showLocationMatrix // Only load when expanded
  });

  // Query 4: Brokers registered for external locations
  const { data: brokersWithExternalLocations } = useQuery({
    queryKey: ['brokers-external-registrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('location_brokers')
        .select(`
          broker_id,
          locations!inner(location_type)
        `)
        .eq('locations.location_type', 'external');

      if (error) throw error;
      
      return new Set(data?.map(d => d.broker_id) || []);
    },
    enabled
  });

  // Query 3: Weekly distribution
  const { data: weeklyDistribution, isLoading: loadingWeekly } = useQuery({
    queryKey: ['distribution-weekly', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_assignments')
        .select(`
          assignment_date,
          location:locations!inner(location_type)
        `)
        .gte('assignment_date', startDate)
        .lte('assignment_date', endDate);

      if (error) throw error;

      const [year, month] = selectedMonth.split('-').map(Number);
      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(new Date(year, month - 1));
      
      const weeks = eachWeekOfInterval(
        { start: monthStart, end: monthEnd },
        { weekStartsOn: 1 }
      );

      const weeklyMap = new Map<number, WeeklyDistribution>();

      weeks.forEach((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        weeklyMap.set(index + 1, {
          week_number: index + 1,
          week_start: format(weekStart, 'dd/MM'),
          week_end: format(weekEnd, 'dd/MM'),
          total: 0,
          external_count: 0,
          internal_count: 0,
          saturday_count: 0,
          sunday_count: 0
        });
      });

      data?.forEach((row: any) => {
        const assignmentDate = new Date(row.assignment_date + 'T12:00:00');
        const dayOfWeek = getDay(assignmentDate);
        const locationType = row.location?.location_type;

        // Find which week this assignment belongs to
        weeks.forEach((weekStart, index) => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          if (assignmentDate >= weekStart && assignmentDate <= weekEnd) {
            const week = weeklyMap.get(index + 1)!;
            week.total++;
            if (locationType === 'external') week.external_count++;
            if (locationType === 'internal') week.internal_count++;
            if (dayOfWeek === 6) week.saturday_count++;
            if (dayOfWeek === 0) week.sunday_count++;
          }
        });
      });

      return Array.from(weeklyMap.values());
    },
    enabled
  });

  // Calculate statistics and alerts
  const stats = useMemo(() => {
    if (!brokerDistribution?.length) return null;

    const externals = brokerDistribution.map(b => b.external_count);
    const saturdays = brokerDistribution.map(b => b.saturday_count);
    const sundays = brokerDistribution.map(b => b.sunday_count);
    const totals = brokerDistribution.map(b => b.total);

    const avgExternal = externals.reduce((a, b) => a + b, 0) / externals.length;
    const avgSaturday = saturdays.reduce((a, b) => a + b, 0) / saturdays.length;
    const avgSunday = sundays.reduce((a, b) => a + b, 0) / sundays.length;
    const avgTotal = totals.reduce((a, b) => a + b, 0) / totals.length;

    return {
      totalAssignments: totals.reduce((a, b) => a + b, 0),
      avgExternal: avgExternal.toFixed(1),
      avgSaturday: avgSaturday.toFixed(1),
      avgSunday: avgSunday.toFixed(1),
      avgTotal: avgTotal.toFixed(1),
      externalVariance: Math.max(...externals) - Math.min(...externals),
      saturdayVariance: Math.max(...saturdays) - Math.min(...saturdays),
      sundayVariance: Math.max(...sundays) - Math.min(...sundays),
      minExternal: Math.min(...externals),
      maxExternal: Math.max(...externals),
      minSaturday: Math.min(...saturdays),
      maxSaturday: Math.max(...saturdays),
      minSunday: Math.min(...sundays),
      maxSunday: Math.max(...sundays),
    };
  }, [brokerDistribution]);

  // Generate alerts
  const alerts = useMemo(() => {
    if (!brokerDistribution?.length) return [];

    const alertList: Alert[] = [];

    // Check "2 before 3" rule - ONLY for brokers registered for external locations
    if (brokersWithExternalLocations && brokersWithExternalLocations.size > 0) {
      const brokersEligibleForExternal = brokerDistribution.filter(
        b => brokersWithExternalLocations.has(b.broker_id)
      );
      
      const brokersWithFewExternals = brokersEligibleForExternal.filter(b => b.external_count < 2);
      const brokersWithManyExternals = brokersEligibleForExternal.filter(b => b.external_count >= 3);
      
      if (brokersWithFewExternals.length > 0 && brokersWithManyExternals.length > 0) {
        brokersWithManyExternals.forEach(b => {
          alertList.push({
            type: 'warning',
            message: `${b.broker_name} tem ${b.external_count} externos enquanto outros cadastrados têm menos de 2`,
            broker: b.broker_name
          });
        });
      }
    }

    // Check Saturday imbalance - only for brokers with saturday availability
    // (simplified: just check if there's a big disparity in the distribution)
    const brokersWithSaturdays = brokerDistribution.filter(b => b.saturday_count > 0);
    const maxSaturdays = Math.max(...brokerDistribution.map(b => b.saturday_count));
    const minSaturdaysAmongActive = brokersWithSaturdays.length > 0 
      ? Math.min(...brokersWithSaturdays.map(b => b.saturday_count))
      : 0;
    
    if (maxSaturdays >= 5 && minSaturdaysAmongActive < 2 && brokersWithSaturdays.length > 1) {
      brokerDistribution.filter(b => b.saturday_count >= 5).forEach(b => {
        alertList.push({
          type: 'warning',
          message: `${b.broker_name} tem ${b.saturday_count} sábados (verificar distribuição)`,
          broker: b.broker_name
        });
      });
    }

    // Check location concentration (only when matrix is loaded)
    if (locationMatrix?.length) {
      const locations = [...new Set(locationMatrix.map(m => m.location_name))];
      locations.forEach(loc => {
        const locAssignments = locationMatrix.filter(m => m.location_name === loc);
        const avgForLoc = locAssignments.reduce((a, b) => a + b.times, 0) / locAssignments.length;
        
        locAssignments.forEach(m => {
          if (m.times > avgForLoc * 2 && m.times >= 5) {
            alertList.push({
              type: 'warning',
              message: `${m.broker_name} tem ${m.times} plantões em ${loc} (média: ${avgForLoc.toFixed(1)})`,
              broker: m.broker_name
            });
          }
        });
      });
    }

    // Check total imbalance
    const avgTotal = brokerDistribution.reduce((a, b) => a + b.total, 0) / brokerDistribution.length;
    brokerDistribution.forEach(b => {
      if (b.total < avgTotal * 0.5) {
        alertList.push({
          type: 'warning',
          message: `${b.broker_name} tem apenas ${b.total} plantões totais (média: ${avgTotal.toFixed(0)})`,
          broker: b.broker_name
        });
      }
    });

    return alertList;
  }, [brokerDistribution, locationMatrix, brokersWithExternalLocations]);

  // Get overall status
  const overallStatus = useMemo(() => {
    if (!stats) return { label: 'Carregando...', color: 'bg-muted' };
    
    const errorAlerts = alerts.filter(a => a.type === 'error').length;
    const warningAlerts = alerts.filter(a => a.type === 'warning').length;
    
    if (errorAlerts > 0) return { label: 'Desbalanceado', color: 'bg-destructive' };
    if (warningAlerts > 3) return { label: 'Atenção', color: 'bg-yellow-500' };
    return { label: 'Equilibrado', color: 'bg-green-500' };
  }, [stats, alerts]);

  // Build broker x location pivot table
  const pivotData = useMemo(() => {
    if (!locationMatrix?.length) return { brokers: [], locations: [], matrix: new Map() };

    const brokers = [...new Set(locationMatrix.map(m => m.broker_name))].sort();
    const locations = [...new Set(locationMatrix.map(m => m.location_name))].sort();
    const matrix = new Map<string, number>();

    locationMatrix.forEach(m => {
      matrix.set(`${m.broker_name}-${m.location_name}`, m.times);
    });

    return { brokers, locations, matrix };
  }, [locationMatrix]);

  // Get row status for broker
  const getBrokerStatus = (broker: BrokerDistribution) => {
    if (!stats) return 'neutral';
    
    // Check if broker is registered for external locations
    const isRegisteredForExternal = brokersWithExternalLocations?.has(broker.broker_id);
    
    // Only flag external issues for brokers registered for external locations
    if (isRegisteredForExternal) {
      const eligibleBrokers = brokerDistribution?.filter(b => brokersWithExternalLocations?.has(b.broker_id)) || [];
      const minExternalAmongEligible = eligibleBrokers.length > 0 
        ? Math.min(...eligibleBrokers.map(b => b.external_count))
        : 0;
      
      if (broker.external_count >= 3 && minExternalAmongEligible < 2) return 'warning';
    }
    
    return 'ok';
  };

  // Check if broker is registered for external locations
  const isBrokerRegisteredForExternal = (brokerId: string) => {
    return brokersWithExternalLocations?.has(brokerId) ?? false;
  };

  // Export functions
  const handleExportBrokers = () => {
    if (!brokerDistribution) return;
    const data = brokerDistribution.map(b => ({
      'Corretor': b.broker_name,
      'Total': b.total,
      'Externos': b.external_count,
      'Internos': b.internal_count,
      'Manhã': b.morning_count,
      'Tarde': b.afternoon_count,
      'Sábados': b.saturday_count,
      'Domingos': b.sunday_count
    }));
    exportToExcel(data, `distribuicao_corretores_${selectedMonth}`, 'Corretores');
  };

  const handleExportMatrix = () => {
    if (!locationMatrix) return;
    const data = locationMatrix.map(m => ({
      'Corretor': m.broker_name,
      'Local': m.location_name,
      'Tipo': m.location_type === 'external' ? 'Externo' : 'Interno',
      'Quantidade': m.times
    }));
    exportToExcel(data, `matriz_corretor_local_${selectedMonth}`, 'Matriz');
  };

  const handleExportWeekly = () => {
    if (!weeklyDistribution) return;
    const data = weeklyDistribution.map(w => ({
      'Semana': w.week_number,
      'Período': `${w.week_start} - ${w.week_end}`,
      'Total': w.total,
      'Externos': w.external_count,
      'Internos': w.internal_count,
      'Sábados': w.saturday_count,
      'Domingos': w.sunday_count
    }));
    exportToExcel(data, `distribuicao_semanal_${selectedMonth}`, 'Semanal');
  };

  // Only wait for main queries, not lazy-loaded matrix
  const isLoading = loadingBrokers || loadingWeekly;

  if (!enabled) return null;

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Badge className={`${overallStatus.color} text-white`}>
            {overallStatus.label}
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Plantões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalAssignments || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Média/corretor: {stats?.avgTotal || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Externos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.minExternal}-{stats?.maxExternal}</div>
                <p className="text-xs text-muted-foreground">
                  Variância: {stats?.externalVariance || 0} | Média: {stats?.avgExternal || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Sábados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.minSaturday}-{stats?.maxSaturday}</div>
                <p className="text-xs text-muted-foreground">
                  Variância: {stats?.saturdayVariance || 0} | Média: {stats?.avgSaturday || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Domingos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.minSunday}-{stats?.maxSunday}</div>
                <p className="text-xs text-muted-foreground">
                  Variância: {stats?.sundayVariance || 0} | Média: {stats?.avgSunday || 0}
                </p>
              </CardContent>
            </Card>

            <Card className={alerts.filter(a => a.type === 'error').length > 0 ? 'border-destructive' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alerts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {alerts.filter(a => a.type === 'error').length} erros, {alerts.filter(a => a.type === 'warning').length} avisos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Alertas de Desbalanceamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {alerts.map((alert, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      {alert.type === 'error' ? (
                        <span className="w-2 h-2 rounded-full bg-destructive" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      )}
                      <span className="text-sm">{alert.message}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Broker Distribution Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Distribuição por Corretor</CardTitle>
              <ExportButton onClick={handleExportBrokers} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Corretor</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Externos</TableHead>
                    <TableHead className="text-center">Internos</TableHead>
                    <TableHead className="text-center">Manhã</TableHead>
                    <TableHead className="text-center">Tarde</TableHead>
                    <TableHead className="text-center">Sábados</TableHead>
                    <TableHead className="text-center">Domingos</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brokerDistribution?.map(broker => {
                    const status = getBrokerStatus(broker);
                    return (
                      <TableRow key={broker.broker_id} className={
                        status === 'warning' ? 'bg-yellow-500/10' : ''
                      }>
                        <TableCell className="font-medium">{broker.broker_name}</TableCell>
                        <TableCell className="text-center">{broker.total}</TableCell>
                        <TableCell className="text-center font-semibold">
                          {isBrokerRegisteredForExternal(broker.broker_id) ? (
                            broker.external_count
                          ) : (
                            <span className="text-muted-foreground" title="Não cadastrado em locais externos">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{broker.internal_count}</TableCell>
                        <TableCell className="text-center">{broker.morning_count}</TableCell>
                        <TableCell className="text-center">{broker.afternoon_count}</TableCell>
                        <TableCell className="text-center">{broker.saturday_count}</TableCell>
                        <TableCell className="text-center">{broker.sunday_count}</TableCell>
                        <TableCell className="text-center">
                          {status === 'warning' ? (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">Atenção</Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-600">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Weekly Distribution */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Distribuição Semanal</CardTitle>
              <ExportButton onClick={handleExportWeekly} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Semana</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Externos</TableHead>
                    <TableHead className="text-center">Internos</TableHead>
                    <TableHead className="text-center">Sábados</TableHead>
                    <TableHead className="text-center">Domingos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyDistribution?.map(week => (
                    <TableRow key={week.week_number}>
                      <TableCell className="font-medium">Semana {week.week_number}</TableCell>
                      <TableCell>{week.week_start} - {week.week_end}</TableCell>
                      <TableCell className="text-center">{week.total}</TableCell>
                      <TableCell className="text-center">{week.external_count}</TableCell>
                      <TableCell className="text-center">{week.internal_count}</TableCell>
                      <TableCell className="text-center">{week.saturday_count}</TableCell>
                      <TableCell className="text-center">{week.sunday_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Broker x Location Matrix (Collapsible) */}
          <Card>
            <Collapsible open={showLocationMatrix} onOpenChange={setShowLocationMatrix}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary">
                  {showLocationMatrix ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <CardTitle>Matriz Corretor x Local</CardTitle>
                </CollapsibleTrigger>
                <ExportButton onClick={handleExportMatrix} />
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-background">Corretor</TableHead>
                          {pivotData.locations.map(loc => (
                            <TableHead key={loc} className="text-center whitespace-nowrap text-xs">
                              {loc}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pivotData.brokers.map(broker => (
                          <TableRow key={broker}>
                            <TableCell className="sticky left-0 bg-background font-medium whitespace-nowrap">
                              {broker}
                            </TableCell>
                            {pivotData.locations.map(loc => {
                              const count = pivotData.matrix.get(`${broker}-${loc}`) || 0;
                              const locItems = locationMatrix?.filter(m => m.location_name === loc) || [];
                              const avgForLoc = locItems.length > 0 
                                ? locItems.reduce((a, b) => a + b.times, 0) / locItems.length 
                                : 0;
                              const isHigh = count > avgForLoc * 1.5 && count >= 3;
                              
                              return (
                                <TableCell 
                                  key={loc} 
                                  className={`text-center ${
                                    isHigh ? 'bg-yellow-100 dark:bg-yellow-900/20 font-semibold' : 
                                    count === 0 ? 'text-muted-foreground' : ''
                                  }`}
                                >
                                  {count || '-'}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </>
      )}
    </div>
  );
};
