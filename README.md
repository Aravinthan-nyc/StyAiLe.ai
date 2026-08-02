  StyAiLe.ai is a mobile-focused web application designed to digitize personal wardrobes and automate outfit selection.
  
  Architecture and Features:
  
  1. Image Processing & Classification
  Converts uploaded clothing images into structured metadata, extracting garment categories, color schemes, and style attributes.
  2. Context-Driven Outfit Recommendations
  Analyzes the user's active clothing library to recommend complete outfits tailored to specific occasions and cultural attire styles.
  3. Availability Management
  Tracks garment availability through a status lock system. Items currently being laundered are temporarily removed from active recommendation pipelines.
  4. Outfit Evaluation
  Accepts full-body outfit photos and provides structured feedback regarding color pairing, accessories, and overall composition.
  5. Motion Asset Export
  Uses Remotion for automated rendering of wardrobe item showcases and social video formats.
  
  Technological Stack:
  
  • Frontend: React 19, TypeScript, Vite, Tailwind CSS
  • Data & Auth: Supabase, LocalStorage Fallbacks
  • Media & Analysis: Google Gemini API, Remotion
  • Mobile Integration: Capacitor
