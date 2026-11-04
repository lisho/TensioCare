import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Measurement } from '../../types';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  measurement: Measurement | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  measurement,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !measurement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 text-left relative my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
              CONFIRMACIÓN REQUERIDA
            </span>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              ¿Eliminar esta toma?
            </h3>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 my-3 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Lectura registrada:</span>
            <span className="text-base font-extrabold text-[#005570]">
              {measurement.tas} / {measurement.tad} <span className="text-xs font-medium text-slate-400">mmHg</span>
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Fecha y hora:</span>
            <span className="font-semibold">{measurement.date} · {measurement.time}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Momento / Brazo:</span>
            <span>{measurement.timeOfDay === 'manana' ? 'Mañana (AM)' : 'Noche (PM)'} · {measurement.arm}</span>
          </div>
        </div>

        <p className="text-[12px] text-slate-500 leading-relaxed mb-4">
          Esta toma se eliminará permanentemente de tu base de datos JSON en el servidor y el progreso del ciclo se recalculará automáticamente.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(measurement.id);
              onClose();
            }}
            className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Sí, eliminar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
