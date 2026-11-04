import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Lock } from 'lucide-react';

interface ResetDbConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
}

export const ResetDbConfirmModal: React.FC<ResetDbConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  const [confirmInput, setConfirmInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmInput.trim().toUpperCase() === 'RESETEAR';

  const handleConfirm = () => {
    if (!isConfirmed) {
      setErrorMsg('Debes escribir la palabra RESETEAR para confirmar la acción.');
      return;
    }
    onConfirmReset();
    onClose();
    setConfirmInput('');
    setErrorMsg('');
  };

  const handleClose = () => {
    setConfirmInput('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-rose-200 text-left relative my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Badge */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs shrink-0">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 block">
              ZONA DE SEGURIDAD CLÍNICA
            </span>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              ¿Restablecer Base de Datos?
            </h3>
          </div>
        </div>

        <div className="p-3.5 bg-rose-50/80 border border-rose-200/80 rounded-2xl text-xs space-y-2 mb-4">
          <p className="text-rose-900 font-semibold leading-relaxed">
            Esta acción es irreversible y borrará todos los registros del archivo JSON en el servidor:
          </p>
          <ul className="list-disc list-inside space-y-1 text-rose-800 text-[11px]">
            <li>Se eliminarán todas las tomas de presión arterial guardadas.</li>
            <li>El progreso del ciclo activo volverá a <strong>0 de 14 tomas (0%)</strong>.</li>
            <li>Se conservarán los datos de tu perfil y la nota clínica base.</li>
          </ul>
        </div>

        <div className="space-y-2 mb-5">
          <label className="block text-xs font-semibold text-slate-700">
            Escribe <span className="font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">RESETEAR</span> para confirmar:
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => {
              setConfirmInput(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="RESETEAR"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono tracking-wider text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 uppercase"
            autoFocus
          />
          {errorMsg && (
            <p className="text-[11px] text-rose-600 font-medium">
              {errorMsg}
            </p>
          )}
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmed}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              isConfirmed
                ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirmar Reseteo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
