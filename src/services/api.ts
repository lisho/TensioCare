import { Cycle, DoctorNote, Measurement, UserProfile } from '../types';
import { initialCycles, initialDoctorNote, initialMeasurements, userProfileData } from '../data/initialData';
import { getVaultFromLocalStorage, saveVaultToLocalStorage } from './dataVault';

export interface ServerDataResponse {
  cycles: Cycle[];
  measurements: Measurement[];
  doctorNote: DoctorNote;
  userProfile: UserProfile;
  lastModified?: string;
  source: 'server_json' | 'local_fallback';
}

export async function fetchServerData(): Promise<ServerDataResponse> {
  const localVault = getVaultFromLocalStorage();

  try {
    const res = await fetch('/api/data', {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    let cycles = data.cycles && data.cycles.length > 0 ? data.cycles : initialCycles;
    let measurements: Measurement[] = data.measurements || [];
    let doctorNote = data.doctorNote || initialDoctorNote;
    let userProfile = data.userProfile || userProfileData;

    // Safety Recovery: If local device vault has saved measurements that server doesn't have yet (e.g. Netlify /tmp restarted), restore them!
    if (localVault && localVault.measurements && localVault.measurements.length > measurements.length) {
      measurements = localVault.measurements;
      if (localVault.cycles) cycles = localVault.cycles;
      if (localVault.userProfile) userProfile = localVault.userProfile;
      if (localVault.doctorNote) doctorNote = localVault.doctorNote;

      // Resync restored data to server in background
      for (const m of measurements) {
        saveMeasurementToServer(m).catch(() => {});
      }
    }

    // Always mirror resolved state into local persistent vault
    saveVaultToLocalStorage({ cycles, measurements, doctorNote, userProfile });

    return {
      cycles,
      measurements,
      doctorNote,
      userProfile,
      lastModified: data.lastModified,
      source: 'server_json',
    };
  } catch (err) {
    console.warn('[TensioCare] Using local vault fallback (Server offline or unreachable):', err);
    if (localVault) {
      return {
        cycles: localVault.cycles || initialCycles,
        measurements: localVault.measurements || initialMeasurements,
        doctorNote: localVault.doctorNote || initialDoctorNote,
        userProfile: localVault.userProfile || userProfileData,
        lastModified: localVault.lastSavedAt,
        source: 'local_fallback',
      };
    }

    return {
      cycles: initialCycles,
      measurements: initialMeasurements,
      doctorNote: initialDoctorNote,
      userProfile: userProfileData,
      source: 'local_fallback',
    };
  }
}

export async function saveMeasurementToServer(measurement: Omit<Measurement, 'id'>): Promise<{
  success: boolean;
  measurement?: Measurement;
  cycles?: Cycle[];
}> {
  try {
    const res = await fetch('/api/measurements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(measurement),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, measurement: data.measurement, cycles: data.cycles };
    }
  } catch (err) {
    console.error('Failed to save to server JSON:', err);
  }
  return { success: false };
}

export async function updateMeasurementOnServer(measurement: Measurement): Promise<{
  success: boolean;
  measurement?: Measurement;
}> {
  try {
    const res = await fetch(`/api/measurements/${measurement.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(measurement),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, measurement: data.measurement };
    }
  } catch (err) {
    console.error('Failed to update measurement on server JSON:', err);
  }
  return { success: false };
}

export async function deleteMeasurementOnServer(id: string): Promise<{
  success: boolean;
  cycles?: Cycle[];
}> {
  try {
    const res = await fetch(`/api/measurements/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, cycles: data.cycles };
    }
  } catch (err) {
    console.error('Failed to delete measurement on server JSON:', err);
  }
  return { success: false };
}

export async function saveCycleToServer(cycle: Cycle): Promise<boolean> {
  try {
    const res = await fetch('/api/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cycle),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to save cycle to server JSON:', err);
    return false;
  }
}

export async function updateNoteOnServer(note: DoctorNote): Promise<boolean> {
  try {
    const res = await fetch('/api/notes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to update note on server JSON:', err);
    return false;
  }
}

export async function updateUserProfileOnServer(profile: UserProfile): Promise<{
  success: boolean;
  userProfile?: UserProfile;
}> {
  try {
    const res = await fetch('/api/user-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, userProfile: data.userProfile };
    }
  } catch (err) {
    console.error('Failed to update user profile on server JSON:', err);
  }
  return { success: false };
}

export async function resetServerDatabase(): Promise<boolean> {
  try {
    const res = await fetch('/api/reset', { method: 'POST' });
    return res.ok;
  } catch (err) {
    console.error('Failed to reset server JSON database:', err);
    return false;
  }
}

export async function checkServerHealth(): Promise<any> {
  try {
    const res = await fetch('/api/health');
    if (res.ok) return await res.json();
  } catch (e) {
    return null;
  }
  return null;
}
