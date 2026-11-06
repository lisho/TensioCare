import { Cycle, DoctorNote, Measurement, UserProfile } from '../types';
import { initialCycles, initialDoctorNote, initialMeasurements, userProfileData } from '../data/initialData';
import { getVaultFromLocalStorage, saveVaultToLocalStorage } from './dataVault';
import { 
  fetchFirestoreData, 
  saveMeasurementToFirestore, 
  updateMeasurementInFirestore, 
  deleteMeasurementFromFirestore,
  saveCycleToFirestore,
  updateDoctorNoteInFirestore,
  updateUserProfileInFirestore,
  resetFirestoreDatabase
} from './firebase';

export interface ServerDataResponse {
  cycles: Cycle[];
  measurements: Measurement[];
  doctorNote: DoctorNote;
  userProfile: UserProfile;
  lastModified?: string;
  source: 'firestore' | 'server_json' | 'local_fallback';
}

export async function fetchServerData(): Promise<ServerDataResponse> {
  const localVault = getVaultFromLocalStorage();

  // Try Firestore Cloud Database first (Primary persistence for Netlify & Multi-device)
  try {
    const fsData = await fetchFirestoreData();
    if (fsData && fsData.cycles) {
      saveVaultToLocalStorage({ 
        cycles: fsData.cycles, 
        measurements: fsData.measurements, 
        doctorNote: fsData.doctorNote, 
        userProfile: fsData.userProfile 
      });

      return {
        cycles: fsData.cycles,
        measurements: fsData.measurements,
        doctorNote: fsData.doctorNote,
        userProfile: fsData.userProfile,
        lastModified: new Date().toISOString(),
        source: 'firestore',
      };
    }
  } catch (fsErr) {
    console.warn('[TensioCare API] Firestore sync unavailable, falling back to server API:', fsErr);
  }

  // Fallback to local server API endpoint if Firestore is unreachable
  try {
    const res = await fetch('/api/data', {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    let cycles = data.cycles && data.cycles.length > 0 ? data.cycles : initialCycles;
    let serverMeasurements: Measurement[] = data.measurements || [];
    let doctorNote = data.doctorNote || initialDoctorNote;
    let userProfile = data.userProfile || userProfileData;

    // Deduplicated union merge between server measurements and localVault measurements
    const mergedMap = new Map<string, Measurement>();
    for (const m of serverMeasurements) {
      if (m && m.id) mergedMap.set(m.id, m);
    }

    if (localVault && localVault.measurements && localVault.measurements.length > 0) {
      for (const m of localVault.measurements) {
        if (m && m.id && !mergedMap.has(m.id)) {
          mergedMap.set(m.id, m);
          saveMeasurementToServer(m).catch(() => {});
        }
      }
      if (localVault.userProfile && localVault.userProfile.name) {
        userProfile = localVault.userProfile;
      }
      if (localVault.doctorNote && localVault.doctorNote.doctorName) {
        doctorNote = localVault.doctorNote;
      }
    }

    const measurements = Array.from(mergedMap.values()).sort((a, b) => {
      const dateTimeA = `${a.date} ${a.time}`;
      const dateTimeB = `${b.date} ${b.time}`;
      return dateTimeB.localeCompare(dateTimeA);
    });

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

export async function saveMeasurementToServer(measurement: Measurement): Promise<{
  success: boolean;
  measurement?: Measurement;
  cycles?: Cycle[];
}> {
  // Sync to Firestore Cloud Database
  saveMeasurementToFirestore(measurement).catch((e) => console.warn('Firestore measurement save warning:', e));

  // Sync to Express Server / Local API Endpoint
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
  return { success: true, measurement };
}

export async function updateMeasurementOnServer(measurement: Measurement): Promise<{
  success: boolean;
  measurement?: Measurement;
}> {
  // Sync to Firestore Cloud Database
  updateMeasurementInFirestore(measurement).catch((e) => console.warn('Firestore measurement update warning:', e));

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
  return { success: true, measurement };
}

export async function deleteMeasurementOnServer(id: string): Promise<{
  success: boolean;
  cycles?: Cycle[];
}> {
  // Sync to Firestore Cloud Database
  deleteMeasurementFromFirestore(id).catch((e) => console.warn('Firestore measurement delete warning:', e));

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
  return { success: true };
}

export async function saveCycleToServer(cycle: Cycle): Promise<boolean> {
  saveCycleToFirestore(cycle).catch((e) => console.warn('Firestore cycle save warning:', e));
  try {
    const res = await fetch('/api/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cycle),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to save cycle to server JSON:', err);
    return true;
  }
}

export async function updateNoteOnServer(note: DoctorNote): Promise<boolean> {
  updateDoctorNoteInFirestore(note).catch((e) => console.warn('Firestore note update warning:', e));
  try {
    const res = await fetch('/api/notes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to update note on server JSON:', err);
    return true;
  }
}

export async function updateUserProfileOnServer(profile: UserProfile): Promise<{
  success: boolean;
  userProfile?: UserProfile;
}> {
  updateUserProfileInFirestore(profile).catch((e) => console.warn('Firestore profile update warning:', e));
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
  return { success: true, userProfile: profile };
}

export async function resetServerDatabase(): Promise<boolean> {
  resetFirestoreDatabase().catch((e) => console.warn('Firestore reset warning:', e));
  try {
    const res = await fetch('/api/reset', { method: 'POST' });
    return res.ok;
  } catch (err) {
    console.error('Failed to reset server JSON database:', err);
    return true;
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
