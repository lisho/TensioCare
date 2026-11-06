import React, { useState } from 'react';
import { X, Check, Copy, Share2, Mail, MessageSquare } from 'lucide-react';
import { userProfileData } from '../../data/initialData';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = window.location.href;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `Informe Clínico TensioCare (AMPA 7 Días) de ${userProfileData.name}: ${shareUrl}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Compartir Informe Clínico
            </h3>
            <p className="text-xs text-slate-500">
              Enviar datos para revisión médica o personal
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Enlace de Lectura
            </label>
            <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent text-slate-600 font-mono text-[11px] outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 bg-[#005570] hover:bg-[#003d50] text-white font-semibold rounded-lg shrink-0 flex items-center gap-1 text-[11px] cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <a
              href={`mailto:?subject=Informe TensioCare AMPA - ${encodeURIComponent(userProfileData.name)}&body=Adjunto informe clínico de automonitorización de presión arterial de los últimos 7 días: ${encodeURIComponent(shareUrl)}`}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-2 font-medium"
            >
              <Mail className="w-4 h-4 text-[#005570]" />
              <span>Enviar por Correo Electrónico</span>
            </a>

            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Hola, comparto mi registro de tensión arterial con TensioCare: ' + shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 flex items-center justify-center gap-2 font-medium"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Enviar resumen por WhatsApp</span>
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
