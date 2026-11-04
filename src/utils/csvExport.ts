import { Cycle, Measurement } from '../types';
import { userProfileData } from '../data/initialData';

export function downloadMeasurementsCsv(cycle: Cycle, measurements: Measurement[]) {
  const headers = [
    'ID_Registro',
    'Fecha',
    'Hora',
    'Momento',
    'Sistolica_TAS_mmHg',
    'Diastolica_TAD_mmHg',
    'Pulso_ppm',
    'Brazo',
    'Factores_Contexto',
    'Limite_AMPA_Superado',
    'Notas_Clinicas',
  ];

  const rows = measurements.map((m) => {
    const isOver = m.tas >= 135 || m.tad >= 85 ? 'SI (>135/85)' : 'NO';
    const contextStr = `"${m.context.join('; ')}"`;
    const notesStr = `"${m.notes || ''}"`;

    return [
      m.id,
      m.date,
      m.time,
      m.timeOfDay === 'manana' ? 'Mañana (AM)' : 'Noche (PM)',
      m.tas,
      m.tad,
      m.pulse || 68,
      m.arm,
      contextStr,
      isOver,
      notesStr,
    ].join(',');
  });

  const metadataRows = [
    `# Informe AMPA TensioCare - Automonitorizacion de Presion Arterial`,
    `# Paciente: ${userProfileData.name} - Edad: ${userProfileData.age}`,
    `# Medico Responsable: ${userProfileData.doctor}`,
    `# Protocolo: ${cycle.title} (${cycle.dateRange})`,
    `# Criterio: Guia ESH/ESC 2023`,
    '',
  ];

  const csvContent = [...metadataRows, headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `tensiocare_informe_ampa_${cycle.startDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
