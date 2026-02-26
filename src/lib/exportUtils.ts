import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Dados') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const formatBrokerPerformanceForExport = (data: any[]) => {
  return data.map(item => ({
    'Corretor': item.broker_name,
    'Total Plantões': item.total_assignments,
    'Manhã': item.morning_count,
    'Tarde': item.afternoon_count,
    'Locais Únicos': item.unique_locations,
    'Último Plantão': item.last_assignment ? new Date(item.last_assignment).toLocaleDateString('pt-BR') : 'N/A'
  }));
};

export const formatLocationPerformanceForExport = (data: any[]) => {
  return data.map(item => ({
    'Local': item.location_name,
    'Tipo': item.location_type === 'external' ? 'Externo' : 'Interno',
    'Cidade': item.city,
    'Estado': item.state,
    'Total Plantões': item.total_assignments,
    'Dias Cobertos': item.days_covered,
    'Corretores Únicos': item.unique_brokers,
    'Manhã': item.morning_count,
    'Tarde': item.afternoon_count
  }));
};

export const formatWeekdayDistributionForExport = (data: any[]) => {
  return data.map(item => ({
    'Dia da Semana': item.weekday_name,
    'Total Plantões': item.total_assignments,
    'Manhã': item.morning_count,
    'Tarde': item.afternoon_count,
    '% do Total': ((item.total_assignments / data.reduce((sum, d) => sum + Number(d.total_assignments), 0)) * 100).toFixed(1) + '%'
  }));
};

export const formatBasicQueryForExport = (data: any[], type: 'broker' | 'location') => {
  if (type === 'broker') {
    return data.map(item => ({
      'Data': new Date(item.assignment_date + 'T00:00:00').toLocaleDateString('pt-BR'),
      'Local': item.location?.name || 'N/A',
      'Endereço': `${item.location?.street}, ${item.location?.number} - ${item.location?.city}/${item.location?.state}`,
      'Turno': item.shift_type === 'morning' ? 'Manhã' : 'Tarde',
      'Horário': `${item.start_time?.substring(0, 5)} - ${item.end_time?.substring(0, 5)}`
    }));
  } else {
    return data.map(item => ({
      'Data': new Date(item.assignment_date + 'T00:00:00').toLocaleDateString('pt-BR'),
      'Corretor': item.broker?.name || 'N/A',
      'CRECI': item.broker?.creci || 'N/A',
      'Turno': item.shift_type === 'morning' ? 'Manhã' : 'Tarde',
      'Horário': `${item.start_time?.substring(0, 5)} - ${item.end_time?.substring(0, 5)}`
    }));
  }
};
