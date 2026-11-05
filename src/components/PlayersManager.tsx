import React, { useState } from 'react';
import {
  UserPlus,
  QrCode,
  Search,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Users,
  ScanLine,
  UserCheck,
  Clock,
  ShieldCheck,
  Camera,
} from 'lucide-react';
import { Player, UserRole } from '../types/championship';
import { QrCodeImage } from './QrCodeImage';
import { CameraQrModal } from './CameraQrModal';

interface PlayersManagerProps {
  tournamentId: string;
  players: Player[];
  currentUserRole: UserRole;
  onAddPlayer: (player: Omit<Player, 'id' | 'qrCode' | 'checkedIn' | 'duplicateAttempts'>) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onScanPlayer: (qrCode: string) => void;
}

export const PlayersManager: React.FC<PlayersManagerProps> = ({
  tournamentId,
  players,
  currentUserRole,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onScanPlayer,
}) => {
  const isAdmin = currentUserRole === 'ADMIN';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'pending'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedQrPlayer, setSelectedQrPlayer] = useState<Player | null>(null);

  // Direct scan state
  const [scanCodeInput, setScanCodeInput] = useState('');
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [team, setTeam] = useState('Atlético San Martín');
  const [jerseyNumber, setJerseyNumber] = useState<number>(10);
  const [position, setPosition] = useState('Delantero');
  const [dni, setDni] = useState('');

  const teams = Array.from(new Set(players.map((p) => p.team)));

  // Totales
  const totalPlayers = players.length;
  const presentPlayers = players.filter((p) => p.checkedIn).length;
  const pendingPlayers = totalPlayers - presentPlayers;
  const totalDuplicateAttempts = players.reduce((acc, p) => acc + p.duplicateAttempts, 0);

  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.qrCode.toLowerCase().includes(search.toLowerCase()) ||
      p.team.toLowerCase().includes(search.toLowerCase()) ||
      p.dni.includes(search);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'present' && p.checkedIn) ||
      (statusFilter === 'pending' && !p.checkedIn);
    const matchesTeam = teamFilter === 'ALL' || p.team === teamFilter;
    return matchesSearch && matchesStatus && matchesTeam;
  });

  const handleOpenAdd = () => {
    if (!isAdmin) {
      alert('Solo el Administrador General tiene permisos para registrar o inscribir nuevos jugadores.');
      return;
    }
    setName('');
    setTeam(teams[0] || 'Club Deportivo');
    setJerseyNumber(10);
    setPosition('Delantero');
    setDni('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Player) => {
    if (!isAdmin) {
      alert('Solo el Administrador General tiene permisos para modificar datos de jugadores.');
      return;
    }
    setEditingPlayer(p);
    setName(p.name);
    setTeam(p.team);
    setJerseyNumber(p.jerseyNumber);
    setPosition(p.position);
    setDni(p.dni);
  };

  const handleDelete = (p: Player) => {
    if (!isAdmin) {
      alert('Solo el Administrador General tiene permisos para eliminar jugadores.');
      return;
    }
    if (confirm(`¿Eliminar al jugador ${p.name} del torneo?`)) {
      onDeletePlayer(p.id);
    }
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !team.trim()) return;
    onAddPlayer({
      tournamentId,
      name: name.trim(),
      team: team.trim(),
      jerseyNumber: Number(jerseyNumber) || 1,
      position: position.trim() || 'Jugador',
      dni: dni.trim() || '00000000',
    });
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer || !name.trim()) return;
    onUpdatePlayer({
      ...editingPlayer,
      name: name.trim(),
      team: team.trim(),
      jerseyNumber: Number(jerseyNumber) || 1,
      position: position.trim(),
      dni: dni.trim(),
    });
    setEditingPlayer(null);
  };

  const handleToggleAttendance = (p: Player) => {
    onUpdatePlayer({
      ...p,
      checkedIn: !p.checkedIn,
      checkInTime: !p.checkedIn ? new Date().toTimeString().slice(0, 8) : undefined,
    });
  };

  const handleDirectScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = scanCodeInput.trim().toUpperCase();
    if (!clean) return;
    onScanPlayer(clean);
    setScanCodeInput('');
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
            Control de Asistencia de Jugadores
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Validación de ingreso único por QR sin duplicidad. {isAdmin ? 'Panel de Administrador.' : 'Estación del Operador de Jugadores.'}
          </p>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs min-h-[44px]"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            Inscribir Nuevo Jugador
          </button>
        ) : (
          <div className="text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
            Estación: Registro y control de ingreso
          </div>
        )}
      </div>

      {/* KPI Totales de Jugadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Presentes en Cancha</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono-tabular text-emerald-700">
            {presentPlayers}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400 font-mono-tabular">
            {totalPlayers > 0 ? Math.round((presentPlayers / totalPlayers) * 100) : 0}% de asistencia
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Pendientes</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono-tabular text-slate-900">
            {pendingPlayers}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            Faltan por ingresar
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Total Inscritos</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono-tabular text-slate-900">
            {totalPlayers}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            Padrón de este torneo
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Duplicados Bloqueados</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono-tabular text-red-600">
            {totalDuplicateAttempts}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            Reingresos prevenidos
          </div>
        </div>
      </div>

      {/* Lector QR Rápido de Jugadores */}
      <div className="bg-[#0A192F] text-white border-2 border-red-600 rounded-xl p-4 sm:p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                Escaneo Directo de Asistencia
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

        <form onSubmit={handleDirectScanSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={scanCodeInput}
              onChange={(e) => setScanCodeInput(e.target.value)}
              placeholder="Escanea el carnet o escribe código (ej: JUG-001)..."
              className="w-full pl-9 pr-3 py-2.5 text-sm font-mono-tabular bg-slate-900 text-white placeholder:text-slate-500 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 min-h-[44px]"
          >
            <CheckCircle2 className="w-4 h-4" />
            Registrar Ingreso
          </button>
        </form>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por jugador, QR, DNI o equipo..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 min-h-[40px]"
          >
            <option value="ALL">Todos los equipos ({teams.length})</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-center">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({players.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('present')}
              className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'present'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Presentes ({presentPlayers})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendientes ({pendingPlayers})
            </button>
          </div>
        </div>
      </div>

      {/* VISTA MÓVIL: Tarjetas Adaptativas (Sin barra horizontal ni scroll recortado) */}
      <div className="sm:hidden space-y-3">
        {filteredPlayers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
            No se encontraron jugadores con los filtros seleccionados.
          </div>
        ) : (
          filteredPlayers.map((player) => (
            <div
              key={player.id}
              className={`bg-white border rounded-xl p-4 shadow-xs space-y-3 transition-colors ${
                player.checkedIn ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tabular font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {player.qrCode}
                    </span>
                    <span className="font-mono-tabular font-bold text-xs text-red-600">
                      #{player.jerseyNumber}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1 truncate">
                    {player.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {player.team} · DNI: {player.dni} · {player.position}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedQrPlayer(player)}
                  className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg cursor-pointer shrink-0"
                  title="Ver credencial QR"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>

              {/* Estado de Asistencia Móvil */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  {player.checkedIn ? (
                    <div className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Presente ({player.checkInTime})
                    </div>
                  ) : (
                    <span className="text-slate-400 font-medium">Pendiente de ingreso</span>
                  )}

                  {player.duplicateAttempts > 0 && (
                    <div className="text-[11px] text-red-600 font-mono-tabular flex items-center gap-1 mt-0.5 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {player.duplicateAttempts} intento(s) duplicado(s) bloqueado(s)
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de Acción Móvil Grandes y Táctiles */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onScanPlayer(player.qrCode)}
                  className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
                    player.checkedIn
                      ? 'bg-red-50 text-red-700 border border-red-200 active:bg-red-100'
                      : 'bg-emerald-600 text-white active:bg-emerald-700 shadow-xs'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {player.checkedIn ? 'Probar Duplicado' : 'Marcar Asistencia'}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleAttendance(player)}
                  className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  title="Alternar estado"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(player)}
                      className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                      title="Editar jugador"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(player)}
                      className="p-2.5 text-red-600 hover:text-red-800 bg-red-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                      title="Eliminar jugador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* VISTA DESKTOP: Tabla Completa */}
      <div className="hidden sm:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                <th className="py-2.5 px-4">Código QR</th>
                <th className="py-2.5 px-3">Jugador</th>
                <th className="py-2.5 px-3">Equipo</th>
                <th className="py-2.5 px-3 text-right">Dorsal</th>
                <th className="py-2.5 px-3">Estado de Asistencia</th>
                <th className="py-2.5 px-3 text-right">Hora Ingreso</th>
                <th className="py-2.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No se encontraron jugadores registrados en este torneo.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono-tabular font-semibold text-slate-800">
                      {player.qrCode}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{player.name}</div>
                      <div className="text-xs text-slate-500 font-mono-tabular">
                        DNI: {player.dni} · {player.position}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{player.team}</td>
                    <td className="py-3 px-3 text-right font-mono-tabular font-semibold text-slate-900">
                      #{player.jerseyNumber}
                    </td>
                    <td className="py-3 px-3">
                      {player.checkedIn ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Presente ({player.checkInTime})
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">
                          Pendiente de ingreso
                        </span>
                      )}
                      {player.duplicateAttempts > 0 && (
                        <div className="text-[11px] text-red-600 font-mono-tabular flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          {player.duplicateAttempts} intento(s) duplicado(s) bloqueado(s)
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular text-slate-600">
                      {player.checkInTime || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedQrPlayer(player)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Ver y descargar credencial QR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onScanPlayer(player.qrCode)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
                            player.checkedIn
                              ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                          title={player.checkedIn ? 'Probar mensaje de duplicado' : 'Registrar ingreso'}
                        >
                          {player.checkedIn ? 'Duplicado' : 'Marcar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAttendance(player)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
                          title={player.checkedIn ? 'Desmarcar asistencia' : 'Marcar presente'}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(player)}
                              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
                              title="Editar jugador"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(player)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                              title="Eliminar jugador"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Ver Credencial QR */}
      {selectedQrPlayer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-tabular font-semibold text-slate-500">
                CREDENCIAL OFICIAL
              </span>
              <button
                type="button"
                onClick={() => setSelectedQrPlayer(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">{selectedQrPlayer.name}</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {selectedQrPlayer.team} · Dorsal #{selectedQrPlayer.jerseyNumber} · {selectedQrPlayer.position}
              </p>
            </div>

            <div className="py-2 flex justify-center">
              <QrCodeImage
                value={selectedQrPlayer.qrCode}
                size={180}
                label={selectedQrPlayer.name}
                showDownload
              />
            </div>

            <p className="text-xs text-slate-500">
              Escanea esta credencial en la puerta de acceso para validar la asistencia única del jugador.
            </p>
          </div>
        </div>
      )}

      {/* Modal: Inscribir Jugador (Solo Administrador) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-slate-900" />
                <h3 className="text-lg font-bold text-slate-900">Inscribir Nuevo Jugador</h3>
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
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Rodrigo Fernández López"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Equipo / Club *
                </label>
                <input
                  type="text"
                  required
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="Ej: Atlético San Martín"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dorsal #
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="74829100"
                    className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Posición
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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

      {/* Modal: Editar Jugador (Solo Administrador) */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Editar Datos de Jugador</h3>
              <button
                type="button"
                onClick={() => setEditingPlayer(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Equipo
                </label>
                <input
                  type="text"
                  required
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dorsal
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Posición
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
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
      {/* Modal de Escaneo con Cámara en Vivo */}
      <CameraQrModal
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScan={(code) => {
          onScanPlayer(code);
        }}
        title="Escáner de Asistencia de Jugadores"
        subtitle="Enfoca la credencial QR del jugador"
        scanCategory="JUGADOR"
      />
    </div>
  );
};
