import { supabase } from "./supabaseClient";
import { ClothingCategory, WardrobeItem, OutfitSuggestion } from "../types";

// API Key is now handled securely on the server (Supabase Edge Function)
// API Key is now handled securely on the server (Supabase Edge Function)


// Models to try in order (fallback chain)
const MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

/**
 * Retry helper with exponential backoff
 * Uses longer delays to handle strict rate limits
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 5,
    baseDelay: number = 5000
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
                error?.message?.toLowerCase().includes("resource");

            if (isRateLimit && attempt < maxRetries - 1) {
                const delay = baseDelay * Math.pow(1.5, attempt);
                console.log(`Rate limited, waiting ${Math.round(delay / 1000)}s before retry ${attempt + 1}/${maxRetries - 1}...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw lastError;
}

/**
 * Try generating content with fallback models
 */
/**
 * Call the secure Supabase Edge Function to generate content
 */
async function generateWithFallback(config: any): Promise<any> {
    try {
        console.log("Invoking secure AI function...");

        // Extract prompt from config (simplified for this implementation)
        const prompt = config.contents?.[0]?.parts?.[0]?.text;
        const imageData = config.contents?.[0]?.parts?.[1]?.inlineData?.data;

        // Call Supabase Function
        // OPTIMIZATION: Use GET for 'chat' type to enable CDN caching
        const isGet = config.type === 'chat' || config.type === 'trends';
        const method = isGet ? 'GET' : 'POST';

        let responseData;

        if (isGet) {
            // Construct Query Params for CDN Cache Key
            const params = new URLSearchParams({
                model: 'gemini-1.5-flash',
                prompt: prompt || "",
                cost: "1",
                provider: 'gemini',
                type: config.type || 'chat'
            });

            // Note: We use fetch directly for GET because supabase.functions.invoke often defaults to POST
            // or we need specific control over the URL construction for caching
            const { data, error } = await supabase.functions.invoke(`generate-outfit?${params.toString()}`, {
                method: 'GET'
            });

            if (error) throw error;
            responseData = data;

        } else {
            // Standard POST for private data (Images, Wardrobe)
            const { data, error } = await supabase.functions.invoke('generate-outfit', {
                body: {
                    model: 'gemini-1.5-flash',
                    prompt: prompt,
                    imageData: imageData,
                    cost: 1,
                    type: config.type || 'outfit'
                }
            });

            if (error) throw error;
            responseData = data;
        }

        const data = responseData;

        // Error handling is done inside the if/else blocks above

        // Map response to match Gemini SDK format so rest of code works
        return {
            text: data.candidates?.[0]?.content?.parts?.[0]?.text || ""
        };

    } catch (error: any) {
        console.error("AI Function Error:", error);
        throw error;
    }
}

interface ClothingAnalysis {
    category: ClothingCategory;
    description: string;
    colors: string[];
    tags: string[];
    occasions: string[];
    mood: string[];
    timing: string[];
    season: string[];
}

/**
 * Analyzes a clothing item image and extracts category, colors, style, occasions, mood, timing, and season
 */
