import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { generateClinicalPrompt } from '@/lib/clinicalPrompt';

export async function runClinicalAnalysis(contextJson: any): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
        }
    });

    const prompt = generateClinicalPrompt(contextJson);

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (!text) throw new Error("No response from Gemini");

        // The responseMimeType: "application/json" should return a valid JSON string
        // but we still parse it to ensure it's an object and handle potential wrapping
        // Although with "application/json" it usually returns raw JSON.
        // cleanJson might be needed if it wraps in markdown blocks.
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);

    } catch (e: any) {
        console.error("Gemini API Error:", e);
        throw new Error(`Gemini Analysis Failed: ${e.message}`);
    }
}
