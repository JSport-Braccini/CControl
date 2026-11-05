import React, { useState } from 'react';
import {
  Ticket,
  Plus,
  Trash2,
  Edit2,
  X,
  Users,
  Baby,
  Sparkles,
  ScanLine,
  CheckCircle2,
  QrCode,
  Shield,
  Camera,
} from 'lucide-react';
import { SpectatorTier, SpectatorEntry, SpectatorTicketType, UserRole } from '../types/championship';
import { QrCodeImage } from './QrCodeImage';
import { CameraQrModal } from './CameraQrModal';

interface SpectatorsManagerProps {
  tournamentId: string;
  tiers: SpectatorTier[];
  entries: SpectatorEntry[];
  currentUserRole: UserRole;
  onRegisterSpectator: (type: SpectatorTicketType, quantity: number) => void;
  onUpdateTierPrice: (tierId: string, newPrice: number, label?: string, description?: string) => void;
  onAddTicketTier: (tier: SpectatorTier) => void;
  onDeleteTicketTier: (tierId: string) => void;
}

export const SpectatorsManager: React.FC<SpectatorsManagerProps> = ({
  tournamentId,
  tiers,
  entries,
  currentUserRole,
  onRegisterSpectator,
  onUpdateTierPrice,
  onAddTicketTier,
  onDeleteTicketTier,
}) => {
  const isAdmin = currentUserRole === 'ADMIN';

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [editingTier, setEditingTier] = useState<SpectatorTier | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Direct Ticket Scan Input
  const [ticketScanCode, setTicketScanCode] = useState('');
  const [ticketScanQty, setTicketScanQty] = useState<number>(1);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  // Form add tier
  const [newLabel, setNewLabel] = useState('');
  const [newPrice, setNewPrice] = useState<number>(10);
  const [newIsChild, setNewIsChild] = useState(false);
  const [newDescription, setNewDescription] = useState('');

  // Form edit tier
  const [editLabel, setEditLabel] = useState('');
  const [editPrice, setEditPrice] = useState<number>(10);
  const [editDescription, setEditDescription] = useState('');

  const totalSpectators = entries.reduce((acc, e) => acc + e.quantity, 0);
  const totalChildren = entries
    .filter((e) => e.isChild)
    .reduce((acc, e) => acc + e.quantity, 0);
  const totalAdultsAndVip = totalSpectators - totalChildren;
  const totalRevenue = entries.reduce((acc, e) => acc + e.totalAmount, 0);

  const handleOpenAdd = () => {
    if (!isAdmin) {
      alert('Solo el Administrador General puede agregar nuevas modalidades de entradas.');
      return;
    }
    setNewLabel('');
    setNewPrice(10);
    setNewIsChild(false);
    setNewDescription('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (tier: SpectatorTier) => {
    if (!isAdmin) {
      alert('Solo el Administrador General puede modificar tarifas de boletos.');
      return;
    }
    setEditingTier(tier);
    setEditLabel(tier.label);
    setEditPrice(tier.price);
    setEditDescription(tier.description);
  };

  const handleDelete = (tier: SpectatorTier) => {
    if (!isAdmin) {
      alert('Solo el Administrador General puede eliminar modalidades de entradas.');
      return;
    }
    if (confirm(`¿Eliminar la tarifa "${tier.label}"?`)) {
      onDeleteTicketTier(tier.id);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;
    onUpdateTierPrice(editingTier.id, editPrice, editLabel, editDescription);
    setEditingTier(null);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const type: SpectatorTicketType = newIsChild ? 'NINO' : 'ADULTO';
    const codeSuffix = newLabel.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    const newTier: SpectatorTier = {
      id: `tier-${Date.now()}`,
      tournamentId,
      type,
      label: newLabel.trim(),
      qrCode: `ESP-${codeSuffix || Date.now().toString().slice(-4)}`,
      price: Math.max(0, Number(newPrice) || 0),
      isChild: newIsChild,
      description: newDescription.trim() || 'Entrada para control de acceso',
    };
    onAddTicketTier(newTier);
    setShowAddModal(false);
  };

  const handleDirectTicketScan = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = ticketScanCode.trim().toUpperCase();
    if (!clean) return;

    // Check if matches an existing tier
    const foundTier = tiers.find(
      (t) => t.qrCode.toUpperCase() === clean || t.type.toUpperCase() === clean
    );
    if (foundTier) {
      onRegisterSpectator(foundTier.type, ticketScanQty);
    } else {
      // Default to ADULTO
      onRegisterSpectator('ADULTO', ticketScanQty);
    }
    setTicketScanCode('');
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
            Control de Espectadores y Boletos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registro de taquilla por QR diferenciando niños y adultos. {isAdmin ? 'Panel de Administrador.' : 'Estación del Operador de Espectadores.'}
          </p>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Nuevo Tipo de Entrada
          </button>
        ) : (
          <div className="text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
            Estación: Control de ingreso y conteo de taquilla
          </div>
        )}
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Total Espectadores</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono-tabular text-slate-900">
            {totalSpectators}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            Asistentes registrados
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Niños / Menores</span>
            <Baby className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono-tabular text-emerald-700">
            {totalChildren}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            {totalSpectators > 0 ? Math.round((totalChildren / totalSpectators) * 100) : 0}% de la taquilla
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Adultos y VIP</span>
            <Ticket className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono-tabular text-slate-900">
            {totalAdultsAndVip}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            General y preferenciales
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Recaudación Entradas</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono-tabular text-emerald-700">
            S/ {totalRevenue.toFixed(2)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            Total en taquilla
          </div>
        </div>
      </div>

      {/* Escáner Directo de Boletos */}
      <div className="bg-[#0A192F] text-white border-2 border-red-600 rounded-xl p-4 sm:p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                Escaneo Rápido de Boletos en Puerta
              </h2>
              <p className="text-[11px] text-slate-300">
                Pasa el lector láser o usa la cámara del celular
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCameraScanner(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm min-h-[44px] shrink-0 active:scale-95"
          >
            <Camera className="w-4 h-4 text-white" />
            Escanear con Cámara
          </button>
        </div>

        <form onSubmit={handleDirectTicketScan} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={ticketScanCode}
              onChange={(e) => setTicketScanCode(e.target.value)}
              placeholder="Escanea el boleto QR o ingresa código..."
              className="w-full pl-9 pr-3 py-2.5 text-sm font-mono-tabular bg-slate-900 text-white placeholder:text-slate-500 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900 px-3 py-2 rounded-lg border border-slate-700 text-xs shrink-0">
              <span className="text-slate-400 text-[11px]">Cant:</span>
              <input
                type="number"
                min={1}
                max={50}
                value={ticketScanQty}
                onChange={(e) => setTicketScanQty(Math.max(1, Number(e.target.value) || 1))}
                className="w-10 text-center font-mono-tabular bg-transparent text-white font-bold focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 min-h-[44px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              Validar Entrada
            </button>
          </div>
        </form>
      </div>

      {/* Tarjetas de Boletos QR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const qty = quantities[tier.id] || 1;
          const matchingEntries = entries.filter((e) => e.qrCode === tier.qrCode || e.ticketType === tier.type);
          const tierCount = matchingEntries.reduce((acc, e) => acc + e.quantity, 0);
          const tierRevenue = matchingEntries.reduce((acc, e) => acc + e.totalAmount, 0);

          return (
            <div
              key={tier.id}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono-tabular font-semibold text-slate-500 uppercase tracking-tight">
                      {tier.isChild ? 'Categoría Niño / Menor' : 'Categoría General'}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                      {tier.label}
                    </h2>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(tier)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar precio y descripción"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {tiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDelete(tier)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar tarifa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-1 min-h-[30px]">{tier.description}</p>

                <div className="mt-3 flex justify-center py-2 bg-slate-50/70 rounded-lg border border-slate-100">
                  <QrCodeImage value={tier.qrCode} size={90} label={tier.label} showDownload />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Precio actual:</span>
                  <span className="text-base font-bold font-mono-tabular text-slate-900">
                    S/ {tier.price.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 font-mono-tabular">
                  <span>Registrados: {tierCount}</span>
                  <span>Recaudado: S/ {tierRevenue.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={qty}
                    onChange={(e) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [tier.id]: Math.max(1, Number(e.target.value) || 1),
                      }))
                    }
                    aria-label={`Cantidad boletos ${tier.label}`}
                    className="w-16 px-2.5 py-2 text-sm font-mono-tabular text-center border border-slate-300 rounded-lg bg-white text-slate-900 min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => onRegisterSpectator(tier.type, qty)}
                    className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs min-h-[44px] flex items-center justify-center text-center"
                  >
                    Registrar (S/ {(tier.price * qty).toFixed(2)})
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historial de Ingresos - VISTA MÓVIL Y DESKTOP */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs w-full max-w-full">
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Registro de Ingresos de Espectadores ({entries.length} transacciones)
          </h3>
          <span className="text-[11px] text-slate-500">Sincronizado en tiempo real</span>
        </div>

        {/* Tarjetas Móviles (sm:hidden) */}
        <div className="sm:hidden divide-y divide-slate-100">
          {entries.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Aún no hay espectadores registrados en este torneo.
            </div>
          ) : (
            entries.slice(0, 30).map((entry) => (
              <div key={entry.id} className="p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{entry.label}</span>
                  <span className="font-mono-tabular font-bold text-emerald-700">
                    S/ {entry.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono-tabular">{entry.qrCode} · Cant: {entry.quantity}</span>
                  <span className="font-mono-tabular">{entry.timestamp}</span>
                </div>
                <div className="text-[11px]">
                  {entry.isChild ? (
                    <span className="text-emerald-700 font-semibold">Niño / Menor</span>
                  ) : (
                    <span className="text-slate-600 font-medium">Adulto / General</span>
                  )}
                  <span className="text-slate-400"> (S/ {entry.price.toFixed(2)} c/u)</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tabla Desktop (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                <th className="py-2.5 px-5">Hora</th>
                <th className="py-2.5 px-3">Código QR</th>
                <th className="py-2.5 px-3">Tipo de Boleto</th>
                <th className="py-2.5 px-3">Categoría</th>
                <th className="py-2.5 px-3 text-right">Cantidad</th>
                <th className="py-2.5 px-3 text-right">Tarifa Unit.</th>
                <th className="py-2.5 px-5 text-right">Total Pagado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Aún no hay espectadores registrados en este torneo.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-5 font-mono-tabular text-slate-500">
                      {entry.timestamp}
                    </td>
                    <td className="py-2.5 px-3 font-mono-tabular font-medium text-slate-800">
                      {entry.qrCode}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {entry.label}
                    </td>
                    <td className="py-2.5 px-3 text-xs font-semibold">
                      {entry.isChild ? (
                        <span className="text-emerald-700">Niño / Menor</span>
                      ) : (
                        <span className="text-slate-600">Adulto / General</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular font-semibold text-slate-900">
                      {entry.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular text-slate-600">
                      S/ {entry.price.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-5 text-right font-mono-tabular font-semibold text-slate-900">
                      S/ {entry.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Editar Entrada (Solo Administrador) */}
      {editingTier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Editar Tarifa de Entrada</h3>
              <button
                type="button"
                onClick={() => setEditingTier(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Boleto
                </label>
                <input
                  type="text"
                  required
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Precio (S/)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={0.5}
                  value={editPrice}
                  onChange={(e) => setEditPrice(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTier(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer shadow-xs"
                >
                  Guardar Tarifa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Tarifa (Solo Administrador) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Crear Nueva Tarifa de Entrada</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Boleto *
                </label>
                <input
                  type="text"
                  required
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Ej: Entrada Preferencial Palco"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Precio del Boleto (S/) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={0.5}
                  value={newPrice}
                  onChange={(e) => setNewPrice(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is-child-box"
                  checked={newIsChild}
                  onChange={(e) => setNewIsChild(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="is-child-box" className="text-xs font-medium text-slate-700">
                  Es boleto para niños (contabilizar en estadísticas infantiles)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detalles sobre tribuna o acceso..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer shadow-xs"
                >
                  Guardar y Generar QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Escaneo con Cámara en Vivo */}
      <CameraQrModal
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScan={(code) => {
          const clean = code.trim().toUpperCase();
          const foundTier = tiers.find(
            (t) => t.qrCode.toUpperCase() === clean || t.type.toUpperCase() === clean
          );
          if (foundTier) {
            onRegisterSpectator(foundTier.type, ticketScanQty);
          } else {
            onRegisterSpectator('ADULTO', ticketScanQty);
          }
        }}
        title="Escáner de Boletos y Entradas"
        subtitle="Enfoca el boleto QR del espectador"
        scanCategory="ESPECTADOR"
      />
    </div>
  );
};
