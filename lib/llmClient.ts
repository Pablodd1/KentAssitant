/**
 * LLM Client for Clinical Analysis
 * Supports both Google Gemini API and OpenAI API
 * Priority: GEMINI_API_KEY > OPENAI_API_KEY
 */

type LLMProvider = 'gemini' | 'openai';

interface LLMConfig {
    provider: LLMProvider;
    apiKey: string;
    model: string;
}

function getLLMConfig(): LLMConfig {
    // Check for Google/Gemini API key first (primary)
    // Supports multiple common naming conventions
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (geminiKey) {
        return {
            provider: 'gemini',
            apiKey: geminiKey,
            model: 'gemini-1.5-pro'
        };
    }

    // Fallback to OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
        return {
            provider: 'openai',
            apiKey: openaiKey,
            model: 'gpt-4o'
        };
    }

    throw new Error("No LLM API key configured. Set GOOGLE_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in environment variables.");
}

async function callGeminiAPI(prompt: string, apiKey: string, model: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `You are a clinical intelligence assistant. Always respond with valid JSON only, no markdown formatting or code blocks.\n\n${prompt}`
                }]
            }],
            generationConfig: {
                temperature: 0.2,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
                responseMimeType: "application/json"
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error Response:", errorText);
        throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Handle Gemini response structure
    const candidate = data.candidates?.[0];
    if (!candidate) {
        console.error("No candidates in Gemini response:", JSON.stringify(data));
        throw new Error("No response candidates from Gemini API");
    }

    // Check for blocked content
    if (candidate.finishReason === 'SAFETY') {
        throw new Error("Content was blocked by Gemini safety filters");
    }

    const text = candidate.content?.parts?.[0]?.text;
    if (!text) {
        console.error("No text in Gemini response:", JSON.stringify(data));
        throw new Error("No text content in Gemini response");
    }

    return text;
}

async function callOpenAIAPI(prompt: string, apiKey: string, model: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a clinical intelligence assistant. Always respond with valid JSON only, no markdown formatting.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI API Error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) throw new Error("No response from OpenAI");

    return text;
}

export async function runClinicalAnalysis(contextJson: any): Promise<any> {
    const { generateClinicalPrompt } = await import('@/lib/clinicalPrompt');
    const prompt = generateClinicalPrompt(contextJson);
    
    const config = getLLMConfig();
    console.log(`Using LLM provider: ${config.provider} with model: ${config.model}`);

    let responseText: string;
    
    try {
        if (config.provider === 'gemini') {
            responseText = await callGeminiAPI(prompt, config.apiKey, config.model);
        } else {
            responseText = await callOpenAIAPI(prompt, config.apiKey, config.model);
        }
    } catch (error: any) {
        console.error(`${config.provider} API call failed:`, error);
        throw error;
    }

    // Parse the JSON response
    try {
        // Clean up any potential markdown formatting
        const cleanJson = responseText
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse JSON response:", responseText);
        throw new Error(`Invalid JSON from ${config.provider}: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
}

/**
 * Get the current LLM provider info (for display purposes)
 */
export function getLLMProviderInfo(): { provider: string; model: string } {
    try {
        const config = getLLMConfig();
        return { provider: config.provider, model: config.model };
    } catch {
        return { provider: 'none', model: 'none' };
    }
}
