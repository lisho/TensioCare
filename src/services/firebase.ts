import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Cycle, DoctorNote, Measurement, UserProfile } from '../types';
import { initialCycles, initialDoctorNote, initialMeasurements, userProfileData } from '../data/initialData';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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
    // Expected error if document doesn't exist, means connection works
    return true;
  }
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
        await setDoc(doc(db, 'cycles', c.id), c);
      }
    }

    if (measurements.length === 0 && initialMeasurements.length > 0) {
      measurements = initialMeasurements;
      for (const m of measurements) {
        await setDoc(doc(db, 'measurements', m.id), m);
      }
    }

    if (!doctorNote) {
      doctorNote = initialDoctorNote;
      await setDoc(doc(db, 'notes', 'doctorNote'), doctorNote);
    }

    if (!userProfile) {
      userProfile = userProfileData;
      await setDoc(doc(db, 'userProfile', 'patientProfile'), userProfile);
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
    await setDoc(doc(db, 'measurements', m.id), m);
    return true;
  } catch (err) {
    console.error('[TensioCare Firebase] Error saving measurement:', err);
    return false;
  }
}

export async function updateMeasurementInFirestore(m: Measurement): Promise<boolean> {
  try {
    await setDoc(doc(db, 'measurements', m.id), m, { merge: true });
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
    await setDoc(doc(db, 'cycles', c.id), c);
    return true;
  } catch (err) {
    console.error('[TensioCare Firebase] Error saving cycle:', err);
    return false;
  }
}

export async function updateDoctorNoteInFirestore(note: DoctorNote): Promise<boolean> {
  try {
    await setDoc(doc(db, 'notes', 'doctorNote'), note);
    return true;
  } catch (err) {
    console.error('[TensioCare Firebase] Error updating doctor note:', err);
    return false;
  }
}

export async function updateUserProfileInFirestore(profile: UserProfile): Promise<boolean> {
  try {
    await setDoc(doc(db, 'userProfile', 'patientProfile'), profile);
    return true;
  } catch (err) {
    console.error('[TensioCare Firebase] Error updating user profile:', err);
    return false;
  }
}

export async function resetFirestoreDatabase(): Promise<boolean> {
  try {
    // Clear collections
    const mSnap = await getDocs(collection(db, 'measurements'));
    const batch = writeBatch(db);
    mSnap.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    // Re-seed cycles
    for (const c of initialCycles) {
      await setDoc(doc(db, 'cycles', c.id), c);
    }
    await setDoc(doc(db, 'notes', 'doctorNote'), initialDoctorNote);
    await setDoc(doc(db, 'userProfile', 'patientProfile'), userProfileData);

    return true;
  } catch (err) {
    console.error('[TensioCare Firebase] Error resetting database:', err);
    return false;
  }
}
