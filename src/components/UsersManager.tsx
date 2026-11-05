import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Edit2,
  Trash2,
  X,
  Check,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { AuthUser, UserRole } from '../types/championship';

interface UsersManagerProps {
  users: AuthUser[];
  currentUserId: string;
  onCreateUser: (user: AuthUser) => void;
  onUpdateUser: (user: AuthUser) => void;
  onDeleteUser: (userId: string) => void;
}

export const UsersManager: React.FC<UsersManagerProps> = ({
  users,
  currentUserId,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);

  // Form Add
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('CONTROL_JUGADORES');

  // Form Edit
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('CONTROL_JUGADORES');
  const [editActive, setEditActive] = useState(true);

  const roleBadgeMap: Record<UserRole, { label: string; color: string }> = {
    ADMIN: { label: 'Administrador Total', color: 'bg-red-50 text-red-700 border-red-200' },
    CONTROL_JUGADORES: { label: 'Control Jugadores', color: 'bg-blue-50 text-blue-800 border-blue-200' },
    CONTROL_ESPECTADORES: { label: 'Control Espectadores', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    CONTROL_BEBIDAS: { label: 'Control Bebidas', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  };

  const handleOpenAdd = () => {
    setNewUsername('');
    setNewDisplayName('');
    setNewPassword('');
    setNewRole('CONTROL_JUGADORES');
    setShowAddModal(true);
  };

  const handleOpenEdit = (user: AuthUser) => {
    setEditingUser(user);
    setEditDisplayName(user.displayName);
    setEditPassword(user.password || '');
    setEditRole(user.role);
    setEditActive(user.active);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;

    const roleColors: Record<UserRole, string> = {
      ADMIN: '#0A192F',
      CONTROL_JUGADORES: '#1D4ED8',
      CONTROL_ESPECTADORES: '#047857',
      CONTROL_BEBIDAS: '#B45309',
    };

    const newUser: AuthUser = {
      id: `usr-${Date.now()}`,
      username: newUsername.trim().toLowerCase(),
      displayName: newDisplayName.trim() || newUsername.trim(),
      role: newRole,
      password: newPassword.trim(),
      avatarColor: roleColors[newRole],
      createdAt: new Date().toISOString(),
      active: true,
    };

    onCreateUser(newUser);
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    onUpdateUser({
      ...editingUser,
      displayName: editDisplayName.trim() || editingUser.username,
      password: editPassword.trim() || editingUser.password,
      role: editRole,
      active: editActive,
    });
    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Administración de Usuarios y Accesos
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Crea, edita y elimina cuentas de usuario para las distintas estaciones (Jugadores, Espectadores o Bebidas).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0A192F] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <UserPlus className="w-4 h-4 text-red-500" />
          Crear Nuevo Usuario
        </button>
      </div>

      {/* Grid de Usuarios */}
      {/* Lista Móvil de Usuarios (sm:hidden) */}
      <div className="sm:hidden space-y-3">
        {users.map((user) => {
          const isMasterAdmin = user.username.toLowerCase() === 'admin';
          const isSelf = user.id === currentUserId;

          return (
            <div key={user.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: user.avatarColor || '#0A192F' }}
                  >
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 font-mono text-sm">@{user.username}</span>
                      {isSelf && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                          Tú
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{user.displayName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(user)}
                    className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    title="Editar usuario"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!isMasterAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Eliminar al usuario @${user.username}?`)) {
                          onDeleteUser(user.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                    roleBadgeMap[user.role]?.color || 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {roleBadgeMap[user.role]?.label || user.role}
                </span>

                <span className={`text-xs font-semibold ${user.active ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {user.active ? 'Habilitado' : 'Inactivo'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabla Desktop (hidden sm:block) */}
      <div className="hidden sm:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-5">Usuario</th>
                <th className="py-3 px-3">Nombre para Mostrar</th>
                <th className="py-3 px-3">Estación / Rol</th>
                <th className="py-3 px-3">Contraseña</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {users.map((user) => {
                const isMasterAdmin = user.username.toLowerCase() === 'admin';
                const isSelf = user.id === currentUserId;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: user.avatarColor || '#0A192F' }}
                        >
                          {user.username.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900 font-mono">
                          @{user.username}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-medium">
                      {user.displayName}
                      {isSelf && (
                        <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          Tú
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                          roleBadgeMap[user.role]?.color || 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {roleBadgeMap[user.role]?.label || user.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">
                      {user.password ? '••••••••' : '(sin clave)'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-xs font-semibold ${
                          user.active ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        {user.active ? 'Habilitado' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Editar usuario"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {!isMasterAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Eliminar al usuario @${user.username}?`)) {
                                onDeleteUser(user.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0A192F]" />
                <h3 className="text-lg font-bold text-slate-900">Crear Nuevo Usuario</h3>
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
                  Nombre de Usuario (Login) *
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ej: operador_puerta, cajero_1"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre para Mostrar (Operador)
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Ej: Juan Pérez - Puerta Principal"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estación / Rol de Trabajo
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                >
                  <option value="CONTROL_JUGADORES">Control Jugadores (Asistencia)</option>
                  <option value="CONTROL_ESPECTADORES">Control Espectadores (Boletos)</option>
                  <option value="CONTROL_BEBIDAS">Control Bebidas (Ventas)</option>
                  <option value="ADMIN">Administrador General (Total)</option>
                </select>
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0A192F] hover:bg-slate-800 rounded-lg cursor-pointer shadow-xs"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Editar Usuario @{editingUser.username}
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre para Mostrar
                </label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nueva Contraseña (deja en blanco para mantener)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estación / Rol
                </label>
                <select
                  disabled={editingUser.username.toLowerCase() === 'admin'}
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                >
                  <option value="CONTROL_JUGADORES">Control Jugadores (Asistencia)</option>
                  <option value="CONTROL_ESPECTADORES">Control Espectadores (Boletos)</option>
                  <option value="CONTROL_BEBIDAS">Control Bebidas (Ventas)</option>
                  <option value="ADMIN">Administrador General (Total)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="user-active-checkbox"
                  checked={editActive}
                  disabled={editingUser.username.toLowerCase() === 'admin'}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="user-active-checkbox" className="text-xs font-medium text-slate-700">
                  Usuario Habilitado para Iniciar Sesión
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0A192F] hover:bg-slate-800 rounded-lg cursor-pointer shadow-xs"
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
