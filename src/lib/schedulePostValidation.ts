// ═══════════════════════════════════════════════════════════
// VALIDADOR PÓS-GERAÇÃO DE ESCALAS
// Verifica TODAS as regras críticas para cada corretor
// ═══════════════════════════════════════════════════════════

import { format, getDay, differenceInDays, getISOWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface PostValidationViolation {
  rule: string;
  severity: "error" | "warning";
  brokerName: string;
  brokerId: string;
  details: string;
  dates?: string[];
  locations?: string[];
}

export interface UnallocatedDemand {
  locationId: string;
  locationName: string;
  date: string;
  shift: "morning" | "afternoon";
}

export interface PostValidationResult {
  isValid: boolean;
  violations: PostValidationViolation[];
  summary: {
    totalAssignments: number;
    totalBrokers: number;
    errorCount: number;
    warningCount: number;
    unallocatedCount: number;
  };
  brokerReports: BrokerValidationReport[];
  unallocatedDemands: UnallocatedDemand[];
}

export interface BrokerValidationReport {
  brokerId: string;
  brokerName: string;
  totalAssignments: number;
  externalCount: number;
  internalCount: number;
  saturdayCount: number;
  weeklyBreakdown: WeeklyBreakdown[];
  violations: PostValidationViolation[];
}

interface WeeklyBreakdown {
  weekLabel: string;
  weekStart: string;
  externalCount: number;
  internalCount: number;
  saturdayCount: number;
  locations: string[];
  dates: string[];
}

interface Assignment {
  broker_id: string;
  broker_name?: string;
  location_id: string;
  location_name?: string;
  location_type?: string;
  assignment_date: string;
  shift_type: string;
}

interface LocationInfo {
  id: string;
  name: string;
  type: string;
}

interface BrokerInfo {
  id: string;
  name: string;
  availableWeekdays?: string[]; // Para identificar corretores Seg-Dom
}

// ═══════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL DE VALIDAÇÃO
// ═══════════════════════════════════════════════════════════
export function validateGeneratedSchedule(
  assignments: Assignment[],
  brokers: BrokerInfo[],
  locations: LocationInfo[],
  unallocatedDemands: UnallocatedDemand[] = [],
  locationBrokerConfigs?: Map<string, string[]> // Map<locationId, brokerId[]> - corretores CONFIGURADOS por local
): PostValidationResult {
  const violations: PostValidationViolation[] = [];
  const brokerReports: BrokerValidationReport[] = [];

  // Criar mapas para lookup rápido
  const brokerMap = new Map(brokers.map(b => [b.id, b.name]));
  const locationMap = new Map(locations.map(l => [l.id, { name: l.name, type: l.type }]));

  // Agrupar assignments por corretor
  const assignmentsByBroker = new Map<string, Assignment[]>();
  for (const a of assignments) {
    if (!assignmentsByBroker.has(a.broker_id)) {
      assignmentsByBroker.set(a.broker_id, []);
    }
    assignmentsByBroker.get(a.broker_id)!.push(a);
  }

  // Validar cada corretor
  for (const [brokerId, brokerAssignments] of assignmentsByBroker) {
    const brokerName = brokerMap.get(brokerId) || "Desconhecido";
    const brokerViolations: PostValidationViolation[] = [];

    // Enriquecer assignments com nomes
    const enrichedAssignments = brokerAssignments.map(a => ({
      ...a,
      broker_name: brokerName,
      location_name: locationMap.get(a.location_id)?.name || "Desconhecido",
      location_type: locationMap.get(a.location_id)?.type || "external"
    }));

    // Ordenar por data
    enrichedAssignments.sort((a, b) => a.assignment_date.localeCompare(b.assignment_date));

    // ═══════════════════════════════════════════════════════════
    // REGRA 1: Máximo 2 DIAS com externos por semana
    // IMPORTANTE: Conta DIAS únicos, não TURNOS
    // (Manhã + Tarde no mesmo dia = 1 DIA, não 2)
    // NOTA: 3 externos é WARNING, 4+ é ERROR CRÍTICO (nunca deve acontecer)
    // ═══════════════════════════════════════════════════════════
    const weeklyExternals = groupByWeek(enrichedAssignments.filter(a => a.location_type === "external"));
    for (const [weekKey, weekAssignments] of weeklyExternals) {
      // Contar DIAS únicos, não turnos
      const uniqueDays = new Set(weekAssignments.map(a => a.assignment_date));
      const dayCount = uniqueDays.size;
      
      if (dayCount >= 4) {
        // 4+ externos = ERRO CRÍTICO - nunca deve acontecer
        brokerViolations.push({
          rule: "LIMITE_ABSOLUTO_4_EXTERNOS",
          severity: "error",
          brokerName,
          brokerId,
          details: `PROIBIDO: ${brokerName} tem ${dayCount} DIAS com externo na semana ${weekKey} (máximo absoluto: 3). Isso NUNCA deve ocorrer.`,
          dates: [...uniqueDays],
          locations: [...new Set(weekAssignments.map(a => a.location_name!))]
        });
      } else if (dayCount === 3) {
        // 3 externos = Warning (pode ocorrer quando necessário)
        brokerViolations.push({
          rule: "MAX_2_EXTERNOS_SEMANA",
          severity: "warning",
          brokerName,
          brokerId,
          details: `${brokerName} tem ${dayCount} DIAS com externo na semana ${weekKey} (máx ideal: 2 dias) - EXCEDEU LIMITE (alta demanda)`,
          dates: [...uniqueDays],
          locations: [...new Set(weekAssignments.map(a => a.location_name!))]
        });
      }
    }

    // ═══════════════════════════════════════════════════════════
    // REGRA 2: Externos consecutivos - REMOVIDA
    // Dias consecutivos são consequência natural de alta demanda
    // e a regra "2 antes de 3" já garante distribuição equânime
    // ═══════════════════════════════════════════════════════════
    const externalAssignments = enrichedAssignments.filter(a => a.location_type === "external");

    // ═══════════════════════════════════════════════════════════
    // REGRA 3: Sem repetição no mesmo local externo em semanas seguidas
    // NOTA: Aplica-se APENAS ao Artus Vivence - outros locais (como Botanic)
    // podem ter repetição devido ao alto volume de plantões
    // ═══════════════════════════════════════════════════════════
    const externalByLocation = new Map<string, Assignment[]>();
    for (const a of externalAssignments) {
      if (!externalByLocation.has(a.location_id)) {
        externalByLocation.set(a.location_id, []);
      }
      externalByLocation.get(a.location_id)!.push(a);
    }

    for (const [locationId, locAssignments] of externalByLocation) {
      const locationName = locationMap.get(locationId)?.name || "Desconhecido";
      
      // SOMENTE verificar para Artus Vivence - ignorar outros locais
      if (!locationName.toLowerCase().includes('vivence')) {
        continue;
      }
      
      if (locAssignments.length > 1) {
        const weeks = locAssignments.map(a => getWeekNumber(a.assignment_date));
        const uniqueWeeks = [...new Set(weeks)];
        
        // Verificar semanas consecutivas
        uniqueWeeks.sort((a, b) => a - b);
        for (let i = 1; i < uniqueWeeks.length; i++) {
          if (uniqueWeeks[i] - uniqueWeeks[i - 1] === 1) {
            // VERIFICAR SE É O ÚNICO CORRETOR CONFIGURADO PARA ESTE LOCAL
            // Usar locationBrokerConfigs se disponível, senão verificar alocados
            let isOnlyConfigured = false;
            
            if (locationBrokerConfigs) {
              const configuredBrokers = locationBrokerConfigs.get(locationId) || [];
              isOnlyConfigured = configuredBrokers.length === 1 && configuredBrokers[0] === brokerId;
            } else {
              // Fallback: verificar quantos corretores DIFERENTES estão neste local em toda a escala
              const allBrokersForLocation = new Set<string>();
              for (const a of externalAssignments) {
                if (a.location_id === locationId) {
                  allBrokersForLocation.add(a.broker_id);
                }
              }
              isOnlyConfigured = allBrokersForLocation.size === 1;
            }
            
            brokerViolations.push({
              rule: "SEM_REPETICAO_LOCAL_SEMANAS_SEGUIDAS",
              severity: isOnlyConfigured ? "warning" : "error",
              brokerName,
              brokerId,
              details: isOnlyConfigured 
                ? `${brokerName} repetido no ${locationName} em semanas consecutivas (único corretor configurado - inevitável)`
                : `${brokerName} repetido no ${locationName} em semanas consecutivas`,
              dates: locAssignments.map(a => a.assignment_date),
              locations: [locationName]
            });
            break;
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════
    // REGRA 4: Sem sábado E domingo externos na mesma semana
    // ═══════════════════════════════════════════════════════════
    for (const [weekKey, weekAssignments] of weeklyExternals) {
      const days = weekAssignments.map(a => getDay(new Date(a.assignment_date + "T00:00:00")));
      const hasSaturday = days.includes(6);
      const hasSunday = days.includes(0);
      
      if (hasSaturday && hasSunday) {
        brokerViolations.push({
          rule: "SEM_SABADO_DOMINGO_EXTERNOS",
          severity: "error",
          brokerName,
          brokerId,
          details: `${brokerName} com externo sábado E domingo na semana ${weekKey}`,
          dates: weekAssignments.filter(a => [0, 6].includes(getDay(new Date(a.assignment_date + "T00:00:00")))).map(a => a.assignment_date),
          locations: weekAssignments.map(a => a.location_name!)
        });
      }
    }

    // Calcular estatísticas do corretor
    const externalCount = externalAssignments.length;
    const internalAssignments = enrichedAssignments.filter(a => a.location_type === "internal");
    const internalCount = internalAssignments.length;
    const saturdayCount = enrichedAssignments.filter(a => 
      getDay(new Date(a.assignment_date + "T00:00:00")) === 6
    ).length;

    // Gerar breakdown semanal
    const weeklyBreakdown: WeeklyBreakdown[] = [];
    const allByWeek = groupByWeek(enrichedAssignments);
    for (const [weekKey, weekAssignments] of allByWeek) {
      weeklyBreakdown.push({
        weekLabel: weekKey,
        weekStart: weekAssignments[0].assignment_date,
        externalCount: weekAssignments.filter(a => a.location_type === "external").length,
        internalCount: weekAssignments.filter(a => a.location_type === "internal").length,
        saturdayCount: weekAssignments.filter(a => getDay(new Date(a.assignment_date + "T00:00:00")) === 6).length,
        locations: [...new Set(weekAssignments.map(a => a.location_name!))],
        dates: weekAssignments.map(a => a.assignment_date)
      });
    }

    // ═══════════════════════════════════════════════════════════
    // REGRA 5: Rodízio de externos para corretores Seg-Dom
    // Corretores com sábado devem alternar: 1→2→1→2 ou 2→1→2→1
    // ═══════════════════════════════════════════════════════════
    const broker = brokers.find(b => b.id === brokerId);
    const hasSaturday = broker?.availableWeekdays?.includes('saturday');
    
    if (hasSaturday && weeklyBreakdown.length >= 2) {
      // Ordenar semanas por data
      const sortedWeeks = [...weeklyBreakdown].sort((a, b) => 
        a.weekStart.localeCompare(b.weekStart)
      );
      
      // Contar DIAS únicos com externos por semana (não turnos)
      const externalDaysByWeek: { weekLabel: string; dayCount: number }[] = [];
      for (const week of sortedWeeks) {
        const weekExternals = enrichedAssignments.filter(a => 
          a.location_type === "external" && 
          week.dates.includes(a.assignment_date)
        );
        const uniqueDays = new Set(weekExternals.map(a => a.assignment_date));
        externalDaysByWeek.push({ weekLabel: week.weekLabel, dayCount: uniqueDays.size });
      }
      
      // Verificar se há duas semanas consecutivas com o mesmo número de dias externos
      for (let i = 1; i < externalDaysByWeek.length; i++) {
        const prev = externalDaysByWeek[i - 1];
        const curr = externalDaysByWeek[i];
        
        // Se ambas têm 1 dia externo (deveria alternar para 2)
        if (prev.dayCount === 1 && curr.dayCount === 1) {
          brokerViolations.push({
            rule: "RODIZIO_EXTERNOS_NAO_ALTERNADO",
            severity: "warning",
            brokerName,
            brokerId,
            details: `${brokerName} (Seg-Dom) teve 1 dia externo nas semanas ${prev.weekLabel} e ${curr.weekLabel}. Após 1 externo, deveria ter 2.`,
          });
        }
        
        // Se ambas têm 2 dias externos (deveria alternar para 1)
        if (prev.dayCount === 2 && curr.dayCount === 2) {
          brokerViolations.push({
            rule: "RODIZIO_EXTERNOS_NAO_ALTERNADO",
            severity: "warning",
            brokerName,
            brokerId,
            details: `${brokerName} (Seg-Dom) teve 2 dias externos nas semanas ${prev.weekLabel} e ${curr.weekLabel}. Após 2 externos, deveria ter 1.`,
          });
        }
      }
    }

    // ═══════════════════════════════════════════════════════════
    // REGRA 6: Concentração de domingos externos
    // Se um corretor recebeu mais de 50% dos domingos do mês, gerar warning
    // ═══════════════════════════════════════════════════════════
    const sundayExternals = externalAssignments.filter(a => 
      getDay(new Date(a.assignment_date + "T00:00:00")) === 0
    );
    
    if (sundayExternals.length > 0) {
      // Verificar por local - cada local deve ter rotação de domingos
      const sundaysByLocation = new Map<string, Assignment[]>();
      for (const a of sundayExternals) {
        if (!sundaysByLocation.has(a.location_id)) {
          sundaysByLocation.set(a.location_id, []);
        }
        sundaysByLocation.get(a.location_id)!.push(a);
      }
      
      for (const [locationId, locSundays] of sundaysByLocation) {
        const locationName = locationMap.get(locationId)?.name || "Desconhecido";
        // Se o corretor tem mais de 2 domingos no mesmo local, é concentração excessiva
        if (locSundays.length > 2) {
          brokerViolations.push({
            rule: "CONCENTRACAO_DOMINGOS",
            severity: "warning",
            brokerName,
            brokerId,
            details: `${brokerName} recebeu ${locSundays.length} domingos no ${locationName} - deveria haver mais rotação`,
            dates: locSundays.map(a => a.assignment_date),
            locations: [locationName]
          });
        }
      }
    }

    brokerReports.push({
      brokerId,
      brokerName,
      totalAssignments: enrichedAssignments.length,
      externalCount,
      internalCount,
      saturdayCount,
      weeklyBreakdown,
      violations: brokerViolations
    });

    violations.push(...brokerViolations);
  }

  // ═══════════════════════════════════════════════════════════
  // REGRA GLOBAL: DISTRIBUIÇÃO 2-ANTES-DE-3
  // Se um corretor tem 3+ externos enquanto outro tem menos de 2, é ERROR
  // ═══════════════════════════════════════════════════════════
  const externalCountsByBroker = new Map<string, { name: string; count: number }>();
  for (const report of brokerReports) {
    externalCountsByBroker.set(report.brokerId, { 
      name: report.brokerName, 
      count: report.externalCount 
    });
  }
  
  const brokersWithLessThan2: string[] = [];
  const brokersWith3OrMore: string[] = [];
  
  for (const [brokerId, info] of externalCountsByBroker) {
    if (info.count < 2) {
      brokersWithLessThan2.push(`${info.name} (${info.count})`);
    }
    if (info.count >= 3) {
      brokersWith3OrMore.push(`${info.name} (${info.count})`);
    }
  }
  
  if (brokersWith3OrMore.length > 0 && brokersWithLessThan2.length > 0) {
    violations.push({
      rule: "DISTRIBUICAO_2_ANTES_3",
      severity: "error",
      brokerName: "Distribuição Geral",
      brokerId: "",
      details: `Violação da regra 2-antes-de-3: Corretor(es) com 3+ externos [${brokersWith3OrMore.join(", ")}] enquanto outros têm menos de 2 [${brokersWithLessThan2.join(", ")}]`,
      dates: [],
      locations: []
    });
  }

  // Ordenar violations por severidade
  violations.sort((a, b) => {
    if (a.severity === "error" && b.severity !== "error") return -1;
    if (a.severity !== "error" && b.severity === "error") return 1;
    return a.brokerName.localeCompare(b.brokerName);
  });

  const errorCount = violations.filter(v => v.severity === "error").length;
  const warningCount = violations.filter(v => v.severity === "warning").length;
  
  // Adicionar demandas não alocadas como violações
  for (const demand of unallocatedDemands) {
    violations.push({
      rule: "TURNO_NAO_ALOCADO",
      severity: "error",
      brokerName: "—",
      brokerId: "",
      details: `Turno não alocado: ${demand.locationName} - ${demand.date} (${demand.shift === "morning" ? "Manhã" : "Tarde"})`,
      dates: [demand.date],
      locations: [demand.locationName]
    });
  }
  
  const totalErrors = errorCount + unallocatedDemands.length;

  return {
    isValid: totalErrors === 0,
    violations,
    summary: {
      totalAssignments: assignments.length,
      totalBrokers: assignmentsByBroker.size,
      errorCount: totalErrors,
      warningCount,
      unallocatedCount: unallocatedDemands.length
    },
    brokerReports,
    unallocatedDemands
  };
}

// ═══════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════

// Usa semana ISO (segunda-feira como início da semana)
function getWeekNumber(dateStr: string): number {
  const date = new Date(dateStr + "T00:00:00");
  return getISOWeek(date);
}

function groupByWeek(assignments: Assignment[]): Map<string, Assignment[]> {
  const result = new Map<string, Assignment[]>();
  
  for (const a of assignments) {
    const date = new Date(a.assignment_date + "T00:00:00");
    const weekNum = getWeekNumber(a.assignment_date);
    const weekKey = `S${weekNum}`;
    
    if (!result.has(weekKey)) {
      result.set(weekKey, []);
    }
    result.get(weekKey)!.push(a);
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════
// FUNÇÃO PARA GERAR RELATÓRIO LEGÍVEL
// ═══════════════════════════════════════════════════════════
export function generateValidationReport(result: PostValidationResult): string {
  const lines: string[] = [];
  
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("           RELATÓRIO DE VALIDAÇÃO PÓS-GERAÇÃO              ");
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("");
  lines.push(`📊 RESUMO:`);
  lines.push(`   Total de alocações: ${result.summary.totalAssignments}`);
  lines.push(`   Total de corretores: ${result.summary.totalBrokers}`);
  lines.push(`   Erros encontrados: ${result.summary.errorCount}`);
  lines.push(`   Avisos encontrados: ${result.summary.warningCount}`);
  lines.push(`   Status: ${result.isValid ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`);
  lines.push("");

  if (result.violations.length > 0) {
    lines.push("═══════════════════════════════════════════════════════════");
    lines.push("                      VIOLAÇÕES                            ");
    lines.push("═══════════════════════════════════════════════════════════");
    
    for (const v of result.violations) {
      const icon = v.severity === "error" ? "❌" : "⚠️";
      lines.push(`${icon} [${v.rule}] ${v.details}`);
      if (v.dates && v.dates.length > 0) {
        lines.push(`   Datas: ${v.dates.join(", ")}`);
      }
      if (v.locations && v.locations.length > 0) {
        lines.push(`   Locais: ${v.locations.join(", ")}`);
      }
      lines.push("");
    }
  }

  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("               RELATÓRIO POR CORRETOR                      ");
  lines.push("═══════════════════════════════════════════════════════════");

  for (const report of result.brokerReports) {
    const hasErrors = report.violations.some(v => v.severity === "error");
    const icon = hasErrors ? "❌" : "✅";
    
    lines.push("");
    lines.push(`${icon} ${report.brokerName}`);
    lines.push(`   Total: ${report.totalAssignments} | Externos: ${report.externalCount} | Internos: ${report.internalCount} | Sábados: ${report.saturdayCount}`);
    
    for (const week of report.weeklyBreakdown) {
      lines.push(`   ${week.weekLabel}: ${week.externalCount} ext, ${week.internalCount} int | ${week.locations.join(", ")}`);
    }
    
    if (report.violations.length > 0) {
      lines.push(`   ⚠️ Violações: ${report.violations.length}`);
      for (const v of report.violations) {
        lines.push(`      - ${v.rule}: ${v.details}`);
      }
    }
  }

  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════
// FUNÇÃO PARA LOG NO CONSOLE
// ═══════════════════════════════════════════════════════════
export function logValidationResult(result: PostValidationResult): void {
  console.log("\n" + generateValidationReport(result));
}
