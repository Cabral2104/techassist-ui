import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Network, 
  Cpu, 
  Server, 
  Key, 
  LogOut, 
  Shield, 
  Trash2, 
  CheckCircle, 
  Clock,
  Sparkles,
  UserCheck
} from 'lucide-react';

/**
 * Mapeo de íconos por categoría técnica
 */
const getCategoryIcon = (category) => {
  switch (category) {
    case 'Redes':
      return <Network className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    case 'Hardware/SO':
      return <Cpu className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 'Servidores':
      return <Server className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    case 'Identidad':
      return <Key className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    default:
      return <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  }
};

/**
 * Sidebar.jsx
 * Barra lateral colapsable con buscador, botón de nueva consulta,
 * chats agrupados por periodo y tarjeta de perfil del técnico.
 */
export function Sidebar({
  isOpen,
  onToggle,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  currentUser,
  onOpenAuth,
  onLogout
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrado reactivo de conversaciones por título o resumen
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        (c.summary && c.summary.toLowerCase().includes(query))
    );
  }, [chats, searchQuery]);

  // Agrupamiento por periodos ('Hoy', 'Semana pasada', 'Anteriores')
  const groupedChats = useMemo(() => {
    const groups = {};
    filteredChats.forEach((chat) => {
      const period = chat.period || 'Anteriores';
      if (!groups[period]) {
        groups[period] = [];
      }
      groups[period].push(chat);
    });
    return groups;
  }, [filteredChats]);

  return (
    <>
      {/* Overlay para móviles */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-xs md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Contenedor del Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col h-full bg-slate-900/95 md:bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out select-none ${
          isOpen ? 'w-72 md:w-80 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        {/* Cabecera del Sidebar: Logo y Botón de Colapsar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>

            {isOpen && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <span className="text-sm font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
                  TechAssist <span className="text-cyan-400 font-mono">AI</span>
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  Soporte TI N2/SysAdmin
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Botón "+ Nueva Consulta" */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group cursor-pointer ${
              isOpen
                ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/20 shadow-sm'
                : 'justify-center bg-slate-800/80 hover:bg-cyan-500/20 text-cyan-400 border border-slate-700/50'
            }`}
            title="Iniciar nueva consulta técnica"
          >
            <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300 group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            {isOpen && (
              <div className="flex items-center justify-between w-full">
                <span>Nueva Consulta</span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                  Ctrl+K
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Buscador de Chats (Solo visible si está abierto) */}
        {isOpen && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en tickets e incidentes..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950/60 border border-slate-800/90 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lista del Historial de Chats con scroll */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2">
          {isOpen ? (
            Object.keys(groupedChats).length > 0 ? (
              Object.entries(groupedChats).map(([period, items]) => (
                <div key={period} className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{period}</span>
                    <span className="text-[10px] text-slate-600 font-mono ml-auto">
                      ({items.length})
                    </span>
                  </div>

                  {items.map((chat) => {
                    const isActive = chat.id === activeChatId;
                    return (
                      <div
                        key={chat.id}
                        onClick={() => onSelectChat(chat.id)}
                        className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                          isActive
                            ? 'bg-slate-800/90 text-cyan-200 border border-cyan-500/30 shadow-sm shadow-cyan-950/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                        }`}
                      >
                        {getCategoryIcon(chat.category)}

                        <div className="flex-1 min-w-0">
                          <p className={`truncate font-medium ${isActive ? 'text-slate-100' : ''}`}>
                            {chat.title}
                          </p>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            {chat.createdAt} • {chat.category || 'Incidente'}
                          </span>
                        </div>

                        {/* Botón eliminar chat (hover) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 rounded transition-all"
                          title="Eliminar historial de esta consulta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                No se encontraron incidentes que coincidan con la búsqueda.
              </div>
            )
          ) : (
            // Vista compacta para sidebar colapsado (sólo iconos)
            <div className="space-y-2 flex flex-col items-center">
              {chats.map((chat) => {
                const isActive = chat.id === activeChatId;
                return (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                    title={chat.title}
                  >
                    {getCategoryIcon(chat.category)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Perfil del Técnico en la parte inferior */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          {currentUser ? (
            <div
              className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700/80 transition-all ${
                isOpen ? '' : 'justify-center p-1.5'
              }`}
            >
              {/* Avatar con iniciales y badge de estado online */}
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {currentUser.initials || 'TI'}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900"
                  title="Estado: En línea"
                />
              </div>

              {isOpen && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {currentUser.name}
                    </p>
                    <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-1 rounded font-mono">
                      N2
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    {currentUser.role}
                  </p>
                </div>
              )}

              {/* Botón de Cerrar Sesión */}
              {isOpen && (
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            // Botón de Iniciar Sesión si no hay usuario
            <button
              onClick={onOpenAuth}
              className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 hover:bg-cyan-900/30 transition-all cursor-pointer ${
                isOpen ? 'justify-start' : 'justify-center'
              }`}
            >
              <UserCheck className="w-4 h-4 text-cyan-400" />
              {isOpen && <span>Iniciar Sesión</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
