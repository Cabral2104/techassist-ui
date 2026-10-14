import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  Terminal, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  Network,
  Cpu,
  Settings,
  PanelLeft,
  ChevronDown
} from 'lucide-react';
import { QUICK_SHORTCUTS, QUICK_PILLS } from '../data/mockData';

/**
 * Componente interactivo para Bloques de Código / Comandos de Terminal
 */
function CodeBlock({ code, language = 'cmd', title }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-md">
      {/* Cabecera del bloque tipo terminal */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          {/* Luces de consola */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-[11px] text-slate-300 font-semibold uppercase">
            {language}
          </span>
          {title && (
            <span className="text-slate-500 text-[11px] font-sans truncate">
              — {title}
            </span>
          )}
        </div>

        {/* Botón Copiar con feedback visual */}
        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
          }`}
          title="Copiar comando"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>

      {/* Contenido del Código / Comando */}
      <div className="p-3.5 overflow-x-auto text-xs leading-relaxed font-mono text-cyan-300 bg-slate-950/90 selection:bg-cyan-500/30">
        <pre className="whitespace-pre">{code}</pre>
      </div>
    </div>
  );
}

/**
 * Badge de Estado de Mensaje (Diagnóstico, Triaje, Alerta)
 */
function StatusBadge({ type, text }) {
  if (!text) return null;

  const styles = {
    warning: 'bg-amber-950/70 border-amber-600/50 text-amber-300',
    info: 'bg-blue-950/70 border-cyan-500/40 text-cyan-300',
    success: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
    critical: 'bg-rose-950/70 border-rose-500/40 text-rose-300'
  }[type] || 'bg-slate-800 border-slate-700 text-slate-300';

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border mb-2 ${styles}`}>
      {type === 'warning' && <AlertTriangle className="w-3 h-3 shrink-0" />}
      {type === 'info' && <Info className="w-3 h-3 shrink-0" />}
      {type === 'success' && <CheckCircle2 className="w-3 h-3 shrink-0" />}
      <span>{text}</span>
    </div>
  );
}

/**
 * ChatArea.jsx
 * Área central de conversación.
 * Controla dos estados:
 * 1) Estado Vacío: Bienvenida con 3 atajos rápidos enriquecidos y sugerencias.
 * 2) Estado Activo: Conversación paso a paso con burbujas diferenciadas y bloques de comandos.
 */
