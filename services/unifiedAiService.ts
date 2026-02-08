/**
 * Unified AI Service
 * Provides a single interface for all AI calls using Gemini API
 * Reads API key from localStorage (configured in Settings)
 */

import { GoogleGenAI } from "@google/genai";
import { ClothingCategory, WardrobeItem, OutfitSuggestion } from "../types";

// Storage key for API keys (same as SettingsView)
const STORAGE_KEY = 'styaile_api_keys';

// Models to try in order (fallback chain)
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

/**
 * Get API key from localStorage
 */
function getApiKey(): string {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const keys = JSON.parse(stored);
            return keys.gemini || '';
        }
    } catch (e) {
        console.warn('Could not load API key from localStorage:', e);
    }
    return '';
}

/**
 * Check if the Gemini API is configured
 */
export function isApiConfigured(): boolean {
    return !!getApiKey();
}

/**
 * Create a new GoogleGenAI instance with the current API key
 */
function getGenAI(): GoogleGenAI | null {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn('⚠️ Gemini API not configured. Please add your API key in Settings.');
        return null;
    }
    return new GoogleGenAI({ apiKey });
}

// Storage key for cached working model
const CACHED_MODEL_KEY = 'styaile_working_model';

/**
 * Get the last working model from cache
 */
function getCachedModel(): string | null {
    try {
        return localStorage.getItem(CACHED_MODEL_KEY);
    } catch (e) {
        return null;
    }
}

/**
 * Save the working model to cache
 */
function cacheWorkingModel(model: string): void {
    try {
        localStorage.setItem(CACHED_MODEL_KEY, model);
        console.log(`✅ Cached working model: ${model}`);
    } catch (e) {
        console.warn('Could not cache working model:', e);
    }
}

/**
 * Smart retry with aggressive backoff for rate limits
 * - Retries up to 5 times for rate limit errors
 * - Uses exponential backoff (2s, 4s, 8s, 16s, 32s)
 * - Only retries on rate limit errors, fails fast on other errors
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 5,
    baseDelay: number = 2000
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            const isRateLimit = error?.message?.includes("429") ||
                error?.status === 429 ||
                error?.message?.toLowerCase().includes("rate") ||
                error?.message?.toLowerCase().includes("quota") ||
                error?.message?.toLowerCase().includes("resource");

            // Only retry on rate limit errors
            if (isRateLimit && attempt < maxRetries - 1) {
                const delay = baseDelay * Math.pow(2, attempt); // Exponential: 2s, 4s, 8s, 16s, 32s
                console.log(`⏳ Rate limited. Waiting ${Math.round(delay / 1000)}s before retry ${attempt + 1}/${maxRetries - 1}...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // For non-rate-limit errors or final retry, throw immediately
                throw error;
            }
        }
    }
    throw lastError;
}

/**
 * Smart model fallback with caching
 * - Tries cached model first (if available)
 * - On success, caches the working model
 * - Only falls back to other models after exhausting retries
 * - Retries each model multiple times before giving up
 */
async function generateWithSmartFallback(genAI: GoogleGenAI, config: any): Promise<any> {
    const cachedModel = getCachedModel();
    let modelsToTry = [...MODELS];

    // If we have a cached working model, try it first
    if (cachedModel && MODELS.includes(cachedModel)) {
        modelsToTry = [cachedModel, ...MODELS.filter(m => m !== cachedModel)];
        console.log(`🎯 Using cached working model: ${cachedModel}`);
    }

    let lastError: any;

    for (const model of modelsToTry) {
        try {
            console.log(`🤖 Trying model: ${model}`);

            // Try this model with aggressive retries for rate limits
            const response = await retryWithBackoff(() =>
                genAI.models.generateContent({
                    ...config,
                    model
                })
            );

            // Success! Cache this model for future use
            cacheWorkingModel(model);
            return response;

        } catch (error: any) {
            lastError = error;
            console.warn(`❌ Model ${model} failed after retries:`, error?.message);

            // Only try next model if this one doesn't exist (404)
            // For other errors (rate limit exhausted, etc.), stop trying
            const isModelNotFound = error?.message?.includes("404") ||
                error?.message?.includes("not found");

            if (!isModelNotFound) {
                console.error(`🛑 Stopping fallback - error is not model-not-found`);
                throw error;
            }
        }
    }

    throw lastError;
}



