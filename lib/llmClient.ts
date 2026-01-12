import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Medical grade schema for stricter output validation
const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        executiveSummary: { type: SchemaType.STRING },
        dataExtraction: {
            type: SchemaType.OBJECT,
            properties: {
                demographics: { type: SchemaType.STRING },
                vitalSigns: { type: SchemaType.STRING }
            }
        },
        abnormalFindings: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        systemCorrelations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        medicationImpacts: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    medication: { type: SchemaType.STRING },
                    intended: { type: SchemaType.STRING },
                    possibleSideEffects: { type: SchemaType.STRING },
                    nutrientDepletions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                }
            }
        },
        redFlags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        providerDataGaps: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    missingItem: { type: SchemaType.STRING },
                    whyItMatters: { type: SchemaType.STRING },
                    suggestedQuestion: { type: SchemaType.STRING }
                }
            }
        },
        telehealthQuestionSet: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        diagnosticRecommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        therapeuticRecommendations: {
            type: SchemaType.OBJECT,
            properties: {
                medications: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                supplements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                lifestyle: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                biohacking: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            }
        },
        furtherStudyRecommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        followUpMetrics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        icd10: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        cpt: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        qualityCheck: {
            type: SchemaType.OBJECT,
            properties: {
                assumptions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                confidence: { type: SchemaType.STRING },
                whatWouldChangeConclusion: { type: SchemaType.STRING }
            }
        }
    }
};

export async function runClinicalAnalysis(contextJson: any): Promise<any> {
    const { generateClinicalPrompt } = await import('@/lib/clinicalPrompt');
    const prompt = generateClinicalPrompt(contextJson);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
                // responseSchema: responseSchema // Note: Schema validation is optional but recommended for medical grade
            }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text) throw new Error("No response from Gemini");

        try {
            // SDK normally handles JSON cleaning if responseMimeType is json, but we double check
            return JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse JSON:", text);
            // Fallback cleanup if needed, though 1.5 Pro is usually good with JSON mode
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        }

    } catch (e: any) {
        console.error("Gemini API Error:", e);
        throw new Error(`Clinical Analysis Failed: ${e.message}`);
    }
}
