import React, { useState } from 'react';
import { X, Calendar, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Cycle } from '../../types';
import { getLocalDateString } from '../../utils/dateUtils';

interface NewCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCycle: (cycle: Cycle) => void;
}

export const NewCycleModal: React.FC<NewCycleModalProps> = ({
  isOpen,
  onClose,
  onCreateCycle,
}) => {
  const [title, setTitle] = useState('Control Semanal Noviembre');
  const [protocol, setProtocol] = useState<'7_dias' | '14_dias'>('7_dias');
  const [startDate, setStartDate] = useState(
    getLocalDateString()
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + (protocol === '7_dias' ? 7 : 14));

    const rangeStr = `${start.getDate()} - ${end.getDate()} ${start.toLocaleString('es-ES', { month: 'long' })}`;

    const newCycle: Cycle = {
      id: `cycle-${Date.now()}`,
      title,
      dateRange: rangeStr,
      startDate: getLocalDateString(start),
      endDate: getLocalDateString(end),
      status: 'en_curso',
      statusLabel: 'En curso',
      dayProgress: `Día 1 de ${protocol === '7_dias' ? 7 : 14}`,
      progressPercent: 0,
      completedTakes: 0,
      totalTakes: protocol === '7_dias' ? 14 : 28,
      morningAvg: {
        tas: 120,
        tad: 80,
        label: 'Pendiente',
      },
      nightAvg: {
        tas: 120,
        tad: 80,
        label: 'Pendiente',
      },
      overallAvg: {
        tas: 120,
        tad: 80,
      },
      classificationTag: 'Iniciando',
      measurements: [],
    };

    onCreateCycle(newCycle);
    onClose();
  };

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

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#e6f2fb] text-[#005570] flex items-center justify-center">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Nuevo Ciclo Clínico
            </h3>
            <p className="text-xs text-slate-500">
              Protocolo estructurado AMPA
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nombre del Ciclo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005570] text-slate-900"
              placeholder="Ej. Control Semanal Noviembre"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Protocolo Clínico
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProtocol('7_dias')}
                className={`py-2 px-3 rounded-xl border text-center font-medium cursor-pointer ${
                  protocol === '7_dias'
                    ? 'border-[#005570] bg-[#e6f2fb] text-[#005570] font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                7 Días (14 tomas)
              </button>
              <button
                type="button"
                onClick={() => setProtocol('14_dias')}
                className={`py-2 px-3 rounded-xl border text-center font-medium cursor-pointer ${
                  protocol === '14_dias'
                    ? 'border-[#005570] bg-[#e6f2fb] text-[#005570] font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                14 Días (28 tomas)
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {protocol === '7_dias' ? 'Recomendación estándar ESH 2023 para revisión.' : 'Pauta extendida para ajuste farmacológico.'}
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005570] text-slate-900"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-3 bg-[#005570] hover:bg-[#003c4f] text-white rounded-xl font-bold cursor-pointer"
            >
              Crear Ciclo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