/**
 * AI Analysis result from image analysis
 */
export interface AIAnalysisResult {
    summary: string;
    detectedType: string;
    styleParams: string[];
    detectedColors: string[];
    fabricGuess?: string;
    timestamp: number;
}

/**
 * Analyze a clothing image using Gemini Vision
 * @param base64Image - Base64 encoded image (with or without data URL prefix)
 * @returns AI analysis of the clothing item
 */
export async function analyzeClothingImage(base64Image: string): Promise<AIAnalysisResult> {
    const genAI = getGenAI();
    if (!genAI) {
        throw new Error('Please configure your Gemini API key in Settings to use AI features.');
    }

    // Ensure base64 has proper format
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const prompt = `You are a fashion expert AI. Analyze clothing items in images and provide detailed, structured analysis.

Your response MUST be valid JSON with this exact structure:
{
  "summary": "A comprehensive 2-3 sentence description of the clothing item",
  "detectedType": "The type of clothing (e.g., shirt, pants, dress, jacket, shoes)",
  "styleParams": ["Array of style descriptors like retro, casual, formal, vintage, modern, streetwear"],
  "detectedColors": ["Array of colors present in the item"],
  "fabricGuess": "Best guess at the fabric (e.g., cotton, denim, silk, polyester)"
}

Be specific and accurate.
- Detect Indian ethnic wear specifically (e.g., "Kurti", "Saree", "Lehenga", "Sherwani", "Dupatta").
- If it's a mix (e.g., Kurti with Jeans), label it "Indo-Western".
- Include details about patterns, cuts, and distinctive features in the summary.`;

    console.log('🔍 Gemini: Starting image analysis...');

    try {
        const response = await generateWithSmartFallback(genAI, {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: base64Data,
                            },
                        },
                    ],
                },
            ],
        });

        const text = response.text || "";
        console.log('📝 AI Response:', text.substring(0, 200) + '...');

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('❌ No JSON found in response');
            throw new Error('AI did not return valid analysis. Please try again.');
        }

        const analysis = JSON.parse(jsonMatch[0]);
        console.log('✅ Parsed Analysis:', analysis);

        return {
            summary: analysis.summary || 'Clothing item',
            detectedType: analysis.detectedType || 'unknown',
            styleParams: Array.isArray(analysis.styleParams) ? analysis.styleParams : [],
            detectedColors: Array.isArray(analysis.detectedColors) ? analysis.detectedColors : [],
            fabricGuess: analysis.fabricGuess,
            timestamp: Date.now(),
        };
    } catch (error: any) {
        console.error('❌ Gemini Analysis Error:', error.message);

        // Provide user-friendly error messages
        if (error?.message?.includes('API_KEY') || error?.message?.includes('api key')) {
            throw new Error('Invalid API key. Please check your Gemini API key in Settings.');
        } else if (error?.message?.includes('429') || error?.status === 429) {
            throw new Error('Rate limit reached. Please wait a minute and try again.');
        }

        throw new Error(`AI Analysis Failed: ${error.message}`);
    }
}

/**
 * Context item for AI chat
 */
interface ContextItem {
    id: string;
    description: string;
    summary?: string;
    colors: string[];
    category: string;
}

/**
 * Ask AI with wardrobe context
 * @param question - User's question
 * @param contextItems - Selected wardrobe items to use as context
 * @returns AI response
 */
