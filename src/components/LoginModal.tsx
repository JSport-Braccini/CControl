import React, { useState } from 'react';
import {
  User,
  KeyRound,
  AlertCircle,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { AuthUser, SystemConfig } from '../types/championship';

interface LoginModalProps {
  systemConfig: SystemConfig;
  users: AuthUser[];
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  systemConfig,
  users,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanUser = username.trim().toLowerCase();
    const matched = users.find(
      (u) => u.username.toLowerCase() === cleanUser && u.active
    );

    setTimeout(() => {
      if (matched && (matched.password === password.trim() || !matched.password)) {
        onLoginSuccess(matched);
      } else {
        setError('Credenciales incorrectas. Verifique su usuario y contraseña o consulte con el Administrador.');
      }
      setLoading(false);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A192F]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Cabecera Corporativa Ejecutiva */}
        <div className="bg-[#0A192F] text-white p-6 pb-5 text-center border-b-2 border-red-600">
          <div className="w-16 h-16 rounded-xl mx-auto overflow-hidden bg-white p-1 border border-slate-700 shadow-md">
            <img
              src={systemConfig.logoUrl}
              alt="Logo JJ Corporativo"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <h2 className="mt-3 text-lg font-bold tracking-tight text-white font-display">
            {systemConfig.systemName}
          </h2>
          <p className="mt-0.5 text-xs text-slate-300">
            Ingreso Seguro a la Plataforma
          </p>
        </div>

        {/* Formulario Limpio (Sin lista de cuentas activas) */}
        <div className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-900 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Usuario
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-username"
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Contraseña
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A192F] font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#0A192F] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Verificando...' : 'Acceder al Sistema'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-red-500" />
            </button>
          </form>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-slate-400">
              CopaControl Cloud · Acceso Protegido
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
