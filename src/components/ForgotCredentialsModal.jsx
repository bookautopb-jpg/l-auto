import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import {
  getUsers,
  updateUserPassword,
  verifyMasterPin
} from '../utils/auth';
import { useBodyScrollLock } from '../utils/scrollLock';

export default function ForgotCredentialsModal({ isOpen, onClose, onSuccessReset }) {
  useBodyScrollLock(isOpen);

  // Recovery State (PIN Master Only)
  const [masterPinInput, setMasterPinInput] = useState('');
  const [showMasterPin, setShowMasterPin] = useState(false);
  const [isMasterVerified, setIsMasterVerified] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const allUsersList = getUsers();

  const handleVerifyMasterPin = (e) => {
    e?.preventDefault();
    setStatusMsg({ type: '', text: '' });

    const pin = masterPinInput.trim();
    if (!pin) {
      setStatusMsg({ type: 'error', text: 'Inserisci il PIN Master di Sicurezza.' });
      return;
    }

    if (verifyMasterPin(pin)) {
      setIsMasterVerified(true);
      if (allUsersList.length > 0) {
        // Pre-select Super Admin (shirantha) or the first user
        const superAdmin = allUsersList.find(u => u.role === 'super_admin');
        setSelectedUser(superAdmin || allUsersList[0]);
      }
      setStatusMsg({
        type: 'success',
        text: 'PIN Master confermato! Seleziona l\'account e inserisci la nuova password.'
      });
    } else {
      setStatusMsg({
        type: 'error',
        text: 'PIN Master errato. Inserisci il codice di sicurezza configurato.'
      });
    }
  };

  const handleSaveNewPassword = (e) => {
    e?.preventDefault();
    setStatusMsg({ type: '', text: '' });

    if (!selectedUser) {
      setStatusMsg({ type: 'error', text: 'Seleziona un account utente da reimpostare.' });
      return;
    }

    const cleanPass = newPassword.trim();
    if (!cleanPass) {
      setStatusMsg({ type: 'error', text: 'Inserisci la nuova password.' });
      return;
    }

    if (cleanPass.length < 4) {
      setStatusMsg({ type: 'error', text: 'La password deve contenere almeno 4 caratteri.' });
      return;
    }

    if (cleanPass !== confirmPassword.trim()) {
      setStatusMsg({ type: 'error', text: 'Le due password inserite non coincidono.' });
      return;
    }

    setIsSaving(true);
    const res = updateUserPassword(selectedUser.id, cleanPass);
    setIsSaving(false);

    if (res.success) {
      setStatusMsg({
        type: 'success',
        text: `✅ Password per @${selectedUser.username} reimpostata con successo!`
      });
      if (onSuccessReset) {
        onSuccessReset(selectedUser.username);
      }
      setTimeout(() => {
        onClose();
      }, 1600);
    } else {
      setStatusMsg({ type: 'error', text: res.reason || 'Errore durante l\'aggiornamento della password.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto overscroll-contain animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-amber-500/10 text-slate-100 overflow-hidden">
        
        {/* Glow ambient background effects */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-wide text-amber-400">
                Recupero Credenziali
              </h3>
              <p className="text-xs text-slate-400">
                Sblocco immediato con PIN Master di Sicurezza
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isMasterVerified ? (
          /* STEP 1: VERIFY PIN MASTER */
          <form onSubmit={handleVerifyMasterPin} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/95 leading-relaxed">
              Inserisci il tuo <strong>PIN Master di Sicurezza</strong> per autorizzare subito la reimpostazione della password di qualsiasi account, <strong>all'istante e senza attendere email</strong>.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                PIN Master di Sicurezza
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input
                  type={showMasterPin ? 'text' : 'password'}
                  value={masterPinInput}
                  onChange={(e) => setMasterPinInput(e.target.value)}
                  placeholder="Digita il PIN Master..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono tracking-wider"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowMasterPin(!showMasterPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 cursor-pointer p-0.5"
                  title={showMasterPin ? 'Nascondi PIN' : 'Mostra PIN'}
                >
                  {showMasterPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {statusMsg.text && (
              <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 animate-fade-in ${
                statusMsg.type === 'error'
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              }`}>
                {statusMsg.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verifica PIN Master</span>
            </button>
          </form>
        ) : (
          /* STEP 2: SELECT USER & SET NEW PASSWORD */
          <form onSubmit={handleSaveNewPassword} className="space-y-4 animate-fade-in">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
              <span className="font-semibold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
                PIN Master Verificato con Successo
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsMasterVerified(false);
                  setMasterPinInput('');
                  setStatusMsg({ type: '', text: '' });
                }}
                className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Blocca di nuovo
              </button>
            </div>

            {/* Account Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Seleziona l'Account da Reimpostare
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {allUsersList.map(u => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-white">{u.name}</span>
                        <span className="font-mono text-[11px] text-slate-400">(@{u.username})</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                        {u.role === 'super_admin' ? 'Super Admin' : u.role === 'admin' ? 'Admin' : u.role === 'editor' ? 'Editor' : 'Cliente'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Password Fields */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nuova Password per @{selectedUser?.username || 'utente'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Inserisci la nuova password..."
                  className="w-full pl-10 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 cursor-pointer p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Conferma Nuova Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ripeti la password per conferma..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  required
                />
              </div>
            </div>

            {statusMsg.text && (
              <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 animate-fade-in ${
                statusMsg.type === 'error'
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              }`}>
                {statusMsg.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salva Nuova Password Immediatamente</span>
            </button>
          </form>
        )}

        {/* Footer Note */}
        <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center leading-relaxed">
          <span>🔒 </span>
          <strong>PIN Master:</strong> Il Super Admin può visualizzare o cambiare il PIN in qualunque momento dal pannello <em>"Gestione Utenti"</em>.
        </div>

      </div>
    </div>
  );
}
