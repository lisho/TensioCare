import React, { useState, useEffect } from 'react';
import { 
  Heart, User, ShieldCheck, Stethoscope, Pill, Calendar, Clock, X, 
  Edit3, Check, AlertTriangle, ChevronDown, ChevronUp, Lock, Save
} from 'lucide-react';
import { TabType, UserProfile } from '../types';
import { initialUserProfile } from '../data/initialData';

interface HeaderProps {
  currentTab: TabType;
  userProfile?: UserProfile;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, userProfile, onOpenProfile }) => {
  const getSubTitle = () => {
    switch (currentTab) {
      case 'hoy':
        return 'Hoy';
      case 'registrar':
        return 'Registrar';
      case 'periodos':
        return 'Periodos';
      case 'reporte':
        return 'Reporte';
      default:
        return 'Hoy';
    }
  };

  const profile = userProfile || initialUserProfile;
  const initials = profile.name
    ? profile.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'TC';

  return (
    <header className="sticky top-0 z-30 bg-[#f8fafc]/95 backdrop-blur-md px-4 pt-3 pb-2.5 border-b border-slate-200/80 flex items-center justify-between">
      {/* Brand lockup */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#005570] to-[#0d7d9e] flex items-center justify-center shadow-xs">
          <div className="relative">
            <Heart className="w-4 h-4 text-white fill-white/20" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-white" />
          </div>
        </div>
        <div className="flex flex-col text-left leading-none">
          <span className="text-[17px] font-bold tracking-tight text-[#0f2d3a]">
            TensioCare
          </span>
          <span className="text-[12px] font-medium text-slate-500 mt-0.5">
            {getSubTitle()}
          </span>
        </div>
      </div>

      {/* User profile avatar */}
      <button
        onClick={onOpenProfile}
        aria-label="Perfil del Paciente"
        title={`Ficha de ${profile.name}`}
        className="h-9 px-2.5 rounded-full bg-[#004e63] text-white flex items-center gap-1.5 shadow-sm hover:bg-[#003c4c] transition-all focus:outline-none focus:ring-2 focus:ring-[#004e63]/30 cursor-pointer"
      >
        <span className="text-xs font-bold tracking-tight">{initials}</span>
        <User className="w-3.5 h-3.5 text-slate-200" />
      </button>
    </header>
  );
};

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile;
  onSaveProfile?: (updated: UserProfile) => Promise<void> | void;
  onRequestResetDb?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
  onRequestResetDb,
}) => {
  const current = userProfile || initialUserProfile;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(current);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData(userProfile);
    }
  }, [userProfile]);

  if (!isOpen) return null;

  const initials = (formData.name || current.name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  const handleInputChange = (field: keyof UserProfile, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSaving(true);
    if (onSaveProfile) {
      await onSaveProfile(formData);
    }
    setIsSaving(false);
    setIsEditing(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div 
        className="bg-white w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 text-left relative my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with avatar & toggle edit */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-[#004e63] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {initials || 'TC'}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#005570] block">
                EXPEDIENTE DEL PACIENTE
              </span>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {formData.name}
              </h3>
              <p className="text-xs text-slate-500">
                {formData.age} años · DNI: {formData.dni}
              </p>
            </div>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Datos actualizados y guardados en el servidor JSON.</span>
          </div>
        )}

        {/* Tab switch between View and Edit */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              !isEditing 
                ? 'bg-white text-[#005570] shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ficha Clínica
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isEditing 
                ? 'bg-[#005570] text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Modificar Datos</span>
          </button>
        </div>

        {/* View Mode */}
        {!isEditing ? (
          <div className="space-y-3.5 text-xs text-slate-700 divide-y divide-slate-100">
            <div className="pt-1 flex items-start gap-2.5">
              <Stethoscope className="w-4 h-4 text-[#005570] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Cardiólogo Responsable</p>
                <p className="text-slate-700">{formData.doctor}</p>
                <p className="text-[11px] text-slate-400">{formData.clinic}</p>
              </div>
            </div>

            <div className="pt-3 flex items-start gap-2.5">
              <Pill className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Pauta Farmacológica</p>
                <p className="text-slate-700">{formData.currentMedication}</p>
              </div>
            </div>

            <div className="pt-3 flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Protocolo Clínico Vigente</p>
                <p className="text-slate-700">{formData.protocol}</p>
                <p className="text-[11px] text-slate-400">AMPA domiciliario · Criterios ESH/ESC 2023</p>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar información del paciente</span>
              </button>
            </div>
          </div>
        ) : (
          /* Edit Form */
          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Nombre y Apellidos
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nombre del paciente"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005570]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Edad
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  required
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005570]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  DNI / Identificador
                </label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => handleInputChange('dni', e.target.value)}
                  placeholder="***1234-X"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005570]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Médico / Cardiólogo Asignado
              </label>
              <input
                type="text"
                value={formData.doctor}
                onChange={(e) => handleInputChange('doctor', e.target.value)}
                placeholder="Dr. ..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005570]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Centro Médico u Hospital
              </label>
              <input
                type="text"
                value={formData.clinic}
                onChange={(e) => handleInputChange('clinic', e.target.value)}
                placeholder="Hospital / Consulta..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005570]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Pauta Farmacológica (Medicación)
              </label>
              <textarea
                rows={2}
                value={formData.currentMedication}
                onChange={(e) => handleInputChange('currentMedication', e.target.value)}
                placeholder="Enalapril, Amlodipino..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005570] resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Protocolo Clínico Vigente
              </label>
              <input
                type="text"
                value={formData.protocol}
                onChange={(e) => handleInputChange('protocol', e.target.value)}
                placeholder="AMPA 7 Días..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005570]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setFormData(current);
                  setIsEditing(false);
                }}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 px-3 bg-[#005570] hover:bg-[#004257] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Collapsible Advanced / Danger Zone (Well protected, requires expansion + explicit confirmation) */}
        <div className="mt-5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-1 text-slate-400 hover:text-slate-600 text-[11px] font-semibold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Opciones avanzadas de mantenimiento</span>
            </span>
            {showAdvanced ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2 text-slate-600 text-[11px] leading-relaxed">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Solo utiliza esta opción si deseas borrar todas las tomas del servidor y comenzar un protocolo completamente limpio.
                </span>
              </div>
              {onRequestResetDb && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestResetDb();
                  }}
                  className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  Restablecer base de datos (con confirmación)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
