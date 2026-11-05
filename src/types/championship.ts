export type ActiveTab = 'resumen' | 'escaner' | 'jugadores' | 'espectadores' | 'bebidas' | 'torneos' | 'usuarios' | 'configuracion';

export type UserRole = 'ADMIN' | 'CONTROL_JUGADORES' | 'CONTROL_ESPECTADORES' | 'CONTROL_BEBIDAS';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  password?: string;
  avatarColor: string;
  createdAt: string;
  active: boolean;
}

export interface SystemConfig {
  systemName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
}

export interface Player {
  id: string;
  tournamentId: string;
  qrCode: string;
  name: string;
  team: string;
  jerseyNumber: number;
  position: string;
  dni: string;
  checkedIn: boolean;
  checkInTime?: string;
  duplicateAttempts: number;
}

export type SpectatorTicketType = 'ADULTO' | 'NINO' | 'VIP';

export interface SpectatorTier {
  id: string;
  tournamentId: string;
  type: SpectatorTicketType;
  label: string;
  qrCode: string;
  price: number;
  isChild: boolean;
  description: string;
}

export interface SpectatorEntry {
  id: string;
  tournamentId: string;
  qrCode: string;
  ticketType: SpectatorTicketType;
  label: string;
  price: number;
  isChild: boolean;
  quantity: number;
  totalAmount: number;
  timestamp: string;
  registeredBy?: string;
}

export interface BeverageProduct {
  id: string;
  tournamentId: string;
  name: string;
  presentation: string;
  qrCode: string;
  price: number;
  stock: number;
  soldCount: number;
}

export interface BeverageSale {
  id: string;
  tournamentId: string;
  beverageId: string;
  beverageName: string;
  qrCode: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  timestamp: string;
  buyerNote?: string;
  registeredBy?: string;
}

export interface ScanFeedback {
  id: string;
  status: 'success' | 'duplicate' | 'error';
  category: 'JUGADOR' | 'ESPECTADOR' | 'BEBIDA' | 'DESCONOCIDO';
  title: string;
  message: string;
  detail?: string;
  timestamp: string;
  qrCode: string;
}

export interface Tournament {
  id: string;
  name: string;
  edition: string;
  category: string;
  venue: string;
  date: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  notes?: string;
}

export interface TournamentState {
  tournament: Tournament;
  players: Player[];
  spectatorTiers: SpectatorTier[];
  spectatorEntries: SpectatorEntry[];
  beverages: BeverageProduct[];
  beverageSales: BeverageSale[];
  scanHistory: ScanFeedback[];
}

export interface ConnectedUserPresence {
  socketId: string;
  user: AuthUser;
  connectedAt: string;
}

export interface AppServerData {
  config: SystemConfig;
  users: AuthUser[];
  tournaments: Tournament[];
  activeTournamentId: string;
  statesByTournament: Record<string, TournamentState>;
  connectedClientsCount?: number;
  onlineUsers?: ConnectedUserPresence[];
}
