import React, { useState } from 'react';
import {
  CupSoda,
  Plus,
  Trash2,
  Edit2,
  X,
  Package,
  TrendingUp,
  ShieldCheck,
  ScanLine,
  CheckCircle2,
  QrCode,
  DollarSign,
  Camera,
} from 'lucide-react';
import { BeverageProduct, BeverageSale, UserRole } from '../types/championship';
import { QrCodeImage } from './QrCodeImage';
import { CameraQrModal } from './CameraQrModal';

interface BeveragesManagerProps {
  tournamentId: string;
  beverages: BeverageProduct[];
  sales: BeverageSale[];
  currentUserRole: UserRole;
  onSellBeverage: (beverageId: string, quantity: number, buyerNote?: string) => void;
  onUpdateBeverage: (beverageId: string, price: number, stock: number, name?: string, presentation?: string) => void;
  onAddBeverage: (beverage: BeverageProduct) => void;
  onDeleteBeverage: (beverageId: string) => void;
}

export const BeveragesManager: React.FC<BeveragesManagerProps> = ({
  tournamentId,
  beverages,
  sales,
  currentUserRole,
  onSellBeverage,
  onUpdateBeverage,
  onAddBeverage,
  onDeleteBeverage,
}) => {
  const isAdmin = currentUserRole === 'ADMIN';

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [buyerNote, setBuyerNote] = useState('');
  const [editingBev, setEditingBev] = useState<BeverageProduct | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Direct Scan Input
  const [beverageScanCode, setBeverageScanCode] = useState('');
  const [beverageScanQty, setBeverageScanQty] = useState<number>(1);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  // Form Edit
  const [editName, setEditName] = useState('');
  const [editPresentation, setEditPresentation] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);

  // Form Add
  const [newName, setNewName] = useState('');
  const [newPresentation, setNewPresentation] = useState('Botella 500 ml');
  const [newPrice, setNewPrice] = useState<number>(4.0);
  const [newStock, setNewStock] = useState<number>(100);

  const totalUnitsSold = beverages.reduce((acc, b) => acc + b.soldCount, 0);
  const totalRevenue = beverages.reduce(
    (acc, b) => acc + b.soldCount * b.price,
    0
  );
  const totalStock = beverages.reduce((acc, b) => acc + b.stock, 0);

  const handleOpenAdd = () => {
    if (!isAdmin) {
      alert('Solo el Administrador General puede agregar nuevas bebidas al catálogo del campeonato.');
      return;
    }
    setNewName('');
    setNewPresentation('Botella 500 ml');
    setNewPrice(4.0);
    setNewStock(100);
    setShowAddModal(true);
  };

  const handleOpenEdit = (b: BeverageProduct) => {
    if (!isAdmin) {
      alert('Solo el Administrador General puede editar precios o nombres de bebidas.');
      return;
    }
    setEditingBev(b);
    setEditName(b.name);
    setEditPresentation(b.presentation);
    setEditPrice(b.price);
    setEditStock(b.stock);
  };

  const handleDelete = (b: BeverageProduct) => {
    if (!isAdmin) {
      alert('Solo el Administrador General puede eliminar bebidas del inventario.');
      return;
    }
    if (confirm(`¿Eliminar la bebida "${b.name}" del catálogo?`)) {
      onDeleteBeverage(b.id);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBev) return;
    onUpdateBeverage(editingBev.id, editPrice, editStock, editName, editPresentation);
    setEditingBev(null);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const cleanCode = newName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    const newProduct: BeverageProduct = {
      id: `bev-${Date.now()}`,
      tournamentId,
      name: newName.trim(),
      presentation: newPresentation.trim() || 'Botella',
      qrCode: `BEB-${cleanCode || Date.now().toString().slice(-4)}`,
      price: Math.max(0, Number(newPrice) || 0),
      stock: Math.max(0, Number(newStock) || 0),
      soldCount: 0,
    };
    onAddBeverage(newProduct);
    setShowAddModal(false);
  };

  const handleDirectBeverageScan = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = beverageScanCode.trim().toUpperCase();
    if (!clean) return;

    const matched = beverages.find(
      (b) => b.qrCode.toUpperCase() === clean || b.name.toUpperCase().includes(clean)
    );
    if (matched) {
      onSellBeverage(matched.id, beverageScanQty, buyerNote.trim() || undefined);
    } else if (beverages.length > 0) {
      onSellBeverage(beverages[0].id, beverageScanQty, buyerNote.trim() || undefined);
    }
    setBeverageScanCode('');
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
            Control de Venta de Bebidas por QR
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Agua, Sporade, Inca Kola, Coca Cola, Volt o personalizadas. {isAdmin ? 'Panel de Administrador.' : 'Estación del Operador de Bebidas.'}
          </p>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Crear Nueva Bebida
          </button>
        ) : (
          <div className="text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
            Estación: Despacho y ventas de hidratación
          </div>
        )}
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Unidades Vendidas</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono-tabular text-slate-900">
            {totalUnitsSold} uds.
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            Despachadas por QR
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Stock en Almacén</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono-tabular text-slate-900">
            {totalStock} uds.
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            Inventario disponible
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Recaudación Bebidas</span>
            <CupSoda className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono-tabular text-emerald-700">
            S/ {totalRevenue.toFixed(2)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            Total en ventas
          </div>
        </div>
      </div>

      {/* Escáner Directo de Bebidas */}
      <div className="bg-[#0A192F] text-white border-2 border-red-600 rounded-xl p-4 sm:p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                Escaneo Rápido de Venta de Bebidas
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

        <form onSubmit={handleDirectBeverageScan} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={beverageScanCode}
              onChange={(e) => setBeverageScanCode(e.target.value)}
              placeholder="Escanea el código de bebida o escribe nombre..."
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
                value={beverageScanQty}
                onChange={(e) => setBeverageScanQty(Math.max(1, Number(e.target.value) || 1))}
                className="w-10 text-center font-mono-tabular bg-transparent text-white font-bold focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 min-h-[44px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              Despachar Bebida
            </button>
          </div>
        </form>
      </div>

      {/* Referencia de Comprador Opcional */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 shadow-xs">
        <label
          htmlFor="beverage-buyer-note"
          className="text-xs font-semibold text-slate-700 whitespace-nowrap"
        >
          Referencia de venta o equipo comprador (opcional):
        </label>
        <input
          id="beverage-buyer-note"
          type="text"
          value={buyerNote}
          onChange={(e) => setBuyerNote(e.target.value)}
          placeholder="Ej: Delegación Atlético San Martín, Bar Cancha 1, Mesa de Control..."
          className="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      {/* Grid de Bebidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {beverages.map((bev) => {
          const qty = quantities[bev.id] || 1;
          const subtotal = bev.soldCount * bev.price;

          return (
            <div
              key={bev.id}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono-tabular font-semibold text-slate-500 uppercase tracking-tight">
                      {bev.presentation}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                      {bev.name}
                    </h2>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(bev)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar precio, stock y nombre"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {beverages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDelete(bev)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar bebida"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex justify-center py-2 bg-slate-50/70 rounded-lg border border-slate-100">
                  <QrCodeImage value={bev.qrCode} size={84} label={bev.name} showDownload />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Precio Unitario</span>
                    <span className="text-base font-bold font-mono-tabular text-slate-900">
                      S/ {bev.price.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Stock Disponible</span>
                    <span
                      className={`text-base font-bold font-mono-tabular ${
                        bev.stock <= 5 ? 'text-red-600' : 'text-slate-900'
                      }`}
                    >
                      {bev.stock} uds.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 font-mono-tabular">
                  <span>Vendidas: {bev.soldCount}</span>
                  <span>Recaudado: S/ {subtotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, bev.stock)}
                    value={qty}
                    onChange={(e) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [bev.id]: Math.max(1, Number(e.target.value) || 1),
                      }))
                    }
                    aria-label={`Cantidad ${bev.name}`}
                    className="w-16 px-2.5 py-2 text-sm font-mono-tabular text-center border border-slate-300 rounded-lg bg-white text-slate-900 min-h-[44px]"
                  />
                  <button
                    type="button"
                    disabled={bev.stock < qty}
                    onClick={() => {
                      onSellBeverage(bev.id, qty, buyerNote.trim() || undefined);
                      setQuantities((prev) => ({ ...prev, [bev.id]: 1 }));
                    }}
                    className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs min-h-[44px] flex items-center justify-center text-center"
                  >
                    {bev.stock < qty
                      ? 'Sin stock'
                      : `Vender (S/ ${(bev.price * qty).toFixed(2)})`}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historial de Ventas - VISTA MÓVIL Y DESKTOP */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs w-full max-w-full">
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Historial de Ventas de Bebidas ({sales.length} transacciones)
          </h3>
          <span className="text-[11px] text-slate-500">Sincronizado en la nube</span>
        </div>

        {/* Tarjetas Móviles (sm:hidden) */}
        <div className="sm:hidden divide-y divide-slate-100">
          {sales.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Aún no se han registrado ventas de bebidas en este torneo.
            </div>
          ) : (
            sales.slice(0, 30).map((sale) => (
              <div key={sale.id} className="p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{sale.beverageName}</span>
                  <span className="font-mono-tabular font-bold text-emerald-700">
                    S/ {sale.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono-tabular">{sale.qrCode} · {sale.quantity} unidad(es)</span>
                  <span className="font-mono-tabular">{sale.timestamp}</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Ref: {sale.buyerNote || 'Venta directa'}</span>
                  <span>S/ {sale.unitPrice.toFixed(2)} c/u</span>
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
                <th className="py-2.5 px-3">Bebida</th>
                <th className="py-2.5 px-3">Referencia</th>
                <th className="py-2.5 px-3 text-right">Cantidad</th>
                <th className="py-2.5 px-3 text-right">P. Unit.</th>
                <th className="py-2.5 px-5 text-right">Subtotal (S/)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Aún no se han registrado ventas de bebidas en este torneo.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-5 font-mono-tabular text-slate-500">
                      {sale.timestamp}
                    </td>
                    <td className="py-2.5 px-3 font-mono-tabular font-medium text-slate-800">
                      {sale.qrCode}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {sale.beverageName}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-500">
                      {sale.buyerNote || 'Venta directa'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular font-semibold text-slate-900">
                      {sale.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular text-slate-600">
                      S/ {sale.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-5 text-right font-mono-tabular font-semibold text-slate-900">
                      S/ {sale.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Editar Bebida (Solo Administrador) */}
      {editingBev && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Editar Bebida</h3>
              <button
                type="button"
                onClick={() => setEditingBev(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Bebida *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Presentación
                </label>
                <input
                  type="text"
                  value={editPresentation}
                  onChange={(e) => setEditPresentation(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio Unitario (S/)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={editPrice}
                    onChange={(e) => setEditPrice(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock en Inventario
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editStock}
                    onChange={(e) => setEditStock(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBev(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Bebida (Solo Administrador) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-slate-900" />
                <h3 className="text-lg font-bold text-slate-900">Crear Nueva Bebida</h3>
              </div>
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
                  Nombre de la Bebida *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Gatorade Naranja, Agua con Gas..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Presentación / Volumen
                </label>
                <input
                  type="text"
                  value={newPresentation}
                  onChange={(e) => setNewPresentation(e.target.value)}
                  placeholder="Ej: Botella 500 ml, Lata 355 ml"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio Unitario (S/) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={newPrice}
                    onChange={(e) => setNewPrice(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Inicial *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newStock}
                    onChange={(e) => setNewStock(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
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
          const matched = beverages.find(
            (b) => b.qrCode.toUpperCase() === clean || b.name.toUpperCase().includes(clean)
          );
          if (matched) {
            onSellBeverage(matched.id, beverageScanQty, buyerNote.trim() || undefined);
          } else if (beverages.length > 0) {
            onSellBeverage(beverages[0].id, beverageScanQty, buyerNote.trim() || undefined);
          }
        }}
        title="Escáner de Despacho de Bebidas"
        subtitle="Enfoca el código QR de la bebida"
        scanCategory="BEBIDA"
      />
    </div>
  );
};
