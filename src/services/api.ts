import { Cycle, DoctorNote, Measurement } from '../types';
import { initialCycles, initialDoctorNote, initialMeasurements, userProfileData } from '../data/initialData';

export interface ServerDataResponse {
  cycles: Cycle[];
  measurements: Measurement[];
  doctorNote: DoctorNote;
  userProfile: typeof userProfileData;
  lastModified?: string;
  source: 'server_json' | 'local_fallback';
}

export async function fetchServerData(): Promise<ServerDataResponse> {
  try {
    const res = await fetch('/api/data', {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return {
      cycles: data.cycles && data.cycles.length > 0 ? data.cycles : initialCycles,
      measurements: data.measurements && data.measurements.length > 0 ? data.measurements : initialMeasurements,
      doctorNote: data.doctorNote || initialDoctorNote,
      userProfile: data.userProfile || userProfileData,
      lastModified: data.lastModified,
      source: 'server_json',
    };
  } catch (err) {
    console.warn('[TensioCare] Using fallback data (Server JSON endpoint unavailable):', err);
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
