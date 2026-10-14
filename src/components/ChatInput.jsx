import React, { useState, useRef, useEffect } from 'react';
import { 
  Paperclip, 
  Send, 
  X, 
  FileText, 
  Sparkles, 
  Terminal, 
  HelpCircle,
  Command,
  ArrowUp
} from 'lucide-react';

/**
 * ChatInput.jsx
 * Barra de entrada flotante en la parte inferior con auto-expansión de textarea,
 * soporte para adjuntar archivos de logs / capturas, y envío con Enter / click.
 */
export function ChatInput({
  onSendMessage,
  isGenerating,
  placeholder = "Escribe tu consulta o pega el error/log (ej. 'ipconfig', '0x80070005', 'DHCP timeout')...",
  initialValue = ""
}) {
  const [inputMessage, setInputMessage] = useState(initialValue);
  const [attachedFile, setAttachedFile] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sincronizar si viene un valor inicial (por ejemplo desde un atajo o sugerencia)
  useEffect(() => {
    if (initialValue) {
      setInputMessage(initialValue);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [initialValue]);

  // Auto-expansión del textarea en función del contenido
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // Altura máxima limitada a ~180px antes de hacer scroll interno
      const newHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${Math.max(newHeight, 44)}px`;
    }
  }, [inputMessage]);

  const handleKeyDown = (e) => {
    // Enviar con Enter (sin Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!inputMessage.trim() && !attachedFile) || isGenerating) return;

    onSendMessage({
      text: inputMessage.trim(),
      attachment: attachedFile
    });

    setInputMessage('');
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type || 'text/plain'
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="shrink-0 p-4 max-w-3xl mx-auto w-full z-10">
      
      {/* Contenedor Flotante del Input */}
      <div className="relative bg-slate-900/90 border border-slate-800 focus-within:border-cyan-500/60 rounded-2xl shadow-xl shadow-cyan-950/20 backdrop-blur-md transition-all duration-200">
        
        {/* Previsualización del archivo adjunto si existe */}
        {attachedFile && (
          <div className="flex items-center gap-2 mx-3 mt-2.5 p-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 animate-fade-in">
            <div className="p-1 rounded bg-cyan-950 text-cyan-400">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono truncate max-w-xs">{attachedFile.name}</span>
            <span className="text-[10px] text-slate-500 font-mono">({attachedFile.size})</span>
            <button
              onClick={() => setAttachedFile(null)}
              className="ml-auto p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Quitar archivo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Textarea auto-expansible */}
        <div className="flex items-end px-3 py-2 gap-2">
          
          {/* Botón de Adjuntar Archivo (Clip) */}
          <button
            type="button"
            onClick={triggerFileInput}
            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer shrink-0"
            title="Adjuntar archivo de logs (.log, .txt, .pcap, .evtx) o captura"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".log,.txt,.json,.csv,.png,.jpg,.jpeg,.evtx,.pcap"
          />

          {/* Campo de entrada de texto */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isGenerating}
            className="flex-1 max-h-44 py-2 px-1 text-xs md:text-sm bg-transparent text-slate-100 placeholder-slate-500 resize-none focus:outline-none leading-relaxed disabled:opacity-50"
            style={{ minHeight: '40px' }}
          />

          {/* Botón de Enviar */}
          <button
            type="button"
            onClick={handleSend}
            disabled={(!inputMessage.trim() && !attachedFile) || isGenerating}
            className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              inputMessage.trim() || attachedFile
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 active:scale-95'
                : 'bg-slate-800/80 text-slate-600 cursor-not-allowed'
            }`}
            title="Enviar mensaje (Enter)"
          >
            {isGenerating ? (
              <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin block" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Barra de atajos rápidos dentro del input */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-800/50 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Presiona</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] border border-slate-700">
              Enter
            </kbd>
            <span className="hidden sm:inline">para enviar,</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] border border-slate-700">
              Shift + Enter
            </kbd>
            <span className="hidden sm:inline">para nueva línea</span>
          </div>

          <div className="flex items-center gap-1.5 text-cyan-400/80 font-mono text-[10px]">
            <Terminal className="w-3 h-3" />
            <span>PowerShell & CMD Ready</span>
          </div>
        </div>

      </div>

      {/* Disclaimer de seguridad tipo ChatGPT/Claude */}
      <p className="mt-2 text-center text-[10px] text-slate-500 leading-tight">
        TechAssist AI puede sugerir comandos con privilegios de Administrador. Valida los parámetros antes de ejecutarlos en servidores o puestos en producción.
      </p>
    </div>
  );
}
