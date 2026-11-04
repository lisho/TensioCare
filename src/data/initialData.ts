import { Cycle, DoctorNote, Measurement, UserProfile } from '../types';

export const initialMeasurements: Measurement[] = [];

export const initialCycles: Cycle[] = [
  {
    id: 'ciclo-actual',
    title: 'Control Semanal AMPA (7 Días)',
    dateRange: 'Semana Actual',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
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
  doctorName: 'Dr. Manuel Varela',
  specialty: 'Cardiología',
  date: 'Pendiente de revisión',
  content: 'Pauta de inicio de automonitorización de presión arterial (AMPA). Registrar dos tomas diarias (matutina en ayunas y vespertina antes de cenar) durante 7 días consecutivos para valoración clínica.',
  adherence: 'Protocolo recién iniciado: 0 de 14 tomas',
};

export const initialUserProfile: UserProfile = {
  name: 'Carlos Méndez',
  age: 58,
  dni: '***4582-K',
  doctor: 'Dr. Manuel Varela',
  clinic: 'Hospital Universitario Clínico - Consulta Externa Cardiología',
  currentMedication: 'Enalapril 10mg (1 comprimido matutino en ayunas)',
  protocol: 'AMPA 7 Días (ESH/ESC 2023)',
};

export const userProfileData = initialUserProfile;
