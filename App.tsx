import React, { useState, useEffect, useCallback } from 'react';
import Navigation from './components/Navigation';
import WardrobeView from './views/WardrobeView';
import AddItemView from './views/AddItemView';
import StylistView from './views/StylistView';
import SettingsView from './views/SettingsView';
import SplashScreen from './components/SplashScreen';
import AuthView from './views/AuthView';
import OnboardingView from './views/OnboardingView';
import ApiKeySetupModal from './components/ApiKeySetupModal';
import { AppView, WardrobeItem } from './types';
import {
  fetchWardrobeItems,
  addWardrobeItem,
  deleteWardrobeItem,
  updateWardrobeItem,
  checkConnection
} from './services/supabaseService';
import {
  getCurrentUser,
  onAuthStateChange,
  hasCompletedOnboarding,
  setOnboardingComplete,
  hasApiKeyConfigured,
  signOut
} from './services/authService';
import { lockItem, unlockItem } from './services/lockService';
import { User } from '@supabase/supabase-js';

// App flow states
type AppFlowState = 'loading' | 'auth' | 'onboarding' | 'api_setup' | 'main';

function App() {
  // Auth & flow state
  const [flowState, setFlowState] = useState<AppFlowState>('loading');
  const [user, setUser] = useState<User | null>(null);

  // Main app state
  const [currentView, setCurrentView] = useState<AppView>(AppView.WARDROBE);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [stylistContext, setStylistContext] = useState<WardrobeItem[]>([]);
  const [showSplash, setShowSplash] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // PRIORITY CHANGE: Onboarding first
        if (!hasCompletedOnboarding()) {
          setFlowState('onboarding');
        } else if (!currentUser) {
          setFlowState('auth');
        } else if (!hasApiKeyConfigured()) {
          setFlowState('api_setup');
        } else {
          setFlowState('main');
        }
      } catch (e) {
        console.error('Auth check failed:', e);
        setFlowState('auth');
      }
    }

    checkAuthStatus();

    // Listen for auth changes
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      // Only redirect to auth if we are NOT in onboarding or if onboarding is done
      if (!user && hasCompletedOnboarding()) {
        setFlowState('auth');
      }
    });

    return unsubscribe;
  }, []);

  // Load wardrobe when entering main app
  useEffect(() => {
    if (flowState !== 'main') return;

    async function loadWardrobe() {
      try {
        setLoading(true);
        setError(null);

        // Always load localStorage first as baseline
        let localItems: WardrobeItem[] = [];
        try {
          const stored = localStorage.getItem('wardrobe_data');
          if (stored) {
            localItems = JSON.parse(stored);
          }
        } catch (e) {
          console.warn('Could not read localStorage:', e);
        }

        // Check connection
        const connected = await checkConnection();
        setIsOnline(connected);

        if (connected) {
          try {
            const remoteItems = await fetchWardrobeItems();

            // Smart merge: combine remote and local, prioritizing remote for duplicates
            const mergedMap = new Map<string, WardrobeItem>();

            // Add local items first
            localItems.forEach(item => mergedMap.set(item.id, item));

            // Remote items override local (they are the source of truth if available)
            remoteItems.forEach(item => mergedMap.set(item.id, item));

            const mergedItems = Array.from(mergedMap.values())
              .sort((a, b) => b.createdAt - a.createdAt);

            setWardrobe(mergedItems);

            // Sync merged result back to localStorage
            localStorage.setItem('wardrobe_data', JSON.stringify(mergedItems));
          } catch (e) {
            console.error('Failed to fetch from Supabase:', e);
            // Fall back to local items
            setWardrobe(localItems);
            setError('Could not connect to cloud. Using local data.');
          }
        } else {
          // Offline mode - use local data
          setWardrobe(localItems);
          if (localItems.length > 0) {
            setError('Offline mode - using local data');
          }
        }
      } catch (e) {
        console.error("Failed to load wardrobe:", e);
        setError('Failed to load wardrobe');
      } finally {
        setLoading(false);
      }
    }

    loadWardrobe();
  }, [flowState]);

  // Sync to localStorage as backup
  useEffect(() => {
    if (flowState !== 'main' || loading || wardrobe.length === 0) return;
    try {
      localStorage.setItem('wardrobe_data', JSON.stringify(wardrobe));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }, [wardrobe, loading, flowState]);

  // Handle auth success
  const handleAuthSuccess = useCallback(() => {
    if (!hasApiKeyConfigured()) {
      setFlowState('api_setup');
    } else {
      setFlowState('main');
    }
  }, []);

  // Handle onboarding complete
  const handleOnboardingComplete = useCallback(async () => {
    setOnboardingComplete();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      setFlowState('auth');
    } else if (!hasApiKeyConfigured()) {
      setFlowState('api_setup');
    } else {
      setFlowState('main');
    }
  }, []);

  // Handle API key setup complete
  const handleApiKeyComplete = useCallback(() => {
    setFlowState('main');
  }, []);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    await signOut();
    setUser(null);
    setFlowState('auth');
  }, []);

  const handleAddItem = useCallback(async (item: WardrobeItem) => {
    try {
      if (isOnline) {
        const savedItem = await addWardrobeItem(item);
        setWardrobe(prev => [savedItem, ...prev]);
      } else {
        setWardrobe(prev => [item, ...prev]);
      }
      setError(null);
    } catch (e) {
      setWardrobe(prev => [item, ...prev]);
      setError('Saved locally. Will sync when online.');
    }
  }, [isOnline]);

  const handleDeleteItem = useCallback(async (id: string) => {
    if (!window.confirm("Delete this item?")) return;
    setWardrobe(prev => prev.filter(i => i.id !== id));
    try {
      if (isOnline) {
        await deleteWardrobeItem(id);
      }
      setError(null);
    } catch (e) {
      setError('Delete may not have synced to cloud.');
    }
  }, [isOnline]);

  // Handle locking an item
  const handleLockItem = useCallback(async (id: string, days: number = 2) => {
    setWardrobe(prev => prev.map(item =>
      item.id === id ? lockItem(item, days) : item
    ));
    try {
      if (isOnline) {
        const item = wardrobe.find(i => i.id === id);
        if (item) {
          await updateWardrobeItem(lockItem(item, days));
        }
      }
    } catch (e) {
      console.error('Failed to sync lock:', e);
    }
  }, [isOnline, wardrobe]);

  // Handle unlocking an item
  const handleUnlockItem = useCallback(async (id: string) => {
    setWardrobe(prev => prev.map(item =>
      item.id === id ? unlockItem(item) : item
    ));
    try {
      if (isOnline) {
        const item = wardrobe.find(i => i.id === id);
        if (item) {
          await updateWardrobeItem(unlockItem(item));
        }
      }
    } catch (e) {
      console.error('Failed to sync unlock:', e);
    }
  }, [isOnline, wardrobe]);

  const handleAskStylist = useCallback((selectedItems: WardrobeItem[]) => {
    setStylistContext(selectedItems);
    setCurrentView(AppView.STYLIST);
  }, []);

  // Render based on flow state
  if (flowState === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    );
  }

  if (flowState === 'auth') {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  if (flowState === 'onboarding') {
    return <OnboardingView onComplete={handleOnboardingComplete} />;
  }

  if (flowState === 'api_setup') {
    return <ApiKeySetupModal onComplete={handleApiKeyComplete} />;
  }

  // Main app
  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans max-w-xl mx-auto border-x border-white/5 shadow-2xl relative overflow-hidden">

      {/* Splash Screen Overlay */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Error banner */}
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-900/80 text-white text-sm px-4 py-2 text-center z-50 backdrop-blur-md border-b border-white/10">
          {error}
        </div>
      )}

      <main className={`h-screen overflow-y-auto no-scrollbar scroll-smooth ${error ? 'pt-8' : ''}`}>
        {loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-black">
            <div className="w-12 h-12 rounded-full border-2 border-white border-t-transparent animate-spin mb-4" />
            <span className="text-gray-400 font-medium tracking-wide animate-pulse">Loading Closet...</span>
          </div>
        ) : (
          <>
            {currentView === AppView.WARDROBE && (
              <WardrobeView
                items={wardrobe}
                onDeleteItem={handleDeleteItem}
                onAddClick={() => setCurrentView(AppView.ADD_ITEM)}
                onAskStylist={handleAskStylist}
                onLockItem={handleLockItem}
                onUnlockItem={handleUnlockItem}
              />
            )}
            {currentView === AppView.ADD_ITEM && (
              <AddItemView onAddItem={handleAddItem} setView={setCurrentView} />
            )}
            {currentView === AppView.STYLIST && (
              <StylistView
                wardrobe={wardrobe}
                initialContext={stylistContext}
                onContextUsed={() => setStylistContext([])}
                onLockItems={handleLockItem}
              />
            )}
            {currentView === AppView.SETTINGS && (
              <SettingsView setView={setCurrentView} onSignOut={handleSignOut} />
            )}
          </>
        )}
      </main>

      {!loading && !showSplash && (
        <Navigation currentView={currentView} setView={setCurrentView} />
      )}
    </div>
  );
}

export default App;
