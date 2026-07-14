/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  syncUserProfile
} from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userProfile: any) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const profile = await syncUserProfile(userCredential.user);
        onAuthSuccess(profile);
        onClose();
      } else {
        // Sign Up
        if (!nombre.trim()) {
          throw new Error("Por favor, ingresa tu nombre completo.");
        }
        if (password.length < 6) {
          throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const profile = await syncUserProfile(userCredential.user, nombre.trim());
        onAuthSuccess(profile);
        onClose();
      }
    } catch (err: any) {
      console.error("Authentication action failed:", err);
      let localizedError = "Ha ocurrido un error en la autenticación.";
      
      if (err.code === 'auth/invalid-email' || err.message?.includes('invalid-email')) {
        localizedError = "El correo electrónico no es válido.";
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        localizedError = "Correo electrónico o contraseña incorrectos.";
      } else if (err.code === 'auth/email-already-in-use') {
        localizedError = "Este correo electrónico ya está registrado.";
      } else if (err.code === 'auth/weak-password') {
        localizedError = "La contraseña es demasiado débil (mínimo 6 caracteres).";
      } else if (err.message) {
        localizedError = err.message;
      }
      
      setError(localizedError);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setEmail('');
    setPassword('');
    setNombre('');
  };

  return (
    <div 
      id="auth-modal-overlay" 
      className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div 
        id="auth-modal-card" 
        className="bg-white rounded-[24px] max-w-md w-full p-8 relative shadow-2xl border border-slate-100 flex flex-col gap-6"
      >
        {/* Close Button */}
        <button
          id="btn-close-auth-modal"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Branding Header */}
        <div className="text-center space-y-2">
          <span className="font-sans font-black text-2xl tracking-tighter text-[#1A1A1A] select-none block">
            SLATE.
          </span>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </p>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex bg-[#F2F2F5] p-1 rounded-xl">
          <button
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
              isLogin 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Ingresar
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
              !isLogin 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        {/* Input Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Nombre Completo</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="ej. Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Correo Electrónico</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-300"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Contraseña</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-slate-900 hover:bg-red-600 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs tracking-wider transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <span>{isLogin ? 'ENTRAR' : 'CREAR CUENTA'}</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={toggleMode}
            className="text-[11px] font-bold text-slate-500 hover:text-red-500 hover:underline underline-offset-4 cursor-pointer"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
