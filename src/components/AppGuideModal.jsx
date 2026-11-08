import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Shield,
  ShieldCheck,
  User,
  Car,
  Calendar,
  Printer,
  FolderOpen,
  Search,
  Filter,
  Bell,
  CheckCircle,
  ArrowRight,
  Eye,
  Key,
  Sparkles,
  BookOpen,
  Clock,
  Heart,
  SlidersHorizontal,
  FileText,
  AlertTriangle,
  RotateCcw,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { useBodyScrollLock } from '../utils/scrollLock';

export default function AppGuideModal({ onClose }) {
  useBodyScrollLock(true);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '1. In Parole Semplici', icon: Sparkles },
    { id: 'roles', label: '2. Categorie & Admin', icon: ShieldCheck },
    { id: 'catalog', label: '3. Ricerca & Filtri', icon: Search },
    { id: 'carDetail', label: '4. Scheda Auto & Dati Esempio', icon: Car },
    { id: 'expirations', label: '5. Semaforo Scadenze', icon: Bell },
    { id: 'print', label: '6. Stampa & PDF di Lusso', icon: Printer },
    { id: 'documents', label: '7. Cartella Documenti', icon: FolderOpen },
    { id: 'cloud', label: '8. Cloud & Sicurezza', icon: RotateCcw }
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-slate-900/95 border border-amber-500/40 rounded-3xl shadow-2xl shadow-black/90 text-slate-100 overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-[#0b132b] rounded-[14px] flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold font-heading text-amber-300">
                  Guida Completa di Book Auto PB
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                  Manuale Ufficiale
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Tutte le funzioni dell'applicazione spiegate passo dopo passo, facili e chiare per chiunque.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-rose-500 rounded-xl transition-all border border-slate-700 hover:border-rose-400 active:scale-95"
            title="Chiudi Guida"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Chips */}
        <div className="flex items-center space-x-2 px-4 sm:px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto no-scrollbar shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content - Scrollable */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl">
                <h3 className="text-base sm:text-lg font-bold text-amber-300 flex items-center space-x-2">
                  <span>🚗 Che cos'è Book Auto PB? (Spiegato come a un bambino)</span>
                </h3>
                <p className="mt-2 text-slate-200 text-sm sm:text-base">
                  Immagina di avere una <strong>scatola magica per tutte le tue automobili</strong>. 
                  Invece di avere fogli di carta sparsi nei cassetti, libretti smarriti e foto nel telefono, 
                  <strong> Book Auto PB</strong> tiene tutto in ordine in un unico posto bellissimo:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60">
                    <span className="text-xl">📸</span>
                    <strong className="block text-slate-100 font-bold mt-1">Le Foto delle Auto</strong>
                    <span>Tutte le foto a colori in alta definizione, proprio come in un catalogo di lusso.</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60">
                    <span className="text-xl">📄</span>
                    <strong className="block text-slate-100 font-bold mt-1">Tutti i Documenti</strong>
                    <span>Libretto, Assicurazione, Ricevute del Bollo e Perizie salvati e pronti da vedere.</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60">
                    <span className="text-xl">⏰</span>
                    <strong className="block text-slate-100 font-bold mt-1">Niente Scadenze Dimenticate</strong>
                    <span>L'app controlla i calendari e ti avvisa col semaforo prima che scada l'assicurazione o il bollo.</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-amber-400 flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Cosa puoi fare tutti i giorni:</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                    <li>Cercare al volo un'auto scrivendo la marca, la targa o il modello.</li>
                    <li>Filtrare per <strong>Proprietario</strong> (es. vedere solo le auto di una persona o della società).</li>
                    <li>Controllare subito se ci sono bolli o revisioni che scadono questo mese.</li>
                    <li>Creare un <strong>foglio PDF ufficiale</strong> da stampare per mostrare la macchina a un amico o compratore.</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-amber-400 flex items-center space-x-2 text-sm">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>I comandi veloci:</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li>🟡 <strong>Click sul logo "BOOK AUTO PB" in alto</strong>: Ti riporta subito alla pagina iniziale azzerando tutte le ricerche e chiudendo qualsiasi finestra.</li>
                    <li>🏎️ <strong>Macchinetta nella schermata di login</strong>: Gira intorno alla scheda d'accesso e fa gli abbaglianti luminosi nelle curve!</li>
                    <li>📱 <strong>Funziona su tutto</strong>: Computer, iPhone, iPad, smartphone e tablet Android.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ROLES & ADMIN */}
          {activeTab === 'roles' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-amber-300 flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span>I Livelli di Accesso: Chi fa Cosa (Esempi con Nomi di Fantasia)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Nell'applicazione possono accedere persone diverse con compiti diversi. Ecco come funzionano le 3 categorie:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Role 1: Super Admin */}
                <div className="p-5 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center space-x-2">
                    <span className="p-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs">👑 SUPER ADMIN</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Amministratore Totale</h4>
                  <p className="text-xs text-amber-300 font-medium">
                    <em>Esempio di fantasia: "Mario — Titolare & Direttore"</em>
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>Crea nuovi account utenti e decide chi può entrare.</li>
                    <li>Modifica le email a cui mandare gli avvisi delle scadenze.</li>
                    <li>Può aggiungere, modificare ed eliminare qualsiasi auto.</li>
                    <li>Decide cosa i clienti possono o non possono vedere (permessi).</li>
                    <li>Scarica il backup di sicurezza dell'intero database.</li>
                  </ul>
                </div>

                {/* Role 2: Editor / Staff */}
                <div className="p-5 bg-slate-900 border border-slate-700 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="p-2 bg-slate-700 text-amber-300 font-bold rounded-xl text-xs">🔧 GESTORE / STAFF</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Gestore Parco Auto</h4>
                  <p className="text-xs text-slate-400 font-medium">
                    <em>Esempio di fantasia: "Luca — Capo Garage / Segreteria"</em>
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>Aggiunge nuove automobili acquistate.</li>
                    <li>Aggiorna i chilometri, il proprietario e le nuove foto.</li>
                    <li>Inserisce i nuovi documenti scansionati (es. nuovo bollo pagato).</li>
                    <li>Stampa i fogli e i report PDF delle auto.</li>
                    <li>Non può modificare gli utenti o le impostazioni di sistema.</li>
                  </ul>
                </div>

                {/* Role 3: Client / Visitor */}
                <div className="p-5 bg-slate-900 border border-slate-700 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="p-2 bg-blue-500/20 text-blue-300 font-bold rounded-xl text-xs">👁️ CLIENTE / OSPITE</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Visitatore del Catalogo</h4>
                  <p className="text-xs text-slate-400 font-medium">
                    <em>Esempio di fantasia: "Giulia — Cliente / Consulente"</em>
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>Sfoglia il catalogo delle vetture con foto e dettagli tecnici.</li>
                    <li>Cerca e filtra le auto per marca o per potenza.</li>
                    <li><strong>Protezione Privacy</strong>: L'Admin può nasconderle le scadenze riservate o i documenti privati con un solo interruttore!</li>
                  </ul>
                </div>
              </div>

              {/* Security note */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Massima Privacy</strong>: La password di ogni utente è protetta. Se dimentichi la password, puoi recuperarla tramite il pulsante <em>"Hai dimenticato la password?"</em> nella schermata d'ingresso.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: CATALOG & FILTERS */}
          {activeTab === 'catalog' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-base font-bold text-amber-300 flex items-center space-x-2">
                <Search className="w-5 h-5 text-amber-400" />
                <span>Come Cercare e Filtrare le Auto in 1 Secondo</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                  <span className="font-bold text-amber-400 text-sm block">🔍 1. Barra di Ricerca Universale</span>
                  <p>In alto al centro trovi la casella dove scrivere. Puoi scrivere qualsiasi cosa:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                    <li>La <strong>Marca</strong> (es. <em>Ferrari, Fiat, Porsche</em>)</li>
                    <li>Il <strong>Modello</strong> (es. <em>500, GT3, Testarossa</em>)</li>
                    <li>La <strong>Targa</strong> (es. <em>AB123CD</em>)</li>
                    <li>Il <strong>Telaio</strong> (es. <em>ZFF...</em>)</li>
                    <li>Il <strong>Proprietario</strong> (es. <em>Mario, Società, Aziendale</em>)</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                  <span className="font-bold text-amber-400 text-sm block">🏷️ 2. Barra Compatta dei Marchi</span>
                  <p>I bottoni con le marche ti mostrano subito quante auto possiedi per ciascun marchio:</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg">Tutti i Marchi (53)</span>
                    <span className="px-2.5 py-1 bg-slate-800 text-slate-200 font-semibold rounded-lg">FERRARI (11)</span>
                    <span className="px-2.5 py-1 bg-slate-800 text-slate-200 font-semibold rounded-lg">PORSCHE (8)</span>
                    <span className="px-2.5 py-1 bg-slate-800 text-slate-200 font-semibold rounded-lg">FIAT (1)</span>
                  </div>
                  <p className="text-slate-400 pt-1">Basta toccare un marchio per vedere all'istante solo le auto di quella marca!</p>
                </div>

                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                  <span className="font-bold text-amber-400 text-sm block">👤 3. Menu a Tendina "Proprietario"</span>
                  <p>Accanto a "Ordina per:", trovi il menu con l'icona utente per filtrare le auto per intestatario:</p>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-700 text-amber-300 font-semibold flex items-center justify-between">
                    <span>👤 Proprietario: Tutti i Proprietari</span>
                    <span>▼</span>
                  </div>
                  <p className="text-slate-400">Cliccando su una persona (es. <em>"Lorenzo (1)"</em>), vedi subito solo le auto intestate a quel proprietario!</p>
                </div>

                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                  <span className="font-bold text-amber-400 text-sm block">🔄 4. Ordinamento & Viste</span>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                    <li><strong>Ordine Predefinito</strong>: Mostra per prime le ultime macchine caricate.</li>
                    <li><strong>Marca (A-Z)</strong>: In ordine alfabetico.</li>
                    <li><strong>Potenza (CV)</strong>: Dalla più veloce e potente alla meno potente.</li>
                    <li><strong>Anno</strong>: Dalla più recente alla più storica d'epoca.</li>
                    <li><strong>Vista a Griglia o Elenco</strong>: Puoi scegliere se vedere le grandi schede con foto oppure una tabella compatta a righe.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CAR DETAIL & EXAMPLE DATA */}
          {activeTab === 'carDetail' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-amber-300 flex items-center space-x-2">
                  <Car className="w-5 h-5 text-amber-400" />
                  <span>Cosa contiene la Scheda di Ogni Auto (Dati di Esempio)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cliccando su qualsiasi automobile nella schermata principale si apre la sua scheda ricca di informazioni dettagliate:
                </p>
              </div>

              {/* Example Car Card Mockup */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-amber-500/40 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Esempio Scheda Vettura</span>
                    <h4 className="text-lg font-bold text-white font-heading">FERRARI — 488 Pista</h4>
                  </div>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold">
                    Anno 2020 • 720 CV
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">CILINDRATA</span>
                    <strong className="text-slate-200">3.902 cc V8 Twin-Turbo</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">POTENZA</span>
                    <strong className="text-amber-400">720 CV / 530 kW</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">ACCELERAZIONE 0-100</span>
                    <strong className="text-slate-200">2.85 secondi</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">VELOCITÀ MASSIMA</span>
                    <strong className="text-slate-200">340 km/h</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">TARGA</span>
                    <strong className="text-slate-200">ES 123 AB</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">NUMERO TELAIO</span>
                    <strong className="text-slate-200 font-mono text-[11px]">ZFF82HLA000123456</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">PROPRIETARIO</span>
                    <strong className="text-amber-300">Mario Rossi (Esempio)</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">GARAGE / UBICAZIONE</span>
                    <strong className="text-slate-200">Garage Milano — Box 04</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                    <strong className="text-amber-400 block font-bold">📂 Documenti Allegati all'Auto:</strong>
                    <p className="text-slate-400 text-[11px]">
                      Ogni auto può contenere scansioni PDF o foto del <strong>Libretto di Circolazione</strong>, 
                      della <strong>Polizza Assicurativa</strong>, della <strong>Ricevuta del Bollo</strong> e delle <strong>Fatture di manutenzione</strong>.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                    <strong className="text-amber-400 block font-bold">🛠️ Storico Tagliandi & Manutenzione:</strong>
                    <p className="text-slate-400 text-[11px]">
                      Puoi appuntare data dell'ultimo tagliando, chilometri effettuati, lavori eseguiti e quando fare il prossimo controllo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: EXPIRATIONS */}
          {activeTab === 'expirations' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-amber-300 flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  <span>Il Semaforo delle Scadenze Automatiche</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Non rischierai mai più multe o auto scoperte: il sistema controlla ogni giorno le 4 scadenze principali di tutte le macchine:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                  <span className="text-xl">📄</span>
                  <strong className="block text-slate-200 mt-1 font-bold">Bollo Auto</strong>
                  <span className="text-slate-400 text-[11px]">Tassa di possesso annuale</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                  <span className="text-xl">🛡️</span>
                  <strong className="block text-slate-200 mt-1 font-bold">Assicurazione</strong>
                  <span className="text-slate-400 text-[11px]">Polizza RCA & Incendio/Furto</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                  <span className="text-xl">🔍</span>
                  <strong className="block text-slate-200 mt-1 font-bold">Revisione Ministeriale</strong>
                  <span className="text-slate-400 text-[11px]">Controllo di legge ogni 2 anni</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                  <span className="text-xl">🔧</span>
                  <strong className="block text-slate-200 mt-1 font-bold">Tagliando & Manutenzione</strong>
                  <span className="text-slate-400 text-[11px]">Cambio olio e filtri</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-sm">Come funziona il colore del semaforo:</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center space-x-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
                    <div>
                      <strong className="text-emerald-300 font-bold">VERDE — Tutto in Regola:</strong>
                      <span className="text-slate-300 ml-1">Mancano più di 60 giorni alla scadenza. Puoi stare tranquillo.</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                    <div>
                      <strong className="text-amber-300 font-bold">GIALLO — In Arrivo:</strong>
                      <span className="text-slate-300 ml-1">Mancano meno di 60 giorni. È ora di prenotare il pagamento o l'officina.</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-2.5 bg-rose-500/15 border border-rose-500/40 rounded-xl">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <div>
                      <strong className="text-rose-300 font-bold">ROSSO LAMPEGGIANTE — Urgente o Scaduto:</strong>
                      <span className="text-slate-300 ml-1">Mancano meno di 15-30 giorni o la scadenza è già passata! Compare l'avviso in cima all'app.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PRINT & LUXURY PDF */}
          {activeTab === 'print' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-amber-300 flex items-center space-x-2">
                  <Printer className="w-5 h-5 text-amber-400" />
                  <span>Stampa Ufficiale & Creazione PDF di Lusso</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Vuoi mostrare la scheda di un'auto su carta o via WhatsApp a un cliente senza fargli vedere il nome del proprietario o note riservate?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2.5">
                  <strong className="text-amber-400 block text-sm font-bold">🎛️ I Tasti di Controllo della Stampa:</strong>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-400 font-bold">1.</span>
                      <span><strong>Con Foto / Senza Foto</strong>: Puoi scegliere se stampare la scheda completa con 2 grandi fotografie a colori o solo il riassunto tecnico.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-400 font-bold">2.</span>
                      <span><strong>Tasto "Proprietario"</strong>: Cliccandolo puoi scegliere se mostrare il nome dell'intestatario o <strong>nasconderlo completamente</strong> dal foglio di stampa per tutelare la privacy!</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-400 font-bold">3.</span>
                      <span><strong>Tasto "Note"</strong>: Puoi attivare o disattivare la stampa delle note interne riservate.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-400 font-bold">4.</span>
                      <span><strong>Caratteri di Lusso (Font)</strong>: Scegli tra font tipografici eleganti (es. <em>Playfair Display</em> stile catalogo di lusso o <em>Inter</em> moderno).</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2.5">
                  <strong className="text-amber-400 block text-sm font-bold">📑 Stampa Massiva Multipla:</strong>
                  <p className="text-slate-300">
                    Puoi stampare una sola macchina aprendo la sua scheda, oppure selezionare più auto (es. 10 auto) con il tasto <strong>"Seleziona Tutte"</strong> e premere il pulsante arancione <strong>"Stampa / PDF (10)"</strong>.
                  </p>
                  <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/30 text-amber-300">
                    Ogni automobile viene impaginata esattamente su <strong>1 singolo foglio A4</strong> con logo ufficiale in alta definizione, pronta per essere stampata o salvata in PDF con il tasto "Scarica".
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DOCUMENTS FOLDER */}
          {activeTab === 'documents' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-base font-bold text-amber-300 flex items-center space-x-2">
                <FolderOpen className="w-5 h-5 text-amber-400" />
                <span>La Cartella Documenti Globale</span>
              </h3>
              <p className="text-xs text-slate-300">
                In alto nella barra degli strumenti trovi il bottone con la cartellina e il numero di documenti totali (es. 📁 24).
              </p>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-white text-sm">Cosa puoi fare nella Cartella Documenti:</h4>
                <ul className="space-y-2 text-slate-300 list-disc list-inside">
                  <li>Visualizzare <strong>tutti i libretti e le assicurazioni di tutte le auto</strong> in una sola schermata senza dover aprire un'auto alla volta.</li>
                  <li>Filtrare con un click per tipologia: solo <em>Libretti</em>, solo <em>Polizze</em> o solo <em>Bolli</em>.</li>
                  <li>Cercare per targa o telaio per trovare istantaneamente il documento che ti serve.</li>
                  <li>Aprire il documento ad alta definizione per leggerlo, ingrandirlo o stamparlo.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 8: CLOUD & BACKUP */}
          {activeTab === 'cloud' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-base font-bold text-amber-300 flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <span>Cloud, Sincronizzazione & Backup di Sicurezza</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                  <strong className="text-amber-400 block text-sm font-bold">☁️ Sincronizzazione Cloud in Tempo Reale</strong>
                  <p className="text-slate-300">
                    Ogni volta che aggiungi un'auto, carichi una foto o modifichi una scadenza dal tuo computer, le modifiche si salvano su <strong>Supabase Cloud</strong>.
                  </p>
                  <p className="text-slate-400">
                    Quando apri l'app dal telefono o da un altro computer, trovi subito tutto già aggiornato automaticamente!
                  </p>
                </div>

                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                  <strong className="text-amber-400 block text-sm font-bold">💾 Backup Sicuro su File JSON</strong>
                  <p className="text-slate-300">
                    Nel menu Admin trovi il pulsante <strong>"Backup Database"</strong>. 
                    Con 1 solo click scarichi sul tuo computer un file con l'intera storia di tutte le auto e impostazioni.
                  </p>
                  <p className="text-slate-400">
                    In caso di necessità puoi usare il tasto <strong>"Ripristina Backup"</strong> per ricaricare tutto in 5 secondi.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between flex-wrap gap-2">
                <span>© {new Date().getFullYear()} Book Auto PB — Gestione & Collezione Vetture</span>
                <span className="text-amber-400 font-semibold">Tutti i sistemi sincronizzati e protetti</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer Modal Action */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Premi <strong>ESC</strong> o clicca fuori per chiudere la guida in qualsiasi momento.
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 ml-auto"
          >
            Ho Capito, Chiudi Guida
          </button>
        </div>

      </div>
    </div>
  );
}
