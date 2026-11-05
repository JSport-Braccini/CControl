import { AuthUser, SystemConfig } from '../types/championship';

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  systemName: 'JJ Executive Sports',
  tagline: 'Plataforma Corporativa de Control de Asistencia, Aforo y Ventas QR',
  logoUrl: '/src/assets/images/jj_corp_shield_logo_1793909841397.jpg',
  primaryColor: '#0A192F', // Navy Blue
  accentColor: '#DC2626',  // Red
};

// Initial admin user
export const INITIAL_AUTH_USERS: AuthUser[] = [
  {
    id: 'usr-admin-master',
    username: 'admin',
    displayName: 'Administrador General',
    role: 'ADMIN',
    password: 'admin', // default password
    avatarColor: '#0A192F',
    createdAt: '2026-11-05T08:00:00Z',
    active: true,
  },
];