export async function analyzeClothingItem(imageData: string, mimeType: string = "image/jpeg"): Promise<ClothingAnalysis> {
    const base64Data = imageData.split(",")[1] || imageData;

    const prompt = `You are a fashion expert analyzing a clothing item image.
Analyze this clothing item and provide the following information in JSON format:

{
  "category": "One of: Top, Bottom, Shoes, Accessory, Outerwear, Dress, Other",
  "description": "A brief 2-3 word description like 'Blue Denim Jacket' or 'Black Sneakers'",
  "colors": ["array of main colors in the item, 1-3 colors"],
  "tags": ["style tags: casual, formal, sporty, elegant, vintage, modern, etc."],
  "occasions": ["suitable occasions: casual, formal, party, work, date, wedding, beach, sports, everyday"],
  "mood": ["mood/vibe: relaxed, energetic, professional, romantic, fun, elegant, confident, cozy"],
  "timing": ["best time to wear: morning, afternoon, evening, night, all-day"],
  "season": ["suitable seasons: summer, winter, spring, fall, all-season"]
}

Guidelines:
- Be accurate with color detection. Include 1-3 main colors.
- For tags, include 2-4 relevant style descriptors.
- For occasions, pick 1-3 most suitable occasions for this item.
- For mood, pick 1-2 vibes this item gives off.
- For timing, pick when this item is best worn.
- For season, pick 1-2 suitable seasons or "all-season" if versatile.
Return ONLY the JSON object, no additional text.`;

    try {
        const response = await retryWithBackoff(() => generateWithFallback({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data,
                            },
                        },
                    ],
                },
            ],
        }));

        const text = response.text || "";
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No valid JSON in response");
        }

        const analysis = JSON.parse(jsonMatch[0]);

        // Map category string to enum
        const categoryMap: Record<string, ClothingCategory> = {
            "Top": ClothingCategory.TOP,
            "Bottom": ClothingCategory.BOTTOM,
            "Shoes": ClothingCategory.SHOES,
            "Accessory": ClothingCategory.ACCESSORY,
            "Outerwear": ClothingCategory.OUTERWEAR,
            "Dress": ClothingCategory.DRESS,
            "Other": ClothingCategory.OTHER,
        };

        return {
            category: categoryMap[analysis.category] || ClothingCategory.OTHER,
            description: analysis.description || "Unknown Item",
            colors: Array.isArray(analysis.colors) ? analysis.colors : [],
            tags: Array.isArray(analysis.tags) ? analysis.tags : [],
            occasions: Array.isArray(analysis.occasions) ? analysis.occasions : ["casual"],
            mood: Array.isArray(analysis.mood) ? analysis.mood : ["relaxed"],
            timing: Array.isArray(analysis.timing) ? analysis.timing : ["all-day"],
            season: Array.isArray(analysis.season) ? analysis.season : ["all-season"],
        };
    } catch (error: any) {
        console.error("Error analyzing clothing:", error);

        // Log more details for debugging
        if (error?.response) {
            console.error("API Response Error:", error.response);
        }
        if (error?.message) {
            console.error("Error message:", error.message);
        }
        if (error?.status) {
            console.error("Error status:", error.status);
        }

        // Check for specific error types
        let errorMessage = "Failed to analyze clothing item. Please try again.";

        if (error?.message?.includes("API_KEY") || error?.message?.includes("api key")) {
            errorMessage = "API key error. Please check your Gemini API key configuration.";
        } else if (error?.message?.includes("429") || error?.status === 429 || error?.message?.toLowerCase().includes("rate")) {
            errorMessage = "API rate limit exceeded. The free Gemini tier has strict limits. Please wait 1-2 minutes and try again, or use a paid API key.";
        } else if (error?.message?.includes("403") || error?.status === 403) {
            errorMessage = "API access denied. Please verify your API key has proper permissions.";
        } else if (error?.message?.includes("400") || error?.status === 400) {
            errorMessage = "Invalid request. The image format may not be supported.";
        } else if (error?.message) {
            errorMessage = `Analysis failed: ${error.message}`;
        }

        throw new Error(errorMessage);
    }
}

/**
 * Generates outfit suggestions based on wardrobe items and occasion
 */
