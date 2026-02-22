import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { CreditService } from './creditService';

// Initialize Gemini
// We need to handle the case where the API key is not yet set
const getGenAI = () => {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

// --- Model Configuration with Fallback ---
const MODELS = [
    "gemini-2.0-flash", // primary (fastest, cheapest)
    "gemini-1.5-flash", // backup
    "gemini-1.5-pro"    // distinct fallback
];

let workingModel: string | null = null;
const CACHE_KEY_MODEL = 'styaile_working_model';

// Helper to get cached working model
const getCachedModel = () => {
    if (workingModel) return workingModel;
    return localStorage.getItem(CACHE_KEY_MODEL);
}

const cacheWorkingModel = (model: string) => {
    workingModel = model;
    localStorage.setItem(CACHE_KEY_MODEL, model);
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries === 0) throw error;

        // Only retry on 429 (Rate Limit) or 503 (Service Unavailable)
        if (error?.status === 429 || error?.status === 503 || error?.message?.includes('429')) {
            console.warn(`⚠️ API rate limit hit. Retrying in ${delay}ms... (${retries} left)`);
            await sleep(delay);
            return retryWithBackoff(fn, retries - 1, delay * 2);
        }

        throw error;
    }
}

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

export interface ContextItem {
    id: string;
    description: string;
    category: string;
    colors: string[];
    summary?: string;
}

/**
 * Analyze a clothing image using Gemini Vision
 * @param base64Image - The image data
 * @returns Analysis result including description, category, colors, etc.
 */
export async function analyzeClothingImage(base64Image: string): Promise<any> {
    const genAI = getGenAI();
    if (!genAI) {
        throw new Error('API Key not found. Please set your Gemini API key in Settings.');
    }

    // Check Credits (1 credit for analysis)
    const cost = 1;
    const hasCredits = await CreditService.deductCredits(cost, 'analysis');

    if (!hasCredits) {
        throw new Error('Insufficient credits. Please watch an ad to earn more!');
    }

    const prompt = `Analyze this clothing item in detail for a fashion app.
    Return ONLY valid JSON with this exact structure:
    {
        "description": "Detailed description of the item including materials, texture, pattern",
        "category": "One of: Tops, Bottoms, Shoes, Outerwear, Accessories, Dresses",
        "colors": ["list", "of", "dominant", "colors"],
        "styleTags": ["list", "of", "relevant", "style", "tags", "e.g. casual, boho, formal"],
        "occasions": ["list", "of", "suitable", "occasions"],
        "weather": ["list", "of", "suitable", "seasons"],
        "brandGuess": "Guess the brand if visible, else null"
    }`;

    try {
        console.log('🔍 Gemini: Starting image analysis...');

        // Fix base64 string if needed
        const cleanBase64 = base64Image.includes('base64,')
            ? base64Image.split('base64,')[1]
            : base64Image;

        const response = await generateWithSmartFallback(genAI, {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: cleanBase64
                            }
                        }
                    ]
                }
            ],
            config: {
                temperature: 0.2, // Lower temperature for more deterministic/JSON output
            }
        });

        const text = response.text || "{}";
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('✅ Parsed Analysis:', parsed);
            return parsed;
        } else {
            throw new Error("Invalid response format from AI");
        }
    } catch (error: any) {
        console.error('Error analyzing image:', error);
        throw new Error(error.message || 'Failed to analyze image');
    }
}

/**
 * Chat with the AI Stylist with wardrobe context
 * @param question - User's question
 * @param contextItems - Relevant wardrobe items
 * @returns AI's text response
 */
export async function askAiWithContext(
    question: string,
    contextItems: ContextItem[]
): Promise<string> {
    const genAI = getGenAI();
    if (!genAI) {
        return "Please configure your Gemini API key in Settings to use the AI Stylist.";
    }

    // Build context from selected items
    let contextText = '';
    if (contextItems.length > 0) {
        contextText = 'The user has selected these items from their wardrobe:\n\n';
        contextItems.forEach((item, index) => {
            const colors = Array.isArray(item.colors) ? item.colors.join(', ') : 'Unknown';
            contextText += `${index + 1}. ${item.description} (${item.category})\n`;
            if (item.summary) {
                contextText += `   AI Analysis: ${item.summary}\n`;
            }
            contextText += `   Colors: ${colors}\n\n`;
        });
    }

    const systemPrompt = `You are an elite, honest fashion stylist. Your goal is to give REALISTIC, constructive advice.

CONTEXT:
- User has specific items in their wardrobe
- They might be asking for outfit ideas or feedback
- User wants to look "Status" / "Premium" / "Stylish"

RULES:
1. **Be Honest, Not Flattering**: If items don't match, say so. Suggest why (e.g., "The textures clash" or "The colors are too similar").
2. **Specific & Actionable**: Don't just say "It looks great." Say "Tuck the shirt in to define ease" or "Roll the sleeves for a casual look."
3. **No Robot Speak**: Avoid "I suggest you wear..." or "Here is a recommendation." content. Speak like a human stylist.
4. **Focus on Fit & Visuals**: Mention color coordination, silhouette, and occasion suitability.
5. **Cultural Context**: If items are Indian ethnic (Kurtis, Sarees), provide relevant styling tips (e.g., specific jewelry, draping).

FORMAT:
- Keep responses concise (max 3-4 sentences unless asked for detail).
- Use bullet points for multiple ideas.
- Use emojis sparingly but effectively.

Now answer the user's request based on this context:
${JSON.stringify(contextItems, null, 2)}
`;

    // Credit Deduction
    const cost = 1;
    const hasCredits = await CreditService.deductCredits(cost, 'chat');
    if (!hasCredits) {
        return "I'm sorry, you don't have enough credits to chat. Please watch an ad or upgrade to continue!";
    }

    try {
        console.log('📡 Calling Gemini API for chat...');
        const response = await generateWithSmartFallback(genAI, {
            contents: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Hello! I'm excited to help you with your style today! 💫 Show me what you're working with and let's create something amazing together." }] },
                { role: "user", parts: [{ text: question }] }
            ],
        });

        console.log('✅ Chat response received');
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
        const colors = Array.isArray(item.colors) ? item.colors.join(', ') : 'Unknown';
        wardrobeContext += `[${index}] ${item.description} (${item.category})\n`;
        if (item.summary) {
            wardrobeContext += `    Analysis: ${item.summary}\n`;
        }
        wardrobeContext += `    Colors: ${colors}\n\n`;
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
 * Rate a fit pic (outfit photo)
 * @param base64Image - The image to rate
 * @returns Rating, compliments, suggestions
 */
export async function rateOutfit(base64Image: string): Promise<{
    rating: number;
    compliments: string[];
    suggestions: string[];
    overallFeedback: string;
}> {
    const genAI = getGenAI();
    if (!genAI) throw new Error('API Key missing');

    const prompt = `Rate this outfit on a scale of 1-10. Be honest but constructive.
    Return ONLY JSON:
    {
        "rating": number,
        "compliments": ["list", "of", "good", "points"],
        "suggestions": ["list", "of", "improvements"],
        "overallFeedback": "short summary"
    }`;

    try {
        const cleanBase64 = base64Image.includes('base64,')
            ? base64Image.split('base64,')[1]
            : base64Image;

        const response = await generateWithSmartFallback(genAI, {
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } }
                ]
            }]
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
