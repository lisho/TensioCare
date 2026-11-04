import React from 'react';
import { X, Printer, ShieldCheck, Heart, Download } from 'lucide-react';
import { Cycle, DoctorNote, Measurement } from '../../types';
import { userProfileData } from '../../data/initialData';

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycle: Cycle;
  measurements: Measurement[];
  doctorNote: DoctorNote;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  isOpen,
  onClose,
  cycle,
  measurements,
  doctorNote,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-left my-auto relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal close & print controls */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#005570]" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Vista previa de Documento Clínico AMPA
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#005570] hover:bg-[#004359] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Medical Dossier Header */}
        <div className="border border-slate-200 rounded-2xl p-5 mb-5 bg-slate-50/50">
          <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#005570] flex items-center justify-center text-white">
                  <Heart className="w-3.5 h-3.5 fill-white" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-[#005570]">
                  TensioCare Clinical Report
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automonitorización de la Presión Arterial (AMPA) · Guía ESH/ESC 2023
              </p>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5" /> Protocolo Validado
              </span>
              <p className="text-[11px] text-slate-400 mt-1">ID: TC-2024-8921</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Paciente</span>
              <span className="font-bold text-slate-900">{userProfileData.name}</span>
              <span className="text-slate-500 block text-[11px]">{userProfileData.age} años · DNI {userProfileData.dni}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Médico Remitente</span>
              <span className="font-bold text-slate-900">{doctorNote.doctorName}</span>
              <span className="text-slate-500 block text-[11px]">{doctorNote.specialty}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Período de Estudio</span>
              <span className="font-bold text-slate-900">{cycle.dateRange}</span>
              <span className="text-slate-500 block text-[11px]">{cycle.completedTakes} tomas registradas</span>
            </div>
          </div>
        </div>

        {/* Executive Summary Metrics Box */}
        <div className="mb-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Resumen Clínico Hemodinámico
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-[#f0f7fd] p-3 rounded-xl border border-blue-100">
              <span className="text-[10px] text-slate-500 block font-medium">TAS Media</span>
              <span className="text-xl font-extrabold text-[#005570]">
                {measurements.length > 0 ? Math.round(measurements.reduce((a, b) => a + b.tas, 0) / measurements.length) : '—'}{' '}
                <span className="text-xs font-normal">mmHg</span>
              </span>
              <span className="text-[10px] text-teal-700 font-semibold block">
                {measurements.length > 0 ? 'Registrada' : 'Sin datos'}
              </span>
            </div>

            <div className="bg-[#f0f7fd] p-3 rounded-xl border border-blue-100">
              <span className="text-[10px] text-slate-500 block font-medium">TAD Media</span>
              <span className="text-xl font-extrabold text-[#005570]">
                {measurements.length > 0 ? Math.round(measurements.reduce((a, b) => a + b.tad, 0) / measurements.length) : '—'}{' '}
                <span className="text-xs font-normal">mmHg</span>
              </span>
              <span className="text-[10px] text-teal-700 font-semibold block">
                {measurements.length > 0 ? 'Registrada' : 'Sin datos'}
              </span>
            </div>

            <div className="bg-[#f0f7fd] p-3 rounded-xl border border-blue-100">
              <span className="text-[10px] text-slate-500 block font-medium">Pulso Medio</span>
              <span className="text-xl font-extrabold text-slate-800">
                {measurements.length > 0 ? Math.round(measurements.reduce((a, b) => a + (b.pulse || 68), 0) / measurements.length) : '—'}{' '}
                <span className="text-xs font-normal">ppm</span>
              </span>
              <span className="text-[10px] text-slate-500 block">
                {measurements.length > 0 ? 'Normocárdico' : 'Sin datos'}
              </span>
            </div>

            <div className="bg-[#f0f7fd] p-3 rounded-xl border border-blue-100">
              <span className="text-[10px] text-slate-500 block font-medium">Carga Hipertensiva</span>
              <span className="text-xl font-extrabold text-[#005570]">
                {measurements.length > 0 ? Math.round((measurements.filter(m => m.tas >= 135 || m.tad >= 85).length / measurements.length) * 100) : 0}%
              </span>
              <span className="text-[10px] text-slate-500 block">
                {measurements.filter(m => m.tas >= 135 || m.tad >= 85).length}/{measurements.length} &gt;135/85
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="mb-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Desglose de Mediciones Domiciliarias (AMPA)
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-left font-semibold">
                  <th className="p-2 border-b">Fecha</th>
                  <th className="p-2 border-b">Horario</th>
                  <th className="p-2 border-b">TAS / TAD</th>
                  <th className="p-2 border-b">Pulso</th>
                  <th className="p-2 border-b">Contexto / Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {measurements.length > 0 ? (
                  measurements.map((m) => (
                    <tr key={m.id} className={m.isOverLimit ? 'bg-rose-50/60' : ''}>
                      <td className="p-2 font-medium text-slate-900">{m.date}</td>
                      <td className="p-2 text-slate-600">{m.time} ({m.timeOfDay === 'manana' ? 'AM' : 'PM'})</td>
                      <td className="p-2 font-bold">
                        <span className={m.isOverLimit ? 'text-rose-600 font-extrabold' : 'text-[#005570]'}>
                          {m.tas} / {m.tad} mmHg
                        </span>
                      </td>
                      <td className="p-2 text-slate-600">{m.pulse || 68} ppm</td>
                      <td className="p-2 text-slate-500 text-[11px]">
                        {m.notes || m.context.join(', ')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                      No hay tomas registradas en este período todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Doctor Remarks */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 mb-6 text-xs text-slate-700">
          <span className="font-bold text-slate-900 block mb-1">
            Dictamen Clínico:
          </span>
          <p className="italic leading-relaxed">
            {doctorNote.content}
          </p>
          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Firma digital: {doctorNote.doctorName} (Col. Med. 28/48201)</span>
            <span>Fecha de emisión: {new Date().toLocaleDateString('es-ES')}</span>
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex justify-end gap-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-[#005570] hover:bg-[#004359] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Informe Oficial</span>
          </button>
        </div>
      </div>
    </div>
  );
};
