
// Mock the @google/generative-ai library
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
    generateContent: mockGenerateContent
}));

jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn(() => ({
        getGenerativeModel: mockGetGenerativeModel
    }))
}));

// Mock clinicalPrompt
jest.mock('@/lib/clinicalPrompt', () => ({
    generateClinicalPrompt: jest.fn(() => "mock prompt")
}));

import { runClinicalAnalysis } from '@/lib/llmClient';

describe('runClinicalAnalysis', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should call Gemini API and return parsed JSON', async () => {
        const mockResponseText = '{"analysis": "result"}';
        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => mockResponseText
            }
        });

        const result = await runClinicalAnalysis({ data: 'test' });

        expect(mockGetGenerativeModel).toHaveBeenCalledWith(expect.objectContaining({
            model: "gemini-1.5-pro",
            generationConfig: { responseMimeType: "application/json" }
        }));
        expect(mockGenerateContent).toHaveBeenCalledWith("mock prompt");
        expect(result).toEqual({ analysis: "result" });
    });

    it('should throw error if GEMINI_API_KEY is missing', async () => {
        process.env.GEMINI_API_KEY = '';
        await expect(runClinicalAnalysis({})).rejects.toThrow("GEMINI_API_KEY not set");
    });

    it('should throw error if Gemini API fails', async () => {
        mockGenerateContent.mockRejectedValue(new Error("API Error"));
        await expect(runClinicalAnalysis({})).rejects.toThrow("Gemini Analysis Failed: API Error");
    });
});
