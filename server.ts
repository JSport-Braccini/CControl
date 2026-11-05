import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Tournament,
  TournamentState,
  AppServerData,
  Player,
  SpectatorTier,
  BeverageProduct,
  AuthUser,
  ConnectedUserPresence,
  SystemConfig,
} from './src/types/championship.js';
import {
  DEFAULT_TOURNAMENT,
  createInitialTournamentState,
} from './src/data/initialData.js';
import {
  DEFAULT_SYSTEM_CONFIG,
  INITIAL_AUTH_USERS,
} from './src/data/authUsers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();
const server = createServer(app);

app.use(express.json());

// In-Memory Cloud Server State (Authoritative source of truth)
const serverData: AppServerData = {
  config: { ...DEFAULT_SYSTEM_CONFIG },
  users: [...INITIAL_AUTH_USERS],
  tournaments: [DEFAULT_TOURNAMENT],
  activeTournamentId: DEFAULT_TOURNAMENT.id,
  statesByTournament: {
    [DEFAULT_TOURNAMENT.id]: createInitialTournamentState(DEFAULT_TOURNAMENT),
  },
  connectedClientsCount: 0,
  onlineUsers: [],
};

// WebSocket Server attached to same HTTP server
const wss = new WebSocketServer({ server });
const clientMetadata = new Map<WebSocket, { user?: AuthUser; connectedAt: string }>();

function getOnlinePresences(): ConnectedUserPresence[] {
  const result: ConnectedUserPresence[] = [];
  let index = 1;
  clientMetadata.forEach((meta) => {
    if (meta.user) {
      result.push({
        socketId: `conn-${index++}`,
        user: meta.user,
        connectedAt: meta.connectedAt,
      });
    }
  });
  return result;
}

function broadcast(type: string, payload: unknown, skipSender?: WebSocket) {
  const message = JSON.stringify({ type, payload });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== skipSender) {
      client.send(message);
    }
  });
}

function broadcastFullState() {
  const payload = {
    ...serverData,
    connectedClientsCount: wss.clients.size,
    onlineUsers: getOnlinePresences(),
  };
  broadcast('STATE_SYNC', payload);
}

wss.on('connection', (ws) => {
  clientMetadata.set(ws, { connectedAt: new Date().toTimeString().slice(0, 8) });

  ws.send(
    JSON.stringify({
      type: 'STATE_SYNC',
      payload: {
        ...serverData,
        connectedClientsCount: wss.clients.size,
        onlineUsers: getOnlinePresences(),
      },
    })
  );

  broadcastFullState();

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      handleClientAction(data, ws);
    } catch (err) {
      console.error('Error handling WS message:', err);
    }
  });

  ws.on('close', () => {
    clientMetadata.delete(ws);
    broadcastFullState();
  });
});