export async function getOutfitSuggestions(
    wardrobe: WardrobeItem[],
    occasion: string,
    additionalContext?: string
): Promise<{ suggestions: OutfitSuggestion[]; message: string }> {

    if (wardrobe.length < 2) {
        return {
            suggestions: [],
            message: "I need at least 2 items in your wardrobe to create outfit suggestions. Please add more clothes!"
        };
    }

    // Create a text description of the wardrobe with all metadata for smart matching
    const wardrobeDescription = wardrobe.map((item, index) =>
        `[${index}] ${item.category}: "${item.description}"
   - Colors: ${item.colors.join(", ")}
   - Style: ${item.tags.join(", ")}
   - Occasions: ${item.occasions?.join(", ") || "casual"}
   - Mood: ${item.mood?.join(", ") || "relaxed"}
   - Best Time: ${item.timing?.join(", ") || "all-day"}
   - Season: ${item.season?.join(", ") || "all-season"}`
    ).join("\n\n");

    const prompt = `You are a personal fashion stylist helping someone pick an outfit.

WARDROBE ITEMS (use the index numbers to reference items):
${wardrobeDescription}

USER'S REQUEST: Create outfit suggestions for: ${occasion}
${additionalContext ? `Additional context: ${additionalContext}` : ""}

SMART MATCHING GUIDELINES:
- Match items with compatible OCCASIONS (e.g., formal items go together)
- Consider MOOD compatibility (professional items with professional, fun with fun)
- Check TIMING appropriateness (evening items for party, morning items for work)
- Respect SEASON compatibility (don't mix heavy winter with light summer)
- Prioritize COLOR HARMONY

Create 2-3 outfit combinations using ONLY items from this wardrobe.
For each outfit, explain WHY it works well together.

Return your response in this JSON format:
{
  "message": "A friendly greeting and brief intro to your suggestions",
  "suggestions": [
    {
      "name": "Creative outfit name like 'Urban Professional' or 'Weekend Chic'",
      "itemIndices": [0, 2, 5],
      "reasoning": "Explain why these items work well together - mention color matching, style coordination, occasion fit, and mood alignment"
    }
  ]
}

Rules:
- Each outfit should have 2-4 items (ideally: top + bottom, or dress, plus optional shoes/accessories)
- Don't combine two tops or two bottoms
- Items should share compatible occasions, timing, or mood
- Keep reasoning concise but helpful (2-3 sentences)
- Return ONLY the JSON object`;

    try {
        const response = await retryWithBackoff(() => generateWithFallback({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        }));

        const text = response.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No valid JSON in response");
        }

        const result = JSON.parse(jsonMatch[0]);

        // Convert indices to actual item IDs
        const suggestions: OutfitSuggestion[] = (result.suggestions || []).map((s: any) => ({
            name: s.name || "Outfit",
            itemIds: (s.itemIndices || []).map((idx: number) => wardrobe[idx]?.id).filter(Boolean),
            reasoning: s.reasoning || "A great combination!",
        }));

        return {
            suggestions,
            message: result.message || "Here are some outfit ideas for you!"
        };
    } catch (error) {
        console.error("Error getting outfit suggestions from AI:", error);
        console.log("Falling back to local outfit matching...");

        // Fallback to local rule-based matching
        return generateLocalOutfitSuggestions(wardrobe, occasion);
    }
}

/**
 * Local rule-based outfit generation when AI is unavailable
 * Matches items based on category compatibility, color harmony, and occasion
 */
