import React, { useState } from 'react';
import {
  Trophy,
  Plus,
  Calendar,
  MapPin,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  ExternalLink,
  Users,
  Ticket,
  CupSoda,
  ShieldAlert,
} from 'lucide-react';
import { Tournament, TournamentState, UserRole } from '../types/championship';

interface TournamentsManagerProps {
  tournaments: Tournament[];
  activeTournamentId: string;
  currentUserRole: UserRole;
  statesByTournament: Record<string, TournamentState>;
  onSelectTournament: (tournamentId: string) => void;
  onCreateTournament: (tournament: Tournament) => void;
  onUpdateTournament: (tournament: Tournament) => void;
  onDeleteTournament: (tournamentId: string) => void;
}

export const TournamentsManager: React.FC<TournamentsManagerProps> = ({
  tournaments,
  activeTournamentId,
  currentUserRole,
  statesByTournament,
  onSelectTournament,
  onCreateTournament,
  onUpdateTournament,
  onDeleteTournament,
}) => {
  const isAdmin = currentUserRole === 'ADMIN';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [edition, setEdition] = useState('');
  const [category, setCategory] = useState('Fútbol 7 Libre');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('2026-11-05');
  const [notes, setNotes] = useState('');

  const handleOpenCreate = () => {
    if (!isAdmin) {
      alert('Solo el Administrador General puede crear nuevos campeonatos o torneos.');
      return;
    }
    setName('');
    setEdition('Edición 2026');
    setCategory('Fútbol 7 Libre');
    setVenue('Cancha Principal');
    setDate(new Date().toISOString().slice(0, 10));
    setNotes('');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (t: Tournament) => {
    if (!isAdmin) {
      alert('Solo el Administrador General puede editar la información de los torneos.');
      return;
    }
    setEditingTournament(t);
    setName(t.name);
    setEdition(t.edition);
    setCategory(t.category);
    setVenue(t.venue);
    setDate(t.date);
    setNotes(t.notes || '');
  };

  const handleDelete = (t: Tournament) => {
    if (!isAdmin) {
      alert('Solo el Administrador General puede eliminar torneos.');
      return;
    }
    if (confirm(`¿Eliminar el torneo "${t.name}" y todos sus registros asociados?`)) {
      onDeleteTournament(t.id);
    }
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const newTournament: Tournament = {
      id: `tour-${Date.now()}`,
      name: name.trim(),
      edition: edition.trim() || 'Edición Oficial',
      category: category.trim() || 'General',
      venue: venue.trim() || 'Sede Principal',
      date: date || new Date().toISOString().slice(0, 10),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
    };
    onCreateTournament(newTournament);
    setShowCreateModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTournament || !name.trim()) return;
    const updated: Tournament = {
      ...editingTournament,
      name: name.trim(),
      edition: edition.trim(),
      category: category.trim(),
      venue: venue.trim(),
      date,
      notes: notes.trim() || undefined,
    };
    onUpdateTournament(updated);
    setEditingTournament(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestión de Torneos y Campeonatos
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Crea, edita y cambia de torneo. Cada torneo tiene su base independiente de jugadores, boletos y ventas sincronizada en la nube.
          </p>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Crear Nuevo Torneo
          </button>
        ) : (
          <div className="text-xs text-slate-400 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
            Creación de torneos restringida a Administrador
          </div>
        )}
      </div>

      {/* Grid de Torneos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {tournaments.map((tournament) => {
          const isActive = tournament.id === activeTournamentId;
          const state = statesByTournament[tournament.id];
          const playerCount = state ? state.players.length : 0;
          const checkedInCount = state ? state.players.filter((p) => p.checkedIn).length : 0;
          const spectatorCount = state ? state.spectatorEntries.reduce((a, b) => a + b.quantity, 0) : 0;
          const beverageSold = state ? state.beverages.reduce((a, b) => a + b.soldCount, 0) : 0;
          const ticketRev = state ? state.spectatorEntries.reduce((a, b) => a + b.totalAmount, 0) : 0;
          const bevRev = state ? state.beverageSales.reduce((a, b) => a + b.totalAmount, 0) : 0;
          const totalRev = ticketRev + bevRev;

          return (
            <div
              key={tournament.id}
              className={`rounded-xl border transition-all p-5 flex flex-col justify-between space-y-4 ${
                isActive
                  ? 'bg-white border-emerald-600 ring-2 ring-emerald-600/10 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span>{tournament.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{tournament.edition}</span>
                      {isActive && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Torneo Activo
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {tournament.name}
                    </h2>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(tournament)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar datos del torneo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {tournaments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDelete(tournament)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar torneo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{tournament.venue}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{tournament.date}</span>
                  </div>
                </div>

                {tournament.notes && (
                  <p className="mt-2 text-xs text-slate-500 italic bg-slate-50 rounded p-2">
                    {tournament.notes}
                  </p>
                )}
              </div>

              {/* Métricas rápidas del torneo */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" /> Jugadores
                  </div>
                  <div className="font-bold text-slate-900 font-mono-tabular mt-0.5">
                    {checkedInCount}/{playerCount}
                  </div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                    <Ticket className="w-3 h-3" /> Boletos
                  </div>
                  <div className="font-bold text-slate-900 font-mono-tabular mt-0.5">
                    {spectatorCount}
                  </div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                    <CupSoda className="w-3 h-3" /> Bebidas
                  </div>
                  <div className="font-bold text-slate-900 font-mono-tabular mt-0.5">
                    {beverageSold}
                  </div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[11px] text-slate-500">Recaudado</div>
                  <div className="font-bold text-emerald-700 font-mono-tabular mt-0.5">
                    S/ {totalRev.toFixed(0)}
                  </div>
                </div>
              </div>

              {/* Botón de Selección */}
              <div>
                {isActive ? (
                  <div className="w-full py-2 px-3 text-center text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200">
                    Controlando actualmente este torneo
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectTournament(tournament.id)}
                    className="w-full py-2 px-3 text-center text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Seleccionar y Controlar Este Torneo
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear Torneo (Solo Administrador) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Crear Nuevo Torneo</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Torneo / Campeonato *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Campeonato Interligas Verano 2026"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Edición / Etapa
                  </label>
                  <input
                    type="text"
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    placeholder="Ej: Fase Eliminatoria"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ej: Fútbol 7 Libre / Senior"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sede / Cancha
                  </label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Ej: Cancha Sintética El Monumental"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha de Jornada
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas organizativas (opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles sobre normativas, premios o árbitros..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer shadow-xs"
                >
                  Crear y Activar Torneo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Torneo (Solo Administrador) */}
      {editingTournament && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Editar Torneo</h3>
              <button
                type="button"
                onClick={() => setEditingTournament(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Torneo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Edición
                  </label>
                  <input
                    type="text"
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sede / Cancha
                  </label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTournament(null)}
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
    </div>
  );
};
