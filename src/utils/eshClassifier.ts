import { EshClassification, Measurement } from '../types';

export function classifyBloodPressure(tas: number, tad: number): EshClassification {
  if (tas >= 180 || tad >= 110) {
    return {
      category: 'hipertension_3',
      label: 'Hipertensión Grado 3',
      guide: 'Guía ESH 2023',
      description: 'Valores severamente elevados. Requiere atención clínica prioritaria.',
      badgeBg: 'bg-rose-50 text-rose-900 border border-rose-200',
      badgeText: 'text-rose-700',
      dotColor: 'bg-rose-600',
    };
  }

  if (tas >= 160 || tad >= 100) {
    return {
      category: 'hipertension_2',
      label: 'Hipertensión Grado 2',
      guide: 'Guía ESH 2023',
      description: 'Valores elevados. Continúa con la monitorización y sigue la pauta prescrita.',
      badgeBg: 'bg-orange-50 text-orange-900 border border-orange-200',
      badgeText: 'text-orange-700',
      dotColor: 'bg-orange-600',
    };
  }

  if (tas >= 140 || tad >= 90) {
    return {
      category: 'hipertension_1',
      label: 'Hipertensión Grado 1',
      guide: 'Guía ESH 2023',
      description: 'Valores moderadamente elevados según criterio clínico. Mantén el registro constante.',
      badgeBg: 'bg-amber-50 text-amber-900 border border-amber-200',
      badgeText: 'text-amber-700',
      dotColor: 'bg-amber-500',
    };
  }

  if (tas >= 130 || tad >= 85) {
    return {
      category: 'normal_alta',
      label: 'Presión Normal Alta',
      guide: 'Guía ESH 2023',
      description: 'En el límite superior del rango fisiológico normal. Vigila hábitos y descanso.',
      badgeBg: 'bg-sky-50 text-sky-900 border border-sky-200',
      badgeText: 'text-sky-700',
      dotColor: 'bg-sky-500',
    };
  }

  if (tas >= 120 || tad >= 80) {
    return {
      category: 'normal',
      label: 'Normal / Saludable',
      guide: 'Guía ESH 2023',
      description: 'Valores dentro del rango fisiológico normal. Continúa con tu hábito.',
      badgeBg: 'bg-blue-50/80 text-slate-800 border border-blue-100',
      badgeText: 'text-teal-700',
      dotColor: 'bg-teal-600',
    };
  }

  return {
    category: 'optima',
    label: 'Tensión Óptima',
    guide: 'Guía ESH 2023',
    description: 'Valores óptimos de protección cardiovascular. Excelente control.',
    badgeBg: 'bg-emerald-50 text-emerald-900 border border-emerald-200',
    badgeText: 'text-emerald-700',
    dotColor: 'bg-emerald-600',
  };
}

export function isOverHomeThreshold(tas: number, tad: number): boolean {
  // Clinical threshold for AMPA (Home BP Monitoring)
  return tas >= 135 || tad >= 85;
}

export function calculateStats(measurements: Measurement[]) {
  if (measurements.length === 0) {
    return {
      tasMedia: 0,
      tadMedia: 0,
      pulseMedia: 0,
      cargaHipertensiva: 0,
      overLimitCount: 0,
      totalCount: 0,
    };
  }

  const totalTas = measurements.reduce((acc, m) => acc + m.tas, 0);
  const totalTad = measurements.reduce((acc, m) => acc + m.tad, 0);
  const pulseMeasurements = measurements.filter(m => m.pulse && m.pulse > 0);
  const totalPulse = pulseMeasurements.reduce((acc, m) => acc + (m.pulse || 0), 0);

  const overLimitCount = measurements.filter(m => isOverHomeThreshold(m.tas, m.tad)).length;

  return {
    tasMedia: Math.round(totalTas / measurements.length),
    tadMedia: Math.round(totalTad / measurements.length),
    pulseMedia: pulseMeasurements.length > 0 ? Math.round(totalPulse / pulseMeasurements.length) : 70,
    cargaHipertensiva: Math.round((overLimitCount / measurements.length) * 100),
    overLimitCount,
    totalCount: measurements.length,
  };
}
