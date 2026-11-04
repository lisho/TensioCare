import { Cycle, DoctorNote, Measurement, UserProfile } from '../types';

const VAULT_STORAGE_KEY = 'tensiocare_vault_data_v1';

export interface AppVaultData {
  cycles: Cycle[];
  measurements: Measurement[];
  doctorNote: DoctorNote;
  userProfile: UserProfile;
  lastSavedAt: string;
}

/**
 * Saves the complete application state into local device storage.
 */
export function saveVaultToLocalStorage(data: Omit<AppVaultData, 'lastSavedAt'>): void {
  try {
    const payload: AppVaultData = {
      ...data,
      lastSavedAt: new Date().toISOString(),
    };
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[DataVault] Failed to save local cache:', err);
  }
}

/**
 * Reads local cached state if available.
 */
export function getVaultFromLocalStorage(): AppVaultData | null {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('[DataVault] Error reading local vault:', err);
    return null;
  }
}

/**
 * Exports complete database as a downloadable .json backup file.
 */
export function exportDatabaseBackup(data: {
  cycles: Cycle[];
  measurements: Measurement[];
  doctorNote: DoctorNote;
  userProfile: UserProfile;
}): void {
  const backup = {
    app: 'TensioCare',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    ...data,
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `TensioCare_Copia_Seguridad_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates an uploaded backup .json file.
 */
export function parseBackupFile(jsonContent: string): {
  success: boolean;
  data?: {
    cycles: Cycle[];
    measurements: Measurement[];
    doctorNote: DoctorNote;
    userProfile: UserProfile;
  };
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Formato de archivo inválido.' };
    }

    if (!Array.isArray(parsed.measurements) || !Array.isArray(parsed.cycles)) {
      return { success: false, error: 'El archivo no contiene mediciones o ciclos válidos.' };
    }

    return {
      success: true,
      data: {
        cycles: parsed.cycles,
        measurements: parsed.measurements,
        doctorNote: parsed.doctorNote,
        userProfile: parsed.userProfile,
      },
    };
  } catch (err: any) {
    return { success: false, error: 'No se pudo leer el archivo JSON: ' + err.message };
  }
}
