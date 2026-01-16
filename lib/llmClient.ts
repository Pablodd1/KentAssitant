export async function runClinicalAnalysis(contextJson: any): Promise<any> {
    const { generateClinicalPrompt } = await import('@/lib/clinicalPrompt');
    const prompt = generateClinicalPrompt(contextJson);
    const geminiKey = process.env.GEMINI_API_KEY;
    const openAIKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
        return callGemini(prompt, geminiKey);
    } else if (openAIKey) {
        return callOpenAI(prompt, openAIKey);
    } else {
        throw new Error("No API key found. Please set GEMINI_API_KEY or OPENAI_API_KEY.");
    }
}

async function callGemini(prompt: string, apiKey: string): Promise<any> {
    // Using gemini-1.5-pro (closest to 'Gemini 3 Pro request')
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API Error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("No response from Gemini");

    return parseJson(text);
}

async function callOpenAI(prompt: string, apiKey: string): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4-turbo", // or gpt-4o if available/preferred
            messages: [
                {
                    role: "system",
                    content: "You are a clinical assistant. You must output only valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.2,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI API Error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) throw new Error("No response from OpenAI");

    return parseJson(text);
}

function parseJson(text: string): any {
    try {
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse JSON:", text);
        throw new Error("Invalid JSON from LLM");
    }
}
