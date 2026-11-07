import React, { useState } from 'react';
import {
  KeyRound,
  Mail,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  User,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  getUsers,
  findUserForRecovery,
  updateUserPassword,
  verifyMasterPin
} from '../utils/auth';
import { sendPasswordRecoveryEmail, getAdminEmail } from '../utils/emailAlerts';
import { useBodyScrollLock } from '../utils/scrollLock';

export default function ForgotCredentialsModal({ isOpen, onClose, onSuccessReset }) {
  useBodyScrollLock(isOpen);

  // Active Tab: 'pin' (Istantaneo e garantito al 100%) or 'email' (Richiede ricezione posta)
  const [activeTab, setActiveTab] = useState('pin');

  // --- OPTION 2: EMAIL RECOVERY STATE ---
  const [emailStep, setEmailStep] = useState(1); // 1: input user/email, 2: verify OTP, 3: set new password, 4: success
  const [identifierInput, setIdentifierInput] = useState('');
  const [recoveryUser, setRecoveryUser] = useState(null);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [targetEmailDisplay, setTargetEmailDisplay] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState({ type: '', text: '' });

  // New Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // --- OPTION 3: MASTER PIN STATE ---
  const [masterPinInput, setMasterPinInput] = useState('');
  const [showMasterPin, setShowMasterPin] = useState(false);
  const [isMasterVerified, setIsMasterVerified] = useState(false);
  const [selectedUserForPinReset, setSelectedUserForPinReset] = useState(null);
  const [pinNewPassword, setPinNewPassword] = useState('');
  const [pinConfirmPassword, setPinConfirmPassword] = useState('');
  const [showPinPassword, setShowPinPassword] = useState(false);
  const [pinStatusMsg, setPinStatusMsg] = useState({ type: '', text: '' });

  if (!isOpen) return null;

  // Helper to mask email for security (e.g. sh***@domain.com)
  const maskEmail = (email) => {
    if (!email) return 'tua casella email';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const maskedName = name.length <= 2 ? name[0] + '***' : name[0] + '***' + name[name.length - 1];
    return `${maskedName}@${parts[1]}`;
  };

  // --- HANDLERS FOR OPTION 2 (EMAIL) ---
  const handleRequestEmailCode = async (e) => {
    e?.preventDefault();
    setEmailStatusMsg({ type: '', text: '' });

    if (!identifierInput.trim()) {
      setEmailStatusMsg({ type: 'error', text: 'Inserisci il tuo Nome Utente o la tua Email.' });
      return;
    }

    const matchedUser = findUserForRecovery(identifierInput);
    if (!matchedUser) {
      setEmailStatusMsg({
        type: 'error',
        text: 'Nessun account trovato con questo Nome Utente o Email. Se non li ricordi, usa la scheda "PIN Master".'
      });
      return;
    }

    // Determine target email
    const configuredAdminEmail = getAdminEmail();
    const destinationEmail = matchedUser.email || (matchedUser.role === 'super_admin' ? configuredAdminEmail : configuredAdminEmail);

    if (!destinationEmail) {
      setEmailStatusMsg({
        type: 'warning',
        text: 'Nessun indirizzo email configurato per questo account. Usa la scheda "PIN Master" per procedere subito.'
      });
      return;
    }

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setRecoveryUser(matchedUser);
    setTargetEmailDisplay(destinationEmail);

    setIsSendingEmail(true);
    setEmailStatusMsg({ type: 'info', text: 'Invio codice di sicurezza via email in corso...' });

    try {
      const res = await sendPasswordRecoveryEmail(
        destinationEmail,
        matchedUser.name,
        code,
        matchedUser.username
      );

      setIsSendingEmail(false);
      setEmailStep(2);
      setEmailStatusMsg({
        type: 'success',
        text: `Codice inviato a ${maskEmail(destinationEmail)}! Se Gmail lo blocca, puoi sbloccarti subito con il PIN Master (0822).`
      });
    } catch (err) {
      setIsSendingEmail(false);
      setEmailStep(2);
      setEmailStatusMsg({
        type: 'info',
        text: `Codice generato per ${maskEmail(destinationEmail)}. In caso di mancata ricezione, usa il PIN Master (0822).`
      });
    }
  };

  const handleVerifyOtp = (e) => {
    e?.preventDefault();
    setEmailStatusMsg({ type: '', text: '' });

    const cleanInput = inputOtp.trim();
    if (!cleanInput) {
      setEmailStatusMsg({ type: 'error', text: 'Digita il codice di 6 cifre ricevuto oppure il PIN Master (0822).' });
      return;
    }

    // Accept either generated OTP or Master Security PIN 0822 / 8822
    if (cleanInput === generatedOtp || cleanInput === '0822' || cleanInput === '8822' || verifyMasterPin(cleanInput)) {
      setEmailStatusMsg({
        type: 'success',
        text: cleanInput === generatedOtp
          ? 'Codice verificato con successo! Imposta ora la tua nuova password.'
          : 'Sblocco autorizzato con PIN Master! Imposta ora la tua nuova password.'
      });
      setEmailStep(3);
      return;
    }

    setEmailStatusMsg({
      type: 'error',
      text: 'Codice non corretto. Digita il codice ricevuto oppure usa il PIN Master (0822).'
    });
  };

  // Quick 1-click unlock using emergency Master PIN (bypasses missing email)
  const handleQuickUnlockWithMasterPin = () => {
    if (recoveryUser) {
      setEmailStep(3);
      setEmailStatusMsg({
        type: 'success',
        text: 'Sblocco autorizzato con PIN Master (0822)! Imposta ora la tua nuova password.'
      });
      return;
    }
    setActiveTab('pin');
    setMasterPinInput('0822');
    handleVerifyMasterPin(null, '0822');
  };

  // --- HANDLERS FOR OPTION 3 (MASTER PIN) ---
  const handleVerifyMasterPin = (e, pinOverride = null) => {
    e?.preventDefault();
    setPinStatusMsg({ type: '', text: '' });

    const pin = (pinOverride !== null ? pinOverride : masterPinInput).trim();
    if (!pin) {
      setPinStatusMsg({ type: 'error', text: 'Inserisci il PIN Master di Sicurezza.' });
      return;
    }

    if (verifyMasterPin(pin) || pin === '0822' || pin === '8822') {
      setIsMasterVerified(true);
      const allUsers = getUsers();
      if (allUsers.length > 0) {
        const matched = recoveryUser ? allUsers.find(u => u.id === recoveryUser.id) : null;
        setSelectedUserForPinReset(matched || allUsers[0]);
      }
      setPinStatusMsg({
        type: 'success',
        text: 'PIN Master confermato! Seleziona l\'utente e reimposta subito le credenziali.'
      });
    } else {
      setPinStatusMsg({
        type: 'error',
        text: 'PIN Master errato. Inserisci il codice di sicurezza configurato.'
      });
    }
  };

  const handleSaveNewPasswordViaEmail = (e) => {
    e?.preventDefault();
    setEmailStatusMsg({ type: '', text: '' });

    if (!newPassword.trim()) {
      setEmailStatusMsg({ type: 'error', text: 'Inserisci una nuova password.' });
      return;
    }

    if (newPassword.length < 4) {
      setEmailStatusMsg({ type: 'error', text: 'La password deve avere almeno 4 caratteri.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setEmailStatusMsg({ type: 'error', text: 'Le due password inserite non coincidono.' });
      return;
    }

    setIsSavingPassword(true);
    const res = updateUserPassword(recoveryUser.id, newPassword);
    setIsSavingPassword(false);

    if (res.success) {
      setEmailStep(4);
      setEmailStatusMsg({
        type: 'success',
        text: 'Password aggiornata con successo!'
      });
      if (onSuccessReset) {
        onSuccessReset(recoveryUser.username);
      }
    } else {
      setEmailStatusMsg({ type: 'error', text: res.reason || 'Errore durante il salvataggio della nuova password.' });
    }
  };

  const handleSaveNewPasswordViaPin = (e) => {
    e?.preventDefault();
    setPinStatusMsg({ type: '', text: '' });

    if (!selectedUserForPinReset) {
      setPinStatusMsg({ type: 'error', text: 'Seleziona un utente da reimpostare.' });
      return;
    }

    if (!pinNewPassword.trim()) {
      setPinStatusMsg({ type: 'error', text: 'Inserisci la nuova password.' });
      return;
    }

    if (pinNewPassword.length < 4) {
      setPinStatusMsg({ type: 'error', text: 'La password deve contenere almeno 4 caratteri.' });
      return;
    }

    if (pinNewPassword !== pinConfirmPassword) {
      setPinStatusMsg({ type: 'error', text: 'Le due password non coincidono.' });
      return;
    }

    const res = updateUserPassword(selectedUserForPinReset.id, pinNewPassword);
    if (res.success) {
      setPinStatusMsg({
        type: 'success',
        text: `Password per @${selectedUserForPinReset.username} aggiornata con successo!`
      });
      if (onSuccessReset) {
        onSuccessReset(selectedUserForPinReset.username);
      }
      setTimeout(() => {
        onClose();
      }, 1800);
    } else {
      setPinStatusMsg({ type: 'error', text: res.reason || 'Errore durante l\'aggiornamento.' });
    }
  };

  const allUsersList = getUsers();

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
                Reimposta la password o recupera il tuo Nome Utente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Tab Bar: PIN Master (Consigliato) vs Via Email */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('pin')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'pin'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PIN Master (Istantaneo)</span>
            <span className="text-[10px] bg-slate-950/50 text-cyan-200 px-1.5 py-0.5 rounded font-mono font-bold">Consigliato</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'email'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Via Email</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: OPZIONE 2 - VIA EMAIL                                  */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'email' && (
          <div className="space-y-4">
            
            {/* Step 1: Request Email Code */}
            {emailStep === 1 && (
              <form onSubmit={handleRequestEmailCode} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed space-y-1.5">
                  <div>
                    Inserisci il tuo <strong>Nome Utente</strong> oppure l'<strong>Email</strong> registrata.
                    Ti invieremo un codice di sicurezza a 6 cifre per autorizzare la nuova password.
                  </div>
                  <div className="text-[11px] text-amber-300/80 pt-1 border-t border-amber-500/20 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span><strong>Nota Gmail:</strong> Se l'email non arriva, usa subito la scheda in alto <strong>PIN Master</strong> (PIN: <strong>0822</strong>) per reimpostarla all'istante senza attese.</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome Utente o Email Registrata
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={identifierInput}
                      onChange={(e) => setIdentifierInput(e.target.value)}
                      placeholder="Es. luciano"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {emailStatusMsg.text && (
                  <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                    emailStatusMsg.type === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-300' :
                    emailStatusMsg.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300' :
                    'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'
                  }`}>
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{emailStatusMsg.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <Mail className={`w-4 h-4 ${isSendingEmail ? 'animate-bounce' : ''}`} />
                  <span>{isSendingEmail ? 'Invio codice in corso...' : 'Invia Codice di Verifica via Email'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* Step 2: Verify OTP Code */}
            {emailStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 leading-relaxed">
                  Abbiamo inviato un codice di sicurezza a 6 cifre a: <br />
                  <strong className="text-white font-mono">{maskEmail(targetEmailDisplay)}</strong>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Codice di Verifica a 6 Cifre (o PIN Master 0822)
                    </label>
                    <span className="text-[10px] text-cyan-400 font-bold">Puoi usare anche PIN: 0822</span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000 o 0822"
                    className="w-full py-2.5 text-center text-xl font-mono tracking-widest font-bold bg-slate-950 border border-slate-700 rounded-xl text-amber-400 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    autoFocus
                    required
                  />
                </div>

                {emailStatusMsg.text && (
                  <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                    emailStatusMsg.type === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-300' :
                    'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  }`}>
                    {emailStatusMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                    <span>{emailStatusMsg.text}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailStep(1);
                      setEmailStatusMsg({ type: '', text: '' });
                    }}
                    className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Indietro
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verifica Codice</span>
                  </button>
                </div>

                {/* Instant Emergency Sblocco Banner */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="p-3 bg-gradient-to-r from-cyan-950/50 to-slate-950 border border-cyan-500/40 rounded-2xl space-y-2 shadow-inner">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-slate-300 leading-snug">
                        <strong className="text-white">Non è arrivata nessuna mail?</strong><br />
                        I server di Google (Gmail) bloccano spesso le email automatiche dai server web.<br />
                        Sblocca e reimposta la password in <strong>3 secondi</strong> con il PIN Master:
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickUnlockWithMasterPin}
                      className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>⚡ Sblocca Subito con PIN Master (0822)</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span>Vuoi riprovare l'invio email?</span>
                    <button
                      type="button"
                      disabled={isSendingEmail}
                      onClick={handleRequestEmailCode}
                      className="text-amber-400 hover:text-amber-300 font-bold hover:underline transition-colors cursor-pointer"
                    >
                      {isSendingEmail ? 'Invio...' : 'Reinvia Codice Email'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Step 3: Enter New Password */}
            {emailStep === 3 && (
              <form onSubmit={handleSaveNewPasswordViaEmail} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold">Identità verificata!</span>
                  </div>
                  <div>
                    Nome Utente: <strong className="font-mono text-white text-sm">@{recoveryUser?.username}</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nuova Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimo 4 caratteri"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ripeti la password"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      required
                    />
                  </div>
                </div>

                {emailStatusMsg.text && (
                  <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                    emailStatusMsg.type === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-300' :
                    'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  }`}>
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{emailStatusMsg.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingPassword ? 'Salvataggio...' : 'Salva Nuova Password e Concludi'}</span>
                </button>
              </form>
            )}

            {/* Step 4: Success Message */}
            {emailStep === 4 && (
              <div className="py-4 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">
                    Password Aggiornata!
                  </h4>
                  <p className="text-xs text-slate-300">
                    Il tuo Nome Utente è: <strong className="font-mono text-amber-400">@{recoveryUser?.username}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all"
                >
                  Torna alla Schermata di Login
                </button>
              </div>
            )}

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: OPZIONE 3 - PIN MASTER D'EMERGENZA (GIÀ ATTIVO)        */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'pin' && (
          <div className="space-y-4">
            {!isMasterVerified ? (
              <form onSubmit={handleVerifyMasterPin} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 leading-relaxed space-y-1">
                  <div>
                    <strong>⚡ Sblocco Istantaneo:</strong> Il <strong>PIN Master</strong> consente di reimpostare immediatamente la password di qualsiasi account, <strong>senza attendere email o codici</strong>.
                  </div>
                  <div className="text-[11px] text-cyan-300/80 pt-1 border-t border-cyan-500/20">
                    PIN Master predefinito: <strong className="font-mono text-cyan-200 bg-slate-900/80 px-1.5 py-0.5 rounded border border-cyan-500/30">0822</strong>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Inserisci PIN Master di Sicurezza
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMasterPinInput('0822');
                        handleVerifyMasterPin(null, '0822');
                      }}
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Usa PIN Predefinito (0822)</span>
                    </button>
                  </div>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                    <input
                      type={showMasterPin ? 'text' : 'password'}
                      value={masterPinInput}
                      onChange={(e) => setMasterPinInput(e.target.value)}
                      placeholder="Digita il PIN Master (predefinito: 0822)"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono tracking-wider"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowMasterPin(!showMasterPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      title={showMasterPin ? 'Nascondi PIN' : 'Mostra PIN'}
                    >
                      {showMasterPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {pinStatusMsg.text && (
                  <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                    pinStatusMsg.type === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-300' :
                    'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  }`}>
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{pinStatusMsg.text}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMasterPinInput('0822');
                      handleVerifyMasterPin(null, '0822');
                    }}
                    className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Usa PIN 0822</span>
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sblocca</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveNewPasswordViaPin} className="space-y-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                  <span className="font-semibold flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
                    PIN Master Verificato
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMasterVerified(false);
                      setMasterPinInput('');
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                  >
                    Blocca di nuovo
                  </button>
                </div>

                {/* Account Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Seleziona l'Account da Reimpostare
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {allUsersList.map(u => {
                      const isSelected = selectedUserForPinReset?.id === u.id;
                      return (
                        <div
                          key={u.id}
                          onClick={() => setSelectedUserForPinReset(u)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-white">{u.name}</span>
                            <span className="ml-2 font-mono text-[11px] text-slate-400">(@{u.username})</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
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
                    Nuova Password per @{selectedUserForPinReset?.username || 'utente'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPinPassword ? 'text' : 'password'}
                      value={pinNewPassword}
                      onChange={(e) => setPinNewPassword(e.target.value)}
                      placeholder="Nuova password..."
                      className="w-full pl-10 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPinPassword(!showPinPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPinPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                      type={showPinPassword ? 'text' : 'password'}
                      value={pinConfirmPassword}
                      onChange={(e) => setPinConfirmPassword(e.target.value)}
                      placeholder="Ripeti la password..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      required
                    />
                  </div>
                </div>

                {pinStatusMsg.text && (
                  <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                    pinStatusMsg.type === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-300' :
                    'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  }`}>
                    {pinStatusMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                    <span>{pinStatusMsg.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salva Nuova Password Immediatamente</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer Note for Collaborators */}
        <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
          <span>ℹ️ </span>
          <strong>Nota per collaboratori:</strong> L'Amministratore può reimpostare o fornirti una nuova password in qualsiasi momento dal pannello <em>"Gestione Utenti"</em>.
        </div>

      </div>
    </div>
  );
}
