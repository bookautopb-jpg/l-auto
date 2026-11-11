import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar';
import StatsBar from './components/StatsBar';
import CarCard from './components/CarCard';
import CarListView from './components/CarListView';
import CarDetailModal from './components/CarDetailModal';
import AddEditCarModal from './components/AddEditCarModal';
import BackupModal from './components/BackupModal';
import PdfPrintReportModal from './components/PdfPrintReportModal';
import BrandLogosModal from './components/BrandLogosModal';
import ExpirationsModal from './components/ExpirationsModal';
import AdminModal from './components/AdminModal';
import AdminLoginPage from './components/AdminLoginPage';
import AutoEmailNotificationPopup from './components/AutoEmailNotificationPopup';
import CartellaDocumentiModal from './components/CartellaDocumentiModal';
import AppGuideModal from './components/AppGuideModal';
import { SlidersHorizontal, ArrowUpDown, Plus, RotateCcw, Car as CarIcon, Sparkles, CheckSquare, Printer, Square, Trash2, Bell, User } from 'lucide-react';
import { getLogoForBrand, getCustomBrandLogos, DEFAULT_BRAND_LOGOS, isValidBrandLogo, getCanonicalBrandName, normalizeBrandName } from './utils/brandLogos';
import { getVehicleExpirations } from './utils/notifications';
import { 
  getCurrentUser, 
  setCurrentUser as setCurrentUserInStorage, 
  logoutUser, 
  syncUsersWithCloud, 
  syncBackgroundsWithCloud,
  getActiveBackground,
  setActiveBackground
} from './utils/auth';
import { syncLocationsWithCloud } from './utils/locations';
import { getOwners, syncOwnersWithCloud } from './utils/owners';
import { checkAndTriggerAutomaticEmailAlerts, syncEmailConfigWithCloud } from './utils/emailAlerts';
import { 
  fetchCarsFromSupabase, 
  syncCarsToSupabase, 
  upsertSingleCarToSupabase, 
  fetchPermissionsFromSupabase, 
  syncPermissionsToSupabase,
  subscribeToCarsRealtime,
  broadcastCarChange
} from './utils/supabase';
import { saveCarsToLocal, getCarsFromLocal } from './utils/storage';
import { getClientPermissions, saveClientPermissions, isStaffUser, canViewExpirations } from './utils/permissions';
import { markCarAsPermanentlyDeleted, markCarsAsPermanentlyDeleted, filterOutDeletedCars, syncDeletedCarsWithCloud } from './utils/deletedCars';
import { useBodyScrollLock } from './utils/scrollLock';

const LOCAL_STORAGE_KEY = 'book_auto_pb_cars_v1';

