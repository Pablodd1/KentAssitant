export async function runClinicalAnalysis(contextJson: any): Promise<any> {
    const { generateClinicalPrompt } = await import('@/lib/clinicalPrompt');
    const prompt = generateClinicalPrompt(contextJson);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) throw new Error("OPENAI_API_KEY not set");

    // Using OpenAI GPT-4 for clinical analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
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

    try {
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse JSON:", text);
        throw new Error("Invalid JSON from LLM");
    }
}
