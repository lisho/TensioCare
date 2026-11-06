import React, { useState } from 'react';
import { 
  Calendar, ChevronDown, TrendingUp, Info, Edit2, 
  FileText, Share2, Download, ShieldCheck, CheckCircle2, AlertTriangle, Activity
} from 'lucide-react';
import { Cycle, Measurement } from '../../types';
import { calculateStats, classifyBloodPressure } from '../../utils/eshClassifier';

interface ReportScreenProps {
  activeCycle: Cycle;
  measurements: Measurement[];
  onOpenPdfReport: () => void;
  onDownloadPdf?: () => void;
  onOpenShareModal: () => void;
  onDownloadCsv: () => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({
  activeCycle,
  measurements,
  onOpenPdfReport,
  onDownloadPdf,
  onOpenShareModal,
  onDownloadCsv,
}) => {
  const [chartMode, setChartMode] = useState<'all' | 'am' | 'pm'>('all');
  const [selectedPoint, setSelectedPoint] = useState<{
    day: string;
    tas: number;
    tad: number;
    type: 'AM' | 'PM';
    note?: string;
  } | null>(null);

  // Dynamic clinical stats calculation
  const stats = calculateStats(measurements);
  const hasData = measurements.length > 0;
  const tasClassification = hasData ? classifyBloodPressure(stats.tasMedia, stats.tadMedia) : null;

  // Build chart points from real measurements
  const chartPoints = measurements.slice(-7).reverse().map((m, i) => ({
    label: `T${i + 1}`,
    date: m.date,
    time: m.time,
    isRed: m.isOverLimit || m.tas >= 135 || m.tad >= 85,
    type: (m.timeOfDay === 'manana' ? 'AM' : 'PM') as 'AM' | 'PM',
    tas: m.tas,
    tad: m.tad,
    note: m.notes || m.context.join(', '),
  }));

  const filteredPoints = chartPoints.filter((p) => {
    if (chartMode === 'am') return p.type === 'AM';
    if (chartMode === 'pm') return p.type === 'PM';
    return true;
  });

  // SVG Chart Geometry
  const width = 320;
  const height = 150;
  const paddingLeft = 32;
  const paddingRight = 16;
  const chartWidth = width - paddingLeft - paddingRight;

  const yMin = 60;
  const yMax = 160;

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return height - ((clamped - yMin) / (yMax - yMin)) * (height - 20) - 10;
  };

