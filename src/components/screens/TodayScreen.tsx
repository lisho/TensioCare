import React from 'react';
import { 
  Sun, Moon, Heart, User, CheckCircle2, 
  ChevronRight, Calendar, Activity, Info, ShieldCheck, Plus, Edit2, Trash2
} from 'lucide-react';
import { Cycle, Measurement } from '../../types';
import { calculateStats, classifyBloodPressure } from '../../utils/eshClassifier';

interface TodayScreenProps {
  activeCycle: Cycle;
  measurements?: Measurement[];
  morningMeasurement?: Measurement;
  nightMeasurement?: Measurement;
  onGoToRegisterMorning: () => void;
  onGoToRegisterNight: () => void;
  onGoToPeriods: () => void;
  onSelectDay: (day: string) => void;
  onEditMeasurement: (measurement: Measurement) => void;
  onDeleteMeasurement: (id: string) => void;
  onRequestDelete?: (measurement: Measurement) => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  activeCycle,
  measurements = [],
  morningMeasurement,
  nightMeasurement,
  onGoToRegisterMorning,
  onGoToRegisterNight,
  onGoToPeriods,
  onEditMeasurement,
  onDeleteMeasurement,
  onRequestDelete,
}) => {
  const stats = calculateStats(measurements);
  const completedTodayCount = (morningMeasurement ? 1 : 0) + (nightMeasurement ? 1 : 0);

  // Format today's date in natural Spanish
  const today = new Date();
  const todayFormatted = today.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const capitalizedToday = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  // Day initials for the 7-day strip (L, M, X, J, V, S, D)
  const dayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const todayDayIndex = today.getDay(); // 0 is Sunday

  const weekDays = [
    { label: 'L', dayIndex: 1 },
    { label: 'M', dayIndex: 2 },
    { label: 'X', dayIndex: 3 },
    { label: 'J', dayIndex: 4 },
    { label: 'V', dayIndex: 5 },
    { label: 'S', dayIndex: 6 },
    { label: 'D', dayIndex: 0 },
  ];

  const hasMeasurements = measurements.length > 0;

  // SVG dimensions for 7-day sparkline
  const svgWidth = 320;
  const svgHeight = 90;

  const minTas = 100;
  const maxTas = 150;
  const getY = (val: number) => {
    const clamped = Math.max(minTas, Math.min(maxTas, val));
    return svgHeight - ((clamped - minTas) / (maxTas - minTas)) * (svgHeight - 24) - 12;
  };

  // Build points from real measurements if available
  const tasPath = hasMeasurements
    ? `M 20,${getY(stats.tasMedia)} L 300,${getY(stats.tasMedia)}`
    : `M 20,${getY(120)} L 300,${getY(120)}`;

  const tadPath = hasMeasurements
    ? `M 20,${getY(stats.tadMedia + 25)} L 300,${getY(stats.tadMedia + 25)}`
    : `M 20,${getY(80 + 25)} L 300,${getY(80 + 25)}`;

  const morningClassification = morningMeasurement 
    ? classifyBloodPressure(morningMeasurement.tas, morningMeasurement.tad)
    : null;

  return (
    <div className="space-y-4 pb-24 text-left animate-in fade-in duration-200">
      {/* Plan Activo Progress Bar Card */}
      <div className="bg-[#e9f2fa] rounded-2xl p-3.5 border border-blue-100 shadow-xs">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#005570] shadow-2xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                PLAN ACTIVO • {activeCycle.dayProgress}
              </span>
              <h2 className="text-[14px] font-bold text-slate-900 leading-tight">
                {activeCycle.title}
              </h2>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-medium text-slate-500">Progreso</span>
            <span className="text-[15px] font-extrabold text-[#005570]">
              {activeCycle.progressPercent}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
          <div
            className="bg-[#005570] h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(2, activeCycle.progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Main Title Row */}
      <div className="pt-1">
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-extrabold tracking-tight text-[#0f2d3a]">
            {capitalizedToday}
          </h1>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#dceffe] text-[#005570]">
            {completedTodayCount} de 2 listas
          </span>
        </div>
        <p className="text-[12px] text-slate-500 mt-0.5">
          2 tomas protocolizadas por día
        </p>
      </div>

      {/* Card 1: Toma de Mañana */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 leading-tight">
                Toma de Mañana
              </h3>
              <p className="text-[11px] text-slate-400">
                {morningMeasurement 
                  ? `Registrada a las ${morningMeasurement.time}`
                  : 'Ventana recomendada: 07:00 - 09:00'}
              </p>
            </div>
          </div>

          {morningMeasurement && morningClassification ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#005570] bg-[#e6f2fb] px-2.5 py-1 rounded-full">
                <span className={`w-1.5 h-1.5 rounded-full ${morningClassification.dotColor}`} />
                {morningClassification.label.split('/')[0]}
              </span>
              <button
                onClick={() => onEditMeasurement(morningMeasurement)}
                className="p-1.5 text-slate-400 hover:text-[#005570] hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                title="Editar toma de mañana"
                aria-label="Editar toma de mañana"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (onRequestDelete) {
                    onRequestDelete(morningMeasurement);
                  } else {
                    onDeleteMeasurement(morningMeasurement.id);
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                title="Eliminar toma de mañana"
                aria-label="Eliminar toma de mañana"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="inline-flex items-center text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-full">
              Pendiente
            </span>
          )}
        </div>

        {morningMeasurement ? (
          <>
            {/* Measurement Values Box */}
            <div className="bg-[#f4f9fd] rounded-xl p-3.5 mb-3 flex items-center justify-around divide-x divide-slate-200/70">
              <div className="text-center px-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  SISTÓLICA (TAS)
                </span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-extrabold text-[#005570] tabular-nums">
                    {morningMeasurement.tas}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">mmHg</span>
                </div>
              </div>

              <div className="text-center px-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  DIASTÓLICA (TAD)
                </span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-extrabold text-[#005570] tabular-nums">
                    {morningMeasurement.tad}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">mmHg</span>
                </div>
              </div>
            </div>

            {/* Pulse & Arm details */}
            <div className="flex items-center justify-between text-xs text-slate-600 px-1 pt-1">
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-50" />
                <span className="font-semibold text-slate-800">
                  {morningMeasurement.pulse || 68} ppm
                </span>
                <span className="text-slate-400">(Pulso en reposo)</span>
              </div>

              <div className="flex items-center gap-1 text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{morningMeasurement.arm || 'Brazo Izq.'}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Realiza tu toma matutina en ayunas, tras vaciar la vejiga y descansando 5 minutos sentado antes del inflado.
            </p>

            <button
              onClick={onGoToRegisterMorning}
              className="w-full py-3 px-4 rounded-xl bg-[#005570] hover:bg-[#004359] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Registrar toma de mañana</span>
            </button>
          </>
        )}
      </div>

      {/* Card 2: Toma de Noche */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-[#005570]">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 leading-tight">
                Toma de Noche
              </h3>
              <p className="text-[11px] text-slate-500">
                {nightMeasurement ? `Registrada a las ${nightMeasurement.time}` : 'Ventana recomendada: 20:00 - 22:00'}
              </p>
            </div>
          </div>

          {nightMeasurement ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Completada
              </span>
              <button
                onClick={() => onEditMeasurement(nightMeasurement)}
                className="p-1.5 text-slate-400 hover:text-[#005570] hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                title="Editar toma de noche"
                aria-label="Editar toma de noche"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (onRequestDelete) {
                    onRequestDelete(nightMeasurement);
                  } else {
                    onDeleteMeasurement(nightMeasurement.id);
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                title="Eliminar toma de noche"
                aria-label="Eliminar toma de noche"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="inline-flex items-center text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-full">
              Pendiente
            </span>
          )}
        </div>

        {nightMeasurement ? (
          <div className="bg-[#f4f9fd] rounded-xl p-3.5 mb-2 flex items-center justify-around divide-x divide-slate-200/70">
            <div className="text-center px-4">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                SISTÓLICA (TAS)
              </span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-extrabold text-[#005570] tabular-nums">
                  {nightMeasurement.tas}
                </span>
                <span className="text-[11px] font-medium text-slate-500">mmHg</span>
              </div>
            </div>

            <div className="text-center px-4">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                DIASTÓLICA (TAD)
              </span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-extrabold text-[#005570] tabular-nums">
                  {nightMeasurement.tad}
                </span>
                <span className="text-[11px] font-medium text-slate-500">mmHg</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Recuerda tomar tu lectura vespertina antes de cenar o al menos 1 hora después para mantener la precisión clínica.
            </p>

            <button
              onClick={onGoToRegisterNight}
              className="w-full py-3 px-4 rounded-xl bg-[#005570] hover:bg-[#004359] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Registrar toma de noche</span>
            </button>
          </>
        )}
      </div>

      {/* Card 3: Tendencia del Periodo (Estabilidad de 7 Días) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              TENDENCIA DEL PERIODO
            </span>
            <h3 className="font-bold text-sm text-[#0f2d3a]">
              Estabilidad de 7 Días
            </h3>
          </div>

          <span className="text-[11px] font-semibold text-[#005570] bg-[#e6f2fb] px-2.5 py-1 rounded-full flex items-center gap-1">
            <span>→</span> {hasMeasurements ? (stats.tasMedia < 130 ? 'Normotenso' : 'Control Clínico') : 'Iniciando'}
          </span>
        </div>

        {/* Visual SVG Chart */}
        <div className="py-2">
          {hasMeasurements ? (
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-24 overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#005570" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#005570" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Top TAS solid line */}
              <path
                d={tasPath}
                fill="none"
                stroke="#005570"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Bottom TAD dashed line */}
              <path
                d={tadPath}
                fill="none"
                stroke="#005570"
                strokeWidth="2"
                strokeDasharray="3 3"
                strokeLinecap="round"
              />

              <circle cx="160" cy={getY(stats.tasMedia)} r="4" fill="#ffffff" stroke="#005570" strokeWidth="2.5" />
              <circle cx="160" cy={getY(stats.tadMedia + 25)} r="4" fill="#ffffff" stroke="#005570" strokeWidth="2.5" />
            </svg>
          ) : (
            <div className="h-20 flex flex-col items-center justify-center text-center p-2 bg-[#f8fafc] rounded-xl border border-dashed border-slate-200">
              <Activity className="w-5 h-5 text-slate-300 mb-1" />
              <span className="text-xs font-semibold text-slate-600">Sin datos de tendencia aún</span>
              <span className="text-[11px] text-slate-400">Registra tus tomas para dibujar la curva hemodinámica</span>
            </div>
          )}

          {/* Days axis (L, M, X, J, V, S, D) */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1 mt-2">
            {weekDays.map((d) => {
              const isToday = d.dayIndex === todayDayIndex;
              return (
                <span
                  key={d.label}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                    isToday
                      ? 'bg-[#dceffe] text-[#005570] font-bold shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  {d.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Summary stats row */}
        <div className="flex items-center justify-between text-xs text-slate-700 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#005570] rounded-full" />
            <span className="text-slate-500">TAS Media:</span>
            <span className="font-bold text-slate-900 tabular-nums">
              {hasMeasurements ? stats.tasMedia : '—'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-[#005570]" />
            <span className="text-slate-500">TAD Media:</span>
            <span className="font-bold text-slate-900 tabular-nums">
              {hasMeasurements ? stats.tadMedia : '—'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-teal-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{hasMeasurements ? 'Control activo' : 'Esperando datos'}</span>
          </div>
        </div>
      </div>

      {/* Card 4: Consejo Clínico */}
      <div className="bg-[#e9f2fa] rounded-2xl p-4 border border-blue-100 flex items-start gap-3 shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#005570] shrink-0 shadow-2xs mt-0.5">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <span className="block text-[10px] font-bold tracking-wider text-[#005570] uppercase">
            CONSEJO CLÍNICO
          </span>
          <h4 className="font-bold text-xs text-slate-900 mb-1">
            Preparación para la medición
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Recuerda reposar sentado durante 5 minutos antes de la toma, sin cruzar las piernas y manteniendo la espalda apoyada. Evita hablar durante el inflado.
          </p>
        </div>
      </div>

      {/* Card 5: Historial del Periodo Activo */}
      <button
        onClick={onGoToPeriods}
        className="w-full bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-[#e6f2fb] group-hover:text-[#005570] flex items-center justify-center text-slate-600 transition-colors">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 leading-tight">
              Historial del Periodo Activo
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {measurements.length} mediciones registradas de {activeCycle.totalTakes}
            </p>
          </div>
        </div>

        <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-[#e6f2fb] flex items-center justify-center text-slate-400 group-hover:text-[#005570] transition-colors">
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
};
