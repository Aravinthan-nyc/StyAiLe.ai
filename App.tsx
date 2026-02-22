import React, { useState, useEffect, useCallback } from 'react';
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
import WardrobeView from './views/WardrobeView';
import AddItemView from './views/AddItemView';
import StylistView from './views/StylistView';
import SettingsView from './views/SettingsView';
import SplashScreen from './components/SplashScreen';
import AuthView from './views/AuthView';
import OnboardingView from './views/OnboardingView';
import ApiKeySetupModal from './components/ApiKeySetupModal';
// New SaaS Feature Views
import SubscriptionView from './views/SubscriptionView';
import PackingListView from './views/PackingListView';
import CapsuleWardrobeView from './views/CapsuleWardrobeView';
import AnalyticsView from './views/AnalyticsView';
import OutfitsView from './views/OutfitsView';
import ExportView from './views/ExportView';
import OutfitPlannerView from './views/OutfitPlannerView';
import SavedOutfitsView from './views/SavedOutfitsView';
import LaundryTrackerView from './views/LaundryTrackerView';
import BetaExpiredView from './views/BetaExpiredView';
import UpdatePrompt from './components/UpdatePrompt';

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
import { isBetaExpired, getDaysRemaining } from './services/betaSecurityService';
import { User } from '@supabase/supabase-js';
import { AdService } from './services/adService';


// App flow states
type AppFlowState = 'loading' | 'auth' | 'onboarding' | 'api_setup' | 'main' | 'beta_expired';

function App() {
  // Auth & flow state
  const [flowState, setFlowState] = useState<AppFlowState>('loading');
  const [user, setUser] = useState<User | null>(null);

  // Main app state
  const [currentView, setCurrentView] = useState<AppView>(AppView.WARDROBE);
  const [previousView, setPreviousView] = useState<AppView>(AppView.WARDROBE);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [stylistContext, setStylistContext] = useState<WardrobeItem[]>([]);
  const [plannerContext, setPlannerContext] = useState<WardrobeItem[]>([]);
  const [showSplash, setShowSplash] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        // CRITICAL: Check beta expiration FIRST
        if (isBetaExpired()) {
          setFlowState('beta_expired');
          return;
        }

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

    // Initialize AdService
    AdService.initialize().catch(console.error);

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

  // Navigation with history
  const navigateTo = useCallback((view: AppView) => {
    setPreviousView(currentView);
    setCurrentView(view);
  }, [currentView]);

  const goBack = useCallback(() => {
    setCurrentView(previousView);
  }, [previousView]);

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

  if (flowState === 'beta_expired') {
    return <BetaExpiredView />;
  }

  // Determine if we should show navigation (hide for sub-views)
  const hideNavViews = [
    AppView.SUBSCRIPTION,
    AppView.PACKING_LIST,
    AppView.CAPSULE_WARDROBE,
    AppView.ANALYTICS,
    AppView.OUTFITS,
    AppView.EXPORT,
    AppView.OUTFIT_PLANNER,
    AppView.LAUNDRY,
    AppView.SAVED_OUTFITS
  ];
  const shouldShowNav = !hideNavViews.includes(currentView);

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
            {/* Core Views */}
            {currentView === AppView.WARDROBE && (
              <WardrobeView
                items={wardrobe}
                onDeleteItem={handleDeleteItem}
                onAddClick={() => setCurrentView(AppView.ADD_ITEM)}
                onAskStylist={handleAskStylist}
                onLockItem={handleLockItem}
                onUnlockItem={handleUnlockItem}
                onOpenSidebar={() => setSidebarOpen(true)}
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
              <SettingsView
                setView={setCurrentView}
                onSignOut={handleSignOut}
                onNavigateTo={navigateTo}
              />
            )}

            {/* SaaS Feature Views */}
            {currentView === AppView.SUBSCRIPTION && (
              <SubscriptionView
                onBack={() => setCurrentView(AppView.WARDROBE)}
                wardrobeCount={wardrobe.length}
              />
            )}
            {currentView === AppView.OUTFITS && (
              <OutfitsView
                wardrobe={wardrobe}
                onBack={() => setCurrentView(AppView.WARDROBE)}
              />
            )}
            {currentView === AppView.OUTFIT_PLANNER && (
              <OutfitPlannerView
                wardrobe={wardrobe}
                contextItems={plannerContext}
                onBack={() => {
                  setPlannerContext([]);
                  setCurrentView(AppView.WARDROBE);
                }}
              />
            )}
            {currentView === AppView.PACKING_LIST && (
              <PackingListView
                wardrobe={wardrobe}
                onBack={() => setCurrentView(AppView.WARDROBE)}
              />
            )}
            {currentView === AppView.CAPSULE_WARDROBE && (
              <CapsuleWardrobeView
                wardrobe={wardrobe}
                onBack={() => setCurrentView(AppView.WARDROBE)}
                onNavigateToPlanner={(items) => {
                  if (items) setPlannerContext(items);
                  setCurrentView(AppView.OUTFIT_PLANNER);
                }}
              />
            )}
            {currentView === AppView.ANALYTICS && (
              <AnalyticsView
                wardrobe={wardrobe}
                onBack={() => setCurrentView(AppView.WARDROBE)}
              />
            )}
            {currentView === AppView.EXPORT && (
              <ExportView
                wardrobe={wardrobe}
                onBack={() => setCurrentView(AppView.WARDROBE)}
              />
            )}
            {currentView === AppView.SAVED_OUTFITS && (
              <SavedOutfitsView
                wardrobe={wardrobe}
                onBack={() => setCurrentView(AppView.WARDROBE)}
              />
            )}
            {currentView === AppView.LAUNDRY && (
              <LaundryTrackerView
                wardrobe={wardrobe}
                onBack={() => setCurrentView(AppView.WARDROBE)}
                onUnlockItem={handleUnlockItem}
              />
            )}
          </>
        )}
      </main>

      {!loading && !showSplash && shouldShowNav && (
        <Navigation currentView={currentView} setView={setCurrentView} />
      )}

      {/* Sidebar - Always available */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setSidebarOpen(false);
        }}
        hasFeature={(feature) => {
          // Simple feature detection
          if (feature === 'hasExport') return true; // Everyone can use export
          if (feature === 'hasPacking') return true; // Everyone can use packing/capsule
          if (feature === 'hasAnalytics') return false; // Premium only
          return false;
        }}
      />
      {/* Live Update Prompt */}
      {flowState === 'main' && <UpdatePrompt />}
    </div>
  );
}

// Simple Error Boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
          <pre className="bg-gray-900 p-4 rounded-lg overflow-auto max-w-full text-xs text-red-200 border border-red-900/50">
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