function generateLocalOutfitSuggestions(
    wardrobe: WardrobeItem[],
    occasion: string
): { suggestions: OutfitSuggestion[]; message: string } {
    const suggestions: OutfitSuggestion[] = [];

    // Group items by category
    const tops = wardrobe.filter(i => i.category === ClothingCategory.TOP);
    const bottoms = wardrobe.filter(i => i.category === ClothingCategory.BOTTOM);
    const dresses = wardrobe.filter(i => i.category === ClothingCategory.DRESS);
    const shoes = wardrobe.filter(i => i.category === ClothingCategory.SHOES);
    const outerwear = wardrobe.filter(i => i.category === ClothingCategory.OUTERWEAR);
    const accessories = wardrobe.filter(i => i.category === ClothingCategory.ACCESSORY);

    // Filter by occasion if items have occasion data
    const matchesOccasion = (item: WardrobeItem) =>
        !item.occasions || item.occasions.length === 0 ||
        item.occasions.some(o => o.toLowerCase().includes(occasion.toLowerCase())) ||
        item.occasions.includes('everyday') || item.occasions.includes('casual');

    // Neutral colors that go with everything
    const neutrals = ['black', 'white', 'gray', 'grey', 'navy', 'beige', 'cream', 'brown'];
    const isNeutral = (color: string) => neutrals.some(n => color.toLowerCase().includes(n));

    // Check color compatibility
    const colorsMatch = (item1: WardrobeItem, item2: WardrobeItem) => {
        const colors1 = item1.colors.map(c => c.toLowerCase());
        const colors2 = item2.colors.map(c => c.toLowerCase());

        // Same color family or one is neutral
        return colors1.some(c1 =>
            colors2.some(c2 => c1 === c2) || isNeutral(c1)
        ) || colors2.some(c2 => isNeutral(c2));
    };

    // Generate outfit 1: Top + Bottom combination
    if (tops.length > 0 && bottoms.length > 0) {
        const matchingTops = tops.filter(matchesOccasion);
        const matchingBottoms = bottoms.filter(matchesOccasion);

        if (matchingTops.length > 0 && matchingBottoms.length > 0) {
            const top = matchingTops[0];
            const bottom = matchingBottoms.find(b => colorsMatch(top, b)) || matchingBottoms[0];
            const itemIds = [top.id, bottom.id];

            // Add shoes if available
            const shoe = shoes.find(s => matchesOccasion(s) && colorsMatch(top, s));
            if (shoe) itemIds.push(shoe.id);

            suggestions.push({
                name: `${occasion} Ready`,
                itemIds,
                reasoning: `A coordinated ${top.description} with ${bottom.description} - perfect for ${occasion}!`
            });
        }
    }

    // Generate outfit 2: Dress outfit
    if (dresses.length > 0) {
        const matchingDresses = dresses.filter(matchesOccasion);
        if (matchingDresses.length > 0) {
            const dress = matchingDresses[0];
            const itemIds = [dress.id];

            // Add accessories or shoes
            const accessory = accessories.find(a => matchesOccasion(a));
            if (accessory) itemIds.push(accessory.id);

            const shoe = shoes.find(s => matchesOccasion(s));
            if (shoe) itemIds.push(shoe.id);

            suggestions.push({
                name: "Effortless Elegance",
                itemIds,
                reasoning: `The ${dress.description} makes a statement on its own - simple and stylish!`
            });
        }
    }

    // Generate outfit 3: Layered look with outerwear
    if (tops.length > 0 && outerwear.length > 0) {
        const top = tops.find(matchesOccasion) || tops[0];
        const outer = outerwear.find(o => matchesOccasion(o) && colorsMatch(top, o)) || outerwear[0];
        const bottom = bottoms.find(b => matchesOccasion(b)) || bottoms[0];

        if (top && outer) {
            const itemIds = [top.id, outer.id];
            if (bottom) itemIds.push(bottom.id);

            suggestions.push({
                name: "Layered Look",
                itemIds,
                reasoning: `Layer the ${outer.description} over ${top.description} for a polished, weather-ready outfit.`
            });
        }
    }

    // If we couldn't generate any suggestions, create a simple combination
    if (suggestions.length === 0 && wardrobe.length >= 2) {
        const randomItems = wardrobe.slice(0, Math.min(3, wardrobe.length));
        suggestions.push({
            name: "Mix & Match",
            itemIds: randomItems.map(i => i.id),
            reasoning: "Try this combination - mixing different pieces can create unexpected great looks!"
        });
    }

    return {
        suggestions: suggestions.slice(0, 3),
        message: suggestions.length > 0
            ? `Here are some outfit ideas for ${occasion}! (Generated locally while AI is unavailable)`
            : "Add more items to your wardrobe for better outfit suggestions!"
    };
}

/**
 * Chat with the AI stylist for general fashion advice
 */
export async function chatWithStylist(
    message: string,
    wardrobe: WardrobeItem[],
    conversationHistory: Array<{ role: string; text: string }>
): Promise<string> {
    const wardrobeSummary = `User's wardrobe has ${wardrobe.length} items: ` +
        Object.values(ClothingCategory).map(cat => {
            const count = wardrobe.filter(w => w.category === cat).length;
            return count > 0 ? `${count} ${cat}(s)` : null;
        }).filter(Boolean).join(", ");

    const systemPrompt = `You are a friendly, enthusiastic personal fashion stylist named StyleBot.
${wardrobeSummary}

Keep responses concise and helpful. If users ask for outfit suggestions, recommend they use the occasion buttons for detailed suggestions.
Be encouraging about their wardrobe choices and give practical fashion advice.`;

    const contents = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Hi! I'm your personal stylist. How can I help you look amazing today?" }] },
        ...conversationHistory.map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text }]
        })),
        { role: "user", parts: [{ text: message }] }
    ];

    try {
        const response = await retryWithBackoff(() => generateWithFallback({
            contents,
            type: 'chat' // Flag as cacheable
        }));

        return response.text || "I'm here to help with your style questions!";
    } catch (error) {
        console.error("Error chatting with stylist:", error);
        return "I'm having a moment! Please try again.";
    }
}
