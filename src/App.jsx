import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { AuthModal } from './components/AuthModal';
import { INITIAL_CONVERSATIONS, MOCK_USER } from './data/mockData';

const API_BASE_URL = 'http://localhost:8000';

export default function App() {
  // 1. Estado de conversaciones y chat activo (IDs numéricos autoincrementales 1, 2, 3...)
  const [chats, setChats] = useState(INITIAL_CONVERSATIONS);
  const [currentChatId, setCurrentChatId] = useState(1);

  // 2. Estado de interfaz (Sidebar y Modal de Autenticación)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 3. Estado de sesión del técnico
  const [currentUser, setCurrentUser] = useState(MOCK_USER);

  // 4. Estado de generación / IA pensando
  const [isGenerating, setIsGenerating] = useState(false);

  // 5. Estado de texto prellenado para el input (al hacer clic en atajos)
  const [prefilledInput, setPrefilledInput] = useState('');

  // Cargar conversaciones activas (status = 1) desde PostgreSQL al iniciar
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/conversations`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setChats(data);
            setCurrentChatId(data[0].id);
          }
        }
      } catch (err) {
        console.warn('Backend aún no disponible, mostrando estado inicial local:', err.message);
      }
    };
    fetchConversations();
  }, []);

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
   * Eliminar una consulta del historial (Borrado Lógico status = 0 en PostgreSQL)
   */
  const handleDeleteChat = async (chatId) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }

    try {
      const emailParam = encodeURIComponent(currentUser?.email || 'c.cabral@techassist.corp');
      await fetch(`${API_BASE_URL}/api/conversations/${chatId}?user_email=${emailParam}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error aplicando borrado lógico en PostgreSQL:', err);
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
   * Función que envía la consulta al servicio Backend Python (FastAPI + PostgreSQL + Algoritmo Genético)
   */
  const sendQueryToPythonAPI = async (conversationId, userMessage) => {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        user_id: typeof currentUser?.id === 'number' ? currentUser.id : 1,
        user_email: currentUser?.email || 'c.cabral@techassist.corp',
        message: userMessage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status} al consultar el motor de IA.`);
    }

    return await response.json();
  };

  /**
   * Enviar mensaje (desde ChatInput)
   */
  const handleSendMessage = async ({ text, attachment }) => {
    if (!text && !attachment) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const optimisticUserMessage = {
      id: Date.now(),
      sender: 'user',
      timestamp: timeString,
      content: text + (attachment ? `\n\n*[Archivo adjunto: ${attachment.name} (${attachment.size})]*` : ''),
    };

    const existingConversationId = currentChatId;
    const tempChatId = -Date.now();

    if (!existingConversationId) {
      const newChatObj = {
        id: tempChatId,
        title: text.length > 40 ? text.slice(0, 38) + '...' : text || 'Nueva Consulta Técnica',
        category: 'Incidente',
        period: 'Hoy',
        createdAt: timeString,
        updatedAt: timeString,
        status: 'in_progress',
        summary: text,
        messages: [optimisticUserMessage],
      };

      setChats((prev) => [newChatObj, ...prev]);
      setCurrentChatId(tempChatId);
    } else {
      setChats((prev) =>
        prev.map((c) =>
          c.id === existingConversationId
            ? { ...c, messages: [...c.messages, optimisticUserMessage], updatedAt: timeString }
            : c
        )
      );
    }

    setPrefilledInput('');
    setIsGenerating(true);

    try {
      const apiData = await sendQueryToPythonAPI(existingConversationId, { text, attachment });
      const realConvId = apiData.conversation_id;
      const persistedUserMsg = apiData.user_message;
      const assistantMessage = apiData.assistant_message;

      if (!existingConversationId) {
        setChats((prev) =>
          prev.map((c) =>
            c.id === tempChatId
              ? {
                  ...c,
                  id: realConvId,
                  title: apiData.conversation_title || c.title,
                  category: apiData.category || c.category,
                  messages: [persistedUserMsg, assistantMessage],
                }
              : c
          )
        );
        setCurrentChatId(realConvId);
      } else {
        setChats((prev) =>
          prev.map((c) =>
            c.id === existingConversationId
              ? {
                  ...c,
                  category: apiData.category || c.category,
                  messages: [
                    ...c.messages.slice(0, -1),
                    persistedUserMsg,
                    assistantMessage,
                  ],
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Error conectando con el servicio Backend en puerto 8000:', err);
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
        <ChatArea
          currentChat={currentChat}
          currentUser={currentUser}
          isGenerating={isGenerating}
          onSelectShortcut={handleSelectShortcut}
          onResetChat={handleResetChat}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
        />

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
