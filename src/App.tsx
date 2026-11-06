import React, { useState, useEffect } from 'react';
import { 
  TabType, Cycle, Measurement, DoctorNote, TimeOfDay, UserProfile 
} from './types';
import { 
  initialCycles, initialMeasurements, initialDoctorNote, initialUserProfile 
} from './data/initialData';
import { Header, UserProfileModal } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TodayScreen } from './components/screens/TodayScreen';
import { RegisterScreen } from './components/screens/RegisterScreen';
import { PeriodsScreen } from './components/screens/PeriodsScreen';
import { ReportScreen } from './components/screens/ReportScreen';
import { PdfReportModal } from './components/modals/PdfReportModal';
import { NewCycleModal } from './components/modals/NewCycleModal';
import { EditNoteModal } from './components/modals/EditNoteModal';
import { ShareModal } from './components/modals/ShareModal';
import { EditMeasurementModal } from './components/modals/EditMeasurementModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { ResetDbConfirmModal } from './components/modals/ResetDbConfirmModal';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';
import { downloadMeasurementsCsv } from './utils/csvExport';
import { generatePlanPdfReport } from './utils/pdfExport';
import { getLocalDateString } from './utils/dateUtils';
import { exportDatabaseBackup, parseBackupFile, saveVaultToLocalStorage } from './services/dataVault';
import { 
  fetchServerData, 
  saveMeasurementToServer, 
  updateMeasurementOnServer,
  deleteMeasurementOnServer,
  saveCycleToServer, 
  updateNoteOnServer,
  updateUserProfileOnServer,
  resetServerDatabase,
  checkServerHealth 
} from './services/api';
import { 
  Smartphone, Monitor, CheckCircle, Database, RefreshCw, Server, AlertCircle
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('hoy');
  const [cycles, setCycles] = useState<Cycle[]>(initialCycles);
  const [activeCycleId, setActiveCycleId] = useState<string>('ciclo-actual');
  const [measurements, setMeasurements] = useState<Measurement[]>(initialMeasurements);
  const [doctorNote, setDoctorNote] = useState<DoctorNote>(initialDoctorNote);
  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [preselectedTimeOfDay, setPreselectedTimeOfDay] = useState<TimeOfDay>('manana');
  
  // Storage and Sync state
  const [storageSource, setStorageSource] = useState<'firestore' | 'server_json' | 'local_fallback'>('firestore');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastServerSync, setLastServerSync] = useState<string | null>(null);

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isResetDbModalOpen, setIsResetDbModalOpen] = useState(false);
  const [isNewCycleOpen, setIsNewCycleOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
  const [measurementToDelete, setMeasurementToDelete] = useState<Measurement | null>(null);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  // Desktop viewport preview mode ('mobile' frame or 'expanded')
  const [viewMode, setViewMode] = useState<'mobile' | 'expanded'>('mobile');

  // Load persistent data from server JSON on startup
  const loadDataFromServer = async () => {
    setIsSyncing(true);
    try {
      const data = await fetchServerData();
      if (data.cycles) setCycles(data.cycles);
      if (data.measurements) setMeasurements(data.measurements);
      if (data.doctorNote) setDoctorNote(data.doctorNote);
      if (data.userProfile) setUserProfile(data.userProfile);
      setStorageSource(data.source);
      if (data.lastModified) {
        setLastServerSync(new Date(data.lastModified).toLocaleTimeString('es-ES'));
      } else {
        setLastServerSync(new Date().toLocaleTimeString('es-ES'));
      }
    } catch (e) {
      console.warn('Could not connect to server JSON storage:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadDataFromServer();
  }, []);

  // Sync state changes to device localStorage vault automatically
  useEffect(() => {
    saveVaultToLocalStorage({ cycles, measurements, doctorNote, userProfile });
  }, [cycles, measurements, doctorNote, userProfile]);

  // Active cycle
  const activeCycle = cycles.find((c) => c.id === activeCycleId) || cycles[0];
  const historyCycles = cycles.filter((c) => c.id !== activeCycleId);

  // Today's measurements (real dynamic date matching local current day)
  const todayStr = getLocalDateString();
  const todayMorningMeasurement = measurements.find(
    (m) => m.date === todayStr && m.timeOfDay === 'manana'
  );

  const todayNightMeasurement = measurements.find(
    (m) => m.date === todayStr && m.timeOfDay === 'noche'
  );

  // Handle saving a measurement directly to Firestore Cloud Database
  const handleSaveMeasurement = async (newM: Omit<Measurement, 'id'>) => {
    const tempId = `m-${Date.now()}`;
    const createdMeasurement: Measurement = {
      ...newM,
      id: tempId,
      isOverLimit: newM.tas >= 135 || newM.tad >= 85,
    };

    // Optimistic UI update
    setMeasurements((prev) => [createdMeasurement, ...prev]);

    let updatedCycleObj: Cycle | undefined;
    setCycles((prev) =>
      prev.map((c) => {
        if (c.id === activeCycleId) {
          const nextCompleted = Math.min(c.totalTakes, c.completedTakes + 1);
          const nextPercent = Math.round((nextCompleted / c.totalTakes) * 100);
          updatedCycleObj = {
            ...c,
            completedTakes: nextCompleted,
            progressPercent: nextPercent,
            dayProgress: nextCompleted >= 14 ? '7 de 7 Días' : c.dayProgress,
          };
          return updatedCycleObj;
        }
        return c;
      })
    );

    setSyncToastMessage('Guardando en la nube de Firebase Firestore...');

    // Persist to Firestore Cloud Database
    const res = await saveMeasurementToServer(createdMeasurement, updatedCycleObj);
    if (res.success) {
      setStorageSource('firestore');
      setLastServerSync(new Date().toLocaleTimeString('es-ES'));
      setSyncToastMessage('✓ Toma guardada y persistida en Firebase Firestore.');
    } else {
      setSyncToastMessage('Toma registrada en memoria local.');
    }

    setTimeout(() => setSyncToastMessage(null), 3500);
  };

  const handleUpdateMeasurement = async (updated: Measurement) => {
    // Optimistic UI update
    setMeasurements((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );

    setSyncToastMessage('Actualizando medición en la nube de Firebase...');
    const res = await updateMeasurementOnServer(updated);
    if (res.success) {
      setStorageSource('firestore');
      setLastServerSync(new Date().toLocaleTimeString('es-ES'));
      setSyncToastMessage('✓ Medición modificada y guardada en Firestore.');
    } else {
      setSyncToastMessage('Medición actualizada localmente.');
    }
    setTimeout(() => setSyncToastMessage(null), 3000);
  };

  const handleDeleteMeasurement = async (id: string) => {
    // Optimistic UI update
    setMeasurements((prev) => prev.filter((m) => m.id !== id));

    // Update cycle count
    setCycles((prev) =>
      prev.map((c) => {
        if (c.id === activeCycleId) {
          const nextCompleted = Math.max(0, c.completedTakes - 1);
          const nextPercent = Math.round((nextCompleted / c.totalTakes) * 100);
          return {
            ...c,
            completedTakes: nextCompleted,
            progressPercent: nextPercent,
          };
        }
        return c;
      })
    );

    setSyncToastMessage('Eliminando medición de Firebase...');
    const res = await deleteMeasurementOnServer(id);
    if (res.success) {
      setStorageSource('firestore');
      setLastServerSync(new Date().toLocaleTimeString('es-ES'));
      setSyncToastMessage('✓ Medición eliminada de Firestore.');
    } else {
      setSyncToastMessage('Medición eliminada localmente.');
    }
    setTimeout(() => setSyncToastMessage(null), 3000);
  };

  const handleCreateCycle = async (newCycle: Cycle) => {
    setCycles((prev) => [newCycle, ...prev]);
    setActiveCycleId(newCycle.id);
    
    // Save to Firestore
    await saveCycleToServer(newCycle);
    setStorageSource('firestore');
    setLastServerSync(new Date().toLocaleTimeString('es-ES'));
    setSyncToastMessage(`✓ Nuevo protocolo guardado en la nube de Firebase.`);
    setTimeout(() => setSyncToastMessage(null), 3000);
  };

  const handleUpdateDoctorNote = async (updated: DoctorNote) => {
    setDoctorNote(updated);
    await updateNoteOnServer(updated);
    setStorageSource('firestore');
    setLastServerSync(new Date().toLocaleTimeString('es-ES'));
    setSyncToastMessage('✓ Nota clínica actualizada en la nube de Firebase.');
    setTimeout(() => setSyncToastMessage(null), 3000);
  };

  const handleUpdateUserProfile = async (updated: UserProfile) => {
    setUserProfile(updated);
    setSyncToastMessage('Guardando ficha del paciente en Firebase...');
    const res = await updateUserProfileOnServer(updated);
    if (res.success) {
      setStorageSource('firestore');
      setLastServerSync(new Date().toLocaleTimeString('es-ES'));
      setSyncToastMessage('✓ Ficha del paciente guardada en Firestore.');
    } else {
      setSyncToastMessage('Ficha actualizada localmente.');
    }
    setTimeout(() => setSyncToastMessage(null), 3500);
  };

  const handleResetDb = async () => {
    await resetServerDatabase();
    await loadDataFromServer();
    setSyncToastMessage('✓ Base de datos de Firebase restaurada a 0.');
    setTimeout(() => setSyncToastMessage(null), 3000);
  };

  const handleSyncDoctor = () => {
    setSyncToastMessage('Sincronizando con la historia clínica del Hospital Universitario...');
    setTimeout(() => {
      setSyncToastMessage('✓ Expediente sincronizado con el servicio de Cardiología (Dr. Manuel Varela).');
      setTimeout(() => setSyncToastMessage(null), 4000);
    }, 1000);
  };

  const handleDownloadCsv = () => {
    downloadMeasurementsCsv(activeCycle, measurements);
    setSyncToastMessage('Archivo CSV generado y descargado.');
    setTimeout(() => setSyncToastMessage(null), 3000);
  };

  const handleExportBackup = () => {
    exportDatabaseBackup({
      cycles,
      measurements,
      doctorNote,
      userProfile,
    });
    setSyncToastMessage('✓ Copia de seguridad JSON generada y descargada.');
    setTimeout(() => setSyncToastMessage(null), 3500);
  };

  const handleRestoreBackup = async (jsonContent: string) => {
    const parsed = parseBackupFile(jsonContent);
    if (!parsed.success || !parsed.data) {
      setSyncToastMessage('Error al leer el archivo de copia de seguridad.');
      setTimeout(() => setSyncToastMessage(null), 3500);
      return;
    }

    const { cycles: newCycles, measurements: newMeasurements, doctorNote: newNote, userProfile: newProfile } = parsed.data;

    if (newCycles) setCycles(newCycles);
    if (newMeasurements) setMeasurements(newMeasurements);
    if (newNote) setDoctorNote(newNote);
    if (newProfile) setUserProfile(newProfile);

    // Persist restored vault locally
    saveVaultToLocalStorage({
      cycles: newCycles || cycles,
      measurements: newMeasurements || measurements,
      doctorNote: newNote || doctorNote,
      userProfile: newProfile || userProfile,
    });

    // Sync restored measurements to server
    if (newMeasurements && newMeasurements.length > 0) {
      setSyncToastMessage('Sincronizando copia restaurada con el servidor...');
      for (const m of newMeasurements) {
        await saveMeasurementToServer(m);
      }
    }
    if (newProfile) await updateUserProfileOnServer(newProfile);
    if (newNote) await updateNoteOnServer(newNote);

    setLastServerSync(new Date().toLocaleTimeString('es-ES'));
    setSyncToastMessage('✓ Copia de seguridad restaurada con éxito.');
    setTimeout(() => setSyncToastMessage(null), 4000);
  };

  const handleDownloadPlanPdf = (targetCycle?: Cycle) => {
    const cycle = targetCycle || activeCycle;
    const cycleMeasurements = cycle.id === activeCycle.id
      ? measurements
      : (cycle.measurements || []);

    generatePlanPdfReport(cycle, cycleMeasurements, doctorNote, userProfile);
    setSyncToastMessage(`✓ Generando informe PDF: ${cycle.title}`);
    setTimeout(() => setSyncToastMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#102a36] flex flex-col items-center">
      {/* Desktop Mode & Server Storage Status Toolbar (hidden in print) */}
      <div className="hidden lg:flex items-center justify-between w-full max-w-4xl px-4 py-2.5 text-xs text-slate-500 border-b border-slate-200/80 bg-white/70 backdrop-blur-md no-print">
        {/* Storage status indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {storageSource === 'firestore'
                ? 'Nube Firebase Firestore: Activo'
                : 'Almacenamiento Local/JSON'}
            </span>
          </div>

          <span className="text-[11px] text-slate-400">
            {lastServerSync ? `Última sincronización: ${lastServerSync}` : 'Sincronizado'}
          </span>

          <button
            onClick={loadDataFromServer}
            disabled={isSyncing}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 cursor-pointer"
            title="Recargar datos del servidor JSON"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* View Mode controls */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
          <button
            onClick={() => setViewMode('mobile')}
            className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'mobile'
                ? 'bg-white text-[#005570] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Vista Móvil</span>
          </button>
          <button
            onClick={() => setViewMode('expanded')}
            className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'expanded'
                ? 'bg-white text-[#005570] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Vista Expandida</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 flex-1 flex flex-col ${
          viewMode === 'mobile'
            ? 'max-w-[420px] bg-[#f8fafc] min-h-screen lg:my-4 lg:rounded-[40px] lg:shadow-2xl lg:border-[8px] lg:border-slate-800/90 lg:ring-1 lg:ring-black/10 overflow-hidden relative'
            : 'max-w-4xl bg-[#f8fafc] min-h-screen px-4 lg:my-4 lg:rounded-3xl lg:shadow-lg border border-slate-200 relative'
        }`}
      >
        {/* Device Speaker Notch on mobile frame */}
        {viewMode === 'mobile' && (
          <div className="hidden lg:flex justify-center pt-2 pb-1 bg-[#f8fafc]">
            <div className="w-20 h-3.5 bg-slate-900 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-800 mr-2" />
              <div className="w-8 h-1 bg-slate-700 rounded-full" />
            </div>
          </div>
        )}

        {/* Global Toast Notification */}
        {syncToastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-900/95 text-white text-xs font-semibold rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 border border-slate-700">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncToastMessage}</span>
          </div>
        )}

        {/* Top App Bar */}
        <Header
          currentTab={currentTab}
          userProfile={userProfile}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        {/* PWA Install Banner (mounts conditionally if installable or on iOS Safari) */}
        <PWAInstallBanner />

        {/* Mobile Server Storage Pill Banner */}
        <div className="lg:hidden px-4 pt-1 pb-0 flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-600">
              {storageSource === 'firestore' ? 'Nube Firebase: Conectado' : 'Almacenamiento Local'}
            </span>
          </div>
          <span className="text-slate-400">
            {lastServerSync ? `Sync ${lastServerSync}` : 'Sync OK'}
          </span>
        </div>

        {/* Content Screens */}
        <main className="flex-1 px-4 pt-2 pb-8 overflow-y-auto">
          {currentTab === 'hoy' && (
            <TodayScreen
              activeCycle={activeCycle}
              measurements={measurements}
              morningMeasurement={todayMorningMeasurement}
              nightMeasurement={todayNightMeasurement}
              onGoToRegisterMorning={() => {
                setPreselectedTimeOfDay('manana');
                setCurrentTab('registrar');
              }}
              onGoToRegisterNight={() => {
                setPreselectedTimeOfDay('noche');
                setCurrentTab('registrar');
              }}
              onGoToPeriods={() => setCurrentTab('periodos')}
              onSelectDay={() => setCurrentTab('reporte')}
              onEditMeasurement={setEditingMeasurement}
              onDeleteMeasurement={handleDeleteMeasurement}
              onRequestDelete={setMeasurementToDelete}
              onDownloadPlanPdf={() => handleDownloadPlanPdf(activeCycle)}
            />
          )}

          {currentTab === 'registrar' && (
            <RegisterScreen
              activePeriodTitle={activeCycle.title}
              initialTimeOfDay={preselectedTimeOfDay}
              onChangePeriodClick={() => setIsNewCycleOpen(true)}
              onSaveMeasurement={(m) => {
                handleSaveMeasurement(m);
                setCurrentTab('hoy');
              }}
            />
          )}

          {currentTab === 'periodos' && (
            <PeriodsScreen
              activeCycle={activeCycle}
              historyCycles={historyCycles}
              measurements={measurements}
              onOpenNewCycleModal={() => setIsNewCycleOpen(true)}
              onSyncDoctorClick={handleSyncDoctor}
              onEditMeasurement={setEditingMeasurement}
              onDeleteMeasurement={handleDeleteMeasurement}
              onRequestDelete={setMeasurementToDelete}
              onDownloadPlanPdf={handleDownloadPlanPdf}
            />
          )}

          {currentTab === 'reporte' && (
            <ReportScreen
              activeCycle={activeCycle}
              measurements={measurements}
              doctorNote={doctorNote}
              onEditDoctorNote={() => setIsEditNoteModalOpen(true)}
              onOpenPdfReport={() => setIsPdfModalOpen(true)}
              onDownloadPdf={() => handleDownloadPlanPdf(activeCycle)}
              onOpenShareModal={() => setIsShareModalOpen(true)}
              onDownloadCsv={handleDownloadCsv}
            />
          )}
        </main>

        {/* Fixed Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'registrar') {
              setPreselectedTimeOfDay('manana');
            }
            setCurrentTab(tab);
          }}
        />
      </div>

      {/* Global Modals */}
      {isProfileOpen && (
        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          userProfile={userProfile}
          onSaveProfile={handleUpdateUserProfile}
          onExportBackup={handleExportBackup}
          onRestoreBackup={handleRestoreBackup}
          onRequestResetDb={() => setIsResetDbModalOpen(true)}
        />
      )}

      {isResetDbModalOpen && (
        <ResetDbConfirmModal
          isOpen={isResetDbModalOpen}
          onClose={() => setIsResetDbModalOpen(false)}
          onConfirmReset={handleResetDb}
        />
      )}

      {isNewCycleOpen && (
        <NewCycleModal
          isOpen={isNewCycleOpen}
          onClose={() => setIsNewCycleOpen(false)}
          onCreateCycle={handleCreateCycle}
        />
      )}

      {isPdfModalOpen && (
        <PdfReportModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          cycle={activeCycle}
          measurements={measurements}
          doctorNote={doctorNote}
          userProfile={userProfile}
        />
      )}

      {isEditNoteModalOpen && (
        <EditNoteModal
          isOpen={isEditNoteModalOpen}
          onClose={() => setIsEditNoteModalOpen(false)}
          note={doctorNote}
          onSave={handleUpdateDoctorNote}
        />
      )}

      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {editingMeasurement && (
        <EditMeasurementModal
          isOpen={!!editingMeasurement}
          measurement={editingMeasurement}
          onClose={() => setEditingMeasurement(null)}
          onSave={handleUpdateMeasurement}
          onDelete={handleDeleteMeasurement}
        />
      )}

      {measurementToDelete && (
        <ConfirmDeleteModal
          isOpen={!!measurementToDelete}
          measurement={measurementToDelete}
          onClose={() => setMeasurementToDelete(null)}
          onConfirm={handleDeleteMeasurement}
        />
      )}
    </div>
  );
}