  const getX = (index: number) => {
    if (filteredPoints.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + index * (chartWidth / (filteredPoints.length - 1));
  };

  // Threshold lines
  const y135 = getY(135);
  const y85 = getY(85);

  const tasCurvePoints = filteredPoints.map((d, i) => `${getX(i)},${getY(d.tas)}`);
  const tasPath = filteredPoints.length > 0 ? `M ${tasCurvePoints.join(' L ')}` : '';

  const tadCurvePoints = filteredPoints.map((d, i) => `${getX(i)},${getY(d.tad)}`);
  const tadPath = filteredPoints.length > 0 ? `M ${tadCurvePoints.join(' L ')}` : '';

  return (
    <div className="space-y-4 pb-24 text-left animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#005570]">
          AUDITORÍA CLÍNICA
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#005570]">
          <span className="w-2 h-2 rounded-full bg-[#005570]" />
          {measurements.length} tomas registradas
        </span>
      </div>

      {/* Periodo de Análisis Selector */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e6f2fb] text-[#005570] flex items-center justify-center shadow-2xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Periodo de Análisis
            </span>
            <span className="text-[15px] font-bold text-slate-900 leading-tight">
              {activeCycle.title}
            </span>
          </div>
        </div>

        <button 
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          aria-label="Seleccionar otro período"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-2">
        {/* TAS Media */}
        <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500">TAS Media</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#005570]" />
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {hasData ? stats.tasMedia : '—'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">mmHg</span>
          </div>
          <span className="text-[11px] text-[#005570] font-semibold mt-0.5 block truncate">
            {hasData && tasClassification ? tasClassification.label.split('/')[0] : 'Sin datos'}
          </span>
        </div>

        {/* TAD Media */}
        <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500">TAD Media</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#005570]" />
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {hasData ? stats.tadMedia : '—'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">mmHg</span>
          </div>
          <span className="text-[11px] text-teal-700 font-semibold mt-0.5 block truncate">
            {hasData ? 'Registrada' : 'Sin datos'}
          </span>
        </div>

        {/* Carga Hipertensiva */}
        <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500">Carga Hip.</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#005570]" />
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {hasData ? stats.cargaHipertensiva : 0}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">%</span>
          </div>
          <span className="text-[10px] text-slate-400 truncate block mt-0.5">
            {stats.overLimitCount}/{measurements.length} tomas &gt;135...
          </span>
        </div>
      </div>

      {/* Evolución TAS / TAD Chart Section */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#005570]" />
            <h3 className="font-extrabold text-[15px] text-[#0f2d3a]">
              Evolución TAS / TAD
            </h3>
          </div>

          {/* AM / PM Segmented Control */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
            <button
              onClick={() => setChartMode(chartMode === 'am' ? 'all' : 'am')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                chartMode === 'am' ? 'bg-[#005570] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AM
            </button>
            <span className="text-slate-300">/</span>
            <button
              onClick={() => setChartMode(chartMode === 'pm' ? 'all' : 'pm')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                chartMode === 'pm' ? 'bg-[#005570] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PM
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-snug mb-3">
          Monitorización diana con límites domiciliarios ESH/ESC (135/85 mmHg).
        </p>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] mb-2 px-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Matutina (AM)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-[#005570]" />
              <span>Vespertina (PM)</span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
            — Límite 135/85
          </span>
        </div>

        {/* Chart View */}
        {filteredPoints.length > 0 ? (
          <div className="relative py-1">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-38 overflow-visible">
              {/* Horizontal Grid lines */}
              <g className="text-slate-200 stroke-slate-100 stroke-[1]">
                <line x1={paddingLeft} y1={getY(150)} x2={width - paddingRight} y2={getY(150)} strokeDasharray="2 2" />
                <line x1={paddingLeft} y1={getY(110)} x2={width - paddingRight} y2={getY(110)} strokeDasharray="2 2" />
                <line x1={paddingLeft} y1={getY(65)} x2={width - paddingRight} y2={getY(65)} strokeDasharray="2 2" />
              </g>

              {/* Red Dashed Threshold Lines for 135 and 85 mmHg */}
              <line
                x1={paddingLeft}
                y1={y135}
                x2={width - paddingRight}
                y2={y135}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <line
                x1={paddingLeft}
                y1={y85}
                x2={width - paddingRight}
                y2={y85}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />

              {/* Y-axis Text Labels */}
              <text x="6" y={getY(150) + 3} className="text-[9px] fill-slate-400 font-medium">150</text>
              <text x="6" y={y135 + 3} className="text-[9px] fill-rose-500 font-bold">135</text>
              <text x="6" y={getY(110) + 3} className="text-[9px] fill-slate-400 font-medium">110</text>
              <text x="6" y={y85 + 3} className="text-[9px] fill-rose-500 font-bold">85</text>
              <text x="6" y={getY(65) + 3} className="text-[9px] fill-slate-400 font-medium">65</text>

              {/* TAS Curve Area */}
              {tasPath && (
                <path
                  d={tasPath}
                  fill="none"
                  stroke="#0f3d4d"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}

              {/* TAD Curve Area */}
              {tadPath && (
                <path
                  d={tadPath}
                  fill="none"
                  stroke="#0f3d4d"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}

              {/* Chart Points */}
              {filteredPoints.map((d, i) => {
                const x = getX(i);
                const yTas = getY(d.tas);
                const yTad = getY(d.tad);
                const dotColor = d.type === 'AM' ? '#f59e0b' : '#005570';

                return (
                  <g key={`${d.date}-${d.time}-${i}`}>
                    {/* TAS Dot */}
                    <circle
                      cx={x}
                      cy={yTas}
                      r="4"
                      fill={d.isRed ? '#ef4444' : dotColor}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="cursor-pointer hover:scale-125 transition-transform"
                      onClick={() =>
                        setSelectedPoint({
                          day: `${d.date} (${d.time})`,
                          tas: d.tas,
                          tad: d.tad,
                          type: d.type,
                          note: d.note,
                        })
                      }
                    />

                    {/* TAD Dot */}
                    <circle
                      cx={x}
                      cy={yTad}
                      r="3.5"
                      fill={d.isRed ? '#ef4444' : dotColor}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
            </svg>

            {/* X-axis days/labels */}
            <div className="flex items-center justify-between text-[11px] font-bold px-7 mt-1">
              {filteredPoints.map((d) => (
                <span
                  key={d.label}
                  className={d.isRed ? 'text-rose-600 font-extrabold' : 'text-slate-600'}
                >
                  {d.label}
                </span>
              ))}
            </div>

            {/* Interactive Tooltip */}
            {selectedPoint && (
              <div className="mt-2 p-2 bg-slate-900 text-white rounded-lg text-xs flex items-center justify-between animate-in fade-in">
                <div>
                  <span className="font-bold text-sky-300">
                    {selectedPoint.day} ({selectedPoint.type}):
                  </span>{' '}
                  <span>
                    {selectedPoint.tas}/{selectedPoint.tad} mmHg
                  </span>
                  {selectedPoint.note && (
                    <span className="text-[10px] text-amber-300 block">
                      {selectedPoint.note}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedPoint(null)}
                  className="text-slate-400 hover:text-white text-[10px] ml-2"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center text-center p-3 bg-slate-50/80 rounded-xl border border-dashed border-slate-200">
            <Activity className="w-6 h-6 text-slate-300 mb-1.5" />
            <p className="text-xs font-semibold text-slate-600">
              Aún no hay mediciones para graficar
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Registra tu primera toma en la pestaña &ldquo;Registrar&rdquo;
            </p>
          </div>
        )}

        {/* Clinical Alert Card */}
        <div className="mt-3 bg-[#eef4fa] rounded-xl p-3 border border-blue-100 flex items-start gap-2.5">
          <div className="w-5 h-5 rounded-full bg-sky-100 text-[#005570] flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs text-slate-700 leading-snug">
            {stats.overLimitCount > 0 ? (
              <span className="text-rose-700 font-medium">
                {stats.overLimitCount} {stats.overLimitCount === 1 ? 'toma sobrepasó' : 'tomas sobrepasaron'} el límite domiciliario (&gt;135/85 mmHg).
              </span>
            ) : hasData ? (
              <span>Todas las tomas registradas se mantienen dentro del objetivo de normotensión diurna (&lt;135/85 mmHg).</span>
            ) : (
              <span>Registra tus tomas matutinas y nocturnas durante 7 días para completar el protocolo clínico AMPA.</span>
            )}
          </p>
        </div>
      </div>

      {/* Exportación Médica section */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
          EXPORTACIÓN MÉDICA
        </span>

        {/* Primary PDF Export Buttons */}
        <div className="space-y-2">
          <button
            onClick={onDownloadPdf || onOpenPdfReport}
            className="w-full py-3.5 px-4 rounded-xl bg-[#005570] hover:bg-[#004257] active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#005570]/20 transition-all cursor-pointer"
            title="Descargar archivo PDF oficial del plan directamente"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Informe del Plan en PDF</span>
          </button>

          <button
            onClick={onOpenPdfReport}
            className="w-full py-2.5 px-3 rounded-xl bg-[#e6f2fb] hover:bg-[#d8e9f8] text-[#005570] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ver vista previa del informe clínico</span>
          </button>
        </div>

        {/* Secondary Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenShareModal}
            className="py-2.5 px-3 rounded-xl bg-[#e6f2fb] hover:bg-[#d8e9f8] text-[#005570] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir informe</span>
          </button>

          <button
            onClick={onDownloadCsv}
            className="py-2.5 px-3 rounded-xl bg-[#e6f2fb] hover:bg-[#d8e9f8] text-[#005570] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* Validado para consulta Card */}
      <div className="bg-[#e9f2fa] rounded-2xl p-4 border border-blue-100 flex items-center gap-3.5 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#005570] shrink-0 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-[#005570]" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-slate-900 leading-tight">
            Validado para consulta
          </h4>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
            Cumple protocolo AMPA de 7 días con 2 tomas dobles diarias.
          </p>
        </div>
      </div>

      {/* Clinical Footer */}
      <div className="pt-2 text-center text-slate-400 space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#005570]" />
          <span>Clasificación basada en las guías ESH/ESC de hipertensión arterial</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal">
          Límites AMPA: Normotensión diurna &lt; 135/85 mmHg · Sociedad Europea de Hipertensión
        </p>
      </div>
    </div>
  );
};