export async function askAiWithContext(
    question: string,
    contextItems: ContextItem[]
): Promise<string> {
    const genAI = getGenAI();
    if (!genAI) {
        return "Please configure your Gemini API key in Settings to chat with me!";
    }

    // Build context from selected items
    let contextText = '';
    if (contextItems.length > 0) {
        contextText = 'The user has selected these items from their wardrobe:\n\n';
        contextItems.forEach((item, index) => {
            contextText += `${index + 1}. ${item.description} (${item.category})\n`;
            if (item.summary) {
                contextText += `   AI Analysis: ${item.summary}\n`;
            }
            contextText += `   Colors: ${item.colors.join(', ')}\n\n`;
        });
    }

    const systemPrompt = `You are **StyAiLe** - a friendly, professional fashion stylist with a warm personality. You're here to help users look and feel their best!

${contextText}

## Your Personality:
- **Friendly & Encouraging**: Lead with positivity! Highlight what works before suggesting improvements ✨
- **Honest but Kind**: Be truthful without being rude. Frame suggestions as "even better" options
- **Culturally Aware**: You understand Indian fashion (Kurti + Jeans = Indo-Western, Saree traditions, ethnic fusion)
- **Concise & Helpful**: Keep responses under 150 words. Use bullet points for clarity

## Response Style:
- Start with what's working well or a compliment
- If there are improvements needed, frame them positively ("This would look even better with...")
- Use emojis sparingly for warmth (1-2 per response)
- Structure with ### headers and bullet points

## Important:
- NEVER be condescending or rude
- NEVER say "I hope this helps" - instead end with a specific actionable tip
- IF items don't match well, explain WHY in a helpful way
- Always give constructive alternatives`;

    try {
        const response = await generateWithSmartFallback(genAI, {
            contents: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Hello! I'm excited to help you with your style today! 💫 Show me what you're working with and let's create something amazing together." }] },
                { role: "user", parts: [{ text: question }] }
            ],
        });

        return response.text || "I'm here to help with your style questions!";
    } catch (error: any) {
        console.error('Error in AI chat:', error);
        return "I'm having trouble connecting right now. Please try again in a moment!";
    }
}

/**
 * Get outfit suggestions using AI
 * @param wardrobeItems - All wardrobe items with their AI analysis
 * @param occasion - The occasion to dress for
 * @returns AI-generated outfit suggestions
 */
export async function getAiOutfitSuggestions(
    wardrobeItems: ContextItem[],
    occasion: string
): Promise<{ message: string; suggestions: Array<{ name: string; itemIds: string[]; reasoning: string }> }> {
    if (wardrobeItems.length < 2) {
        return {
            message: "Add at least 2 items to your wardrobe to get outfit suggestions!",
            suggestions: []
        };
    }

    const genAI = getGenAI();
    if (!genAI) {
        return {
            message: "Please configure your Gemini API key in Settings to get AI outfit suggestions!",
            suggestions: []
        };
    }

    // Build wardrobe context
    let wardrobeContext = 'Available wardrobe items:\n\n';
    wardrobeItems.forEach((item, index) => {
        wardrobeContext += `[${index}] ${item.description} (${item.category})\n`;
        if (item.summary) {
            wardrobeContext += `    Analysis: ${item.summary}\n`;
        }
        wardrobeContext += `    Colors: ${item.colors.join(', ')}\n\n`;
    });

    const systemPrompt = `You are an expert fashion stylist with a sharp eye for **Indo-Western** and **Global** trends. Create outfit combinations from the user's wardrobe.

${wardrobeContext}

Return your response as JSON with this structure:
{
  "message": "Honest opinion on the available options",
  "suggestions": [
    {
      "name": "Outfit Name (e.g. 'Office Chic' or 'Desi Fusion')",
      "itemIndices": [0, 2],
      "reasoning": "Why this works (or why it's a bold choice)"
    }
  ]
}

Rules:
- Create 2-3 outfit suggestions
- **Mix & Match**: Try combining ethnic tops (Kurtis) with western bottoms (Jeans) for Indo-Western looks.
- **Color Theory**: Ensure colors actually work.
- **Honesty**: If the user has limited items that don't match well, acknowledge it in the 'reasoning'.`;

    try {
        const response = await generateWithSmartFallback(genAI, {
            contents: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "user", parts: [{ text: `Create outfit suggestions for: ${occasion}` }] }
            ],
        });

        const text = response.text || '';

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid response format');
        }

        const result = JSON.parse(jsonMatch[0]);

        // Convert indices to IDs
        const suggestions = (result.suggestions || []).map((s: any) => ({
            name: s.name || 'Outfit',
            itemIds: (s.itemIndices || []).map((idx: number) => wardrobeItems[idx]?.id).filter(Boolean),
            reasoning: s.reasoning || 'A great combination!',
        }));

        return {
            message: result.message || `Here are my suggestions for ${occasion}!`,
            suggestions
        };
    } catch (error: any) {
        console.error('Error getting outfit suggestions:', error);
        return {
            message: "I couldn't generate suggestions right now. Please try again!",
            suggestions: []
        };
    }
}

