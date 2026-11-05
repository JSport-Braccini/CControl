import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Users,
  Ticket,
  CupSoda,
  QrCode,
  LayoutDashboard,
  LogOut,
  UserCog,
  Settings,
  Camera,
  CheckCircle2,
} from 'lucide-react';
import {
  ActiveTab,
  UserRole,
  Tournament,
  Player,
  SpectatorTier,
  BeverageProduct,
  AuthUser,
  SystemConfig,
} from './types/championship';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { SummaryDashboard } from './components/SummaryDashboard';
import { QrScannerPanel } from './components/QrScannerPanel';
import { PlayersManager } from './components/PlayersManager';
import { SpectatorsManager } from './components/SpectatorsManager';
import { BeveragesManager } from './components/BeveragesManager';
import { TournamentsManager } from './components/TournamentsManager';
import { UsersManager } from './components/UsersManager';
import { SystemSettingsModal } from './components/SystemSettingsModal';
import { LoginModal } from './components/LoginModal';
import { CameraQrModal } from './components/CameraQrModal';
import { INITIAL_AUTH_USERS } from './data/authUsers';

const AUTH_STORAGE_KEY = 'copacontrol_auth_user_v2';

export function App() {
  const {
    serverData,
    systemConfig,
    users,
    activeTournamentState,
    activeTournament,
    isConnected,
    lastSyncTime,
    sendAction,
  } = useRealtimeSync();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_AUTH_USERS[0];
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('resumen');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showGlobalCamera, setShowGlobalCamera] = useState(false);

  const currentRole: UserRole = currentUser?.role || 'ADMIN';
  const isAdmin = currentRole === 'ADMIN';

  // Strict role isolation: Force non-admin operators to their dedicated module
  useEffect(() => {
    if (!isAdmin) {
      if (currentRole === 'CONTROL_JUGADORES' && activeTab !== 'jugadores') {
        setActiveTab('jugadores');
      } else if (currentRole === 'CONTROL_ESPECTADORES' && activeTab !== 'espectadores') {
        setActiveTab('espectadores');
      } else if (currentRole === 'CONTROL_BEBIDAS' && activeTab !== 'bebidas') {
        setActiveTab('bebidas');
      }
    }
  }, [currentRole, isAdmin, activeTab]);

  // Notify server of current user presence
  useEffect(() => {
    if (currentUser && isConnected) {
      sendAction('IDENTIFY_USER', { user: currentUser });
    }
  }, [currentUser, isConnected, sendAction]);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
    if (user.role === 'CONTROL_JUGADORES') setActiveTab('jugadores');
    else if (user.role === 'CONTROL_ESPECTADORES') setActiveTab('espectadores');
    else if (user.role === 'CONTROL_BEBIDAS') setActiveTab('bebidas');
    else setActiveTab('resumen');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // System Config Action
  const handleUpdateConfig = (newConfig: Partial<SystemConfig>) => {
    sendAction('UPDATE_SYSTEM_CONFIG', { config: newConfig });
  };

  // User Management Actions (Admin Only)
  const handleCreateUser = (newUser: AuthUser) => {
    sendAction('CREATE_USER', { user: newUser });
  };

  const handleUpdateUser = (updatedUser: AuthUser) => {
    sendAction('UPDATE_USER', { user: updatedUser });
  };

  const handleDeleteUser = (userId: string) => {
    sendAction('DELETE_USER', { userId });
  };

  // Multi-tournament actions via WebSocket
  const handleSelectTournament = (tournamentId: string) => {
    sendAction('SELECT_TOURNAMENT', { tournamentId });
  };

  const handleCreateTournament = (tournament: Tournament) => {
    sendAction('CREATE_TOURNAMENT', { tournament });
  };

  const handleUpdateTournament = (tournament: Tournament) => {
    sendAction('UPDATE_TOURNAMENT', { tournament });
  };

  const handleDeleteTournament = (tournamentId: string) => {
    sendAction('DELETE_TOURNAMENT', { tournamentId });
  };

  // QR Scanning & Auto-Distribution
  const handleProcessQr = (qrCode: string, quantity = 1) => {
    const roleName = currentUser?.displayName || 'Operador';
    sendAction('PROCESS_QR_SCAN', {
      tournamentId: activeTournament.id,
      qrCode,
      quantity,
      registeredBy: roleName,
    });
  };

  // Players Actions
  const handleAddPlayer = (
    playerData: Omit<Player, 'id' | 'qrCode' | 'checkedIn' | 'duplicateAttempts'>
  ) => {
    const currentList = activeTournamentState.players;
    const nextNum = currentList.length + 1;
    const qrCode = `JUG-${String(nextNum).padStart(3, '0')}`;
    const newPlayer: Player = {
      ...playerData,
      id: `p-${Date.now()}`,
      qrCode,
      checkedIn: false,
      duplicateAttempts: 0,
    };
    sendAction('ADD_PLAYER', {
      tournamentId: activeTournament.id,
      player: newPlayer,
    });
  };

  const handleUpdatePlayer = (player: Player) => {
    sendAction('UPDATE_PLAYER', {
      tournamentId: activeTournament.id,
      player,
    });
  };

  const handleDeletePlayer = (playerId: string) => {
    sendAction('DELETE_PLAYER', {
      tournamentId: activeTournament.id,
      playerId,
    });
  };

  // Spectator Tiers Actions
  const handleRegisterSpectator = (tierType: string, quantity: number) => {
    const tier = activeTournamentState.spectatorTiers.find((t) => t.type === tierType);
    if (tier) {
      handleProcessQr(tier.qrCode, quantity);
    }
  };

  const handleUpdateTierPrice = (
    tierId: string,
    newPrice: number,
    label?: string,
    description?: string
  ) => {
    sendAction('UPDATE_TICKET_PRICE', {
      tournamentId: activeTournament.id,
      tierId,
      price: newPrice,
      label,
      description,
    });
  };

  const handleAddTicketTier = (tier: SpectatorTier) => {
    sendAction('ADD_TICKET_TIER', {
      tournamentId: activeTournament.id,
      tier,
    });
  };

  const handleDeleteTicketTier = (tierId: string) => {
    sendAction('DELETE_TICKET_TIER', {
      tournamentId: activeTournament.id,
      tierId,
    });
  };

  // Beverages Actions
  const handleSellBeverage = (
    beverageId: string,
    quantity: number,
    buyerNote?: string
  ) => {
    const bev = activeTournamentState.beverages.find((b) => b.id === beverageId);
    if (bev) {
      handleProcessQr(bev.qrCode, quantity);
    }
  };

  const handleUpdateBeverage = (
    beverageId: string,
    price: number,
    stock: number,
    name?: string,
    presentation?: string
  ) => {
    sendAction('UPDATE_BEVERAGE', {
      tournamentId: activeTournament.id,
      beverageId,
      price,
      stock,
      name,
      presentation,
    });
  };

  const handleAddBeverage = (beverage: BeverageProduct) => {
    sendAction('ADD_BEVERAGE', {
      tournamentId: activeTournament.id,
      beverage,
    });
  };

  const handleDeleteBeverage = (beverageId: string) => {
    sendAction('DELETE_BEVERAGE', {
      tournamentId: activeTournament.id,
      beverageId,
    });
  };

  // Login Modal si no hay sesión activa
  if (!currentUser) {
    return (
      <LoginModal
        systemConfig={systemConfig}
        users={users}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans w-full max-w-full overflow-x-hidden">
      {/* Top Bar Principal (Azul Marino Profundo #0A192F con borde Rojo #DC2626) */}
      <header className="no-print bg-[#0A192F] text-white border-b-2 border-red-600 sticky top-0 z-30 shadow-md w-full max-w-full overflow-hidden">
        {/* Fila 1: Logo Corporativo + Identidad + Controles Rápidos */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Zona 1: Logo Corporativo JJ y Estación de Usuario */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-white p-0.5 border border-slate-700 shadow-sm shrink-0">
              <img
                src={systemConfig.logoUrl}
                alt="Escudo Corporativo JJ"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight truncate max-w-[125px] xs:max-w-[160px] sm:max-w-none font-display">
                  {systemConfig.systemName}
                </span>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(true)}
                    className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    title="Configurar nombre o logo del sistema"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Indicador de Estación/Rol en Modo Móvil y Desktop */}
              <div className="flex items-center gap-1 text-[10px] leading-tight font-medium">
                {currentRole === 'CONTROL_JUGADORES' && (
                  <span className="text-blue-400 font-semibold truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    Estación Jugadores
                  </span>
                )}
                {currentRole === 'CONTROL_ESPECTADORES' && (
                  <span className="text-emerald-400 font-semibold truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    Estación Espectadores
                  </span>
                )}
                {currentRole === 'CONTROL_BEBIDAS' && (
                  <span className="text-amber-400 font-semibold truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    Estación Bebidas
                  </span>
                )}
                {isAdmin && (
                  <span className="text-red-300 font-semibold truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    Administrador General
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Zona 2: Menú Desktop (SOLO ADMIN) */}
          {isAdmin && (
            <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-300">
              <button
                type="button"
                onClick={() => setActiveTab('resumen')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'resumen'
                    ? 'bg-red-600 text-white font-bold'
                    : 'hover:text-white hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Principal
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('escaner')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'escaner'
                    ? 'bg-red-600 text-white font-bold'
                    : 'hover:text-white hover:bg-slate-800'
                }`}
              >
                <QrCode className="w-4 h-4" />
                Escáner QR
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('jugadores')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'jugadores'
                    ? 'bg-red-600 text-white font-bold'
                    : 'hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                Jugadores
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('espectadores')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'espectadores'
                    ? 'bg-red-600 text-white font-bold'
                    : 'hover:text-white hover:bg-slate-800'
                }`}
              >
                <Ticket className="w-4 h-4" />
                Espectadores
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bebidas')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'bebidas'
                    ? 'bg-red-600 text-white font-bold'
                    : 'hover:text-white hover:bg-slate-800'
                }`}
              >
                <CupSoda className="w-4 h-4" />
                Bebidas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('torneos')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'torneos'
                    ? 'bg-red-600 text-white font-bold'
                    : 'hover:text-white hover:bg-slate-800'
                }`}
              >
                <Trophy className="w-4 h-4" />
                Torneos
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('usuarios')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'usuarios'
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-red-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <UserCog className="w-4 h-4" />
                Usuarios ({users.length})
              </button>
            </nav>
          )}

          {/* Zona 3: Botón de Cámara en Vivo + Nube + Avatar + Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Botón de Escaneo con Cámara (Accesible para TODOS los usuarios) */}
            <button
              type="button"
              onClick={() => setShowGlobalCamera(true)}
              className="px-2.5 sm:px-3 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1.5 min-h-[36px]"
              title="Abrir cámara del celular para escanear QR"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Escanear QR</span>
            </button>

            {/* Estado Nube Compacto */}
            <div
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono-tabular shrink-0"
              title={isConnected ? `Conectado a la nube (${serverData.connectedClientsCount || 1} online)` : 'Reconectando con el servidor'}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="text-slate-300 text-[11px] hidden md:inline">
                {isConnected ? 'Nube' : 'Reconectando'}
              </span>
            </div>

            {/* Usuario Actual */}
            <div className="flex items-center gap-1 pl-1 border-l border-slate-700">
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 border border-slate-600"
                style={{ backgroundColor: currentUser.avatarColor || '#0A192F' }}
                title={`${currentUser.displayName} (@${currentUser.username})`}
              >
                {currentUser.username.slice(0, 2).toUpperCase()}
              </div>

              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-bold text-white leading-tight">
                  {currentUser.displayName}
                </span>
                <span className="text-[10px] text-slate-300 font-mono-tabular">
                  @{currentUser.username}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Fila 2: Sub-Barra de Torneo Ordenada en Celular y PC */}
        <div className="bg-[#050D1A] border-t border-slate-800/80 px-3 sm:px-6 py-1.5 w-full max-w-full">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs">
            {/* Lado Izquierdo: Torneo */}
            <div className="flex items-center gap-1.5 min-w-0">
              <Trophy className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-tight shrink-0">
                Torneo:
              </span>
              {isAdmin ? (
                <select
                  value={activeTournament.id}
                  onChange={(e) => handleSelectTournament(e.target.value)}
                  className="px-2 py-0.5 font-semibold text-white bg-slate-900 border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 shadow-2xs text-xs truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none"
                >
                  {serverData.tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.edition})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-white font-bold truncate text-[11px] sm:text-xs">
                  {activeTournament.name} ({activeTournament.edition})
                </span>
              )}
            </div>

            {/* Lado Derecho: Sede y Fecha */}
            <div className="flex items-center gap-1.5 text-slate-300 text-[10px] sm:text-[11px] shrink-0">
              <span className="truncate max-w-[90px] xs:max-w-[140px] sm:max-w-none">
                {activeTournament.venue}
              </span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="font-mono-tabular">{activeTournament.date}</span>
              {isAdmin && (
                <>
                  <span aria-hidden="true" className="text-slate-500 hidden sm:inline">·</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('usuarios')}
                    className="text-red-400 hover:text-red-300 font-semibold cursor-pointer underline underline-offset-2 hidden sm:inline"
                  >
                    Usuarios ({users.length})
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Fila 3: Menú Móvil Limpio y Desplazable (SOLO ADMINISTRADOR) */}
        {isAdmin && (
          <div className="lg:hidden border-t border-slate-800 bg-[#0A192F] px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto w-full max-w-full no-scrollbar">
            {(
              [
                ['resumen', 'Principal', LayoutDashboard],
                ['escaner', 'Escáner QR', QrCode],
                ['jugadores', 'Jugadores', Users],
                ['espectadores', 'Entradas', Ticket],
                ['bebidas', 'Bebidas', CupSoda],
                ['torneos', 'Torneos', Trophy],
                ['usuarios', `Usuarios (${users.length})`, UserCog],
              ] as [ActiveTab, string, any][]
            ).map(([tabKey, label, Icon]) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  activeTab === tabKey
                    ? 'bg-red-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 overflow-x-hidden">
        {/* VISTAS AISLADAS SEGÚN EL ROL DE USUARIO */}
        {/* Caso 1: ADMIN - Puede ver cualquier tab seleccionada */}
        {isAdmin && (
          <>
            {activeTab === 'resumen' && (
              <SummaryDashboard
                tournament={activeTournament}
                players={activeTournamentState.players}
                spectatorTiers={activeTournamentState.spectatorTiers}
                spectatorEntries={activeTournamentState.spectatorEntries}
                beverages={activeTournamentState.beverages}
                beverageSales={activeTournamentState.beverageSales}
                lastFeedback={activeTournamentState.scanHistory[0] || null}
                currentUserRole={currentRole}
                currentUserName={currentUser.displayName}
                connectedClientsCount={serverData.connectedClientsCount}
                onQuickScan={handleProcessQr}
                onGoToScanner={() => setActiveTab('escaner')}
                onGoToPlayers={() => setActiveTab('jugadores')}
                onGoToSpectators={() => setActiveTab('espectadores')}
                onGoToBeverages={() => setActiveTab('bebidas')}
                onGoToTournaments={() => setActiveTab('torneos')}
              />
            )}

            {activeTab === 'escaner' && (
              <QrScannerPanel
                tournamentId={activeTournament.id}
                tournamentName={activeTournament.name}
                currentRole={currentRole}
                players={activeTournamentState.players}
                spectatorTiers={activeTournamentState.spectatorTiers}
                beverages={activeTournamentState.beverages}
                lastFeedback={activeTournamentState.scanHistory[0] || null}
                scanHistory={activeTournamentState.scanHistory}
                onProcessQr={handleProcessQr}
              />
            )}

            {activeTab === 'jugadores' && (
              <PlayersManager
                tournamentId={activeTournament.id}
                players={activeTournamentState.players}
                currentUserRole={currentRole}
                onAddPlayer={handleAddPlayer}
                onUpdatePlayer={handleUpdatePlayer}
                onDeletePlayer={handleDeletePlayer}
                onScanPlayer={(qrCode) => handleProcessQr(qrCode, 1)}
              />
            )}

            {activeTab === 'espectadores' && (
              <SpectatorsManager
                tournamentId={activeTournament.id}
                tiers={activeTournamentState.spectatorTiers}
                entries={activeTournamentState.spectatorEntries}
                currentUserRole={currentRole}
                onRegisterSpectator={handleRegisterSpectator}
                onUpdateTierPrice={handleUpdateTierPrice}
                onAddTicketTier={handleAddTicketTier}
                onDeleteTicketTier={handleDeleteTicketTier}
              />
            )}

            {activeTab === 'bebidas' && (
              <BeveragesManager
                tournamentId={activeTournament.id}
                beverages={activeTournamentState.beverages}
                sales={activeTournamentState.beverageSales}
                currentUserRole={currentRole}
                onSellBeverage={handleSellBeverage}
                onUpdateBeverage={handleUpdateBeverage}
                onAddBeverage={handleAddBeverage}
                onDeleteBeverage={handleDeleteBeverage}
              />
            )}

            {activeTab === 'torneos' && (
              <TournamentsManager
                tournaments={serverData.tournaments}
                activeTournamentId={serverData.activeTournamentId}
                currentUserRole={currentRole}
                statesByTournament={serverData.statesByTournament}
                onSelectTournament={handleSelectTournament}
                onCreateTournament={handleCreateTournament}
                onUpdateTournament={handleUpdateTournament}
                onDeleteTournament={handleDeleteTournament}
              />
            )}

            {activeTab === 'usuarios' && (
              <UsersManager
                users={users}
                currentUserId={currentUser.id}
                onCreateUser={handleCreateUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
              />
            )}
          </>
        )}

        {/* Caso 2: CONTROL_JUGADORES - SOLO SE VISUALIZA JUGADORES */}
        {currentRole === 'CONTROL_JUGADORES' && (
          <PlayersManager
            tournamentId={activeTournament.id}
            players={activeTournamentState.players}
            currentUserRole={currentRole}
            onAddPlayer={handleAddPlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer}
            onScanPlayer={(qrCode) => handleProcessQr(qrCode, 1)}
          />
        )}

        {/* Caso 3: CONTROL_ESPECTADORES - SOLO SE VISUALIZA ESPECTADORES */}
        {currentRole === 'CONTROL_ESPECTADORES' && (
          <SpectatorsManager
            tournamentId={activeTournament.id}
            tiers={activeTournamentState.spectatorTiers}
            entries={activeTournamentState.spectatorEntries}
            currentUserRole={currentRole}
            onRegisterSpectator={handleRegisterSpectator}
            onUpdateTierPrice={handleUpdateTierPrice}
            onAddTicketTier={handleAddTicketTier}
            onDeleteTicketTier={handleDeleteTicketTier}
          />
        )}

        {/* Caso 4: CONTROL_BEBIDAS - SOLO SE VISUALIZA BEBIDAS */}
        {currentRole === 'CONTROL_BEBIDAS' && (
          <BeveragesManager
            tournamentId={activeTournament.id}
            beverages={activeTournamentState.beverages}
            sales={activeTournamentState.beverageSales}
            currentUserRole={currentRole}
            onSellBeverage={handleSellBeverage}
            onUpdateBeverage={handleUpdateBeverage}
            onAddBeverage={handleAddBeverage}
            onDeleteBeverage={handleDeleteBeverage}
          />
        )}
      </main>

      {/* Modal Global de Escaneo con Cámara (disponible para todos desde el Header) */}
      <CameraQrModal
        isOpen={showGlobalCamera}
        onClose={() => setShowGlobalCamera(false)}
        onScan={(code) => {
          handleProcessQr(code, 1);
        }}
        title={`Escáner Cámara — ${
          currentRole === 'CONTROL_JUGADORES'
            ? 'Asistencia de Jugadores'
            : currentRole === 'CONTROL_ESPECTADORES'
            ? 'Boletos y Entradas'
            : currentRole === 'CONTROL_BEBIDAS'
            ? 'Venta de Bebidas'
            : 'Auto-Distribución Inteligente'
        }`}
        subtitle="Apunta la cámara al código QR"
        scanCategory={
          currentRole === 'CONTROL_JUGADORES'
            ? 'JUGADOR'
            : currentRole === 'CONTROL_ESPECTADORES'
            ? 'ESPECTADOR'
            : currentRole === 'CONTROL_BEBIDAS'
            ? 'BEBIDA'
            : 'GENERAL'
        }
      />

      {/* Modal de Configuración del Nombre del Sistema y Logo JJ */}
      {showConfigModal && isAdmin && (
        <SystemSettingsModal
          config={systemConfig}
          onUpdateConfig={handleUpdateConfig}
          onClose={() => setShowConfigModal(false)}
        />
      )}

      {/* Footer Corporativo Oficial */}
      <footer className="no-print border-t border-slate-200 bg-white py-3 px-3 sm:px-6 mt-auto w-full max-w-full">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
            <span className="font-bold text-slate-800">{systemConfig.systemName}</span>
            <span aria-hidden="true">·</span>
            <span>Estación: <strong>{currentUser.displayName}</strong></span>
            {lastSyncTime && (
              <>
                <span aria-hidden="true" className="hidden sm:inline">·</span>
                <span className="font-mono-tabular hidden sm:inline">Sync: {lastSyncTime}</span>
              </>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
              >
                Personalizar marca y logo
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;
