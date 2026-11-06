import { Cycle, DoctorNote, Measurement, UserProfile } from '../types';
import { getLocalDateString } from '../utils/dateUtils';

export const initialMeasurements: Measurement[] = [];

export const initialCycles: Cycle[] = [
  {
    id: 'ciclo-actual',
    title: 'Control Semanal AMPA (7 Días)',
    dateRange: 'Semana Actual',
    startDate: getLocalDateString(),
    endDate: getLocalDateString(new Date(Date.now() + 7 * 86400000)),
    status: 'en_curso',
    statusLabel: 'En curso',
    dayProgress: 'Día 1 de 7',
    progressPercent: 0,
    completedTakes: 0,
    totalTakes: 14,
    morningAvg: {
      tas: 0,
      tad: 0,
      label: 'Sin registros',
    },
    nightAvg: {
      tas: 0,
      tad: 0,
      label: 'Sin registros',
    },
    overallAvg: {
      tas: 0,
      tad: 0,
    },
    classificationTag: 'Iniciando',
    measurements: [],
  },
];

export const initialDoctorNote: DoctorNote = {
  doctorName: '',
  specialty: '',
  date: '',
  content: '',
  adherence: '',
};

export const initialUserProfile: UserProfile = {
  name: 'Carlos Méndez',
  age: 58,
  dni: '***4582-K',
  doctor: '',
  clinic: '',
  currentMedication: 'Enalapril 10mg (1 comprimido matutino en ayunas)',
  protocol: 'AMPA 7 Días (ESH/ESC 2023)',
};

export const userProfileData = initialUserProfile;
