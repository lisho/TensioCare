export type TabType = 'hoy' | 'registrar' | 'periodos' | 'reporte';

export type TimeOfDay = 'manana' | 'noche';

export interface Measurement {
  id: string;
  periodId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timeOfDay: TimeOfDay;
  tas: number; // Systolic mmHg
  tad: number; // Diastolic mmHg
  pulse?: number; // Heart rate ppm
  arm: 'Brazo Izq.' | 'Brazo Der.';
  context: string[];
  notes?: string;
  isOverLimit?: boolean; // ESH home limit TAS >= 135 or TAD >= 85
}

export type EshCategory = 
  | 'optima'
  | 'normal'
  | 'normal_alta'
  | 'hipertension_1'
  | 'hipertension_2'
  | 'hipertension_3';

export interface EshClassification {
  category: EshCategory;
  label: string;
  guide: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
}

export interface Cycle {
  id: string;
  title: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  status: 'en_curso' | 'finalizado' | 'completado_100';
  statusLabel: string;
  dayProgress: string; // e.g. "Día 5 de 7"
  progressPercent: number; // 71%
  completedTakes: number;
  totalTakes: number;
  morningAvg: {
    tas: number;
    tad: number;
    label: string;
  };
  nightAvg: {
    tas: number;
    tad: number;
    label: string;
  };
  overallAvg: {
    tas: number;
    tad: number;
  };
  classificationTag: string;
  measurements: Measurement[];
}

export interface DoctorNote {
  doctorName: string;
  specialty: string;
  date: string;
  content: string;
  adherence: string;
}

export interface UserProfile {
  name: string;
  age: number;
  dni: string;
  doctor: string;
  clinic: string;
  currentMedication: string;
  protocol: string;
}

