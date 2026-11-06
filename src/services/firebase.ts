import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocFromServer,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Cycle, DoctorNote, Measurement, UserProfile } from '../types';
import { initialCycles, initialDoctorNote, initialMeasurements, userProfileData } from '../data/initialData';

const app = initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Removes any undefined fields from objects before saving to Firestore,
 * as Firestore throws an error if any field is undefined.
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = cleanFirestoreData(value);
      } else if (Array.isArray(value)) {
        cleaned[key] = value.map((item) => 
          item && typeof item === 'object' && !(item instanceof Date)
            ? cleanFirestoreData(item)
            : item
        );
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as T;
}

/**
 * Validates connection to Firestore Cloud Database
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[TensioCare Firebase] Conexión a Firestore verificada correctamente.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[TensioCare Firebase] El cliente está en modo offline.');
      return false;
    }
    return true;
  }
}

export interface FirestoreSubscriptions {
  onCycles?: (cycles: Cycle[]) => void;
  onMeasurements?: (measurements: Measurement[]) => void;
  onDoctorNote?: (note: DoctorNote) => void;
  onUserProfile?: (profile: UserProfile) => void;
  onError?: (err: any) => void;
}

/**
 * Subscribes to Firestore collections in real time with individual callbacks.
 * This guarantees that updates to one collection never accidentally overwrite or clear another collection.
 */
export function subscribeToFirestore(callbacks: FirestoreSubscriptions): () => void {
  const unsubCycles = onSnapshot(
    collection(db, 'cycles'),
    (snap) => {
      if (!snap.empty && callbacks.onCycles) {
        const cycles: Cycle[] = [];
        snap.forEach((d) => cycles.push(d.data() as Cycle));
        callbacks.onCycles(cycles);
      }
    },
    (err) => {
      console.warn('[TensioCare Firebase] Realtime cycles warning:', err);
      callbacks.onError?.(err);
    }
  );

  const unsubMeasurements = onSnapshot(
    collection(db, 'measurements'),
    (snap) => {
      if (callbacks.onMeasurements) {
        const measurements: Measurement[] = [];
        snap.forEach((d) => measurements.push(d.data() as Measurement));
        measurements.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
        callbacks.onMeasurements(measurements);
      }
    },
    (err) => {
      console.warn('[TensioCare Firebase] Realtime measurements warning:', err);
      callbacks.onError?.(err);
    }
  );

  const unsubNotes = onSnapshot(
    collection(db, 'notes'),
    (snap) => {
      if (callbacks.onDoctorNote) {
        snap.forEach((d) => {
          if (d.id === 'doctorNote') {
            callbacks.onDoctorNote!(d.data() as DoctorNote);
          }
        });
      }
    },
    (err) => {
      console.warn('[TensioCare Firebase] Realtime notes warning:', err);
      callbacks.onError?.(err);
    }
  );

  const unsubProfile = onSnapshot(
    collection(db, 'userProfile'),
    (snap) => {
      if (callbacks.onUserProfile) {
        snap.forEach((d) => {
          if (d.id === 'patientProfile') {
            callbacks.onUserProfile!(d.data() as UserProfile);
          }
        });
      }
    },
    (err) => {
      console.warn('[TensioCare Firebase] Realtime userProfile warning:', err);
      callbacks.onError?.(err);
    }
  );

  return () => {
    unsubCycles();
    unsubMeasurements();
    unsubNotes();
    unsubProfile();
  };
}

/**
 * Fetch all application state directly from Firestore Cloud Database.
 */
