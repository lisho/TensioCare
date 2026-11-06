import React, { useState, useEffect } from 'react';
import { 
  Heart, Calendar, ChevronDown, Sun, Moon, Minus, Plus, 
  Coffee, Armchair, Pill, AlertCircle, CheckCircle2, UserCheck,
  Clock, RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Measurement, TimeOfDay } from '../../types';
import { classifyBloodPressure } from '../../utils/eshClassifier';
import { 
  getLocalDateString, 
  getLocalTimeString, 
  getYesterdayDateString, 
  formatDateWithContext 
} from '../../utils/dateUtils';

interface RegisterScreenProps {
  onSaveMeasurement: (measurement: Omit<Measurement, 'id'>) => void;
  activePeriodTitle: string;
  onChangePeriodClick: () => void;
  initialTimeOfDay?: TimeOfDay;
  initialDate?: string;
  initialTime?: string;
  startWithCustomDateOpen?: boolean;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onSaveMeasurement,
  activePeriodTitle,
  onChangePeriodClick,
  initialTimeOfDay = 'manana',
  initialDate,
  initialTime,
  startWithCustomDateOpen = false,
}) => {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(initialTimeOfDay);
  const [tas, setTas] = useState<number>(120);
  const [tad, setTad] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(72);
  const [selectedContext, setSelectedContext] = useState<string[]>([
    'En reposo (5 min)',
    'Antes del desayuno',
  ]);
  const [arm, setArm] = useState<'Brazo Izq.' | 'Brazo Der.'>('Brazo Izq.');
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);
  const [isFavoriteActive, setIsFavoriteActive] = useState<boolean>(false);

  // Custom retroactive date and time state
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState<boolean>(startWithCustomDateOpen);
  const [measurementDate, setMeasurementDate] = useState<string>(initialDate || getLocalDateString());
  const [measurementTime, setMeasurementTime] = useState<string>(initialTime || getLocalTimeString());

  useEffect(() => {
    if (startWithCustomDateOpen) {
      setIsDateDropdownOpen(true);
    }
  }, [startWithCustomDateOpen]);

  // Dynamic classification according to ESH/ESC 2023
  const classification = classifyBloodPressure(tas, tad);

  const contextOptions = [
    { id: 'En reposo (5 min)', label: 'En reposo (5 min)', icon: Armchair },
    { id: 'Antes del desayuno', label: 'Antes del desayuno', icon: Coffee },
    { id: 'Medicación tomada', label: 'Medicación tomada', icon: Pill },
    { id: 'Con estrés', label: 'Con estrés', icon: AlertCircle },
  ];

  const toggleContext = (item: string) => {
    setSelectedContext((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSave = () => {
    const dateStr = measurementDate || getLocalDateString();
    const timeStr = measurementTime || getLocalTimeString();

    onSaveMeasurement({
      periodId: 'ciclo-actual',
      date: dateStr,
      time: timeStr,
      timeOfDay,
      tas,
      tad,
      pulse,
      arm,
      context: selectedContext,
      notes: selectedContext.includes('Con estrés') ? 'Toma registrada bajo situación de tensión' : undefined,
    });

    // Celebration feedback
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#005570', '#0ea5e9', '#10b981'],
      });
    } catch {
      // Ignore if confetti fails
    }

    setIsSavedRecently(true);
    setTimeout(() => {
      setIsSavedRecently(false);
    }, 3500);
  };

  return (
    <div className="space-y-4 pb-24 text-left animate-in fade-in duration-200">
      {/* Title & Header Bar matching screenshot */}
      <div className="flex items-start justify-between gap-2 pt-1">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[#0f2d3a] leading-tight">
            Nueva Medición de Tensión
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Registro diario con criterio clínico ESH/ESC
          </p>
        </div>
        <button
          onClick={() => setIsFavoriteActive(!isFavoriteActive)}
          aria-label="Marcar como valor de referencia"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            isFavoriteActive ? 'bg-rose-100 text-rose-600' : 'bg-[#e5effb] text-[#005570] hover:bg-[#d8e7f8]'
          }`}
          title="Guardar como pauta habitual"
        >
          <Heart className={`w-5 h-5 ${isFavoriteActive ? 'fill-rose-500' : ''}`} />
        </button>
      </div>

      {/* Período Activo Banner */}
      <div className="bg-[#e9f2fa] rounded-2xl p-3.5 flex items-center justify-between border border-blue-100/60 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#005570] shadow-2xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              PERÍODO ACTIVO
            </span>
            <span className="text-[14px] font-bold text-slate-900 leading-tight">
              {activePeriodTitle}
            </span>
          </div>
        </div>
        <button
          onClick={onChangePeriodClick}
          className="px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer border border-slate-200/50"
        >
          <span>Cambiar</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Selector Desplegable de Fecha y Hora (Añadir datos antiguos) */}
      <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isDateDropdownOpen 
          ? 'bg-[#f0f7fd] border-[#005570]/30 shadow-xs' 
          : measurementDate !== getLocalDateString()
            ? 'bg-amber-50/70 border-amber-200 shadow-2xs'
            : 'bg-white border-slate-200/80 shadow-2xs'
      }`}>
        <div 
          onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
          className="p-3.5 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs ${
              measurementDate !== getLocalDateString()
                ? 'bg-amber-100 text-amber-800'
                : 'bg-[#edf5fc] text-[#005570]'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                  FECHA Y HORA DEL REGISTRO
                </span>
                {measurementDate !== getLocalDateString() && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Histórico / Pasado
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-slate-900 block leading-tight mt-0.5">
                {formatDateWithContext(measurementDate)} • {measurementTime}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#005570] hidden sm:inline">
              {isDateDropdownOpen ? 'Ocultar' : 'Modificar día a mano'}
            </span>
            <div className={`w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-transform ${isDateDropdownOpen ? 'rotate-180 bg-slate-200' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Desplegable desplegado */}
        {isDateDropdownOpen && (
          <div className="px-3.5 pb-4 pt-1 border-t border-slate-200/60 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Quick shortcuts pills */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-500">Accesos rápidos:</span>
              <button
                type="button"
                onClick={() => {
                  setMeasurementDate(getLocalDateString());
                  setMeasurementTime(getLocalTimeString());
                }}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                  measurementDate === getLocalDateString()
                    ? 'bg-[#005570] text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => {
                  setMeasurementDate(getYesterdayDateString());
                }}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                  measurementDate === getYesterdayDateString()
                    ? 'bg-[#005570] text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Ayer
              </button>
              {measurementDate !== getLocalDateString() && (
                <button
                  type="button"
                  onClick={() => {
                    setMeasurementDate(getLocalDateString());
                    setMeasurementTime(getLocalTimeString());
                  }}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer ml-auto"
                  title="Restablecer a fecha actual"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restablecer</span>
                </button>
              )}
            </div>

            {/* Inputs manuales: Fecha y Hora */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Día de la toma:
                </label>
                <input
                  type="date"
                  max={getLocalDateString()}
                  value={measurementDate}
                  onChange={(e) => {
                    if (e.target.value) setMeasurementDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005570] shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Hora de la toma:
                </label>
                <input
                  type="time"
                  value={measurementTime}
                  onChange={(e) => {
                    if (e.target.value) {
                      setMeasurementTime(e.target.value);
                      const [hour] = e.target.value.split(':').map(Number);
                      if (hour < 14) {
                        setTimeOfDay('manana');
                      } else {
                        setTimeOfDay('noche');
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005570] shadow-2xs"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              ℹ️ Permite incorporar registros pasados de tu tensiómetro para completar tu historial médico sin perder la continuidad del protocolo AMPA.
            </p>
          </div>
        )}
      </div>

      {/* Momento del Día Selector */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          MOMENTO DEL DÍA
        </label>
        <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-200/60 rounded-2xl">
          <button
            type="button"
            onClick={() => setTimeOfDay('manana')}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              timeOfDay === 'manana'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>☀️</span>
            <span>Mañana</span>
            {timeOfDay === 'manana' && <span className="w-1.5 h-1.5 rounded-full bg-[#005570]" />}
          </button>

          <button
            type="button"
            onClick={() => setTimeOfDay('noche')}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              timeOfDay === 'noche'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🌙</span>
            <span>Noche</span>
            {timeOfDay === 'noche' && <span className="w-1.5 h-1.5 rounded-full bg-[#005570]" />}
          </button>
        </div>
      </div>

      {/* Clinical Classification Badge Card */}
      <div className="bg-[#e4effc] rounded-2xl p-3.5 border border-blue-100 shadow-xs transition-colors">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${classification.dotColor}`} />
            <span className="font-bold text-[14px] text-slate-900">
              {classification.label}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-600 bg-white/80 px-2 py-0.5 rounded-md shadow-2xs">
            {classification.guide}
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-snug pl-4.5">
          {classification.description}
        </p>
      </div>

      {/* TAS (Sistólica) Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-sm text-[#0f2d3a]">
            TAS <span className="text-slate-500 font-normal">(Sistólica)</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            mmHg
          </span>
        </div>

        <div className="flex items-center justify-between px-2">
          <button
            type="button"
            onClick={() => setTas((prev) => Math.max(70, prev - 1))}
            className="w-12 h-12 rounded-2xl bg-[#edf5fc] hover:bg-[#dbebf9] text-[#005570] flex items-center justify-center text-xl font-bold transition-transform active:scale-95 cursor-pointer shadow-2xs"
            aria-label="Disminuir TAS"
          >
            <Minus className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="text-center">
            <div className="text-[46px] font-extrabold tracking-tight text-[#005570] leading-none tabular-nums">
              {tas}
            </div>
            <div className="w-14 h-1 bg-cyan-400 mx-auto mt-1 rounded-full" />
          </div>

          <button
            type="button"
            onClick={() => setTas((prev) => Math.min(230, prev + 1))}
            className="w-12 h-12 rounded-2xl bg-[#edf5fc] hover:bg-[#dbebf9] text-[#005570] flex items-center justify-center text-xl font-bold transition-transform active:scale-95 cursor-pointer shadow-2xs"
            aria-label="Aumentar TAS"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Quick Presets for TAS */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-100/80">
          {[110, 120, 130, 140].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setTas(preset)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                tas === preset
                  ? 'bg-[#dcecfe] text-[#005570] font-bold shadow-2xs'
                  : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* TAD (Diastólica) Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-sm text-[#0f2d3a]">
            TAD <span className="text-slate-500 font-normal">(Diastólica)</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            mmHg
          </span>
        </div>

        <div className="flex items-center justify-between px-2">
          <button
            type="button"
            onClick={() => setTad((prev) => Math.max(40, prev - 1))}
            className="w-12 h-12 rounded-2xl bg-[#edf5fc] hover:bg-[#dbebf9] text-[#005570] flex items-center justify-center text-xl font-bold transition-transform active:scale-95 cursor-pointer shadow-2xs"
            aria-label="Disminuir TAD"
          >
            <Minus className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="text-center">
            <div className="text-[46px] font-extrabold tracking-tight text-[#005570] leading-none tabular-nums">
              {tad}
            </div>
            <div className="w-14 h-1 bg-cyan-400 mx-auto mt-1 rounded-full" />
          </div>

          <button
            type="button"
            onClick={() => setTad((prev) => Math.min(140, prev + 1))}
            className="w-12 h-12 rounded-2xl bg-[#edf5fc] hover:bg-[#dbebf9] text-[#005570] flex items-center justify-center text-xl font-bold transition-transform active:scale-95 cursor-pointer shadow-2xs"
            aria-label="Aumentar TAD"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Quick Presets for TAD */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-100/80">
          {[70, 80, 85, 90].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setTad(preset)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                tad === preset
                  ? 'bg-[#dcecfe] text-[#005570] font-bold shadow-2xs'
                  : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Pulso Card */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-2xs">
            <Heart className="w-5 h-5 fill-rose-50" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-slate-900">Pulso cardíaco</span>
              <span className="text-[11px] text-slate-400">(ppm)</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Opcional</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPulse((prev) => Math.max(40, prev - 1))}
            className="w-8 h-8 rounded-lg bg-[#edf5fc] hover:bg-[#dbebf9] text-[#005570] flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            aria-label="Disminuir pulso"
          >
            <Minus className="w-4 h-4 stroke-[2.5]" />
          </button>

          <span className="text-xl font-bold text-slate-900 w-8 text-center tabular-nums">
            {pulse}
          </span>

          <button
            type="button"
            onClick={() => setPulse((prev) => Math.min(180, prev + 1))}
            className="w-8 h-8 rounded-lg bg-[#edf5fc] hover:bg-[#dbebf9] text-[#005570] flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            aria-label="Aumentar pulso"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Factores de Contexto */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            FACTORES DE CONTEXTO
          </span>
          <span className="text-[11px] text-slate-400">
            Selecciona los aplicables
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {contextOptions.map((opt) => {
            const isSelected = selectedContext.includes(opt.id);
            const Icon = opt.icon;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleContext(opt.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-white text-[#005570] border-sky-300 shadow-xs font-semibold'
                    : 'bg-white/80 text-slate-600 border-slate-200/80 hover:bg-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#005570]' : 'text-slate-400'}`} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Arm selector */}
        <div className="mt-2.5 flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Brazo de toma:</span>
          {(['Brazo Izq.', 'Brazo Der.'] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setArm(b)}
              className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors cursor-pointer ${
                arm === b
                  ? 'bg-slate-800 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Success Notification feedback if saved */}
      {isSavedRecently && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {measurementDate === getLocalDateString()
              ? '¡Medición de tensión guardada correctamente en el protocolo activo!'
              : `¡Medición retroactiva del ${formatDateWithContext(measurementDate)} guardada con éxito!`}
          </span>
        </div>
      )}

      {/* Save Button matching screenshot */}
      <button
        type="button"
        onClick={handleSave}
        className="w-full py-3.5 rounded-xl bg-[#005570] hover:bg-[#004359] active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#005570]/20 transition-all cursor-pointer"
      >
        <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
        <span>
          {measurementDate === getLocalDateString()
            ? 'Guardar Medición'
            : `Guardar Medición (${formatDateWithContext(measurementDate)})`}
        </span>
      </button>
    </div>
  );
};
