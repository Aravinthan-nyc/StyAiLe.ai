import { supabase } from "./supabaseClient";

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
 * Analyze a clothing image using NVIDIA NIM (via Supabase Edge Function)
 * @param base64Image - Base64 encoded image (with or without data URL prefix)
 * @returns AI analysis of the clothing item
 */
export async function analyzeClothingImage(base64Image: string): Promise<AIAnalysisResult> {
    // Ensure base64 has proper data URL format for API
    const imageData = base64Image.includes(',')
        ? base64Image
        : `data:image/jpeg;base64,${base64Image}`;

    const systemPrompt = `You are a fashion expert AI. Analyze clothing items in images and provide detailed, structured analysis.

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

    const userPrompt = 'Analyze this clothing item and provide a detailed JSON analysis.';

    try {
        console.log('🔍 NVIDIA NIM (Secure): Invoking Edge Function...');

        // Call Supabase Function
        const { data, error } = await supabase.functions.invoke('generate-outfit', {
            body: {
                provider: 'nvidia',
                model: 'meta/llama-3.2-11b-vision-instruct',
                prompt: JSON.stringify({
                    system: systemPrompt,
                    user: userPrompt,
                    image: imageData // Pass image if needed by backend logic
                }),
                cost: 2 // Higher cost for Vision model
            }
        });

        if (error) throw error;

        // Parse response (assuming edge function returns standard format)
        // Note: The edge function should handle the specific provider response format mapping
        // For MVP, we presume the edge function returns the direct provider response
        const content = data.choices?.[0]?.message?.content || '';

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON in response");

        const analysis = JSON.parse(jsonMatch[0]);

        return {
            summary: analysis.summary || 'Clothing item',
            detectedType: analysis.detectedType || 'unknown',
            styleParams: Array.isArray(analysis.styleParams) ? analysis.styleParams : [],
            detectedColors: Array.isArray(analysis.detectedColors) ? analysis.detectedColors : [],
            fabricGuess: analysis.fabricGuess,
            timestamp: Date.now(),
        };

    } catch (error: any) {
        console.error('AI Analysis Failed:', error);
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

    const systemPrompt = `You are **Flareo's Honest Fashion Critic**. You are NOT a generic AI. You are a high-end stylist who values **truth** over politeness.

${contextText}

## Persona & Tone:
- **Brutally Honest**: If items don't match, SAY IT. ("These colors clash", "The styles fight each other").
- **Cultural Intelligence**: You understand Indian aesthetics (Kurti + Jeans = Indo-Western; Saree requires a Blouse).
- **Vogue Editor**: Concise, punchy, authoritative. Under 150 words.

## Guidelines:
- **Critique First**: Start with your honest opinion. Good or Bad.
- **Fix It**: If it's bad, suggest the specific fix (e.g., "Swap the neon top for a white Kurti").
- **Structure**: Use Markdown headers (###), bullet points.

## Restrictions:
- NEVER say "I hope this helps" or "Certainly!".
- NEVER be fake nice. If it's a bad outfit, warn the user.
- IF 2+ items selected: Judge the combination strictly.`;

    try {
        console.log('🔍 NVIDIA NIM (Secure): Invoking Edge Function for Chat...');
        // Call Supabase Function
        const { data, error } = await supabase.functions.invoke('generate-outfit', {
            body: {
                provider: 'nvidia',
                model: 'meta/llama-3.2-11b-vision-instruct', // Or a chat model if preferred
                prompt: JSON.stringify({
                    system: systemPrompt,
                    user: question
                }),
                cost: 1
            }
        });

        if (error) throw error;

        const content = data.choices?.[0]?.message?.content || '';
        return content || "I'm here to help with your style questions!";
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
        console.log('🔍 NVIDIA NIM (Secure): Invoking Edge Function for Suggestions...');

        const { data, error } = await supabase.functions.invoke('generate-outfit', {
            body: {
                provider: 'nvidia',
                model: 'meta/llama-3.2-11b-vision-instruct',
                prompt: JSON.stringify({
                    system: systemPrompt,
                    user: `Create outfit suggestions for: ${occasion}`
                }),
                cost: 3
            }
        });

        if (error) throw error;

        const content = data.choices?.[0]?.message?.content || '';

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
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