export function ChatArea({
  currentChat,
  currentUser,
  isGenerating,
  onSelectShortcut,
  onResetChat,
  onToggleSidebar,
  isSidebarOpen
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll al recibir o enviar nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, isGenerating]);

  // Si no hay chat activo o no tiene mensajes -> ESTADO VACÍO (Nuevo Chat)
  const isEmptyState = !currentChat || !currentChat.messages || currentChat.messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 relative">
      
      {/* Barra Superior / Header del Chat */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Alternar barra lateral"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100 truncate max-w-xs md:max-w-md">
                {isEmptyState ? 'Nueva Consulta Técnica' : currentChat.title}
              </h2>
              {!isEmptyState && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                  {currentChat.category || 'Incidente Activo'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span>Modelo: TechAssist Core L2 (Local Python Engine)</span>
            </p>
          </div>
        </div>

      </header>

      {/* Cuerpo Central con Scroll */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        
        {/* ================= ESTADO 1: VACÍO (NUEVO CHAT) ================= */}
        {isEmptyState ? (
          <div className="max-w-3xl mx-auto py-8 md:py-12 space-y-8 animate-fade-in">
            
            {/* Saludo con resplandor moderno tipo Claude/ChatGPT */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-indigo-500/20 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 mb-2">
                <Bot className="w-9 h-9 text-cyan-400 animate-subtle-pulse" />
              </div>

              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
                Hola, {currentUser?.name?.split(' ')[0] || 'Técnico'}.
              </h1>
              <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
                ¿En qué incidente técnico de TI te apoyo hoy? Selecciona un atajo de diagnóstico o describe la anomalía.
              </p>
            </div>

            {/* Las 3 Tarjetas de Atajos Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {QUICK_SHORTCUTS.map((shortcut) => {
                const IconComponent = {
                  Network: Network,
                  Cpu: Cpu,
                  Settings: Settings
                }[shortcut.icon] || Bot;

                return (
                  <div
                    key={shortcut.id}
                    onClick={() => onSelectShortcut(shortcut)}
                    className="group relative p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 shadow-lg hover:shadow-cyan-500/10 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${shortcut.color} border shadow-xs`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {shortcut.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {shortcut.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-slate-400">
                      <span>Iniciar flujo guiado</span>
                      <span className="font-mono text-[10px]">L2</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Píldoras de sugerencias adicionales */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                Consultas y Procedimientos Rápidos
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_PILLS.map((pill, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectShortcut({ initialPrompt: `Procedimiento recomendado para: ${pill}` })}
                    className="px-3 py-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800 rounded-full transition-all cursor-pointer"
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>

          </div>
        ) : (
          
          /* ================= ESTADO 2: CONVERSACIÓN ACTIVA ================= */
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Lista de Mensajes */}
            {currentChat.messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 md:gap-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {/* Avatar de TechAssist AI (Lado izquierdo) */}
                  {isAssistant && (
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-cyan-900/30">
                      <Bot className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                  )}

                  {/* Burbuja del Mensaje */}
                  <div
                    className={`max-w-[88%] md:max-w-[82%] rounded-2xl p-4 md:p-5 transition-all ${
                      isAssistant
                        ? 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-xl'
                        : 'bg-cyan-950/40 border border-cyan-800/50 text-slate-100 shadow-md'
                    }`}
                  >
                    {/* Encabezado de la burbuja */}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300">
                          {isAssistant ? 'TechAssist AI' : (currentUser?.name || 'Técnico de Soporte')}
                        </span>
                        {isAssistant && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800/80 text-cyan-300">
                            L2 Support
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Status Badge si aplica */}
                    {msg.statusBadge && (
                      <StatusBadge type={msg.statusType} text={msg.statusBadge} />
                    )}

                    {/* Contenido principal del mensaje con formato markdown visual */}
                    <div className="text-xs md:text-sm leading-relaxed space-y-2.5 text-slate-200">
                      {msg.content.split('\n\n').map((paragraph, pIdx) => {
                        // Render de encabezados h3 / h4
                        if (paragraph.startsWith('### ')) {
                          return (
                            <h4 key={pIdx} className="text-sm font-bold text-cyan-300 mt-2">
                              {paragraph.replace('### ', '')}
                            </h4>
                          );
                        }
                        if (paragraph.startsWith('#### ')) {
                          return (
                            <h5 key={pIdx} className="text-xs font-semibold text-slate-200 mt-2">
                              {paragraph.replace('#### ', '')}
                            </h5>
                          );
                        }
                        return (
                          <p key={pIdx} className="whitespace-pre-line">
                            {paragraph}
                          </p>
                        );
                      })}
                    </div>

                    {/* Bloques de Código primarios (con botón Copiar) */}
                    {msg.codeBlocks && msg.codeBlocks.map((block, bIdx) => (
                      <CodeBlock
                        key={bIdx}
                        language={block.language}
                        title={block.title}
                        code={block.code}
                      />
                    ))}

                    {/* Continuación de contenido si el mensaje tiene varios pasos */}
                    {msg.contentContinuation && (
                      <div className="text-xs md:text-sm leading-relaxed space-y-2 mt-3 text-slate-200">
                        {msg.contentContinuation.split('\n\n').map((par, idx) => (
                          <p key={idx} className="whitespace-pre-line">{par}</p>
                        ))}
                      </div>
                    )}

                    {/* Bloques de Código secundarios */}
                    {msg.codeBlocks2 && msg.codeBlocks2.map((block, bIdx) => (
                      <CodeBlock
                        key={bIdx}
                        language={block.language}
                        title={block.title}
                        code={block.code}
                      />
                    ))}

                    {/* Continuación 2 */}
                    {msg.contentContinuation2 && (
                      <div className="text-xs md:text-sm leading-relaxed space-y-2 mt-3 text-slate-200">
                        {msg.contentContinuation2.split('\n\n').map((par, idx) => (
                          <p key={idx} className="whitespace-pre-line">{par}</p>
                        ))}
                      </div>
                    )}

                    {/* Nota al pie si existe */}
                    {msg.footerNote && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 italic">
                        Nota: {msg.footerNote}
                      </div>
                    )}

                    {/* Acciones sugeridas de seguimiento (píldoras de acción rápida) */}
                    {msg.suggestedActions && (
                      <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Siguientes pasos sugeridos:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedActions.map((action, aIdx) => (
                            <button
                              key={aIdx}
                              onClick={() => onSelectShortcut({ initialPrompt: action })}
                              className="px-2.5 py-1 text-[11px] bg-slate-800/90 hover:bg-cyan-950/80 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 rounded-lg transition-all cursor-pointer text-left"
                            >
                              → {action}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Avatar del Usuario (Lado derecho) */}
                  {!isAssistant && (
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0 shadow-md">
                      {currentUser?.initials || 'TI'}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Indicador de "Escribiendo / Analizando..." cuando isGenerating es true */}
            {isGenerating && (
              <div className="flex gap-3 md:gap-4 justify-start animate-fade-in">
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-cyan-900/30">
                  <Bot className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Consultando modelo de diagnóstico L2...
                  </span>
                </div>
              </div>
            )}

            {/* Referencia para auto-scroll */}
            <div ref={messagesEndRef} />
          </div>
        )}

      </div>
    </div>
  );
}
