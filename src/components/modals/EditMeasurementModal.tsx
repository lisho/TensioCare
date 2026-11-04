import React, { useState, useEffect } from 'react';
import { 
  X, Trash2, CheckCircle2, Heart, Armchair, Coffee, Pill, AlertCircle, Minus, Plus 
} from 'lucide-react';
import { Measurement, TimeOfDay } from '../../types';
import { classifyBloodPressure } from '../../utils/eshClassifier';

interface EditMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  measurement: Measurement | null;
  onSave: (updated: Measurement) => void;
  onDelete: (id: string) => void;
}

export const EditMeasurementModal: React.FC<EditMeasurementModalProps> = ({
  isOpen,
  onClose,
  measurement,
  onSave,
  onDelete,
}) => {
  const [tas, setTas] = useState<number>(measurement?.tas || 120);
  const [tad, setTad] = useState<number>(measurement?.tad || 80);
  const [pulse, setPulse] = useState<number>(measurement?.pulse || 70);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(measurement?.timeOfDay || 'manana');
  const [date, setDate] = useState<string>(measurement?.date || '');
  const [time, setTime] = useState<string>(measurement?.time || '');
  const [arm, setArm] = useState<'Brazo Izq.' | 'Brazo Der.'>(measurement?.arm || 'Brazo Izq.');
  const [selectedContext, setSelectedContext] = useState<string[]>(measurement?.context || []);
  const [notes, setNotes] = useState<string>(measurement?.notes || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (measurement) {
      setTas(measurement.tas);
      setTad(measurement.tad);
      setPulse(measurement.pulse || 70);
      setTimeOfDay(measurement.timeOfDay);
      setDate(measurement.date);
      setTime(measurement.time);
      setArm(measurement.arm);
      setSelectedContext(measurement.context || []);
      setNotes(measurement.notes || '');
      setShowDeleteConfirm(false);
    }
  }, [measurement]);

  if (!isOpen || !measurement) return null;

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...measurement,
      tas,
      tad,
      pulse,
      timeOfDay,
      date,
      time,
      arm,
      context: selectedContext,
      notes: notes.trim() || undefined,
      isOverLimit: tas >= 135 || tad >= 85,
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete(measurement.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div 
        className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 text-left relative my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#005570] block">
            MODIFICACIÓN CLÍNICA
          </span>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">
            Editar Medición Guardada
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            ID: {measurement.id}
          </p>
        </div>

        {/* Delete Confirmation Box */}
        {showDeleteConfirm ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-3 mb-4 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-800 font-bold">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>¿Eliminar esta medición?</span>
            </div>
            <p className="text-rose-700 leading-relaxed">
              Esta acción borrará permanentemente la toma de <strong>{measurement.tas}/{measurement.tad} mmHg</strong> ({measurement.date} - {measurement.time}) del servidor JSON.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 px-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2 px-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
          {/* Classification Preview Card */}
          <div className="bg-[#e4effc] rounded-xl p-3 border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${classification.dotColor}`} />
              <span className="font-bold text-xs text-slate-900">
                {classification.label}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 bg-white/80 px-2 py-0.5 rounded-md">
              {classification.guide}
            </span>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Hora
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Momento del Día */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Momento
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setTimeOfDay('manana')}
                className={`py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  timeOfDay === 'manana' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <span>☀️ Mañana</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeOfDay('noche')}
                className={`py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  timeOfDay === 'noche' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <span>🌙 Noche</span>
              </button>
            </div>
          </div>

          {/* TAS Controls */}
          <div className="bg-[#f8fafc] p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-800">TAS (Sistólica)</span>
              <span className="text-[10px] text-slate-400">mmHg</span>
            </div>
            <div className="flex items-center justify-between px-2">
              <button
                type="button"
                onClick={() => setTas((p) => Math.max(70, p - 1))}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-[#005570] flex items-center justify-center cursor-pointer hover:bg-slate-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-3xl font-extrabold text-[#005570] tabular-nums">
                {tas}
              </span>
              <button
                type="button"
                onClick={() => setTas((p) => Math.min(240, p + 1))}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-[#005570] flex items-center justify-center cursor-pointer hover:bg-slate-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TAD Controls */}
          <div className="bg-[#f8fafc] p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-800">TAD (Diastólica)</span>
              <span className="text-[10px] text-slate-400">mmHg</span>
            </div>
            <div className="flex items-center justify-between px-2">
              <button
                type="button"
                onClick={() => setTad((p) => Math.max(40, p - 1))}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-[#005570] flex items-center justify-center cursor-pointer hover:bg-slate-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-3xl font-extrabold text-[#005570] tabular-nums">
                {tad}
              </span>
              <button
                type="button"
                onClick={() => setTad((p) => Math.min(140, p + 1))}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-[#005570] flex items-center justify-center cursor-pointer hover:bg-slate-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pulso */}
          <div className="bg-[#f8fafc] p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-50" />
              <span className="font-bold text-xs text-slate-800">Pulso (ppm)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPulse((p) => Math.max(40, p - 1))}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-lg font-bold text-slate-800 w-8 text-center tabular-nums">
                {pulse}
              </span>
              <button
                type="button"
                onClick={() => setPulse((p) => Math.min(180, p + 1))}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Brazo */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-500 text-[11px] font-medium">Brazo:</span>
            <div className="flex gap-1.5">
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

          {/* Factores de Contexto */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">
              Factores de Contexto
            </label>
            <div className="flex flex-wrap gap-1.5">
              {contextOptions.map((opt) => {
                const isSelected = selectedContext.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleContext(opt.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 cursor-pointer border ${
                      isSelected
                        ? 'bg-white text-[#005570] border-sky-300 shadow-2xs font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-white'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Notas / Observaciones
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Tras café, en ayunas..."
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-slate-800"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-2">
            {!showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                title="Eliminar esta medición"
              >
                <Trash2 className="w-4 h-4" />
                <span>Borrar</span>
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-[#005570] hover:bg-[#004257] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