/**
 * Fit pic rating result
 */
export interface FitPicRating {
    rating: number;          // 1-10
    compliments: string[];   // What's working well
    suggestions: string[];   // How to improve
    overallFeedback: string; // Summary
}

/**
 * Rate a user's outfit photo ("fit pic")
 * @param base64Image - Base64 encoded image of the user wearing an outfit
 * @returns AI rating and feedback
 */
export async function rateFitPic(base64Image: string): Promise<FitPicRating> {
    const genAI = getGenAI();
    if (!genAI) {
        throw new Error('Please configure your Gemini API key in Settings to use AI features.');
    }

    // Ensure base64 has proper format
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const prompt = `You are a friendly, encouraging fashion stylist rating a user's outfit photo. Be POSITIVE and HONEST - compliment what works and gently suggest improvements.

Your response MUST be valid JSON with this exact structure:
{
  "rating": 8,
  "compliments": ["What's working great - colors, fit, style choices"],
  "suggestions": ["Gentle improvements - accessories, adjustments"],
  "overallFeedback": "2-3 sentence summary that's encouraging and helpful"
}

Guidelines:
- Rating 1-10 (be generous but honest - most outfits should be 6-9)
- Compliments: 2-4 specific things that look good
- Suggestions: 1-3 improvements (optional if outfit is great)
- Be warm, professional, and encouraging
- Consider fit, color coordination, accessorizing, occasion appropriateness
- Understand Indian fashion (ethnic, Indo-Western, traditional wear)

NEVER be harsh or discouraging. Frame everything positively!`;

    console.log('📸 Gemini: Rating fit pic...');

    try {
        const response = await generateWithSmartFallback(genAI, {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: base64Data,
                            },
                        },
                    ],
                },
            ],
        });

        const text = response.text || "";
        console.log('📝 Fit Pic Rating Response:', text.substring(0, 200) + '...');

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('❌ No JSON found in response');
            throw new Error('AI did not return valid rating. Please try again.');
        }

        const rating = JSON.parse(jsonMatch[0]);
        console.log('✅ Parsed Rating:', rating);

        return {
            rating: Math.min(10, Math.max(1, rating.rating || 7)),
            compliments: Array.isArray(rating.compliments) ? rating.compliments : ['Looking good!'],
            suggestions: Array.isArray(rating.suggestions) ? rating.suggestions : [],
            overallFeedback: rating.overallFeedback || 'Nice outfit choice! 👏',
        };
    } catch (error: any) {
        console.error('❌ Fit Pic Rating Error:', error.message);

        if (error?.message?.includes('API_KEY') || error?.message?.includes('api key')) {
            throw new Error('Invalid API key. Please check your Gemini API key in Settings.');
        } else if (error?.message?.includes('429') || error?.status === 429) {
            throw new Error('Rate limit reached. Please wait a minute and try again.');
        }

        throw new Error(`Rating Failed: ${error.message}`);
    }
}
