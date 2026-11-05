import { useEffect, useRef, useState, useCallback } from 'react';
import { AppServerData, TournamentState } from '../types/championship';
import { DEFAULT_TOURNAMENT, createInitialTournamentState } from '../data/initialData';
import { DEFAULT_SYSTEM_CONFIG, INITIAL_AUTH_USERS } from '../data/authUsers';

export function useRealtimeSync() {
  const [serverData, setServerData] = useState<AppServerData>({
    config: { ...DEFAULT_SYSTEM_CONFIG },
    users: [...INITIAL_AUTH_USERS],
    tournaments: [DEFAULT_TOURNAMENT],
    activeTournamentId: DEFAULT_TOURNAMENT.id,
    statesByTournament: {
      [DEFAULT_TOURNAMENT.id]: createInitialTournamentState(DEFAULT_TOURNAMENT),
    },
    connectedClientsCount: 1,
    onlineUsers: [],
  });

  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        setLastSyncTime(new Date().toTimeString().slice(0, 8));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'STATE_SYNC') {
            setServerData(message.payload);
            setLastSyncTime(new Date().toTimeString().slice(0, 8));
          } else if (message.type === 'PRESENCE_UPDATE') {
            setServerData((prev) => ({
              ...prev,
              connectedClientsCount: message.payload.count,
            }));
          }
        } catch (err) {
          console.error('Error parsing WS frame:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, 2000);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Error connecting to WS server:', err);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendAction = useCallback((type: string, payload: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket not open. Action buffered or fallback to local REST');
    }
  }, []);

  const activeTournamentState: TournamentState =
    serverData.statesByTournament[serverData.activeTournamentId] ||
    createInitialTournamentState(DEFAULT_TOURNAMENT);

  return {
    serverData,
    systemConfig: serverData.config,
    users: serverData.users,
    activeTournamentState,
    activeTournament: activeTournamentState.tournament,
    isConnected,
    lastSyncTime,
    sendAction,
  };
}
