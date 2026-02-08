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
  name: string;
  itemIds: string[];
  reasoning: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  suggestions?: OutfitSuggestion[];
  timestamp: number;
}

export enum AppView {
  WARDROBE = 'WARDROBE',
  ADD_ITEM = 'ADD_ITEM',
  STYLIST = 'STYLIST',
  SETTINGS = 'SETTINGS'
}

// ============================================
// Outfit Algorithm Types (Simplified)
// ============================================

// Occasion types for outfit recommendations
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