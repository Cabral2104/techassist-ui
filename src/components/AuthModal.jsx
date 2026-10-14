import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

/**
 * AuthModal.jsx
 * Modal para Autenticación de Técnicos (Login / Registro).
 * Preparado con estados locales listos para conectarse con endpoints Python tipo:
 * POST /api/auth/login o POST /api/auth/register
 */
export function AuthModal({ isOpen, onClose, onLoginSuccess, currentUser }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState(currentUser?.email || 'c.cabral@techassist.corp');
  const [password, setPassword] = useState('admin123');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sincronizar y precargar credenciales cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setEmail(currentUser?.email || 'c.cabral@techassist.corp');
      setPassword('admin123'); // Precarga amigable para la demostración
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validación básica de campos
    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }

    if (activeTab === 'register') {
      if (!name) {
        setErrorMsg('El nombre completo del técnico es requerido.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
    }

    setIsLoading(true);

    // Simulación de respuesta de backend API Python (ej. FastAPI / Flask)
    setTimeout(() => {
      setIsLoading(false);
      const authenticatedUser = {
        id: 'tech-042',
        name: activeTab === 'register' ? name : (currentUser?.name || 'Carlos Cabral'),
        email: email,
        role: 'Especialista de Soporte TI (N2)',
        department: 'Infraestructura & Operaciones',
        status: 'online',
        initials: (activeTab === 'register' ? name : (currentUser?.name || 'Carlos Cabral'))
          .split(' ')
          .map(n => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        tier: 'Nivel 2 - Redes & SysAdmin'
      };

      setSuccessMsg(activeTab === 'login' ? '¡Sesión iniciada correctamente!' : '¡Cuenta de técnico registrada!');

      setTimeout(() => {
        onLoginSuccess(authenticatedUser);
        onClose();
      }, 600);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      {/* Backdrop con click para cerrar solo si ya hay usuario autenticado */}
      <div
        className="fixed inset-0 cursor-default"
        onClick={() => {
          if (currentUser) onClose();
        }}
        aria-label="Cerrar modal"
      />

      {/* Contenedor del Modal con resplandor moderno */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden z-10 transition-all duration-300">

        {/* Barra superior con gradiente de acento */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-1.5">
                TechAssist AI <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono">L2 Auth</span>
              </h3>
              <p className="text-xs text-slate-400">Portal de Operaciones & Soporte TI</p>
            </div>
          </div>

          {/* Botón Cerrar (Solo si hay un usuario autenticado previamente) */}
          {currentUser && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Notificación si la sesión está cerrada */}
        {!currentUser && (
          <div className="mx-6 mb-2 p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-800/60 text-[11px] text-cyan-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>Sesión cerrada. Inicia sesión para acceder al centro de soporte.</span>
          </div>
        )}

        {/* Tabs de Alternancia: Iniciar Sesión vs Registro */}
        <div className="px-6 pt-1">
          <div className="flex p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'login'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'register'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Registrar Técnico
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Mensajes de feedback */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Campo Nombre (solo en registro) */}
          {activeTab === 'register' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Nombre y Apellidos
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej. Carlos Cabral"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Campo Correo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Correo Corporativo de TI
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="c.cabral@techassist.corp"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300">
                Contraseña
              </label>
              {activeTab === 'login' && (
                <button
                  type="button"
                  onClick={() => alert('Para restablecer la clave corporativa, contacta al administrador de Active Directory.')}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 underline"
                >
                  ¿Olvidaste tu clave?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Confirmar Contraseña (solo en registro) */}
          {activeTab === 'register' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Botón de Acción Principal */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 hover:from-cyan-300 hover:to-blue-300 active:scale-[0.99] disabled:opacity-60 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2 text-slate-900 font-semibold">
                <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                Conectando con Backend...
              </span>
            ) : (
              <>
                <span>{activeTab === 'login' ? 'Acceder al Centro de Soporte' : 'Registrar Credencial de Soporte'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer con información de cumplimiento / SSO corporativo */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Servicio IAM Activo
          </span>
          <span className="font-mono text-slate-500">v2.4.0-Enterprise</span>
        </div>

      </div>
    </div>
  );
}
