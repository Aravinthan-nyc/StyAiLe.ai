export enum ClothingCategory {
  TOP = 'Top',
  BOTTOM = 'Bottom',
  SHOES = 'Shoes',
  ACCESSORY = 'Accessory',
  OUTERWEAR = 'Outerwear',
  DRESS = 'Dress',
  OTHER = 'Other'
}

export interface WardrobeItem {
  id: string;
  imageData: string; // Base64
  category: ClothingCategory;
  description: string;
  colors: string[];
  tags: string[]; // e.g. "casual", "summer", "denim"
  occasions: string[]; // casual, formal, party, work, date, wedding, beach, sports
  mood: string[]; // relaxed, energetic, professional, romantic, fun, elegant
  timing: string[]; // morning, afternoon, evening, night
  season: string[]; // summer, winter, spring, fall, all-season
  createdAt: number;
  // Locking system for laundry tracking
  lockedUntil?: number;  // Timestamp when item becomes available again
  lastWornAt?: number;   // When item was last worn
  wearCount?: number;    // How many times worn
  // Price tracking for cost-per-wear analysis
  purchasePrice?: number;
  purchaseDate?: string;
  brand?: string;
  // Favorite flag
  isFavorite?: boolean;
  // Status tracking
  status?: 'available' | 'laundry' | 'packed' | 'on_loan';

  // AI-generated analysis from NVIDIA NIM
  aiAnalysis?: {
    summary: string;        // Full clothing description
    detectedType: string;   // e.g., "shirt", "pants", "dress"
    styleParams: string[];  // e.g., ["retro", "casual", "vintage"]
    detectedColors: string[];
    fabricGuess?: string;   // e.g., "cotton", "denim"
    timestamp: number;
  };
}

export interface OutfitSuggestion {
  id?: string;
  name: string;
  itemIds: string[];
  reasoning: string;
  occasion?: string;
  season?: string;
  isFavorite?: boolean;
  createdAt?: number;
  timesWorn?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  suggestions?: OutfitSuggestion[];
  timestamp: number;
  imageUrl?: string;
}

export enum AppView {
  WARDROBE = 'WARDROBE',
  ADD_ITEM = 'ADD_ITEM',
  STYLIST = 'STYLIST',
  SETTINGS = 'SETTINGS',
  // New views for SaaS features
  SUBSCRIPTION = 'SUBSCRIPTION',
  OUTFITS = 'OUTFITS',
  OUTFIT_PLANNER = 'OUTFIT_PLANNER',
  PACKING_LIST = 'PACKING_LIST',
  CAPSULE_WARDROBE = 'CAPSULE_WARDROBE',
  BODY_ANALYSIS = 'BODY_ANALYSIS',
  ANALYTICS = 'ANALYTICS',
  EXPORT = 'EXPORT',
  PROFILE = 'PROFILE',
  // New views for laundry and saved outfits
  LAUNDRY = 'LAUNDRY',
  SAVED_OUTFITS = 'SAVED_OUTFITS',
  // Security views
  BETA_EXPIRED = 'BETA_EXPIRED'
}

// ============================================
// Subscription & Plan Types
// ============================================

export type PlanTier = 'free' | 'starter' | 'pro' | 'premium';

export interface UserSubscription {
  tier: PlanTier;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  startDate: number;
  endDate: number;
  razorpaySubscriptionId?: string;
  isYearly: boolean;
}

export interface PlanLimits {
  wardrobeItems: number; // -1 = unlimited
  aiAnalysesPerMonth: number;
  chatHistoryDays: number;
  hasExport: boolean;
  hasCloudBackup: boolean;
  hasAnalytics: boolean;
  hasApiAccess: boolean;
  hasPacking: boolean;
  hasCapsule: boolean;
  hasBodyAnalysis: boolean;
  hasWhiteLabel: boolean;
  processingPriority: number; // 0-3
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    wardrobeItems: 10,
    aiAnalysesPerMonth: 20,
    chatHistoryDays: 7,
    hasExport: false,
    hasCloudBackup: false,
    hasAnalytics: false,
    hasApiAccess: false,
    hasPacking: false,
    hasCapsule: false,
    hasBodyAnalysis: false,
    hasWhiteLabel: false,
    processingPriority: 0
  },
  starter: {
    wardrobeItems: 100,
    aiAnalysesPerMonth: -1, // unlimited
    chatHistoryDays: 30,
    hasExport: true,
    hasCloudBackup: false,
    hasAnalytics: false,
    hasApiAccess: false,
    hasPacking: false,
    hasCapsule: false,
    hasBodyAnalysis: false,
    hasWhiteLabel: false,
    processingPriority: 1
  },
  pro: {
    wardrobeItems: -1, // unlimited
    aiAnalysesPerMonth: -1,
    chatHistoryDays: -1, // unlimited
    hasExport: true,
    hasCloudBackup: true,
    hasAnalytics: false,
    hasApiAccess: false,
    hasPacking: true,
    hasCapsule: true,
    hasBodyAnalysis: true,
    hasWhiteLabel: false,
    processingPriority: 2
  },
  premium: {
    wardrobeItems: -1,
    aiAnalysesPerMonth: -1,
    chatHistoryDays: -1,
    hasExport: true,
    hasCloudBackup: true,
    hasAnalytics: true,
    hasApiAccess: true,
    hasPacking: true,
    hasCapsule: true,
    hasBodyAnalysis: true,
    hasWhiteLabel: true,
    processingPriority: 3
  }
};

