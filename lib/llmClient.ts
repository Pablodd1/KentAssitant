export async function runClinicalAnalysis(contextJson: any): Promise<any> {
    const { generateClinicalPrompt } = await import('@/lib/clinicalPrompt');
    const prompt = generateClinicalPrompt(contextJson);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    // Using gemini-3-pro-preview as requested
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`, {
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

    try {
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse JSON:", text);
        throw new Error("Invalid JSON from LLM");
    }
}