export default function App() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Auth & User State
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [clientPermissions, setClientPermissions] = useState(() => getClientPermissions());

  // Real-time synchronization toast feedback
  const [realtimeToast, setRealtimeToast] = useState(null);
  const realtimeToastTimeoutRef = useRef(null);

  const showRealtimeToast = (msg) => {
    if (realtimeToastTimeoutRef.current) {
      clearTimeout(realtimeToastTimeoutRef.current);
    }
    setRealtimeToast(msg);
    realtimeToastTimeoutRef.current = setTimeout(() => {
      setRealtimeToast(null);
    }, 3500);
  };

  const handleLoginSuccess = (user, rememberMe = false) => {
    hasShownEmailAlertRef.current = false;
    try {
      sessionStorage.removeItem('book_auto_pb_email_popup_dismissed');
    } catch (e) {}
    setCurrentUserInStorage(user, rememberMe);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('book_auto_pb_email_popup_dismissed');
    } catch (e) {}
    hasShownEmailAlertRef.current = false;
    logoutUser();
    setCurrentUser(null);
  };
  
  // Selection State
  const [selectedCarIds, setSelectedCarIds] = useState([]);
  
  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Tutti');
  const [selectedLocation, setSelectedLocation] = useState('Tutti');
  const [selectedOwner, setSelectedOwner] = useState('Tutti');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState('page'); // 'page' | 'brand' | 'hp_desc' | 'year_desc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Visual Effects, Theme & Expiration Alert Bar Toggles (saved in localStorage)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('book_auto_pb_theme_v1');
    return saved || 'military';
  });

  useEffect(() => {
    localStorage.setItem('book_auto_pb_theme_v1', theme);
    if (theme === 'military') {
      document.body.classList.add('theme-military');
    } else {
      document.body.classList.remove('theme-military');
    }
  }, [theme]);

  const [showSideGlow, setShowSideGlow] = useState(() => {
    const saved = localStorage.getItem('book_auto_pb_side_glow');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [showExpirationBar, setShowExpirationBar] = useState(() => {
    const saved = localStorage.getItem('book_auto_pb_expiration_bar');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Active Background Wallpaper state
  const [activeBackground, setActiveBackgroundState] = useState(() => {
    return getActiveBackground();
  });

  const handleSelectActiveBackground = (bgUrl) => {
    setActiveBackgroundState(bgUrl);
    setActiveBackground(bgUrl);
    if (bgUrl && bgUrl.includes('military_camo')) {
      setTheme('military');
    }
  };

  // Active Modals
  const [selectedCar, setSelectedCar] = useState(null);
  const [carToEdit, setCarToEdit] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isPdfReportModalOpen, setIsPdfReportModalOpen] = useState(false);
  const [isBrandLogosModalOpen, setIsBrandLogosModalOpen] = useState(false);
  const [isExpirationsModalOpen, setIsExpirationsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isCartellaDocumentiOpen, setIsCartellaDocumentiOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [autoEmailPopupAlerts, setAutoEmailPopupAlerts] = useState(null);
  const hasShownEmailAlertRef = useRef(false);

  // Freeze/lock background page scroll whenever ANY popup or modal is open
  const isAnyModalOpen = Boolean(
    selectedCar ||
    isAddModalOpen ||
    isBackupModalOpen ||
    isPdfReportModalOpen ||
    isBrandLogosModalOpen ||
    isExpirationsModalOpen ||
    isAdminModalOpen ||
    isCartellaDocumentiOpen ||
    isGuideModalOpen
  );
  useBodyScrollLock(isAnyModalOpen);

  // Automatic Email Expiration Check on Load / Login (Staff Only: Super Admin & Editor)
  useEffect(() => {
    if (!loading && cars && cars.length > 0 && isStaffUser(currentUser)) {
      // 1. ALWAYS execute background email milestone check
      const result = checkAndTriggerAutomaticEmailAlerts(cars);

      // 2. Only show the on-screen visual popup if not previously dismissed in this browser session
      const isDismissed = sessionStorage.getItem('book_auto_pb_email_popup_dismissed') === 'true';
      if (!isDismissed && !hasShownEmailAlertRef.current) {
        if (result && (result.autoTriggered || (result.alerts && result.alerts.length > 0))) {
          hasShownEmailAlertRef.current = true;
          setAutoEmailPopupAlerts(result.alerts);
        }
      }
    }
  }, [cars, loading, currentUser]);

  // Periodic background check every 30 minutes while app is running
  useEffect(() => {
    if (loading || !cars || cars.length === 0 || !isStaffUser(currentUser)) return;
    const interval = setInterval(() => {
      checkAndTriggerAutomaticEmailAlerts(cars);
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cars, loading, currentUser]);

  const handleCloseEmailPopup = () => {
    try {
      sessionStorage.setItem('book_auto_pb_email_popup_dismissed', 'true');
    } catch (e) {}
    hasShownEmailAlertRef.current = true;
    setAutoEmailPopupAlerts(null);
  };

  // Helper to normalize image paths for multi-environment hosting
  const formatCarImages = (carList) => {
    if (!Array.isArray(carList)) return carList;
    const fixPath = (p) => {
      if (!p || typeof p !== 'string') return p;
      if (p.startsWith('/images/')) return '.' + p;
      return p;
    };

    return carList.map(car => ({
      ...car,
      mainPhoto: fixPath(car.mainPhoto),
      logoImg: fixPath(car.logoImg),
      pageImage: fixPath(car.pageImage),
      images: Array.isArray(car.images) ? car.images.map(fixPath) : [],
      carPhotos: Array.isArray(car.carPhotos) ? car.carPhotos.map(fixPath) : []
    }));
  };

  // Load Initial Data with Real-Time Cloud Sync (Supabase + LocalStorage + baseline cars.json)
  useEffect(() => {
    async function loadInitialCars() {
      // 0. Sync deleted cars, email config, users, locations, owners and backgrounds with Supabase Cloud
      await Promise.allSettled([
        syncDeletedCarsWithCloud(),
        syncEmailConfigWithCloud(),
        syncUsersWithCloud(),
        syncLocationsWithCloud(),
        syncOwnersWithCloud(),
        syncBackgroundsWithCloud()
      ]);

      // 1. Check if this device has local edits / expirations (IndexedDB + safe localStorage)
      const savedLocalCars = await getCarsFromLocal();
      let localCars = null;
      if (Array.isArray(savedLocalCars) && savedLocalCars.length > 0) {
        localCars = formatCarImages(filterOutDeletedCars(savedLocalCars));
      }

      // If local storage has cars, show them immediately so there's zero UI latency
      if (localCars && localCars.length > 0) {
        setCars(localCars);
        setLoading(false);
      }

      // Fetch latest client permissions from Supabase Cloud
      fetchPermissionsFromSupabase().then(remotePerms => {
        if (remotePerms) {
          saveClientPermissions(remotePerms);
          setClientPermissions(remotePerms);
        }
      }).catch(err => console.warn('Permissions initial fetch:', err));

      // 2. Fetch latest shared cars from Supabase Cloud (The central dynamic database)
      const supabaseCars = await fetchCarsFromSupabase();
      if (supabaseCars && supabaseCars.length > 0) {
        const activeSupabase = formatCarImages(filterOutDeletedCars(supabaseCars));

        // Preserve heavy cached document binary data (fileData/dataUrl) if present on this device
        const finalCars = activeSupabase.map(sc => {
          if (!localCars) return sc;
          const lc = localCars.find(l => String(l.id) === String(sc.id));
          if (!lc) return sc;

          const lcDocs = Array.isArray(lc.documents) ? lc.documents : [];
          const scDocs = Array.isArray(sc.documents) ? sc.documents : [];
          const docsWithCachedData = scDocs.map(d => {
            const ld = lcDocs.find(x => x && x.id === d.id);
            if (ld && !d.fileData && !d.dataUrl && (ld.fileData || ld.dataUrl)) {
              return { ...d, fileData: ld.fileData || ld.dataUrl, dataUrl: ld.dataUrl || ld.fileData };
            }
            return d;
          });

          return {
            ...sc,
            documents: docsWithCachedData
          };
        });

        // Supabase Cloud is authoritative: respect all empty fields, additions, deletions!
        setCars(finalCars);
        saveCarsToLocal(finalCars);
        setLoading(false);
        return;
      }

      // If Supabase is offline or empty, use localCars directly
      if (localCars && localCars.length > 0) {
        setCars(localCars);
        setLoading(false);
        return;
      }

      // 3. Fallback to cars.json ONLY if both Supabase and LocalStorage are completely empty (fresh install)
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/cars.json?t=${Date.now()}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) {
            const initialSeed = formatCarImages(filterOutDeletedCars(json));
            setCars(initialSeed);
            saveCarsToLocal(initialSeed);
            syncCarsToSupabase(initialSeed);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Error loading initial seed cars.json:', err);
      }

      setLoading(false);
    }

    loadInitialCars();
  }, []);

  // Real-time synchronization via Supabase Realtime (WebSocket + Instant Broadcasts + Heartbeat)
  useEffect(() => {
    // 1. Subscribe to Live Realtime Channel (Instant updates in milliseconds!)
    const unsubscribe = subscribeToCarsRealtime((event) => {
      const { type, eventType, car, carId } = event;
      
      // Handle system permissions or config update
      if (type === 'SYSTEM' && event.id === '__app_permissions__') {
        fetchPermissionsFromSupabase().then(p => {
          if (p) {
            setClientPermissions(p);
            saveClientPermissions(p);
          }
        }).catch(() => {});
        return;
      }

      // Handle system users update in real-time across all devices
      if ((type === 'SYSTEM' && event.id === '__app_users__') || type === 'USER_BROADCAST') {
        syncUsersWithCloud().then(() => {
          showRealtimeToast('👥 Utenti sincronizzati in tempo reale');
        }).catch(() => {});
        return;
      }

      // Handle car deletion in real-time
      if (eventType === 'DELETE') {
        const targetId = carId || car?.id;
        if (!targetId) return;
        setCars(prev => {
          const updated = prev.filter(c => String(c.id) !== String(targetId));
          saveCarsToLocal(updated);
          return updated;
        });
        setSelectedCar(prev => (prev && String(prev.id) === String(targetId) ? null : prev));
        showRealtimeToast('Una vettura è stata eliminata in tempo reale');
        return;
      }

      // Handle car insert or update in real-time
      if (car && (eventType === 'INSERT' || eventType === 'UPDATE' || type === 'BROADCAST')) {
        setCars(prev => {
          const idx = prev.findIndex(c => String(c.id) === String(car.id));
          let updated;
          if (idx >= 0) {
            updated = [...prev];
            const current = prev[idx];
            const currentDocs = Array.isArray(current.documents) ? current.documents : [];
            const carDocs = Array.isArray(car.documents) ? car.documents : [];
            const docsWithCachedData = carDocs.map(d => {
              const ld = currentDocs.find(x => x && x.id === d.id);
              if (ld && !d.fileData && !d.dataUrl && (ld.fileData || ld.dataUrl)) {
                return { ...d, fileData: ld.fileData || ld.dataUrl, dataUrl: ld.dataUrl || ld.fileData };
              }
              return d;
            });

            updated[idx] = {
              ...car,
              documents: docsWithCachedData
            };
          } else {
            updated = [car, ...prev];
          }
          saveCarsToLocal(updated);
          return updated;
        });

        setSelectedCar(prev => {
          if (prev && String(prev.id) === String(car.id)) {
            return { ...prev, ...car };
          }
          return prev;
        });

        const carName = `${car.brand || ''} ${car.model || ''}`.trim() || 'Vettura';
        showRealtimeToast(`⚡ Dati sincronizzati in tempo reale: ${carName}`);
      }
    });

    // 2. Instant sync when browser tab gains focus or user unlocks screen
    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        fetchCarsFromSupabase(4000).then(remoteCars => {
          if (remoteCars && remoteCars.length > 0) {
            const activeCars = filterOutDeletedCars(remoteCars);
            const formatted = formatCarImages(activeCars);
            setCars(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(formatted)) {
                saveCarsToLocal(formatted);
                return formatted;
              }
              return prev;
            });
          }
        }).catch(() => {});

        fetchPermissionsFromSupabase(3000).then(freshPerms => {
          if (freshPerms) {
            setClientPermissions(freshPerms);
            saveClientPermissions(freshPerms);
          }
        }).catch(() => {});
      }
    };

    window.addEventListener('focus', handleVisibilitySync);
    document.addEventListener('visibilitychange', handleVisibilitySync);

    // 3. Resilient background heartbeat (every 8s) to keep state in perfect sync across all devices
    const interval = setInterval(async () => {
      const freshSupabase = await fetchCarsFromSupabase(5000);
      if (freshSupabase && freshSupabase.length > 0) {
        const activeSupabase = filterOutDeletedCars(freshSupabase);
        const formatted = formatCarImages(activeSupabase);
        setCars(prev => {
          const mergedWithDocs = formatted.map(sc => {
            const prevCar = (prev || []).find(p => String(p.id) === String(sc.id));
            if (!prevCar) return sc;

            const prevDocs = Array.isArray(prevCar.documents) ? prevCar.documents : [];
            const scDocs = Array.isArray(sc.documents) ? sc.documents : [];
            const docsWithCachedData = scDocs.map(d => {
              const ld = prevDocs.find(x => x && x.id === d.id);
              if (ld && !d.fileData && !d.dataUrl && (ld.fileData || ld.dataUrl)) {
                return { ...d, fileData: ld.fileData || ld.dataUrl, dataUrl: ld.dataUrl || ld.fileData };
              }
              return d;
            });

            return {
              ...sc,
              documents: docsWithCachedData
            };
          });

          if (JSON.stringify(prev) !== JSON.stringify(mergedWithDocs)) {
            saveCarsToLocal(mergedWithDocs);
            return mergedWithDocs;
          }
          return prev;
        });
      }

      fetchPermissionsFromSupabase(4000).then(freshPerms => {
        if (freshPerms) {
          setClientPermissions(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(freshPerms)) {
              saveClientPermissions(freshPerms);
              return freshPerms;
            }
            return prev;
          });
        }
      }).catch(() => {});
    }, 8000);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('focus', handleVisibilitySync);
      document.removeEventListener('visibilitychange', handleVisibilitySync);
      clearInterval(interval);
    };
  }, []);

  // Manual Cloud Data Refresh Handler with Centralized Dynamic Sync (Zero Data Loss)
  const handleRefreshCloudData = async () => {
    setIsSyncing(true);
    try {
      // 1. First sync any deleted cars with cloud
      await syncDeletedCarsWithCloud();

      // 2. Push current local cars (with all local photos/docs) to Supabase Cloud FIRST!
      if (cars && cars.length > 0) {
        await syncCarsToSupabase(cars);
      }

      // 3. Fetch latest dynamic data from Supabase Cloud
      const freshSupabase = await fetchCarsFromSupabase();
      let remoteCars = [];
      if (freshSupabase && freshSupabase.length > 0) {
        remoteCars = filterOutDeletedCars(freshSupabase);
      } else {
        const res = await fetch(`${import.meta.env.BASE_URL}data/cars.json?t=${Date.now()}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) {
            remoteCars = filterOutDeletedCars(json);
          }
        }
      }

      // 4. Update with latest Cloud data, preserving local cached PDF binary data without resurrecting deleted items
      const finalCars = remoteCars.map(rc => {
        const localCar = (cars || []).find(c => String(c.id) === String(rc.id));
        if (!localCar) return rc;

        const localDocs = Array.isArray(localCar.documents) ? localCar.documents : [];
        const rcDocs = Array.isArray(rc.documents) ? rc.documents : [];
        const docsWithCachedData = rcDocs.map(d => {
          const ld = localDocs.find(x => x && x.id === d.id);
          if (ld && !d.fileData && !d.dataUrl && (ld.fileData || ld.dataUrl)) {
            return { ...d, fileData: ld.fileData || ld.dataUrl, dataUrl: ld.dataUrl || ld.fileData };
          }
          return d;
        });

        return {
          ...rc,
          documents: docsWithCachedData
        };
      });

      const formatted = formatCarImages(finalCars);
      setCars(formatted);
      saveCarsToLocal(formatted);

      // 5. In local mode, flush merged state to public/data/cars.json
      if (typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '0.0.0.0'
      )) {
        fetch('/api/sync-cars-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cars: formatted })
        }).catch(e => console.warn('Sync cars.json in local mode:', e));
      }

      // 6. Push final dataset back to Supabase to keep Cloud 100% updated
      await syncCarsToSupabase(formatted);

      // 7. Refresh permissions and users
      await syncUsersWithCloud();
      const freshPerms = await fetchPermissionsFromSupabase();
      if (freshPerms) {
        saveClientPermissions(freshPerms);
        setClientPermissions(freshPerms);
      }

      alert('Sincronizzazione Cloud completata con successo! Tutte le modifiche sono sincronizzate in tempo reale.');
    } catch (err) {
      console.error('Manual refresh error:', err);
      alert('Avviso di sincronizzazione: ' + (err.message || 'Verifica la connessione internet.'));
    } finally {
      setIsSyncing(false);
    }
  };

  // Save to state, local storage (IndexedDB + safe localStorage), and sync to Supabase Cloud
  const saveCarsState = (newCars) => {
    setCars(newCars);
    saveCarsToLocal(newCars);
    syncCarsToSupabase(newCars);

    // In local development / test mode, immediately flush changes to public/data/cars.json on disk!
    if (typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0'
    )) {
      fetch('/api/sync-cars-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cars: newCars })
      }).catch(e => console.warn('Sync cars.json in local mode:', e));
    }
  };

  // Selection Toggle Handlers
  const handleToggleSelect = (carId) => {
    setSelectedCarIds(prev => 
      prev.includes(carId) ? prev.filter(id => id !== carId) : [...prev, carId]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredCars.map(c => c.id);
    const areAllSelected = allFilteredIds.every(id => selectedCarIds.includes(id));
    if (areAllSelected) {
      setSelectedCarIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedCarIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleDeselectAll = () => {
    setSelectedCarIds([]);
  };

  // Return to Home / Initial Main View (Reset search, filters, close modals, and scroll to top)
  const handleGoHome = () => {
    setSearchQuery('');
    setSelectedBrand('Tutti');
    setSelectedLocation('Tutti');
    setSelectedOwner('Tutti');
    setOnlyFavorites(false);
    setSortBy('page');
    setSelectedCar(null);
    setCarToEdit(null);
    setIsAddModalOpen(false);
    setIsBackupModalOpen(false);
    setIsPdfReportModalOpen(false);
    setIsBrandLogosModalOpen(false);
    setIsExpirationsModalOpen(false);
    setIsAdminModalOpen(false);
    setIsCartellaDocumentiOpen(false);
    setIsGuideModalOpen(false);
    setAutoEmailPopupAlerts(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Selected Cars list
  const selectedCarsList = useMemo(() => {
    return cars.filter(c => selectedCarIds.includes(c.id));
  }, [cars, selectedCarIds]);

  // Toggle Favorite
  const handleToggleFavorite = (carId) => {
    const updated = cars.map(c => 
      c.id === carId ? { ...c, isFavorite: !c.isFavorite } : c
    );
    saveCarsState(updated);
    if (selectedCar && selectedCar.id === carId) {
      setSelectedCar(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
    }
  };

  // Save New or Modified Car
  const handleSaveCar = async (carData) => {
    // Ensure newly created cars sort to the top
    if (!carToEdit) {
      carData.page = 0; // page 0 sorts before page 2
    }
    
    let finalCar = { ...carData };

    // If on localhost, save car & photos into DOCUMENTI SCANSIONATI/<carFolder>/immagini/ and update cars.json on disk
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      try {
        const res = await fetch('/api/save-car', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ car: carData })
        });
        if (res.ok) {
          const result = await res.json();
          if (result && result.car) {
            finalCar = result.car;
          }
        }
      } catch (err) {
        console.warn('Could not save car to local disk:', err);
      }
    }
    
    const existingIndex = cars.findIndex(c => String(c.id) === String(finalCar.id));
    let updated = [];
    if (existingIndex >= 0) {
      updated = [...cars];
      updated[existingIndex] = finalCar;
    } else {
      updated = [finalCar, ...cars];
    }
    
    saveCarsState(updated);
    upsertSingleCarToSupabase(finalCar);
    broadcastCarChange(carToEdit ? 'UPDATE' : 'INSERT', finalCar);
    
    // Clear filters so user immediately sees the newly added car
    setSelectedBrand('Tutti');
    setSelectedLocation('Tutti');
    setSelectedOwner('Tutti');
    setSearchQuery('');
    setOnlyFavorites(false);
    
    setIsAddModalOpen(false);
    setCarToEdit(null);
  };

  // Quick update and save of car expirations (Bollo, Assicurazione, Revisione, Tagliando)
  const handleUpdateCarExpirations = async (carId, expirationFields) => {
    const existingIndex = cars.findIndex(c => String(c.id) === String(carId));
    if (existingIndex < 0) return;

    const currentCar = cars[existingIndex];
    const updatedCar = {
      ...currentCar,
      ...expirationFields
    };

    const updatedCars = [...cars];
    updatedCars[existingIndex] = updatedCar;

    saveCarsState(updatedCars);
    upsertSingleCarToSupabase(updatedCar);
    broadcastCarChange('UPDATE', updatedCar);

    if (typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0'
    )) {
      try {
        await fetch('/api/save-car', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ car: updatedCar })
        });
      } catch (err) {
        console.warn('Could not save car to local disk:', err);
      }
    }
  };

  // Delete Single Car Permanently across Local & Supabase Cloud
  const handleDeleteCar = async (carId) => {
    const targetCar = cars.find(c => String(c.id) === String(carId));
    const carFolder = targetCar ? `${targetCar.brand} ${targetCar.model}`.trim() : null;

    // 1. Mark permanently deleted (local storage tombstone + delete from Supabase row + sync tombstone)
    await markCarAsPermanentlyDeleted(carId);
    broadcastCarChange('DELETE', null, carId);

    // If in localhost, delete from public/data/cars.json on disk too AND delete entire folder (docs + immagini)!
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      fetch('/api/delete-car', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId, carFolder })
      }).catch(err => console.warn('Could not delete car and folder from disk:', err));
    }

    // 2. Filter state & local storage
    const updated = cars.filter(c => String(c.id) !== String(carId));
    setCars(updated);
    saveCarsToLocal(updated);
    setSelectedCarIds(prev => prev.filter(id => String(id) !== String(carId)));
    if (selectedCar && String(selectedCar.id) === String(carId)) {
      setSelectedCar(null);
    }
  };

  // Update Car Photos order & deletion
  const handleUpdateCarImages = (carId, newImages, deletedImage = null) => {
    const targetCar = cars.find(c => String(c.id) === String(carId));
    const carFolder = targetCar ? `${targetCar.brand} ${targetCar.model}`.trim() : '';

    const updated = cars.map(c => {
      if (String(c.id) === String(carId)) {
        return {
          ...c,
          images: newImages,
          carPhotos: newImages,
          mainPhoto: newImages.length > 0 ? newImages[0] : c.mainPhoto,
          pageImage: newImages.length > 0 ? newImages[0] : c.pageImage
        };
      }
      return c;
    });
    saveCarsState(updated);
    const updatedCar = updated.find(c => String(c.id) === String(carId));
    if (updatedCar) {
      upsertSingleCarToSupabase(updatedCar);
      broadcastCarChange('UPDATE', updatedCar);
    }
    if (selectedCar && String(selectedCar.id) === String(carId)) {
      setSelectedCar(prev => ({
        ...prev,
        images: newImages,
        carPhotos: newImages,
        mainPhoto: newImages.length > 0 ? newImages[0] : prev.mainPhoto,
        pageImage: newImages.length > 0 ? newImages[0] : prev.pageImage
      }));
    }

    // If an image was deleted and we're on localhost, delete it from disk and cars.json
    if (deletedImage && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      fetch('/api/delete-car-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId,
          carFolder,
          imagePath: deletedImage
        })
      }).catch(err => console.warn('Could not delete car image on disk:', err));
    }
  };

  // Open PDF Print Report Modal for a specific car
  const handleOpenPrintPdfForCar = (car) => {
    setSelectedCarIds([car.id]);
    setIsPdfReportModalOpen(true);
  };

  // Sync updated brand logos across all cars
  const handleLogosUpdated = () => {
    const updated = cars.map(car => ({
      ...car,
      logoImg: getLogoForBrand(car.brand) || (isValidBrandLogo(car.logoImg) ? car.logoImg : '')
    }));
    saveCarsState(updated);
    if (selectedCar) {
      setSelectedCar(prev => prev ? ({
        ...prev,
        logoImg: getLogoForBrand(prev.brand) || (isValidBrandLogo(prev.logoImg) ? prev.logoImg : '')
      }) : null);
    }
  };

  // Bulk Delete Selected Cars Permanently across Local & Supabase Cloud
  const handleDeleteSelectedCars = async () => {
    if (selectedCarIds.length === 0) return;
    if (window.confirm(`Sei sicuro di voler eliminare DEFINITIVAMENTE le ${selectedCarIds.length} schede selezionate?`)) {
      const idsToDelete = [...selectedCarIds];
      setSelectedCarIds([]);

      // 1. Mark permanently deleted across local storage & Supabase Cloud
      await markCarsAsPermanentlyDeleted(idsToDelete);

      // 2. Filter state & local storage
      const updated = cars.filter(c => !idsToDelete.map(String).includes(String(c.id)));
      setCars(updated);
      saveCarsToLocal(updated);
      if (selectedCar && idsToDelete.map(String).includes(String(selectedCar.id))) {
        setSelectedCar(null);
      }

      // 3. Delete physical folders from disk if on localhost
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        idsToDelete.forEach(id => {
          const targetCar = cars.find(c => String(c.id) === String(id));
          const carFolder = targetCar ? `${targetCar.brand} ${targetCar.model}`.trim() : null;
          fetch('/api/delete-car', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carId: id, carFolder })
          }).catch(err => console.warn('Could not delete car and folder from disk:', err));
        });
      }
    }
  };

  // Reset to original PDF dataset (preserving permanently deleted vehicles)
  const handleResetData = () => {
    fetch(`${import.meta.env.BASE_URL}data/cars.json?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        const active = filterOutDeletedCars(data);
        setCars(active);
        saveCarsToLocal(active);
        setSelectedBrand('Tutti');
        setSelectedLocation('Tutti');
        setSelectedOwner('Tutti');
        setSearchQuery('');
        setOnlyFavorites(false);
        setSelectedCarIds([]);
      });
  };

  // Extract list of all unique brands present in cars, case-insensitively deduplicated & sorted
  const brands = useMemo(() => {
    const brandMap = new Map();
    cars.forEach(c => {
      if (!c.brand || !c.brand.trim()) return;
      const canonical = getCanonicalBrandName(c.brand);
      const normKey = normalizeBrandName(canonical);
      if (normKey && !brandMap.has(normKey)) {
        brandMap.set(normKey, canonical);
      }
    });
    return Array.from(brandMap.values()).sort((a, b) => a.localeCompare(b));
  }, [cars]);

  // Extract list of all unique locations present in cars
  const locations = useMemo(() => {
    const map = new Map();
    cars.forEach(c => {
      const loc = (c.location || c.ubicazione || '').trim().replace(/\s+/g, ' ');
      if (loc && !map.has(loc.toLowerCase())) {
        map.set(loc.toLowerCase(), loc);
      }
    });
    return Array.from(map.values()).sort();
  }, [cars]);

  // Extract list of all unique owners present in cars or configured in system
  const owners = useMemo(() => {
    return getOwners(cars);
  }, [cars]);

  // Filter & Sort Logic
  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      // Search query filter (Brand, Model, Chassis, Year, Location, Targa, Proprietario)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchBrand = (car.brand || '').toLowerCase().includes(q);
        const matchModel = (car.model || '').toLowerCase().includes(q);
        const matchChassis = (car.chassis || '').toLowerCase().includes(q);
        const matchYear = (car.immatricolazione || '').toLowerCase().includes(q);
        const matchLocation = (car.location || car.ubicazione || '').toLowerCase().includes(q);
        const matchPlate = (car.targa || '').toLowerCase().includes(q);
        const matchOwner = (car.proprietario || car.owner || '').toLowerCase().includes(q);
        if (!matchBrand && !matchModel && !matchChassis && !matchYear && !matchLocation && !matchPlate && !matchOwner) {
          return false;
        }
      }

      // Brand filter with canonical / normalized matching
      if (selectedBrand !== 'Tutti') {
        const carNorm = normalizeBrandName(car.brand);
        const selNorm = normalizeBrandName(selectedBrand);
        if (carNorm !== selNorm) {
          return false;
        }
      }

      // Location filter
      if (selectedLocation !== 'Tutti') {
        const carLoc = (car.location || car.ubicazione || '').trim().replace(/\s+/g, ' ').toLowerCase();
        const selLoc = selectedLocation.trim().replace(/\s+/g, ' ').toLowerCase();
        if (carLoc !== selLoc) {
          return false;
        }
      }

      // Owner filter
      if (selectedOwner !== 'Tutti') {
        const carOwner = (car.proprietario || car.owner || '').trim().replace(/\s+/g, ' ').toLowerCase();
        const selOwner = selectedOwner.trim().replace(/\s+/g, ' ').toLowerCase();
        if (carOwner !== selOwner) {
          return false;
        }
      }

      // Favorite filter
      if (onlyFavorites && !car.isFavorite) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'brand') {
        return a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model);
      }
      if (sortBy === 'hp_desc') {
        const getHp = c => parseInt((c.horsepower || '').match(/\d+/)?.[0] || '0', 10);
        return getHp(b) - getHp(a);
      }
      if (sortBy === 'year_desc') {
        const getYear = c => parseInt((c.immatricolazione || '').match(/\d{4}/)?.[0] || '0', 10);
        return getYear(b) - getYear(a);
      }
      // Default: sort newly added cars (page 0 or non-number) FIRST
      const getPage = c => (typeof c.page === 'number' ? c.page : 0);
      return getPage(a) - getPage(b);
    });
  }, [cars, searchQuery, selectedBrand, selectedLocation, selectedOwner, onlyFavorites, sortBy]);

  const favoritesCount = useMemo(() => cars.filter(c => c.isFavorite).length, [cars]);

  // Compute Expiration Alerts (Bollo, Assicurazione, Revisione, Tagliando)
  const expirationsAlerts = useMemo(() => getVehicleExpirations(cars), [cars]);
  const hasUrgentExpirations = useMemo(() => 
    expirationsAlerts.some(a => a.alertLevel === 'expired' || a.alertLevel === 'urgent'), 
    [expirationsAlerts]
  );

  // Total Saved Documents Count
  const totalDocumentsCount = useMemo(() => 
    cars.reduce((acc, c) => acc + (Array.isArray(c.documents) ? c.documents.length : 0), 0),
    [cars]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d1a] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-amber-400 font-heading font-bold text-lg tracking-wider">Caricamento Book Auto PB...</p>
      </div>
    );
  }

  // If user is not logged in, display the initial Admin Login Page with slideshow background
  if (!currentUser) {
    return (
      <AdminLoginPage 
        onLoginSuccess={handleLoginSuccess} 
        clientPermissions={clientPermissions} 
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col pb-16 relative transition-colors duration-500 ${theme === 'military' ? 'theme-military' : ''}`}>
      
      {/* Dynamic Active Custom Background Wallpaper */}
      {activeBackground && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-cover bg-center bg-no-repeat transition-all duration-700"
          style={{
            backgroundImage: activeBackground.includes('military_camo') 
              ? `linear-gradient(to bottom, rgba(12, 17, 10, 0.78), rgba(8, 12, 7, 0.88)), url(${activeBackground})`
              : `linear-gradient(to bottom, rgba(3, 7, 18, 0.82), rgba(3, 7, 18, 0.92)), url(${activeBackground})`,
            backgroundAttachment: 'fixed'
          }}
        />
      )}
      
      {/* Soft Ambient Side Glow Lights (Olive/Khaki for Military or Azure/Blue for Classic) */}
      {showSideGlow && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
          {/* Left Side Aura */}
          <div className={`absolute top-1/4 -left-36 w-96 h-[700px] rounded-full blur-3xl animate-side-aura ${
            theme === 'military' 
              ? 'bg-gradient-to-r from-emerald-600/25 via-lime-700/15 to-transparent'
              : 'bg-gradient-to-r from-cyan-500/25 via-blue-600/15 to-transparent'
          }`} />
          
          {/* Right Side Aura */}
          <div className={`absolute top-1/3 -right-36 w-96 h-[700px] rounded-full blur-3xl animate-side-aura ${
            theme === 'military'
              ? 'bg-gradient-to-l from-amber-700/25 via-yellow-900/15 to-transparent'
              : 'bg-gradient-to-l from-blue-600/25 via-indigo-600/15 to-transparent'
          }`} style={{ animationDelay: '2s' }} />
        </div>
      )}

      {/* Live Real-Time Cloud Sync Toast */}
      {realtimeToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center space-x-2.5 px-4 py-2 bg-slate-900/95 border border-emerald-500/50 text-emerald-300 rounded-full shadow-2xl backdrop-blur-md text-xs font-semibold animate-fade-in pointer-events-none transition-all">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{realtimeToast}</span>
        </div>
      )}

      {/* Header & Navbar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedBrand={selectedBrand}
        setSelectedBrand={setSelectedBrand}
        brands={brands}
        carsCount={cars.length}
        favoritesCount={favoritesCount}
        selectedCount={selectedCarIds.length}
        expirationsCount={expirationsAlerts.length}
        hasUrgentExpirations={hasUrgentExpirations}
        onOpenExpirationsModal={() => setIsExpirationsModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenAddModal={() => { setCarToEdit(null); setIsAddModalOpen(true); }}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onResetData={handleResetData}
        onOpenPdfReportModal={() => setIsPdfReportModalOpen(true)}
        onOpenBrandLogosModal={() => setIsBrandLogosModalOpen(true)}
        onlyFavorites={onlyFavorites}
        setOnlyFavorites={setOnlyFavorites}
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentUser={currentUser}
        clientPermissions={clientPermissions}
        onLogout={handleLogout}
        onRefreshCloudData={handleRefreshCloudData}
        isSyncing={isSyncing}
        onOpenCartellaDocumenti={() => setIsCartellaDocumentiOpen(true)}
        totalDocumentsCount={totalDocumentsCount}
        theme={theme}
        setTheme={setTheme}
        onGoHome={handleGoHome}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
      />

      {/* Top Expiration Notification Banner (Shown ONLY if allowed for clients, or always for staff) */}
      {canViewExpirations(currentUser, clientPermissions) && showExpirationBar && expirationsAlerts.length > 0 && (
        <div className="relative z-10 animate-alert-glow border-b border-amber-500/40 px-3 sm:px-4 py-1.5 text-xs text-amber-100 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Bell className={`w-3.5 h-3.5 shrink-0 ${hasUrgentExpirations ? 'text-rose-300 animate-bounce' : 'text-amber-300'}`} />
              <span className="text-[11px] sm:text-xs">
                <strong className="text-amber-200 font-extrabold">{expirationsAlerts.length} {expirationsAlerts.length === 1 ? 'scadenza' : 'scadenze'}</strong> (Bollo, Assicurazione, Revisione, Tagliando) nei prossimi 2 mesi.
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setIsExpirationsModalOpen(true)}
                className="px-2.5 sm:px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-[11px] rounded-lg shadow-sm transition-all active:scale-95 shrink-0 border border-amber-300/40"
              >
                Controlla Scadenze ({expirationsAlerts.length})
              </button>
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-[11px] rounded-lg border border-amber-500/40 shadow transition-all shrink-0"
              >
                ⚙️ Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-0.5 sm:pt-1 flex-1 w-full">
        
        {/* Brand, Owner & Location Filter Chips */}
        <StatsBar
          cars={cars}
          brands={brands}
          selectedBrand={selectedBrand}
          setSelectedBrand={setSelectedBrand}
          owners={owners}
          selectedOwner={selectedOwner}
          setSelectedOwner={setSelectedOwner}
          locations={locations}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          totalCarsCount={cars.length}
          filteredCount={filteredCars.length}
        />

        {/* Toolbar Header (Results Counter, Bulk Selection Actions & Sort) */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 my-1 pb-1 border-b border-slate-800/80 text-xs">
          
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs sm:text-sm font-bold text-slate-200">
                Risultati:
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                {filteredCars.length} vetture
              </span>
            </div>

            {/* Quick Filter Reset Tags if any filter is active */}
            {(selectedBrand !== 'Tutti' || selectedOwner !== 'Tutti' || selectedLocation !== 'Tutti' || onlyFavorites || searchQuery) && (
              <button
                type="button"
                onClick={handleGoHome}
                className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-all shrink-0"
                title="Azzera tutti i filtri e mostra tutte le auto"
              >
                <span>Azzera Filtri</span>
                <span className="text-amber-400 font-bold">✕</span>
              </button>
            )}

            {/* Selection Counter & Quick Bulk Selection Actions */}
            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800 flex-wrap gap-y-1.5">
              <button
                onClick={handleSelectAllFiltered}
                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition-all shrink-0"
              >
                <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Seleziona Tutte</span>
              </button>

              {selectedCarIds.length > 0 && (
                <>
                  <button
                    onClick={handleDeselectAll}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold shrink-0"
                  >
                    Deseleziona ({selectedCarIds.length})
                  </button>

                  <button
                    onClick={() => setIsPdfReportModalOpen(true)}
                    className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Stampa / PDF ({selectedCarIds.length})</span>
                  </button>

                  <button
                    onClick={handleDeleteSelectedCars}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all shrink-0"
                    title="Elimina schede selezionate"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Elimina ({selectedCarIds.length})</span>
                  </button>
                </>
              )}
            </div>

          </div>

          {/* Right Toolbar Controls: Ordina per */}
          <div className="flex items-center space-x-2 text-xs shrink-0 ml-auto">
            <div className="flex items-center space-x-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-medium hidden sm:inline">Ordina:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
              >
                <option value="page">Ordine Predefinito</option>
                <option value="brand">Marca (A-Z)</option>
                <option value="hp_desc">Potenza (CV Decrescente)</option>
                <option value="year_desc">Anno (Più Recente)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid or List Content */}
        {filteredCars.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto my-12 space-y-4">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
              <CarIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-heading text-white">Nessuna Vettura Trovata</h3>
            <p className="text-xs text-slate-400">
              Nessun risultato corrisponde ai filtri impostati. Prova a modificare la ricerca o ripristinare i filtri.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedBrand('Tutti'); setSelectedLocation('Tutti'); setSelectedOwner('Tutti'); setOnlyFavorites(false); }}
              className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
            >
              Mostra Tutte le Vetture
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredCars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                isSelected={selectedCarIds.includes(car.id)}
                onToggleSelect={handleToggleSelect}
                onToggleFavorite={handleToggleFavorite}
                onSelectCar={setSelectedCar}
                onEditCar={(c) => { setCarToEdit(c); setIsAddModalOpen(true); }}
                onDeleteCar={handleDeleteCar}
                currentUser={currentUser}
                clientPermissions={clientPermissions}
              />
            ))}
          </div>
        ) : (
          <CarListView
            cars={filteredCars}
            selectedCarIds={selectedCarIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleSelectAllFiltered}
            onToggleFavorite={handleToggleFavorite}
            onSelectCar={setSelectedCar}
            onEditCar={(c) => { setCarToEdit(c); setIsAddModalOpen(true); }}
            onDeleteCar={handleDeleteCar}
            currentUser={currentUser}
            clientPermissions={clientPermissions}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Book Auto PB</p>
      </footer>

      {/* Modals */}
      {selectedCar && (
        <CarDetailModal
          car={cars.find(c => String(c.id) === String(selectedCar.id)) || selectedCar}
          onClose={() => setSelectedCar(null)}
          onToggleFavorite={handleToggleFavorite}
          onEditCar={(c) => {
            setSelectedCar(null);
            setCarToEdit(c);
            setIsAddModalOpen(true);
          }}
          onDeleteCar={handleDeleteCar}
          onUpdateCarPhotos={handleUpdateCarImages}
          onOpenPrintPdf={handleOpenPrintPdfForCar}
          onOpenCartellaDocumenti={() => {
            setSelectedCar(null);
            setIsCartellaDocumentiOpen(true);
          }}
          onSaveCar={handleSaveCar}
          onUpdateCars={saveCarsState}
          onUpdateCarExpirations={handleUpdateCarExpirations}
          currentUser={currentUser}
          clientPermissions={clientPermissions}
        />
      )}

      {isAddModalOpen && (
        <AddEditCarModal
          carToEdit={carToEdit}
          onClose={() => { setIsAddModalOpen(false); setCarToEdit(null); }}
          onSaveCar={handleSaveCar}
          existingBrands={brands}
          allCars={cars}
        />
      )}

      {isBackupModalOpen && (
        <BackupModal
          cars={cars}
          onClose={() => setIsBackupModalOpen(false)}
          onImportData={(newCars) => saveCarsState(newCars)}
          onResetData={handleResetData}
        />
      )}

      {isPdfReportModalOpen && (
        <PdfPrintReportModal
          selectedCars={selectedCarsList}
          onClose={() => setIsPdfReportModalOpen(false)}
          currentUser={currentUser}
          clientPermissions={clientPermissions}
        />
      )}

      {isBrandLogosModalOpen && (
        <BrandLogosModal
          existingBrands={brands}
          onClose={() => setIsBrandLogosModalOpen(false)}
          onLogosUpdated={handleLogosUpdated}
        />
      )}

      {isExpirationsModalOpen && isStaffUser(currentUser) && (
        <ExpirationsModal
          alerts={expirationsAlerts}
          cars={cars}
          onClose={() => setIsExpirationsModalOpen(false)}
          onEditCar={(carToEditObj) => {
            setCarToEdit(carToEditObj);
            setIsAddModalOpen(true);
          }}
          onUpdateCarExpirations={handleUpdateCarExpirations}
          currentUser={currentUser}
        />
      )}

      {isAdminModalOpen && isStaffUser(currentUser) && (
        <AdminModal
          cars={cars}
          currentUser={currentUser}
          onClose={() => setIsAdminModalOpen(false)}
          onOpenAddModal={() => { setCarToEdit(null); setIsAddModalOpen(true); }}
          onOpenBrandLogosModal={() => setIsBrandLogosModalOpen(true)}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          onResetData={handleResetData}
          onUpdateCars={saveCarsState}
          showSideGlow={showSideGlow}
          setShowSideGlow={(val) => {
            setShowSideGlow(val);
            localStorage.setItem('book_auto_pb_side_glow', JSON.stringify(val));
          }}
          showExpirationBar={showExpirationBar}
          setShowExpirationBar={(val) => {
            setShowExpirationBar(val);
            localStorage.setItem('book_auto_pb_expiration_bar', JSON.stringify(val));
          }}
          clientPermissions={clientPermissions}
          onPermissionsUpdated={(updated) => {
            setClientPermissions(updated);
            saveClientPermissions(updated);
            syncPermissionsToSupabase(updated);
          }}
          onOpenGuideModal={() => setIsGuideModalOpen(true)}
          activeBackground={activeBackground}
          onSelectActiveBackground={handleSelectActiveBackground}
        />
      )}

      {/* Cartella & Archivio Documenti Vetture Modal */}
      {isCartellaDocumentiOpen && (
        <CartellaDocumentiModal
          isOpen={isCartellaDocumentiOpen}
          onClose={() => setIsCartellaDocumentiOpen(false)}
          cars={cars}
          onUpdateCars={saveCarsState}
          currentUser={currentUser}
        />
      )}

      {autoEmailPopupAlerts && isStaffUser(currentUser) && (
        <AutoEmailNotificationPopup
          alerts={autoEmailPopupAlerts}
          onClose={handleCloseEmailPopup}
          onOpenAdminModal={() => setIsAdminModalOpen(true)}
          currentUser={currentUser}
        />
      )}

      {/* Guida Ufficiale Completa (?) Modal */}
      {isGuideModalOpen && (
        <AppGuideModal
          onClose={() => setIsGuideModalOpen(false)}
        />
      )}

    </div>
  );
}
