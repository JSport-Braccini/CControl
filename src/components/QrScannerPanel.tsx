import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
  QrCode,
  UserCheck,
  Ticket,
  CupSoda,
  RotateCcw,
} from 'lucide-react';
import {
  Player,
  SpectatorTier,
  BeverageProduct,
  ScanFeedback,
  UserRole,
} from '../types/championship';
import { QrCodeImage } from './QrCodeImage';

interface QrScannerPanelProps {
  tournamentId: string;
  tournamentName: string;
  currentRole: UserRole;
  players: Player[];
  spectatorTiers: SpectatorTier[];
  beverages: BeverageProduct[];
  lastFeedback: ScanFeedback | null;
  scanHistory: ScanFeedback[];
  onProcessQr: (qrCode: string, quantity?: number) => void;
}

export const QrScannerPanel: React.FC<QrScannerPanelProps> = ({
  tournamentId,
  tournamentName,
  currentRole,
  players,
  spectatorTiers,
  beverages,
  lastFeedback,
  scanHistory,
  onProcessQr,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [scanQuantity, setScanQuantity] = useState<number>(1);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Selector de simulador ajustado por defecto al rol del usuario
  const getDefaultSimTab = () => {
    if (currentRole === 'CONTROL_JUGADORES') return 'jugadores';
    if (currentRole === 'CONTROL_ESPECTADORES') return 'espectadores';
    if (currentRole === 'CONTROL_BEBIDAS') return 'bebidas';
    return 'jugadores';
  };

  const [simulatorTab, setSimulatorTab] = useState<'jugadores' | 'espectadores' | 'bebidas'>(getDefaultSimTab);

  useEffect(() => {
    setSimulatorTab(getDefaultSimTab());
  }, [currentRole]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('El navegador no soporta captura de cámara. Usa el lector manual o el simulador interactivo.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError('Permiso de cámara denegado o no disponible en este dispositivo. Puedes ingresar el código directamente.');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      if (
        cameraActive &&
        videoRef.current &&
        canvasRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code && code.data) {
            const now = Date.now();
            if (
              code.data !== lastScannedRef.current.code ||
              now - lastScannedRef.current.time > 2000
            ) {
              lastScannedRef.current = { code: code.data, time: now };
              onProcessQr(code.data.trim(), scanQuantity);
            }
          }
        }
      }
      if (cameraActive) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (cameraActive) {
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [cameraActive, onProcessQr, scanQuantity]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualCode.trim().toUpperCase();
    if (!trimmed) return;
    onProcessQr(trimmed, scanQuantity);
    setManualCode('');
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Escaneo en Tiempo Real */}
      {lastFeedback && (
        <div
          role="alert"
          className={`rounded-xl border p-4 shadow-xs transition-all ${
            lastFeedback.status === 'duplicate'
              ? 'bg-red-50 border-red-300 text-red-950'
              : lastFeedback.status === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 shrink-0">
              {lastFeedback.status === 'duplicate' ? (
                <ShieldAlert className="w-6 h-6 text-red-600" />
              ) : lastFeedback.status === 'success' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                <span>{lastFeedback.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">{lastFeedback.qrCode}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">{lastFeedback.timestamp}</span>
              </div>
              <h3 className="mt-1 text-base font-bold tracking-tight">
                {lastFeedback.title}
              </h3>
              <p className="mt-0.5 text-sm leading-relaxed">{lastFeedback.message}</p>
              {lastFeedback.detail && (
                <p className="mt-1 text-xs font-semibold opacity-90">{lastFeedback.detail}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid: Lector QR + Simulador */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lector QR / Cámara */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Lector de Códigos QR
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Válido para jugadores, boletos de entrada y bebidas
              </p>
            </div>
            <button
              type="button"
              onClick={cameraActive ? stopCamera : startCamera}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                cameraActive
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {cameraActive ? (
                <>
                  <CameraOff className="w-3.5 h-3.5" />
                  Cerrar Cámara
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  Activar Cámara
                </>
              )}
            </button>
          </div>

          {/* Visor de Cámara */}
          <div className="relative bg-slate-900 rounded-lg overflow-hidden aspect-[4/3] flex items-center justify-center border border-slate-200">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-emerald-400 rounded-xl" />
                </div>
              </>
            ) : (
              <div className="text-center px-6 py-8">
                <QrCode className="w-10 h-10 text-slate-400 mx-auto mb-2.5" />
                <p className="text-sm font-medium text-slate-200">
                  Cámara en espera
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Enfoca el QR físico o utiliza el lector de barras/código manual debajo.
                </p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {cameraError && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              {cameraError}
            </div>
          )}

          {/* Formulario de Ingreso Directo */}
          <form onSubmit={handleManualSubmit} className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="qr-manual-input" className="text-xs font-semibold text-slate-700">
                Código QR o Lector Láser USB:
              </label>
              <div className="flex items-center gap-1.5">
                <label htmlFor="qr-qty" className="text-xs text-slate-500">
                  Cant:
                </label>
                <input
                  id="qr-qty"
                  type="number"
                  min={1}
                  max={50}
                  value={scanQuantity}
                  onChange={(e) => setScanQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="w-14 px-2 py-1 text-xs font-mono-tabular border border-slate-300 rounded-md text-right bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <input
                id="qr-manual-input"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ej: JUG-001, ESP-ADULTO, BEB-AGUA..."
                className="flex-1 min-w-0 px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              >
                Escanear
              </button>
            </div>
          </form>
        </div>

        {/* Simulador Interactivo de Tarjetas QR */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Simulador de Tarjetas QR
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Haz clic en cualquier tarjeta para validar el escaneo inmediato en la nube
              </p>
            </div>

            {/* Segmented Control */}
            <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSimulatorTab('jugadores')}
                className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  simulatorTab === 'jugadores'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Jugadores ({players.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSimulatorTab('espectadores')}
                className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  simulatorTab === 'espectadores'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Ticket className="w-3.5 h-3.5 shrink-0" />
                <span>Boletos ({spectatorTiers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSimulatorTab('bebidas')}
                className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  simulatorTab === 'bebidas'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CupSoda className="w-3.5 h-3.5 shrink-0" />
                <span>Bebidas ({beverages.length})</span>
              </button>
            </div>
          </div>

          {/* Tab Jugadores */}
          {simulatorTab === 'jugadores' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Haz clic en <strong>"Marcar Ingreso"</strong> en un jugador pendiente. Al reintentar con uno ya registrado, se desplegará la advertencia de duplicidad.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="border border-slate-200 rounded-lg p-3 flex items-center gap-3 hover:border-slate-300 transition-colors bg-slate-50/40"
                  >
                    <QrCodeImage value={player.qrCode} size={64} label={player.name} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-slate-500 truncate">
                        {player.team} · #{player.jerseyNumber}
                      </div>
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {player.name}
                      </div>
                      <div className="mt-0.5 text-[11px] font-medium">
                        {player.checkedIn ? (
                          <span className="text-emerald-700 font-mono-tabular">
                            Presente ({player.checkInTime})
                          </span>
                        ) : (
                          <span className="text-slate-400">Pendiente de ingreso</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onProcessQr(player.qrCode, 1)}
                        className={`mt-2 w-full px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          player.checkedIn
                            ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {player.checkedIn ? 'Probar Duplicado' : 'Escanear Asistencia'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Boletos */}
          {simulatorTab === 'espectadores' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Selecciona la cantidad y haz clic para simular la validación de boletos pagados en el acceso de espectadores.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {spectatorTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center bg-slate-50/40"
                  >
                    <QrCodeImage value={tier.qrCode} size={80} label={tier.label} />
                    <h4 className="mt-2 text-xs font-bold text-slate-900">{tier.label}</h4>
                    <span className="text-[11px] font-medium text-slate-500 mt-0.5">
                      {tier.isChild ? 'Menores / Niños' : 'General / Adultos'}
                    </span>
                    <div className="mt-1 text-sm font-bold font-mono-tabular text-slate-900">
                      S/ {tier.price.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => onProcessQr(tier.qrCode, scanQuantity)}
                      className="mt-2.5 w-full px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer"
                    >
                      +{scanQuantity} {scanQuantity === 1 ? 'Ingreso' : 'Ingresos'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Bebidas */}
          {simulatorTab === 'bebidas' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Escanea el QR de cada producto para registrar la venta y descontar stock automáticamente.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {beverages.map((bev) => (
                  <div
                    key={bev.id}
                    className="border border-slate-200 rounded-lg p-3.5 flex flex-col items-center text-center bg-slate-50/40"
                  >
                    <QrCodeImage value={bev.qrCode} size={76} label={bev.name} />
                    <h4 className="mt-2 text-xs font-bold text-slate-900">{bev.name}</h4>
                    <div className="text-[11px] text-slate-500 font-mono-tabular">
                      Stock: {bev.stock} uds.
                    </div>
                    <div className="mt-1 text-sm font-bold font-mono-tabular text-slate-900">
                      S/ {bev.price.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      disabled={bev.stock < scanQuantity}
                      onClick={() => onProcessQr(bev.qrCode, scanQuantity)}
                      className="mt-2.5 w-full px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {bev.stock < scanQuantity ? 'Sin Stock' : `Vender ${scanQuantity}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historial Reciente de Escaneos */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-900">
            Registro Cronológico de Escaneos QR ({scanHistory.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Torneo: {tournamentName}
          </span>
        </div>
        {scanHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Aún no se registran escaneos en este torneo. Usa el lector o los botones del simulador.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {scanHistory.slice(0, 15).map((item) => (
              <div
                key={item.id}
                className="px-5 py-2.5 flex items-center justify-between gap-4 text-xs hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono-tabular text-slate-400 shrink-0 text-[11px]">
                    {item.timestamp}
                  </span>
                  <span className="font-mono-tabular font-medium text-slate-700 shrink-0 text-[11px]">
                    {item.qrCode}
                  </span>
                  <span className="font-semibold text-slate-900 truncate">
                    {item.title}
                  </span>
                  <span className="text-slate-500 truncate hidden md:inline">
                    — {item.message}
                  </span>
                </div>
                <span
                  className={`font-semibold shrink-0 text-[11px] ${
                    item.status === 'duplicate'
                      ? 'text-red-600'
                      : item.status === 'success'
                      ? 'text-emerald-700'
                      : 'text-amber-600'
                  }`}
                >
                  {item.status === 'duplicate'
                    ? 'Duplicado bloqueado'
                    : item.status === 'success'
                    ? 'Registrado'
                    : 'Error'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
