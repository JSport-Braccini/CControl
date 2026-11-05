import React, { useState } from 'react';
import {
  Settings,
  Image,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { SystemConfig } from '../types/championship';
import { DEFAULT_SYSTEM_CONFIG } from '../data/authUsers';

interface SystemSettingsModalProps {
  config: SystemConfig;
  onUpdateConfig: (newConfig: Partial<SystemConfig>) => void;
  onClose: () => void;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  config,
  onUpdateConfig,
  onClose,
}) => {
  const [systemName, setSystemName] = useState(config.systemName);
  const [tagline, setTagline] = useState(config.tagline);
  const [logoUrl, setLogoUrl] = useState(config.logoUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemName.trim()) return;
    onUpdateConfig({
      systemName: systemName.trim(),
      tagline: tagline.trim(),
      logoUrl: logoUrl.trim(),
    });
    onClose();
  };

  const handleResetDefaults = () => {
    setSystemName(DEFAULT_SYSTEM_CONFIG.systemName);
    setTagline(DEFAULT_SYSTEM_CONFIG.tagline);
    setLogoUrl(DEFAULT_SYSTEM_CONFIG.logoUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        <div className="bg-[#0A192F] text-white p-5 flex items-center justify-between border-b border-red-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-0.5 border border-slate-600">
              <img
                src={logoUrl || DEFAULT_SYSTEM_CONFIG.logoUrl}
                alt="Logo JJ"
                className="w-full h-full object-cover rounded"
              />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Identidad y Nombre del Sistema
              </h3>
              <p className="text-xs text-slate-300">
                Personaliza la marca corporativa de la aplicación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre Oficial del Sistema *
            </label>
            <input
              type="text"
              required
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="Ej: JJ CopaControl Pro, JJ Torneos 2026..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lema o Subtítulo Institucional
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Ej: Sistema Corporativo de Control y Ventas QR"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ruta o URL del Logo Corporativo
            </label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="/src/assets/images/... o URL"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Incluye el escudo oficial profesional JJ generado en alta definición.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restablecer Valores JJ
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0A192F] hover:bg-slate-800 rounded-lg cursor-pointer shadow-xs"
              >
                Guardar Nombre y Logo
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
