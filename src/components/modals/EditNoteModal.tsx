import React, { useState, useEffect } from 'react';
import { X, Check, FileText } from 'lucide-react';
import { DoctorNote } from '../../types';

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: DoctorNote;
  onSave: (updatedNote: DoctorNote) => void;
}

export const EditNoteModal: React.FC<EditNoteModalProps> = ({
  isOpen,
  onClose,
  note,
  onSave,
}) => {
  const [content, setContent] = useState(note.content);
  const [adherence, setAdherence] = useState(note.adherence);

  useEffect(() => {
    setContent(note.content);
    setAdherence(note.adherence);
  }, [note]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...note,
      content,
      adherence,
      date: 'Hoy, ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    });
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

        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[#005570]" />
          <h3 className="text-base font-bold text-slate-900">
            Editar Dictamen Clínico
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Médico / Especialidad
            </label>
            <p className="text-slate-500 font-medium">
              {note.doctorName} ({note.specialty})
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Observaciones y Recomendaciones
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005570] text-slate-900 text-xs leading-relaxed"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Adherencia Farmacológica
            </label>
            <input
              type="text"
              value={adherence}
              onChange={(e) => setAdherence(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005570] text-slate-900 text-xs"
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
              Guardar Nota
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