export const PLAN_PRICES = {
  free: { monthly: 0, yearly: 0 },
  starter: { monthly: 99, yearly: 999 },
  pro: { monthly: 299, yearly: 2999 },
  premium: { monthly: 599, yearly: 5999 }
};

// ============================================
// Outfit Planner Types
// ============================================

export interface PlannedOutfit {
  id: string;
  date: string; // YYYY-MM-DD
  outfitId?: string;
  itemIds: string[];
  occasion?: string;
  notes?: string;
  completed: boolean;
}

export interface WeekPlanner {
  startDate: string;
  endDate: string;
  plannedOutfits: PlannedOutfit[];
}

// ============================================
// Packing List Types
// ============================================

export interface PackingList {
  id: string;
  name: string;
  destination?: string;
  startDate: string;
  endDate: string;
  tripType: 'business' | 'leisure' | 'adventure' | 'beach' | 'winter' | 'mixed';
  weather?: {
    avgTemp: number;
    conditions: string[];
  };
  itemIds: string[];
  suggestedItemIds: string[];
  checkedItems: string[];
  notes?: string;
  createdAt: number;
}

// ============================================
// Capsule Wardrobe Types
// ============================================

export interface CapsuleWardrobe {
  id: string;
  name: string;
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'all-season';
  itemIds: string[];
  targetCount: number;
  gapAnalysis: {
    missingCategories: ClothingCategory[];
    suggestions: string[];
  };
  createdAt: number;
}

// ============================================
// Body & Color Analysis Types
// ============================================

export type BodyType = 'rectangle' | 'hourglass' | 'pear' | 'apple' | 'inverted-triangle';
export type ColorSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export interface BodyAnalysis {
  bodyType: BodyType;
  colorSeason: ColorSeason;
  bestFits: string[];
  avoidFits: string[];
  bestColors: string[];
  avoidColors: string[];
  recommendations: string[];
  analyzedAt: number;
}

// ============================================
// Analytics Types
// ============================================

export interface WardrobeAnalytics {
  totalItems: number;
  totalValue: number;
  mostWornItems: { item: WardrobeItem; wearCount: number }[];
  leastWornItems: { item: WardrobeItem; wearCount: number }[];
  costPerWear: { item: WardrobeItem; cost: number }[];
  categoryBreakdown: { category: ClothingCategory; count: number; percentage: number }[];
  colorDistribution: { color: string; count: number; percentage: number }[];
  seasonBreakdown: { season: string; count: number }[];
  averageItemAge: number;
  itemsNeverWorn: number;
}

// ============================================
// Occasion types for outfit recommendations
// ============================================

export type OccasionType =
  | 'COLLEGE'
  | 'FEST'
  | 'FAMILY_FUNCTION'
  | 'PARTY'
  | 'CASUAL'
  | 'WORK'
  | 'DATE';

// Outfit suggestion with compatibility score
export interface AlgorithmOutfitSuggestion extends OutfitSuggestion {
  compatibilityScore: number; // 0-100 percentage
}

// ============================================
// Style Memory Types (Pro Feature)
// ============================================

export interface StylePreference {
  preferredColors: string[];
  preferredStyles: string[];
  preferredBrands: string[];
  avoidColors: string[];
  avoidStyles: string[];
  colorCombinations: { primary: string; secondary: string; count: number }[];
  occasionPreferences: Record<OccasionType, string[]>;
  lastUpdated: number;
}

// ============================================
// Usage Tracking
// ============================================

export interface UsageStats {
  aiAnalysesThisMonth: number;
  lastResetDate: string;
  totalOutfitsGenerated: number;
  totalChatMessages: number;
  wardrobeItemsCount: number;
}