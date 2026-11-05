import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CameraOff,
  X,
  Flashlight,
  SwitchCamera,
  CheckCircle2,
  AlertTriangle,
  ScanLine,
} from 'lucide-react';

interface CameraQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
  subtitle?: string;
  scanCategory?: 'JUGADOR' | 'ESPECTADOR' | 'BEBIDA' | 'GENERAL';
}

export const CameraQrModal: React.FC<CameraQrModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Escanear Código QR',
  subtitle = 'Apunta la cámara al código QR físico o credencial',
  scanCategory = 'GENERAL',
}) => {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanSuccessAnim, setScanSuccessAnim] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastCodeRef = useRef<string>('');

  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio might be blocked by user policy; ignore
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([80]);
      } catch {
        // ignore
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Tu navegador no permite acceso directo a la cámara. Usa el lector manual o actualiza los permisos.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as unknown as { torch?: boolean }) : {};
      setHasTorch(Boolean(capabilities?.torch));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission')) {
        setCameraError('Permiso de cámara denegado. Habilita el acceso en tu navegador para continuar.');
      } else {
        setCameraError('No se pudo acceder a la cámara. Asegúrate de que otra aplicación no la esté usando.');
      }
    }
  }, [facingMode, stopCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn } as unknown as MediaTrackConstraintSet],
        });
        setTorchOn(!torchOn);
      } catch {
        // Torch failed
      }
    }
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Process scanning loop
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    let animationFrameId: number;

    const tick = () => {
      if (
        videoRef.current &&
        canvasRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data && code.data.trim()) {
            const trimmed = code.data.trim();
            const now = Date.now();
            // Prevent burst scans: allow same code only after 2.5s, or different code after 1.2s
            const isDifferent = trimmed !== lastCodeRef.current;
            const elapsed = now - lastScanTimeRef.current;

            if (isDifferent && elapsed > 1000) {
              lastScanTimeRef.current = now;
              lastCodeRef.current = trimmed;
              setLastScannedCode(trimmed);
              setScanSuccessAnim(true);
              playBeep();
              onScan(trimmed);
              setTimeout(() => setScanSuccessAnim(false), 800);
            } else if (!isDifferent && elapsed > 2500) {
              lastScanTimeRef.current = now;
              setLastScannedCode(trimmed);
              setScanSuccessAnim(true);
              playBeep();
              onScan(trimmed);
              setTimeout(() => setScanSuccessAnim(false), 800);
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera, onScan, playBeep]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0A192F]/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Header Modal */}
      <div className="w-full max-w-md flex items-center justify-between text-white pb-3 pt-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-xs">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold tracking-tight">{title}</h3>
            <p className="text-[11px] text-slate-300 leading-tight">{subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Cerrar escáner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Viewfinder Central */}
      <div className="w-full max-w-md flex-1 my-auto flex flex-col items-center justify-center relative min-h-[300px]">
        {cameraError ? (
          <div className="w-full bg-slate-900 border border-red-500/50 rounded-2xl p-6 text-center text-white space-y-3">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
            <h4 className="text-base font-bold">Cámara no disponible</h4>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">{cameraError}</p>
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Reintentar acceso
            </button>
          </div>
        ) : (
          <div className="relative w-full aspect-square max-h-[70vh] rounded-2xl overflow-hidden bg-black border-2 border-red-600 shadow-2xl flex items-center justify-center">
            {/* Video Element */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />

            {/* Hidden Canvas for QR parsing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div
                className={`w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-2 transition-all duration-300 relative flex items-center justify-center ${
                  scanSuccessAnim
                    ? 'border-emerald-400 bg-emerald-500/20 scale-105'
                    : 'border-red-500/90'
                }`}
              >
                {/* Corner markers */}
                <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
                <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr-lg" />
                <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500 rounded-bl-lg" />
                <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500 rounded-br-lg" />

                {/* Animated laser scan bar */}
                {!scanSuccessAnim && (
                  <div className="absolute left-4 right-4 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse" />
                )}

                {scanSuccessAnim && (
                  <div className="flex flex-col items-center justify-center text-emerald-400 animate-in zoom-in-75 duration-150">
                    <CheckCircle2 className="w-12 h-12" />
                    <span className="text-xs font-bold text-white mt-1 bg-black/60 px-2 py-0.5 rounded">
                      ¡Escaneado!
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Category Pill Tag */}
            <div className="absolute top-3 left-3 bg-[#0A192F]/80 backdrop-blur-xs border border-slate-700 text-white px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5">
              <ScanLine className="w-3.5 h-3.5 text-red-400" />
              <span>{scanCategory}</span>
            </div>

            {/* Feedback Banner at bottom of viewfinder */}
            {lastScannedCode && (
              <div className="absolute bottom-3 inset-x-3 bg-slate-900/90 backdrop-blur-xs border border-slate-700 rounded-xl p-2.5 text-center text-white text-xs">
                <span className="text-slate-400 text-[10px] block">Último código detectado:</span>
                <span className="font-mono-tabular font-bold text-emerald-400 text-sm">
                  {lastScannedCode}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="w-full max-w-md flex items-center justify-center gap-4 pt-3 pb-2">
        {hasTorch && (
          <button
            type="button"
            onClick={toggleTorch}
            className={`p-3 rounded-full border transition-colors cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center ${
              torchOn
                ? 'bg-amber-400 text-slate-900 border-amber-300'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title="Linterna"
          >
            <Flashlight className="w-5 h-5" />
          </button>
        )}

        <button
          type="button"
          onClick={flipCamera}
          className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-full transition-colors cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
          title="Cambiar de cámara (frontal / trasera)"
        >
          <SwitchCamera className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer min-h-[48px] flex items-center justify-center shadow-md"
        >
          Listo / Cerrar
        </button>
      </div>
    </div>
  );
};
