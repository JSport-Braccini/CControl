import React, { useState } from 'react';
import {
  Download,
  QrCode,
  Users,
  Ticket,
  CupSoda,
  DollarSign,
  Trophy,
  ShieldAlert,
  Calendar,
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  ScanLine,
  Lock,
} from 'lucide-react';
import {
  Tournament,
  Player,
  SpectatorTier,
  SpectatorEntry,
  BeverageProduct,
  BeverageSale,
  ScanFeedback,
  UserRole,
} from '../types/championship';
import { CameraQrModal } from './CameraQrModal';

interface SummaryDashboardProps {
  tournament: Tournament;
  players: Player[];
  spectatorTiers: SpectatorTier[];
  spectatorEntries: SpectatorEntry[];
  beverages: BeverageProduct[];
  beverageSales: BeverageSale[];
  lastFeedback: ScanFeedback | null;
  currentUserRole: UserRole;
  currentUserName: string;
  connectedClientsCount?: number;
  onQuickScan: (qrCode: string, quantity?: number) => void;
  onGoToScanner: () => void;
  onGoToPlayers: () => void;
  onGoToSpectators: () => void;
  onGoToBeverages: () => void;
  onGoToTournaments: () => void;
}

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({
  tournament,
  players,
  spectatorTiers,
  spectatorEntries,
  beverages,
  beverageSales,
  lastFeedback,
  currentUserRole,
  currentUserName,
  connectedClientsCount = 1,
  onQuickScan,
  onGoToScanner,
  onGoToPlayers,
  onGoToSpectators,
  onGoToBeverages,
  onGoToTournaments,
}) => {
  const [directQrCode, setDirectQrCode] = useState('');
  const [directQty, setDirectQty] = useState<number>(1);
  const [showDirectCamera, setShowDirectCamera] = useState(false);

  const isAdmin = currentUserRole === 'ADMIN';
  const isPlayersUser = currentUserRole === 'CONTROL_JUGADORES';
  const isSpectatorsUser = currentUserRole === 'CONTROL_ESPECTADORES';
  const isBeveragesUser = currentUserRole === 'CONTROL_BEBIDAS';

  // Cálculos de Jugadores
  const totalPlayers = players.length;
  const checkedInPlayers = players.filter((p) => p.checkedIn).length;
  const pendingPlayers = totalPlayers - checkedInPlayers;
  const totalDuplicateAttempts = players.reduce(
    (acc, p) => acc + p.duplicateAttempts,
    0
  );
  const attendancePct =
    totalPlayers > 0 ? Math.round((checkedInPlayers / totalPlayers) * 100) : 0;

  // Cálculos de Espectadores
  const totalSpectatorsCount = spectatorEntries.reduce(
    (acc, e) => acc + e.quantity,
    0
  );
  const totalChildrenCount = spectatorEntries
    .filter((e) => e.isChild)
    .reduce((acc, e) => acc + e.quantity, 0);

  const totalAdultsCount = spectatorEntries
    .filter((e) => e.ticketType === 'ADULTO')
    .reduce((acc, e) => acc + e.quantity, 0);

  const totalVipCount = spectatorEntries
    .filter((e) => e.ticketType === 'VIP')
    .reduce((acc, e) => acc + e.quantity, 0);

  const totalTicketRevenue = spectatorEntries.reduce(
    (acc, e) => acc + e.totalAmount,
    0
  );

  const ticketBreakdown = spectatorTiers.map((tier) => {
    const matching = spectatorEntries.filter(
      (e) => e.ticketType === tier.type || e.qrCode === tier.qrCode
    );
    const qty = matching.reduce((acc, e) => acc + e.quantity, 0);
    const revenue = matching.reduce((acc, e) => acc + e.totalAmount, 0);
    return { ...tier, qty, revenue };
  });

  // Cálculos de Bebidas
  const totalBeverageUnits = beverages.reduce((acc, b) => acc + b.soldCount, 0);
  const totalBeverageRevenue = beverages.reduce(
    (acc, b) => acc + b.soldCount * b.price,
    0
  );

  const grandTotalRevenue = totalTicketRevenue + totalBeverageRevenue;

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = directQrCode.trim().toUpperCase();
    if (!clean) return;
    onQuickScan(clean, directQty);
    setDirectQrCode('');
  };

  const handleExportCsv = () => {
    const lines: string[] = [
      `REPORTE OFICIAL DEL TORNEO - ${tournament.name.toUpperCase()}`,
      `Sede: ${tournament.venue} | Fecha: ${tournament.date} | Edicion: ${tournament.edition}`,
      `Generado: ${new Date().toLocaleString('es-PE')}`,
      '',
      'RESUMEN FINANCIERO Y RECAUDACION',
      `Total Recaudado en Boletos (S/),${totalTicketRevenue.toFixed(2)}`,
      `Total Recaudado en Bebidas (S/),${totalBeverageRevenue.toFixed(2)}`,
      `Gran Total Consolidado (S/),${grandTotalRevenue.toFixed(2)}`,
      '',
      'CONTROL DE ESPECTADORES Y BOLETERIA',
      'Tipo de Entrada,Tarifa Unitaria (S/),Personas Ingresadas,Subtotal (S/)',
      ...ticketBreakdown.map(
        (t) => `"${t.label}",${t.price.toFixed(2)},${t.qty},${t.revenue.toFixed(2)}`
      ),
      `Total Niños / Menores,,${totalChildrenCount},`,
      `Total General Adultos,,${totalAdultsCount},`,
      `Total Preferencial VIP,,${totalVipCount},`,
      `Total General Espectadores,,${totalSpectatorsCount},${totalTicketRevenue.toFixed(2)}`,
      '',
      'CONTROL DE VENTAS DE BEBIDAS',
      'Producto,Presentacion,Precio (S/),Unidades Vendidas,Stock Disponible,Subtotal (S/)',
      ...beverages.map(
        (b) =>
          `"${b.name}","${b.presentation}",${b.price.toFixed(2)},${b.soldCount},${b.stock},${(
            b.soldCount * b.price
          ).toFixed(2)}`
      ),
      '',
      'CONTROL DE ASISTENCIA DE JUGADORES',
      'Codigo QR,Nombre,Equipo,Dorsal,Estado,Hora Ingreso,Intentos Duplicados Bloqueados',
      ...players.map(
        (p) =>
          `${p.qrCode},"${p.name}","${p.team}",${p.jerseyNumber},${
            p.checkedIn ? 'PRESENTE' : 'PENDIENTE'
          },${p.checkInTime || '-'},${p.duplicateAttempts}`
      ),
    ];

    const blob = new Blob(['\uFEFF' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_${tournament.name.replace(/\s+/g, '_')}_${tournament.date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. MÓDULO DE ESCANEO DIRECTO UNIFICADO (ARRIBA DEL MENÚ) */}
      <div className="bg-[#0A192F] text-white border-2 border-red-600 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-semibold">
              <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-mono">
                Auto-Distribución Inteligente QR
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300 text-[11px] sm:text-xs">Estación: <strong>{currentUserName}</strong></span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-red-500 animate-pulse shrink-0" />
              <span>Escanear QR Directo</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Escanea con la cámara en vivo o lector láser: el sistema reconoce al instante si es <strong>Jugador</strong> (con control de duplicidad), <strong>Entrada</strong> (contando niños/adultos) o <strong>Bebida</strong> (descontando stock y sumando venta).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Botón de Cámara en Vivo Directo (igual que en los demás usuarios) */}
            <button
              type="button"
              onClick={() => setShowDirectCamera(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md min-h-[42px] shrink-0 active:scale-95"
              title="Abrir cámara del dispositivo para escanear QR"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>Escanear con Cámara</span>
            </button>
          </div>
        </div>

        {/* Input de Escaneo Directo */}
        <form onSubmit={handleDirectSubmit} className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={directQrCode}
              onChange={(e) => setDirectQrCode(e.target.value)}
              placeholder="Escanea con láser o ingresa código (ej: JUG-001, ESP-ADULTO, BEB-VOLT)..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono-tabular bg-slate-900/90 text-white placeholder:text-slate-500 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[40px]"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1.5 rounded-xl border border-slate-700 text-xs min-h-[40px]">
              <span className="text-slate-400 text-[11px]">Cant:</span>
              <input
                type="number"
                min={1}
                max={50}
                value={directQty}
                onChange={(e) => setDirectQty(Math.max(1, Number(e.target.value) || 1))}
                className="w-10 text-center font-mono-tabular bg-transparent text-white font-bold focus:outline-none text-xs sm:text-sm"
              />
            </div>

            <button
              type="submit"
              className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5 min-h-[40px]"
            >
              Procesar QR
            </button>
          </div>
        </form>

        {/* Acceso rápido a pruebas directas */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
          <span className="text-slate-400 text-[10px] sm:text-[11px]">Pruebas rápidas:</span>
          <button
            type="button"
            onClick={() => onQuickScan('JUG-001', 1)}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 cursor-pointer text-[10px] sm:text-[11px]"
          >
            Jugador JUG-001
          </button>
          <button
            type="button"
            onClick={() => onQuickScan('ESP-ADULTO', directQty)}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 cursor-pointer text-[10px] sm:text-[11px]"
          >
            Boleto Adulto
          </button>
          <button
            type="button"
            onClick={() => onQuickScan('ESP-NINO', directQty)}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 cursor-pointer text-[10px] sm:text-[11px]"
          >
            Boleto Niño
          </button>
          <button
            type="button"
            onClick={() => onQuickScan('BEB-VOLT', directQty)}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 cursor-pointer text-[10px] sm:text-[11px]"
          >
            Bebida Volt
          </button>
          <button
            type="button"
            onClick={() => onQuickScan('BEB-SPORADE', directQty)}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 cursor-pointer text-[10px] sm:text-[11px]"
          >
            Bebida Sporade
          </button>
        </div>

        {/* Feedback del último escaneo directo */}
        {lastFeedback && (
          <div
            className={`mt-3.5 p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
              lastFeedback.status === 'duplicate'
                ? 'bg-red-950/80 border-red-500 text-red-100'
                : lastFeedback.status === 'success'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100'
                : 'bg-amber-950/80 border-amber-500 text-amber-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {lastFeedback.status === 'duplicate' ? (
                <ShieldAlert className="w-4 h-4 text-red-400" />
              ) : lastFeedback.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold tracking-tight">{lastFeedback.title}</span> — {lastFeedback.message}
            </div>
            <span className="text-[10px] font-mono-tabular opacity-75 shrink-0">
              {lastFeedback.timestamp}
            </span>
          </div>
        )}
      </div>

      {/* 2. MENÚ PRINCIPAL CON ÍCONOS PARA INGRESAR DIRECTAMENTE */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 font-display">
            Menú de Módulos del Sistema
          </h2>
          <span className="text-xs text-slate-500">
            Haz clic en cualquier estación para gestionar
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mt-3">
          {/* Módulo Jugadores */}
          <button
            type="button"
            onClick={onGoToPlayers}
            className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-600 rounded-xl p-3 sm:p-4 text-left transition-all shadow-xs group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 group-hover:text-blue-700 transition-colors" />
            </div>
            <div className="mt-2.5 sm:mt-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-900 truncate">
                Control Jugadores
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
                {checkedInPlayers} de {totalPlayers} presentes
              </p>
            </div>
          </button>

          {/* Módulo Espectadores */}
          <button
            type="button"
            onClick={onGoToSpectators}
            className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-600 rounded-xl p-3 sm:p-4 text-left transition-all shadow-xs group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 group-hover:text-emerald-700 transition-colors" />
            </div>
            <div className="mt-2.5 sm:mt-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-900 truncate">
                Control Espectadores
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 font-mono-tabular truncate">
                {totalSpectatorsCount} boletos (S/ {totalTicketRevenue.toFixed(0)})
              </p>
            </div>
          </button>

          {/* Módulo Bebidas */}
          <button
            type="button"
            onClick={onGoToBeverages}
            className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-600 rounded-xl p-3 sm:p-4 text-left transition-all shadow-xs group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <CupSoda className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 group-hover:text-amber-700 transition-colors" />
            </div>
            <div className="mt-2.5 sm:mt-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-900 truncate">
                Control Bebidas
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 font-mono-tabular truncate">
                {totalBeverageUnits} ventas (S/ {totalBeverageRevenue.toFixed(0)})
              </p>
            </div>
          </button>

          {/* Módulo Torneos */}
          <button
            type="button"
            onClick={onGoToTournaments}
            className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-red-600 rounded-xl p-3 sm:p-4 text-left transition-all shadow-xs group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 group-hover:text-red-700 transition-colors" />
            </div>
            <div className="mt-2.5 sm:mt-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-red-900 truncate">
                Gestión de Torneos
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
                {tournament.name}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. VISUALIZACIÓN DE TOTALES SEGÚN EL ROL DEL USUARIO */}
      {/* ========================================================================= */}

      {/* CASO A: USUARIO ADMINISTRADOR -> VE TODOS LOS TOTALES DETALLADOS */}
      {isAdmin && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Consolidado General Financiero y Operativo (Exclusivo Administrador)
            </span>
          </div>

          {/* KPI Strip 4 Columnas (2x2 en móvil para visualización ejecutiva compacta sin barras de scroll) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 shadow-xs flex flex-col justify-between min-h-[110px] sm:min-h-[130px]">
              <div>
                <div className="text-[11px] sm:text-xs font-medium text-slate-500 flex items-center justify-between">
                  <span className="truncate">Gran Total</span>
                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                </div>
                <div className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold font-mono-tabular text-slate-900 truncate">
                  S/ {grandTotalRevenue.toFixed(2)}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] sm:text-xs text-slate-500 font-mono-tabular truncate">
                Boletos + Bebidas
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 shadow-xs flex flex-col justify-between min-h-[110px] sm:min-h-[130px]">
              <div>
                <div className="text-[11px] sm:text-xs font-medium text-slate-500 flex items-center justify-between">
                  <span className="truncate">Ventas Boletos</span>
                  <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                </div>
                <div className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold font-mono-tabular text-slate-900 truncate">
                  S/ {totalTicketRevenue.toFixed(2)}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] sm:text-xs text-slate-600 font-mono-tabular truncate">
                {totalSpectatorsCount} asistentes ({totalChildrenCount} niños)
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 shadow-xs flex flex-col justify-between min-h-[110px] sm:min-h-[130px]">
              <div>
                <div className="text-[11px] sm:text-xs font-medium text-slate-500 flex items-center justify-between">
                  <span className="truncate">Ventas Bebidas</span>
                  <CupSoda className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                </div>
                <div className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold font-mono-tabular text-slate-900 truncate">
                  S/ {totalBeverageRevenue.toFixed(2)}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] sm:text-xs text-slate-600 font-mono-tabular truncate">
                {totalBeverageUnits} unidades QR
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 shadow-xs flex flex-col justify-between min-h-[110px] sm:min-h-[130px]">
              <div>
                <div className="text-[11px] sm:text-xs font-medium text-slate-500 flex items-center justify-between">
                  <span className="truncate">Jugadores</span>
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                </div>
                <div className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold font-mono-tabular text-slate-900 truncate">
                  {checkedInPlayers}/{totalPlayers}{' '}
                  <span className="text-xs sm:text-sm font-semibold text-emerald-700">
                    ({attendancePct}%)
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] sm:text-xs font-mono-tabular flex items-center justify-between truncate">
                <span className="text-slate-500 truncate">{pendingPlayers} pend.</span>
                {totalDuplicateAttempts > 0 ? (
                  <span className="text-red-600 font-semibold flex items-center gap-0.5 shrink-0">
                    <ShieldAlert className="w-3 h-3" />
                    {totalDuplicateAttempts} dup
                  </span>
                ) : (
                  <span className="text-slate-400 shrink-0">0 dup</span>
                )}
              </div>
            </div>
          </div>

          {/* Tablas Detalladas Exclusivas de Administrador */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabla Entradas */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Desglose Completo de Boletos de Espectadores
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Detalle financiero por tarifa y categoría
                  </p>
                </div>
                <span className="text-xs font-mono-tabular font-semibold text-slate-700">
                  {totalSpectatorsCount} personas
                </span>
              </div>

              {/* Vista Móvil Desglose Boletos (sm:hidden) */}
              <div className="sm:hidden divide-y divide-slate-100 flex-1">
                {ticketBreakdown.map((row) => (
                  <div key={row.id} className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{row.label}</span>
                      <span className="font-mono-tabular font-bold text-emerald-700">
                        S/ {row.revenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{row.isChild ? 'Menores / Niños' : row.type === 'VIP' ? 'Zona VIP' : 'General'}</span>
                      <span className="font-mono-tabular">{row.qty} asistentes (S/ {row.price.toFixed(2)} c/u)</span>
                    </div>
                  </div>
                ))}
                <div className="p-3.5 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Total Boletos ({totalSpectatorsCount} personas)</span>
                  <span className="text-emerald-700 font-mono-tabular">S/ {totalTicketRevenue.toFixed(2)}</span>
                </div>
              </div>

              {/* Vista Desktop Desglose Boletos (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto flex-1 w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                      <th className="py-2.5 px-5">Tipo de Entrada</th>
                      <th className="py-2.5 px-3 text-right">Tarifa</th>
                      <th className="py-2.5 px-3 text-right">Personas</th>
                      <th className="py-2.5 px-5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {ticketBreakdown.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-5">
                          <div className="font-medium text-slate-900 text-xs">{row.label}</div>
                          <div className="text-[11px] text-slate-400 font-mono-tabular">
                            {row.qrCode} · {row.isChild ? 'Menores / Niños' : row.type === 'VIP' ? 'Zona VIP' : 'General'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-tabular text-slate-600 text-xs">
                          S/ {row.price.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-tabular font-semibold text-slate-900 text-xs">
                          {row.qty}
                        </td>
                        <td className="py-2.5 px-5 text-right font-mono-tabular font-semibold text-slate-900 text-xs">
                          S/ {row.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50 text-xs font-bold text-slate-900">
                      <td className="py-2.5 px-5">
                        Total ({totalAdultsCount} Adultos · {totalChildrenCount} Niños · {totalVipCount} VIP)
                      </td>
                      <td className="py-2.5 px-3 text-right">—</td>
                      <td className="py-2.5 px-3 text-right font-mono-tabular">
                        {totalSpectatorsCount}
                      </td>
                      <td className="py-2.5 px-5 text-right font-mono-tabular text-emerald-700">
                        S/ {totalTicketRevenue.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Tabla Bebidas */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Desglose Completo de Bebidas por QR
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Agua, Sporade, Inca Kola, Coca Cola, Volt
                  </p>
                </div>
                <span className="text-xs font-mono-tabular font-semibold text-slate-700">
                  {totalBeverageUnits} unidades
                </span>
              </div>

              {/* Vista Móvil Desglose Bebidas (sm:hidden) */}
              <div className="sm:hidden divide-y divide-slate-100 flex-1">
                {beverages.map((bev) => (
                  <div key={bev.id} className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{bev.name}</span>
                      <span className="font-mono-tabular font-bold text-emerald-700">
                        S/ {(bev.soldCount * bev.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{bev.presentation} · Stock: {bev.stock}</span>
                      <span className="font-mono-tabular">{bev.soldCount} vendidas (S/ {bev.price.toFixed(2)} c/u)</span>
                    </div>
                  </div>
                ))}
                <div className="p-3.5 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Total Bebidas ({totalBeverageUnits} uds.)</span>
                  <span className="text-emerald-700 font-mono-tabular">S/ {totalBeverageRevenue.toFixed(2)}</span>
                </div>
              </div>

              {/* Vista Desktop Desglose Bebidas (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto flex-1 w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                      <th className="py-2.5 px-5">Bebida</th>
                      <th className="py-2.5 px-3 text-right">Precio</th>
                      <th className="py-2.5 px-3 text-right">Vendidas</th>
                      <th className="py-2.5 px-3 text-right">Stock</th>
                      <th className="py-2.5 px-5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {beverages.map((bev) => (
                      <tr key={bev.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-5">
                          <div className="font-medium text-slate-900 text-xs">{bev.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono-tabular">
                            {bev.qrCode} · {bev.presentation}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-tabular text-slate-600 text-xs">
                          S/ {bev.price.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-tabular font-semibold text-slate-900 text-xs">
                          {bev.soldCount}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-tabular text-slate-500 text-xs">
                          {bev.stock}
                        </td>
                        <td className="py-2.5 px-5 text-right font-mono-tabular font-semibold text-slate-900 text-xs">
                          S/ {(bev.soldCount * bev.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50 text-xs font-bold text-slate-900">
                      <td className="py-2.5 px-5">Total Bebidas</td>
                      <td className="py-2.5 px-3 text-right">—</td>
                      <td className="py-2.5 px-3 text-right font-mono-tabular">
                        {totalBeverageUnits}
                      </td>
                      <td className="py-2.5 px-3 text-right">—</td>
                      <td className="py-2.5 px-5 text-right font-mono-tabular text-emerald-700">
                        S/ {totalBeverageRevenue.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Exportación CSV disponible para Admin */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Exportar Reporte Financiero Completo a CSV
            </button>
          </div>
        </div>
      )}

      {/* CASO B: USUARIO CONTROL JUGADORES -> SOLO TOTALES DE JUGADORES */}
      {isPlayersUser && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 font-mono">
              Totales de tu Estación: Control de Jugadores
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                <span>Jugadores Presentes en Cancha</span>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-3xl font-bold font-mono-tabular text-emerald-700">
                {checkedInPlayers}{' '}
                <span className="text-sm font-semibold text-slate-500">
                  / {totalPlayers} inscritos
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-500 font-mono-tabular">
                Porcentaje de asistencia: {attendancePct}%
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500">
                Jugadores Pendientes de Ingreso
              </div>
              <div className="mt-2 text-3xl font-bold font-mono-tabular text-slate-900">
                {pendingPlayers}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Faltan por escanear su credencial QR
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                <span>Intentos Duplicados Bloqueados</span>
                <ShieldAlert className="w-4 h-4 text-red-500" />
              </div>
              <div className="mt-2 text-3xl font-bold font-mono-tabular text-red-600">
                {totalDuplicateAttempts}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Intentos de reingreso bloqueados por el sistema
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CASO C: USUARIO CONTROL ESPECTADORES -> TOTAL DE VENTA Y DETALLE DE NIÑO, VIP Y GENERAL */}
      {isSpectatorsUser && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-mono">
              Totales de tu Estación: Control de Espectadores y Boletos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Venta de Boletos */}
            <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                <span>Total Ventas de Entradas</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono-tabular text-emerald-700">
                S/ {totalTicketRevenue.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-slate-500 font-mono-tabular">
                Recaudado en taquilla de acceso
              </div>
            </div>

            {/* Total Niños */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                <span>Total de Niños / Menores</span>
                <Ticket className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono-tabular text-slate-900">
                {totalChildrenCount}{' '}
                <span className="text-xs font-normal text-slate-500">niños</span>
              </div>
              <div className="mt-1 text-xs text-slate-500 font-mono-tabular">
                Subtotal: S/{' '}
                {spectatorEntries
                  .filter((e) => e.isChild)
                  .reduce((a, b) => a + b.totalAmount, 0)
                  .toFixed(2)}
              </div>
            </div>

            {/* Total General / Adultos */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                <span>Total Entradas General</span>
                <Ticket className="w-4 h-4 text-slate-600" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono-tabular text-slate-900">
                {totalAdultsCount}{' '}
                <span className="text-xs font-normal text-slate-500">adultos</span>
              </div>
              <div className="mt-1 text-xs text-slate-500 font-mono-tabular">
                Subtotal: S/{' '}
                {spectatorEntries
                  .filter((e) => e.ticketType === 'ADULTO')
                  .reduce((a, b) => a + b.totalAmount, 0)
                  .toFixed(2)}
              </div>
            </div>

            {/* Total VIP */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                <span>Total Entradas VIP</span>
                <Ticket className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono-tabular text-amber-700">
                {totalVipCount}{' '}
                <span className="text-xs font-normal text-slate-500">preferenciales</span>
              </div>
              <div className="mt-1 text-xs text-slate-500 font-mono-tabular">
                Subtotal: S/{' '}
                {spectatorEntries
                  .filter((e) => e.ticketType === 'VIP')
                  .reduce((a, b) => a + b.totalAmount, 0)
                  .toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CASO D: USUARIO CONTROL BEBIDAS -> SOLO TOTAL DE VENTA Y UNIDADES DE BEBIDAS */}
      {isBeveragesUser && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 font-mono">
              Totales de tu Estación: Control de Bebidas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                <span>Total de Venta en Bebidas</span>
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono-tabular text-amber-700">
                S/ {totalBeverageRevenue.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-slate-500 font-mono-tabular">
                Recaudado por venta QR en este torneo
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                <span>Unidades Vendidas</span>
                <CupSoda className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono-tabular text-slate-900">
                {totalBeverageUnits} uds.
              </div>
              <div className="mt-1 text-xs text-slate-500 font-mono-tabular">
                Despachadas en puntos de hidratación
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500">
                Stock Total Disponible
              </div>
              <div className="mt-2 text-2xl font-bold font-mono-tabular text-slate-900">
                {beverages.reduce((a, b) => a + b.stock, 0)} uds.
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Inventario remanente en almacén
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Escaneo con Cámara Directo para Administrador */}
      <CameraQrModal
        isOpen={showDirectCamera}
        onClose={() => setShowDirectCamera(false)}
        onScan={(code) => {
          onQuickScan(code, directQty);
        }}
        title="Escáner QR — Modo Administrador"
        subtitle="Auto-distribución: reconoce Jugadores, Boletos y Bebidas en vivo"
        scanCategory="GENERAL"
      />
    </div>
  );
};