export async function fetchFirestoreData(): Promise<{
  cycles: Cycle[];
  measurements: Measurement[];
  doctorNote: DoctorNote;
  userProfile: UserProfile;
  source: 'firestore' | 'local_fallback';
}> {
  try {
    const cyclesSnap = await getDocs(collection(db, 'cycles'));
    const measurementsSnap = await getDocs(collection(db, 'measurements'));
    const notesSnap = await getDocs(collection(db, 'notes'));
    const profileSnap = await getDocs(collection(db, 'userProfile'));

    let cycles: Cycle[] = [];
    cyclesSnap.forEach((doc) => cycles.push(doc.data() as Cycle));

    let measurements: Measurement[] = [];
    measurementsSnap.forEach((doc) => measurements.push(doc.data() as Measurement));

    let doctorNote: DoctorNote | null = null;
    notesSnap.forEach((doc) => {
      if (doc.id === 'doctorNote' || !doctorNote) {
        doctorNote = doc.data() as DoctorNote;
      }
    });

    let userProfile: UserProfile | null = null;
    profileSnap.forEach((doc) => {
      if (doc.id === 'patientProfile' || !userProfile) {
        userProfile = doc.data() as UserProfile;
      }
    });

    // If Firestore is empty (first time creation), initialize seed documents
    if (cycles.length === 0) {
      cycles = initialCycles;
      for (const c of cycles) {
        await setDoc(doc(db, 'cycles', c.id), cleanFirestoreData(c));
      }
    }

    if (measurements.length === 0 && initialMeasurements.length > 0) {
      measurements = initialMeasurements;
      for (const m of measurements) {
        await setDoc(doc(db, 'measurements', m.id), cleanFirestoreData(m));
      }
    }

    if (!doctorNote) {
      doctorNote = initialDoctorNote;
      await setDoc(doc(db, 'notes', 'doctorNote'), cleanFirestoreData(doctorNote));
    }

    if (!userProfile) {
      userProfile = userProfileData;
      await setDoc(doc(db, 'userProfile', 'patientProfile'), cleanFirestoreData(userProfile));
    }

    // Sort measurements descending by date/time
    measurements.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

    return {
      cycles,
      measurements,
      doctorNote,
      userProfile,
      source: 'firestore',
    };
  } catch (err) {
    console.error('[TensioCare Firebase] Error fetching from Firestore:', err);
    throw err;
  }
}

export async function saveMeasurementToFirestore(m: Measurement): Promise<boolean> {
  try {
    const payload = cleanFirestoreData(m);
    await setDoc(doc(db, 'measurements', m.id), payload);
    return true;
  } catch (err) {
    console.error('[TensioCare Firebase] Error saving measurement:', err);
    return false;
  }
}

export async function updateMeasurementInFirestore(m: Measurement): Promise<boolean> {
  try {
    const payload = cleanFirestoreData(m);
    await setDoc(doc(db, 'measurements', m.id), payload, { merge: true });
    return true;
  } catch (err) {
    console.error('[TensioCare Firebase] Error updating measurement:', err);
    return false;
  }
}

export async function deleteMeasurementFromFirestore(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'measurements', id));
    return true;
  } catch (err) {
    console.error('[TensioCare Firebase] Error deleting measurement:', err);
    return false;
  }
}

export async function saveCycleToFirestore(c: Cycle): Promise<boolean> {
  try {
    const payload = cleanFirestoreData(c);
    await setDoc(doc(db, 'cycles', c.id), payload);
    return true;
  } catch (err) {
    console.error('[TensioCare Firebase] Error saving cycle:', err);
    return false;
  }
}

export async function updateDoctorNoteInFirestore(note: DoctorNote): Promise<boolean> {
  try {
    const payload = cleanFirestoreData(note);
    await setDoc(doc(db, 'notes', 'doctorNote'), payload);
    return true;
  } catch (err) {
    console.error('[TensioCare Firebase] Error updating doctor note:', err);
    return false;
  }
}

export async function updateUserProfileInFirestore(profile: UserProfile): Promise<boolean> {
  try {
    const payload = cleanFirestoreData(profile);
    await setDoc(doc(db, 'userProfile', 'patientProfile'), payload);
    return true;
  } catch (err) {
    console.error('[TensioCare Firebase] Error updating user profile:', err);
    return false;
  }
}

export async function resetFirestoreDatabase(): Promise<boolean> {
  try {
    // Clear measurements collection
    const mSnap = await getDocs(collection(db, 'measurements'));
    const batch = writeBatch(db);
    mSnap.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    // Re-seed cycles
    for (const c of initialCycles) {
      await setDoc(doc(db, 'cycles', c.id), cleanFirestoreData(c));
    }
    await setDoc(doc(db, 'notes', 'doctorNote'), cleanFirestoreData(initialDoctorNote));
    await setDoc(doc(db, 'userProfile', 'patientProfile'), cleanFirestoreData(userProfileData));

    return true;
  } catch (err) {
    console.error('[TensioCare Firebase] Error resetting database:', err);
    return false;
  }
}
