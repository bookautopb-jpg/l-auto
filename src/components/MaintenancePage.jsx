import React, { useState } from 'react';
import { Wrench, Shield, Lock, ArrowRight, UserCheck, KeyRound, Sparkles } from 'lucide-react';
import AdminLoginPage from './AdminLoginPage';

export default function MaintenancePage({ 
  message, 
  onLoginSuccess,
  onLogout,
  currentUser 
}) {
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // If the admin clicks to login, show the AdminLoginPage
  if (showAdminLogin) {
    return (
      <div className="relative min-h-screen">
        <AdminLoginPage
          onLoginSuccess={(user) => {
            setShowAdminLogin(false);
            if (onLoginSuccess) onLoginSuccess(user);
          }}
          onClose={() => setShowAdminLogin(false)}
        />
        {/* Back to Maintenance Notice button */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <button
            type="button"
            onClick={() => setShowAdminLogin(false)}
            className="px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 shadow-xl transition-all"
          >
            ← Torna all'avviso di manutenzione
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between pt-2 sm:pt-4 z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            PB
          </div>
          <span className="font-heading font-extrabold tracking-wider text-base sm:text-lg text-white">
            BOOK AUTO PB
          </span>
        </div>

        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-full flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Aggiornamento in corso</span>
        </span>
      </header>

      {/* Main Center Card */}
      <main className="w-full max-w-xl my-auto py-8 z-10">
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden text-center space-y-6">
          
          {/* Subtle Top Accent Strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

          {/* Animated Wrench Icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Wrench className="w-10 h-10 text-amber-400 animate-bounce" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-amber-500 text-slate-950 rounded-full shadow">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Titles */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black font-heading tracking-wide text-white">
              Sito in Manutenzione Temporanea
            </h1>
            <p className="text-xs sm:text-sm text-amber-300/90 font-medium">
              Stiamo aggiornando il book e le schede tecniche dei veicoli.
            </p>
          </div>

          {/* Description Box */}
          <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed text-left">
            <p>
              {message || 'Il catalogo è momentaneamente sospeso per operazioni di manutenzione, aggiornamento archivi e riallineamento dei dati. Il portale tornerà presto disponibile per la consultazione.'}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Book Auto PB — Collezione Privata</span>
              <span className="text-amber-400 font-bold">Riapertura a breve</span>
            </div>
          </div>

          {/* Admin Login Prompt */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdminLogin(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 font-bold text-xs rounded-xl border border-slate-700/80 hover:border-amber-500/40 shadow transition-all active:scale-95 group"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>Accesso Riservato Amministrazione</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {currentUser && (
            <div className="pt-1 text-[11px] text-slate-400">
              Accesso come: <strong className="text-slate-200">{currentUser.name || currentUser.username}</strong> ({currentUser.role})
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="ml-2 text-rose-400 hover:underline"
                >
                  Esci
                </button>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-2 text-xs text-slate-500 z-10">
        &copy; {new Date().getFullYear()} Book Auto PB &bull; Tutti i diritti riservati
      </footer>
    </div>
  );
}