function handleClientAction(
  action: { type: string; payload: any },
  sender: WebSocket
) {
  const { type, payload } = action;

  switch (type) {
    case 'IDENTIFY_USER': {
      const meta = clientMetadata.get(sender);
      if (meta) {
        meta.user = payload.user;
        broadcastFullState();
      }
      break;
    }

    // UPDATE SYSTEM CONFIG (SYSTEM NAME, LOGO, ETC.)
    case 'UPDATE_SYSTEM_CONFIG': {
      serverData.config = {
        ...serverData.config,
        ...payload.config,
      };
      broadcastFullState();
      break;
    }

    // USER MANAGEMENT (ADMIN ONLY)
    case 'CREATE_USER': {
      const newUser: AuthUser = payload.user;
      // prevent duplicate username
      if (!serverData.users.some((u) => u.username.toLowerCase() === newUser.username.toLowerCase())) {
        serverData.users.push(newUser);
        broadcastFullState();
      }
      break;
    }

    case 'UPDATE_USER': {
      const updatedUser: AuthUser = payload.user;
      const idx = serverData.users.findIndex((u) => u.id === updatedUser.id);
      if (idx !== -1) {
        serverData.users[idx] = {
          ...serverData.users[idx],
          ...updatedUser,
        };
        broadcastFullState();
      }
      break;
    }

    case 'DELETE_USER': {
      const { userId } = payload;
      // cannot delete the primary admin
      if (serverData.users.length > 1) {
        const target = serverData.users.find((u) => u.id === userId);
        if (target && target.username.toLowerCase() !== 'admin') {
          serverData.users = serverData.users.filter((u) => u.id !== userId);
          broadcastFullState();
        }
      }
      break;
    }

    case 'SELECT_TOURNAMENT': {
      if (serverData.statesByTournament[payload.tournamentId]) {
        serverData.activeTournamentId = payload.tournamentId;
        broadcastFullState();
      }
      break;
    }

    case 'CREATE_TOURNAMENT': {
      const newTournament: Tournament = payload.tournament;
      serverData.tournaments.unshift(newTournament);
      serverData.statesByTournament[newTournament.id] = createInitialTournamentState(newTournament);
      serverData.activeTournamentId = newTournament.id;
      broadcastFullState();
      break;
    }

    case 'DELETE_TOURNAMENT': {
      const { tournamentId } = payload;
      if (serverData.tournaments.length <= 1) return;
      serverData.tournaments = serverData.tournaments.filter((t) => t.id !== tournamentId);
      delete serverData.statesByTournament[tournamentId];
      if (serverData.activeTournamentId === tournamentId) {
        serverData.activeTournamentId = serverData.tournaments[0].id;
      }
      broadcastFullState();
      break;
    }

    case 'UPDATE_TOURNAMENT': {
      const updated: Tournament = payload.tournament;
      const idx = serverData.tournaments.findIndex((t) => t.id === updated.id);
      if (idx !== -1) {
        serverData.tournaments[idx] = updated;
        if (serverData.statesByTournament[updated.id]) {
          serverData.statesByTournament[updated.id].tournament = updated;
        }
        broadcastFullState();
      }
      break;
    }

    case 'PROCESS_QR_SCAN': {
      const { tournamentId, qrCode, quantity = 1, registeredBy } = payload;
      const state = serverData.statesByTournament[tournamentId];
      if (!state) return;

      const code = String(qrCode).trim().toUpperCase();
      const nowTime = new Date().toTimeString().slice(0, 8);
      const qty = Math.max(1, Number(quantity) || 1);

      // Check Player
      const matchedPlayer = state.players.find((p) => p.qrCode.toUpperCase() === code);
      if (matchedPlayer) {
        if (matchedPlayer.checkedIn) {
          matchedPlayer.duplicateAttempts += 1;
          const feedback = {
            id: `fb-${Date.now()}`,
            status: 'duplicate' as const,
            category: 'JUGADOR' as const,
            title: '¡YA ESTÁ REGISTRADO! — Asistencia Duplicada Bloqueada',
            message: `El jugador ${matchedPlayer.name} (#${matchedPlayer.jerseyNumber} · ${matchedPlayer.team}) ya registró su ingreso a las ${matchedPlayer.checkInTime}.`,
            detail: 'El sistema impide ingresos duplicados por normativa de torneo.',
            timestamp: nowTime,
            qrCode: code,
          };
          state.scanHistory.unshift(feedback);
          broadcastFullState();
          return;
        }

        matchedPlayer.checkedIn = true;
        matchedPlayer.checkInTime = nowTime;
        const feedback = {
          id: `fb-${Date.now()}`,
          status: 'success' as const,
          category: 'JUGADOR' as const,
          title: 'Asistencia de Jugador Registrada',
          message: `${matchedPlayer.name} (#${matchedPlayer.jerseyNumber} · ${matchedPlayer.team}) habilitado en cancha oficial. Operador: ${registeredBy || 'Módulo'}`,
          timestamp: nowTime,
          qrCode: code,
        };
        state.scanHistory.unshift(feedback);
        broadcastFullState();
        return;
      }

      // Check Spectator Tier
      const matchedTier = state.spectatorTiers.find((t) => t.qrCode.toUpperCase() === code);
      if (matchedTier) {
        const totalAmount = matchedTier.price * qty;
        state.spectatorEntries.unshift({
          id: `se-${Date.now()}`,
          tournamentId,
          qrCode: matchedTier.qrCode,
          ticketType: matchedTier.type,
          label: matchedTier.label,
          price: matchedTier.price,
          isChild: matchedTier.isChild,
          quantity: qty,
          totalAmount,
          timestamp: nowTime,
          registeredBy: registeredBy || 'Módulo Espectadores',
        });
        const feedback = {
          id: `fb-${Date.now()}`,
          status: 'success' as const,
          category: 'ESPECTADOR' as const,
          title: 'Ingreso de Espectador Registrado',
          message: `+${qty} ${matchedTier.label} (${matchedTier.isChild ? 'Niño / Menor' : 'Adulto / General'}) — Total: S/ ${totalAmount.toFixed(2)}`,
          timestamp: nowTime,
          qrCode: code,
        };
        state.scanHistory.unshift(feedback);
        broadcastFullState();
        return;
      }

      // Check Beverage
      const matchedBev = state.beverages.find((b) => b.qrCode.toUpperCase() === code);
      if (matchedBev) {
        if (matchedBev.stock < qty) {
          const feedback = {
            id: `fb-${Date.now()}`,
            status: 'error' as const,
            category: 'BEBIDA' as const,
            title: `Stock insuficiente de ${matchedBev.name}`,
            message: `Solo quedan ${matchedBev.stock} unidades disponibles en inventario.`,
            timestamp: nowTime,
            qrCode: code,
          };
          state.scanHistory.unshift(feedback);
          broadcastFullState();
          return;
        }

        matchedBev.stock -= qty;
        matchedBev.soldCount += qty;
        const totalAmount = matchedBev.price * qty;
        state.beverageSales.unshift({
          id: `bs-${Date.now()}`,
          tournamentId,
          beverageId: matchedBev.id,
          beverageName: matchedBev.name,
          qrCode: matchedBev.qrCode,
          quantity: qty,
          unitPrice: matchedBev.price,
          totalAmount,
          timestamp: nowTime,
          registeredBy: registeredBy || 'Módulo Bebidas',
        });
        const feedback = {
          id: `fb-${Date.now()}`,
          status: 'success' as const,
          category: 'BEBIDA' as const,
          title: `Venta de ${matchedBev.name} Registrada`,
          message: `${qty} × ${matchedBev.name} (${matchedBev.presentation}) — Total: S/ ${totalAmount.toFixed(2)}`,
          timestamp: nowTime,
          qrCode: code,
        };
        state.scanHistory.unshift(feedback);
        broadcastFullState();
        return;
      }

      // Unknown
      const feedback = {
        id: `fb-${Date.now()}`,
        status: 'error' as const,
        category: 'DESCONOCIDO' as const,
        title: 'Código QR no reconocido',
        message: `El código "${code}" no está registrado en este torneo.`,
        timestamp: nowTime,
        qrCode: code,
      };
      state.scanHistory.unshift(feedback);
      broadcastFullState();
      break;
    }

    // CRUD PLAYERS
    case 'ADD_PLAYER': {
      const { tournamentId, player } = payload;
      const state = serverData.statesByTournament[tournamentId];
      if (state) {
        state.players.unshift(player);
        broadcastFullState();
      }
      break;
    }

    case 'UPDATE_PLAYER': {
      const { tournamentId, player } = payload;
      const state = serverData.statesByTournament[tournamentId];
      if (state) {
        const idx = state.players.findIndex((p) => p.id === player.id);
        if (idx !== -1) {
          state.players[idx] = { ...state.players[idx], ...player };
          broadcastFullState();
        }
      }
      break;
    }

    case 'DELETE_PLAYER': {
      const { tournamentId, playerId } = payload;
      const state = serverData.statesByTournament[tournamentId];
      if (state) {
        state.players = state.players.filter((p) => p.id !== playerId);
        broadcastFullState();
      }
      break;
    }

    // CRUD TICKETS
    case 'UPDATE_TICKET_PRICE': {
      const { tournamentId, tierId, price, label, description } = payload;
      const state = serverData.statesByTournament[tournamentId];
      if (state) {
        const tier = state.spectatorTiers.find((t) => t.id === tierId);
        if (tier) {
          if (price !== undefined) tier.price = Number(price);
          if (label !== undefined) tier.label = label;
          if (description !== undefined) tier.description = description;
          broadcastFullState();
        }
      }
      break;
    }

    case 'ADD_TICKET_TIER': {
      const { tournamentId, tier } = payload;
      const state = serverData.statesByTournament[tournamentId];
      if (state) {
        state.spectatorTiers.push(tier);
        broadcastFullState();
      }
      break;
    }

    case 'DELETE_TICKET_TIER': {
      const { tournamentId, tierId } = payload;
      const state = serverData.statesByTournament[tournamentId];
      if (state) {
        state.spectatorTiers = state.spectatorTiers.filter((t) => t.id !== tierId);
        broadcastFullState();
      }
      break;
    }

    // CRUD BEVERAGES
    case 'UPDATE_BEVERAGE': {
      const { tournamentId, beverageId, price, stock, name, presentation } = payload;
      const state = serverData.statesByTournament[tournamentId];
      if (state) {
        const bev = state.beverages.find((b) => b.id === beverageId);
        if (bev) {
          if (price !== undefined) bev.price = Number(price);
          if (stock !== undefined) bev.stock = Number(stock);
          if (name !== undefined) bev.name = name;
          if (presentation !== undefined) bev.presentation = presentation;
          broadcastFullState();
        }
      }
      break;
    }

    case 'ADD_BEVERAGE': {
      const { tournamentId, beverage } = payload;
      const state = serverData.statesByTournament[tournamentId];
      if (state) {
        state.beverages.push(beverage);
        broadcastFullState();
      }
      break;
    }

    case 'DELETE_BEVERAGE': {
      const { tournamentId, beverageId } = payload;
      const state = serverData.statesByTournament[tournamentId];
      if (state) {
        state.beverages = state.beverages.filter((b) => b.id !== beverageId);
        broadcastFullState();
      }
      break;
    }

    case 'RESET_TOURNAMENT_DATA': {
      const { tournamentId } = payload;
      const t = serverData.tournaments.find((tour) => tour.id === tournamentId);
      if (t) {
        serverData.statesByTournament[tournamentId] = createInitialTournamentState(t);
        broadcastFullState();
      }
      break;
    }

    default:
      break;
  }
}

// REST Authentication Endpoint matching serverData.users
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Usuario y contraseña requeridos' });
  }

  const cleanUser = String(username).toLowerCase().trim();
  const matched = serverData.users.find(
    (u) => u.username.toLowerCase() === cleanUser && u.active
  );

  if (!matched || matched.password !== String(password).trim()) {
    return res.status(401).json({ success: false, message: 'Credenciales inválidas. Comprueba el usuario y contraseña.' });
  }

  return res.json({ success: true, user: matched });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    connectedClients: wss.clients.size,
    tournamentsCount: serverData.tournaments.length,
    activeTournamentId: serverData.activeTournamentId,
    systemName: serverData.config.systemName,
  });
});

app.get('/api/state', (req, res) => {
  res.json(serverData);
});

// Mount Vite in dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`JJ CopaControl Server running on http://0.0.0.0:${PORT} with WebSockets`);
  });
}

startServer();
