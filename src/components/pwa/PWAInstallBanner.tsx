import React, { useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already running standalone or user dismissed in this session, do not show
  if (isInstalled || isDismissed) return null;

  // Show if browser fired beforeinstallprompt OR if on iOS Safari where install prompt is manual
  const shouldShow = isInstallable || isIOS;
  if (!shouldShow) return null;

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else {
      await install();
    }
  };

  return (
    <>
      <div className="mx-4 mt-2 mb-1 p-2.5 bg-gradient-to-r from-[#005570] to-[#0a6c8a] rounded-2xl text-white shadow-sm flex items-center justify-between gap-2.5 animate-in fade-in duration-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 text-left">
            <h4 className="text-xs font-bold leading-tight truncate">
              Instala TensioCare en tu móvil
            </h4>
            <p className="text-[10px] text-sky-100 truncate">
              Acceso directo rápido y registro sin conexión
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-2.5 py-1 bg-white text-[#005570] hover:bg-sky-50 font-bold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95 flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            <span>Instalar</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-white/70 hover:text-white rounded-md transition-colors"
            aria-label="Cerrar banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              aria-label="Cerrar guía"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#e6f2fb] text-[#005570] flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#005570] block">
                  INSTALACIÓN EN IPHONE / IPAD
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Cómo instalar TensioCare
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              En Safari en iOS puedes instalar la app en tu pantalla de inicio en 2 sencillos pasos:
            </p>

            <div className="space-y-3 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-xs mb-4">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-sky-100 text-[#005570] flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="text-slate-700">
                  Toca el botón <strong>Compartir</strong> en la barra inferior de Safari{' '}
                  <Share className="w-3.5 h-3.5 inline text-[#005570] -mt-0.5" />.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-sky-100 text-[#005570] flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="text-slate-700">
                  Desplaza hacia abajo y selecciona{' '}
                  <strong>&quot;Añadir a pantalla de inicio&quot;</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 -mt-0.5" />.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-[#005570] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#004257] transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
