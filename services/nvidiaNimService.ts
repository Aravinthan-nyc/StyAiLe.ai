/**
 * NVIDIA NIM Service
 * Uses nemotron-nano-12b-v2-vl for image analysis and context-aware chat
 */

const NVIDIA_API_KEY = import.meta.env.VITE_NVIDIA_API_KEY || '';
const NVIDIA_MODEL = import.meta.env.VITE_NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct';
// Use Vite proxy to bypass CORS - requests to /api/nvidia are proxied to https://integrate.api.nvidia.com
const NVIDIA_API_BASE = '/api/nvidia/v1';

// Log API key status for debugging
if (!NVIDIA_API_KEY) {
    console.warn('⚠️ NVIDIA API not configured. AI features will be limited until you add credentials in Settings.');
} else {
    console.log('✅ NVIDIA API key loaded successfully');
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
 * Analyze a clothing image using NVIDIA NIM
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

    console.log('🔍 NVIDIA NIM: Starting image analysis...');
    console.log('📊 API Base:', NVIDIA_API_BASE);
    console.log('🤖 Model:', NVIDIA_MODEL);
    console.log('🔑 API Key present:', !!NVIDIA_API_KEY);
    console.log('🔑 API Key (first 20 chars):', NVIDIA_API_KEY.substring(0, 20) + '...');

    try {
        const requestBody = {
            model: NVIDIA_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: userPrompt },
                        { type: 'image_url', image_url: { url: imageData } }
                    ]
                }
            ],
            max_tokens: 500,
            temperature: 0.3,
        };

        console.log('📤 Request body:', JSON.stringify(requestBody, null, 2).substring(0, 500) + '...');

        const response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        console.log('📡 Response Status:', response.status, response.statusText);
        console.log('📡 Response Headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ NVIDIA API Error Response:', errorText);
            throw new Error(`NVIDIA API error (${response.status}): ${errorText.substring(0, 300)}`);
        }

        const data = await response.json();
        console.log('✅ Full API Response:', JSON.stringify(data, null, 2));

        const content = data.choices?.[0]?.message?.content || '';
        console.log('📝 AI Content:', content);

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('❌ No JSON found in response. Full content:', content);
            throw new Error(`AI did not return valid JSON. Response was: ${content.substring(0, 200)}`);
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
        console.error('❌ NVIDIA NIM Complete Error Details:');
        console.error('  - Error Name:', error.name);
        console.error('  - Error Message:', error.message);
        console.error('  - Error Stack:', error.stack);

        // Throw the error so it shows in the UI
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
        const response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: NVIDIA_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: question }
                ],
                max_tokens: 800,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('NVIDIA API error:', response.status, errorText);
            throw new Error(`NVIDIA API error: ${response.status}`);
        }

        const data = await response.json();
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
        const response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: NVIDIA_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Create outfit suggestions for: ${occasion}` }
                ],
                max_tokens: 1000,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            throw new Error(`NVIDIA API error: ${response.status}`);
        }

        const data = await response.json();
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
