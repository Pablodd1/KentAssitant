
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function runClinicalAnalysis(contextJson: any): Promise<any> {
    const { generateClinicalPrompt } = await import('@/lib/clinicalPrompt');
    const prompt = generateClinicalPrompt(contextJson);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("GEMINI_API_KEY not set");
        throw new Error("GEMINI_API_KEY not set");
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-1.5-pro as requested (or flash if preferred for speed, but pro for clinical)
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text) throw new Error("No response from Gemini");

        return JSON.parse(text);
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        throw new Error(`Gemini Analysis Failed: ${error.message}`);
    }
}
