import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { AuthModal } from './components/AuthModal';
import { INITIAL_CONVERSATIONS, MOCK_USER } from './data/mockData';

/**
 * ============================================================================
 * GUÍA DE INTEGRACIÓN CON API PYTHON (FastAPI / Flask / Django Ninja)
 * ============================================================================
 * Para conectar este frontend con tu backend en Python:
 * 
 * 1. Define tu endpoint en FastAPI:
 *    @app.post("/api/chat")
 *    async def handle_chat(request: ChatRequest):
 *        # Conexión con LangChain / LlamaIndex / Gemini / OpenAI
 *        response = await ai_service.diagnose_incident(request.messages)
 *        return {"reply": response}
 * 
 * 2. En la función `sendQueryToPythonAPI` de este archivo:
 *    Descomenta la llamada `fetch()` y reemplaza la simulación.
 * ============================================================================
 */

export default function App() {
  // 1. Estado de conversaciones y chat activo (Inicia con la conversación de falla de red APIPA)
  const [chats, setChats] = useState(INITIAL_CONVERSATIONS);
  const [currentChatId, setCurrentChatId] = useState('chat-network-apipa');

  // 2. Estado de interfaz (Sidebar y Modal de Autenticación)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 3. Estado de sesión del técnico
  const [currentUser, setCurrentUser] = useState(MOCK_USER);

  // 4. Estado de generación / IA pensando
  const [isGenerating, setIsGenerating] = useState(false);

  // 5. Estado de texto prellenado para el input (al hacer clic en atajos)
  const [prefilledInput, setPrefilledInput] = useState('');

  // Obtener la conversación actual seleccionada
  const currentChat = chats.find((c) => c.id === currentChatId) || null;

  /**
   * Crear o iniciar una nueva consulta técnica (Estado Vacío)
   */
  const handleNewChat = () => {
    setCurrentChatId(null);
    setPrefilledInput('');
  };

  /**
   * Seleccionar una consulta del historial
   */
  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
    setPrefilledInput('');
  };

  /**
   * Eliminar una consulta del historial
   */
  const handleDeleteChat = (chatId) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  /**
   * Seleccionar atajo o sugerencia rápida en el ChatArea
   */
  const handleSelectShortcut = (shortcut) => {
    if (shortcut.initialPrompt) {
      setPrefilledInput(shortcut.initialPrompt);
    }
  };

  /**
   * Reiniciar la conversación actual o abrir una nueva
   */
  const handleResetChat = () => {
    handleNewChat();
  };

  /**
   * Función para conectar con el backend en Python.
   * Actualmente contiene un mock inteligente que genera respuestas realistas de soporte TI.
   */
  const sendQueryToPythonAPI = async (chatHistory, userMessage) => {
    /* 
    // DESCOMENTAR PARA CONEXIÓN REAL CON FASTAPI / FLASK:
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: chatHistory,
          message: userMessage,
          user: currentUser
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error al conectar con la API de Python:", error);
      throw error;
    }
    */

    // Simulación de respuesta con delay natural de procesamiento
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const lower = userMessage.text.toLowerCase();

    // Lógica contextual simulada según el contenido del mensaje
    if (lower.includes('estática') || lower.includes('ip estática') || lower.includes('192.168.1.240')) {
      return {
        content: `### Procedimiento para Asignación de IP Estática Temporal
Para aislar si el problema es exclusivamente del servidor DHCP o de la tarjeta de red, configuraremos temporalmente una IP estática fuera del rango de conflicto:`,
        statusBadge: 'Configuración Manual de IP',
        statusType: 'info',
        codeBlocks: [
          {
            language: 'powershell',
            title: 'Configurar IP estática con PowerShell (Admin)',
            code: `New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress "192.168.1.240" -PrefixLength 24 -DefaultGateway "192.168.1.1"
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("192.168.1.1", "1.1.1.1")`
          }
        ],
        contentContinuation: `Una vez aplicada, intenta hacer ping al gateway (\`192.168.1.1\`). Si responde, el cable y el switch funcionan y el fallo reside 100% en el agente DHCP Relay o servidor DHCP.`,
        suggestedActions: [
          'Revertir a DHCP automático tras prueba',
          'Comprobar reservas DHCP en el Router Core'
        ]
      };
    }

    if (lower.includes('bsod') || lower.includes('pantalla azul') || lower.includes('dmp') || lower.includes('hardware')) {
      return {
        content: `### Análisis de Volcado de Memoria (BSOD)
Para analizar la causa del kernel panic y aislar el controlador o hardware defectuoso:`,
        statusBadge: 'Triaje de Hardware & Kernel',
        statusType: 'warning',
        codeBlocks: [
          {
            language: 'powershell',
            title: 'Localizar y listar últimos volcados de memoria',
            code: `Get-ChildItem -Path "C:\\Windows\\Minidump" -Filter "*.dmp" | Sort-Object LastWriteTime -Descending | Select-Object -First 5 Name, Length, LastWriteTime`
          }
        ],
        contentContinuation: `Recomiendo abrir el archivo en **WinDbg** y ejecutar el análisis automático:
\`\`\`
!analyze -v
\`\`\`
Revisa los parámetros \`IMAGE_NAME\` y \`FAILURE_BUCKET_ID\` para identificar el driver (.sys) causante.`,
        suggestedActions: [
          'Ejecutar diagnóstico de memoria mdsched.exe',
          'Comprobar salud de disco con CrystalDisk / smartctl'
        ]
      };
    }

    // Respuesta genérica inteligente para soporte TI L2
    return {
      content: `### Evaluación Técnica del Incidente
He analizado los parámetros de tu solicitud: **"${userMessage.text.slice(0, 60)}..."**

Procederemos a recopilar la telemetría del sistema operativo para diagnosticar el comportamiento anómalo. Ejecuta el siguiente diagnóstico general:`,
      statusBadge: 'Análisis de Incidente en Curso',
      statusType: 'info',
      codeBlocks: [
        {
          language: 'powershell',
          title: 'Auditoría de eventos críticos recientes (Últimas 24h)',
          code: `Get-WinEvent -FilterHashtable @{LogName='System'; Level=1,2; StartTime=(Get-Date).AddDays(-1)} -MaxEvents 15 | Select-Object TimeCreated, Id, Message | Format-Table -Wrap`
        }
      ],
      contentContinuation: `Por favor adjunta la salida o los códigos de Event ID reportados para correlacionar la falla con la base de conocimientos de TI.`,
      suggestedActions: [
        'Exportar logs a archivo de texto',
        'Reiniciar subsistema afectado',
        'Escalar a Soporte Nivel 3'
      ]
    };
  };

  /**
   * Enviar mensaje (desde ChatInput)
   */
  const handleSendMessage = async ({ text, attachment }) => {
    if (!text && !attachment) return;

    // Formatear hora actual (HH:MM AM/PM)
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Mensaje del usuario
    const newUserMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      timestamp: timeString,
      content: text + (attachment ? `\n\n*[Archivo adjunto: ${attachment.name} (${attachment.size})]*` : '')
    };

    let activeId = currentChatId;

    // Si estábamos en Estado Vacío (Nuevo Chat), creamos una nueva conversación en el estado
    if (!activeId) {
      const newChatId = `chat-${Date.now()}`;
      const newChatObj = {
        id: newChatId,
        title: text.length > 40 ? text.slice(0, 38) + '...' : text || 'Nueva Consulta Técnica',
        category: 'Incidente',
        period: 'Hoy',
        createdAt: timeString,
        updatedAt: timeString,
        status: 'in_progress',
        summary: text,
        messages: [newUserMessage]
      };

      setChats((prev) => [newChatObj, ...prev]);
      setCurrentChatId(newChatId);
      activeId = newChatId;
    } else {
      // Agregar mensaje a la conversación existente
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, newUserMessage], updatedAt: timeString }
            : c
        )
      );
    }

    // Limpiar input prellenado
    setPrefilledInput('');

    // Iniciar animación de "Pensando..." de la IA
    setIsGenerating(true);

    try {
      // Llamar a la función que interactúa con la API de Python
      const aiResponse = await sendQueryToPythonAPI(
        currentChat ? currentChat.messages : [],
        { text, attachment }
      );

      // Crear mensaje de respuesta del asistente
      const newAssistantMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: aiResponse.content,
        statusBadge: aiResponse.statusBadge,
        statusType: aiResponse.statusType || 'info',
        codeBlocks: aiResponse.codeBlocks,
        contentContinuation: aiResponse.contentContinuation,
        suggestedActions: aiResponse.suggestedActions
      };

      setChats((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, newAssistantMessage] }
            : c
        )
      );
    } catch (err) {
      console.error('Error generando respuesta:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Manejo de Autenticación
   */
  const handleLoginSuccess = (authenticatedUser) => {
    setCurrentUser(authenticatedUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      
      {/* 1. Barra Lateral Izquierda (Colapsable) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        chats={chats}
        activeChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Área Central (Header + Mensajes + Input de Chat) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Vista Central (Estado Vacío vs Conversación Activa) */}
        <ChatArea
          currentChat={currentChat}
          currentUser={currentUser}
          isGenerating={isGenerating}
          onSelectShortcut={handleSelectShortcut}
          onResetChat={handleResetChat}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Barra de Entrada Flotante Inferior */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
          initialValue={prefilledInput}
        />
      </main>

      {/* 3. Modal de Inicio de Sesión y Registro */}
      <AuthModal
        isOpen={isAuthModalOpen || !currentUser}
        onClose={() => {
          if (currentUser) {
            setIsAuthModalOpen(false);
          }
        }}
        onLoginSuccess={handleLoginSuccess}
        currentUser={currentUser}
      />

    </div>
  );
}
