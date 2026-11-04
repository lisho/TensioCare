import React from 'react';
import { Heart, User, ShieldCheck, Stethoscope, Pill, Calendar, Clock, X } from 'lucide-react';
import { TabType } from '../types';
import { userProfileData } from '../data/initialData';

interface HeaderProps {
  currentTab: TabType;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onOpenProfile }) => {
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

  return (
    <header className="sticky top-0 z-30 bg-[#f8fafc]/95 backdrop-blur-md px-4 pt-3 pb-2.5 border-b border-slate-200/80 flex items-center justify-between">
      {/* Brand lockup matching screenshot */}
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

      {/* User profile avatar matching screenshot */}
      <button
        onClick={onOpenProfile}
        aria-label="Perfil del Paciente"
        className="w-9 h-9 rounded-full bg-[#004e63] text-white flex items-center justify-center shadow-sm hover:bg-[#003c4c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#004e63]/30 cursor-pointer"
      >
        <User className="w-5 h-5 text-slate-100" />
      </button>
    </header>
  );
};

export const UserProfileModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  onResetDb?: () => void;
}> = ({
  isOpen,
  onClose,
  onResetDb,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 text-left relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-full bg-[#004e63] text-white flex items-center justify-center font-bold text-xl shadow-md">
            CM
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {userProfileData.name}
            </h3>
            <p className="text-xs text-slate-500">
              {userProfileData.age} años · DNI: {userProfileData.dni}
            </p>
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" /> Paciente Activo AMPA
            </span>
          </div>
        </div>

        <div className="space-y-3.5 text-xs text-slate-700 divide-y divide-slate-100">
          <div className="pt-2 flex items-start gap-2.5">
            <Stethoscope className="w-4 h-4 text-[#005570] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Cardiólogo Responsable</p>
              <p className="text-slate-600">{userProfileData.doctor}</p>
              <p className="text-[11px] text-slate-400">{userProfileData.clinic}</p>
            </div>
          </div>

          <div className="pt-3 flex items-start gap-2.5">
            <Pill className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Pauta Farmacológica</p>
              <p className="text-slate-600">{userProfileData.currentMedication}</p>
            </div>
          </div>

          <div className="pt-3 flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Protocolo Clínico Vigente</p>
              <p className="text-slate-600">{userProfileData.protocol}</p>
              <p className="text-[11px] text-slate-400">2 tomas al día (08:00 y 20:00) durante 7 días</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-[#005570] hover:bg-[#004257] text-white rounded-xl font-medium text-sm transition-colors text-center cursor-pointer shadow-xs"
          >
            Aceptar y Cerrar
          </button>

          {onResetDb && (
            <button
              onClick={() => {
                onResetDb();
                onClose();
              }}
              className="w-full py-2 text-center text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              Reiniciar base de datos a 0
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
