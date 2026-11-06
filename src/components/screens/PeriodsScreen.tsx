import React, { useState } from 'react';
import { 
  Plus, ShieldCheck, Sun, Moon, ChevronDown, ChevronUp, 
  CheckCircle2, Send, Calendar, Clock, Heart, Filter, FolderKanban, Edit2, Trash2,
  Download, FileText
} from 'lucide-react';
import { Cycle, Measurement } from '../../types';
import { classifyBloodPressure } from '../../utils/eshClassifier';

interface PeriodsScreenProps {
  activeCycle: Cycle;
  historyCycles: Cycle[];
  measurements: Measurement[];
  onOpenNewCycleModal: () => void;
  onEditMeasurement: (measurement: Measurement) => void;
  onDeleteMeasurement: (id: string) => void;
  onRequestDelete?: (measurement: Measurement) => void;
  onDownloadPlanPdf?: (cycle: Cycle) => void;
  onGoToRegisterPastDate?: () => void;
}

export const PeriodsScreen: React.FC<PeriodsScreenProps> = ({
  activeCycle,
  historyCycles,
  measurements,
  onOpenNewCycleModal,
  onEditMeasurement,
  onDeleteMeasurement,
  onRequestDelete,
  onDownloadPlanPdf,
  onGoToRegisterPastDate,
}) => {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState<boolean>(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'ultimos' | 'optimo'>('todos');

  // Dynamic calculations for Morning vs Night from actual measurements
  const morningMeasurements = measurements.filter((m) => m.timeOfDay === 'manana');
  const nightMeasurements = measurements.filter((m) => m.timeOfDay === 'noche');

  const morningAvgTas = morningMeasurements.length > 0 
    ? Math.round(morningMeasurements.reduce((acc, m) => acc + m.tas, 0) / morningMeasurements.length) 
    : 0;
  const morningAvgTad = morningMeasurements.length > 0 
    ? Math.round(morningMeasurements.reduce((acc, m) => acc + m.tad, 0) / morningMeasurements.length) 
    : 0;

  const nightAvgTas = nightMeasurements.length > 0 
    ? Math.round(nightMeasurements.reduce((acc, m) => acc + m.tas, 0) / nightMeasurements.length) 
    : 0;
  const nightAvgTad = nightMeasurements.length > 0 
    ? Math.round(nightMeasurements.reduce((acc, m) => acc + m.tad, 0) / nightMeasurements.length) 
    : 0;

  const morningClassification = morningAvgTas > 0 ? classifyBloodPressure(morningAvgTas, morningAvgTad) : null;
  const nightClassification = nightAvgTas > 0 ? classifyBloodPressure(nightAvgTas, nightAvgTad) : null;

  const progressPercent = Math.min(100, Math.round((measurements.length / activeCycle.totalTakes) * 100));

  // Filter historical cycles based on active filter
  const filteredCycles = historyCycles.filter((c) => {
    if (activeFilter === 'optimo') {
      return c.overallAvg.tas < 120 && c.overallAvg.tad < 80;
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-24 text-left animate-in fade-in duration-200">
      {/* Title & Action Row */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[#0f2d3a]">
            Ciclos y Protocolos
          </h1>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Seguimiento estructurado
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onGoToRegisterPastDate && (
            <button
              onClick={onGoToRegisterPastDate}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#005570] border border-blue-200/80 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95 cursor-pointer"
              title="Añadir toma con fecha pasada modificando el día a mano"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Añadir datos antiguos</span>
              <span className="sm:hidden">Toma antigua</span>
            </button>
          )}
          <button
            onClick={onOpenNewCycleModal}
            className="px-3.5 py-2 rounded-xl bg-[#004e63] hover:bg-[#003c4d] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Ciclo</span>
          </button>
        </div>
      </div>

      {/* Protocolo Clínico Activo Notice */}
      <div className="bg-[#e9f2fa] rounded-2xl p-3.5 border border-blue-100 flex items-center gap-3 shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-[#38bdf8] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-slate-900 leading-tight">
            Protocolo Clínico Activo
          </h4>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
            Completando 2 tomas diarias garantizarás alta precisión para tu cardiólogo.
          </p>
        </div>
      </div>

      {/* Active Cycle Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Top teal stripe */}
        <div className="h-1.5 bg-[#005570] w-full" />

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#005570] bg-[#e6f2fb] px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#005570]" />
                En curso
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {measurements.length >= 14 ? '7 de 7 Días' : `Día ${Math.min(7, Math.max(1, Math.ceil((measurements.length + 1) / 2)))} de 7`}
              </span>
            </div>

            {/* Circular Progress Gauge */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#005570]"
                  strokeDasharray={`${progressPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[11px] font-extrabold text-slate-800 tabular-nums">
                {progressPercent}%
              </span>
            </div>
          </div>

          <h2 className="text-[17px] font-extrabold text-[#0f2d3a] tracking-tight">
            {activeCycle.title}
          </h2>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-0.5 mb-3.5">
            <span>{activeCycle.dateRange}</span>
            <span className="font-medium text-slate-700">
              {measurements.length} de {activeCycle.totalTakes} tomas
            </span>
          </div>

          {/* Morning vs Evening Comparison Boxes */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {/* Morning Box */}
            <div className="bg-[#f4f9fd] rounded-xl p-3 border border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Mañana</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#005570]" />
              </div>
              <div className="flex items-baseline gap-1">
                {morningAvgTas > 0 ? (
                  <>
                    <span className="text-xl font-extrabold text-[#005570] tabular-nums">
                      {morningAvgTas} <span className="text-sm font-semibold text-slate-400">/</span> {morningAvgTad}
                    </span>
                    <span className="text-[10px] text-slate-400">mmHg</span>
                  </>
                ) : (
                  <span className="text-sm font-semibold text-slate-400">
                    — / — mmHg
                  </span>
                )}
              </div>
              <span className="block text-[11px] text-[#005570] font-semibold mt-1">
                {morningClassification ? morningClassification.label.split('/')[0] : 'Sin tomas'}
              </span>
            </div>

            {/* Night Box */}
            <div className="bg-[#f4f9fd] rounded-xl p-3 border border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <Moon className="w-3.5 h-3.5 text-[#005570]" />
                  <span>Noche</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#005570]" />
              </div>
              <div className="flex items-baseline gap-1">
                {nightAvgTas > 0 ? (
                  <>
                    <span className="text-xl font-extrabold text-[#005570] tabular-nums">
                      {nightAvgTas} <span className="text-sm font-semibold text-slate-400">/</span> {nightAvgTad}
                    </span>
                    <span className="text-[10px] text-slate-400">mmHg</span>
                  </>
                ) : (
                  <span className="text-sm font-semibold text-slate-400">
                    — / — mmHg
                  </span>
                )}
              </div>
              <span className="block text-[11px] text-teal-700 font-semibold mt-1">
                {nightClassification ? nightClassification.label.split('/')[0] : 'Sin tomas'}
              </span>
            </div>
          </div>

          {/* Action buttons: Download Plan PDF & Toggle breakdown */}
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <button
              onClick={() => onDownloadPlanPdf && onDownloadPlanPdf(activeCycle)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#005570] hover:bg-[#004359] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-[0.99]"
              title="Descargar informe oficial en PDF de este plan"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Informe en PDF</span>
            </button>

            <button
              onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
              className="py-2.5 px-3 rounded-xl bg-[#e6f0fa] hover:bg-[#d8e8f8] text-[#005570] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{isBreakdownOpen ? 'Ocultar desglose' : 'Ver desglose'}</span>
              {isBreakdownOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Expandable breakdown list */}
          {isBreakdownOpen && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>Fecha / Toma</span>
                <span>Valores</span>
                <span>Contexto</span>
              </div>

              {measurements.length > 0 ? (
                measurements.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      m.isOverLimit
                        ? 'bg-rose-50/60 border-rose-200'
                        : 'bg-slate-50/60 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {m.timeOfDay === 'manana' ? (
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Moon className="w-3.5 h-3.5 text-[#005570]" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-800 block">
                          {m.date}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {m.time} · {m.arm}
                        </span>
                      </div>
                    </div>

                    <div className="text-center">
                      <span className={`font-bold tabular-nums ${m.isOverLimit ? 'text-rose-600 font-extrabold' : 'text-[#005570]'}`}>
                        {m.tas}/{m.tad}
                      </span>
                      <span className="text-[10px] text-slate-400 block">mmHg</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditMeasurement(m)}
                        className="p-1 text-slate-400 hover:text-[#005570] hover:bg-slate-200/60 rounded-md cursor-pointer transition-colors"
                        title="Editar medición"
                        aria-label="Editar medición"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (onRequestDelete) {
                            onRequestDelete(m);
                          } else {
                            onDeleteMeasurement(m.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 rounded-md cursor-pointer transition-colors"
                        title="Eliminar medición"
                        aria-label="Eliminar medición"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs">
                  No hay mediciones en este ciclo todavía.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Historial de Ciclos */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="font-bold text-sm text-[#0f2d3a]">
            Historial de Ciclos
          </h3>
          <span className="text-xs text-slate-500">
            {filteredCycles.length} completados
          </span>
        </div>

        {/* Filters bar */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveFilter('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'todos'
                ? 'bg-[#004e63] text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todos
          </button>

          <button
            onClick={() => setActiveFilter('ultimos')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'ultimos'
                ? 'bg-[#004e63] text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Últimos 6 meses
          </button>

          <button
            onClick={() => setActiveFilter('optimo')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'optimo'
                ? 'bg-[#004e63] text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Óptimo (&lt;120/80)
          </button>
        </div>

        {/* History Cycle Items or Clean Empty State */}
        {filteredCycles.length > 0 ? (
          <div className="space-y-3">
            {filteredCycles.map((cycle) => {
              const isExpanded = expandedHistoryId === cycle.id;

              return (
                <div
                  key={cycle.id}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {cycle.statusLabel}
                      </span>
                      <span className="text-xs text-slate-500">
                        {cycle.totalTakes} tomas
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold text-[#005570] tabular-nums">
                        {cycle.overallAvg.tas} <span className="text-slate-400 font-normal">/</span> {cycle.overallAvg.tad}
                      </span>
                      <span className="text-[10px] text-slate-400 block -mt-0.5">
                        mmHg Promedio
                      </span>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 leading-tight">
                    {cycle.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 mb-3">
                    {cycle.dateRange}
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-[#005570] bg-[#e8f2fa] px-2.5 py-1 rounded-full">
                      {cycle.classificationTag}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDownloadPlanPdf && onDownloadPlanPdf(cycle)}
                        className="text-xs text-[#005570] hover:text-[#004359] font-bold flex items-center gap-1 bg-[#e8f2fa] hover:bg-[#d8e8f8] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        title="Descargar informe PDF de este plan"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => setExpandedHistoryId(isExpanded ? null : cycle.id)}
                        className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <span>Tomas</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 text-center bg-white rounded-2xl border border-slate-100 shadow-xs">
            <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-700">Sin ciclos archivados</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Tu historial de protocolos completados y revisiones clínicas anteriores se archivará aquí automáticamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
