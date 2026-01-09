import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';

// Stub imports (User should install these)
// import pdf from 'pdf-parse';

export async function extractText(filePath: string, mimeType: string): Promise<string> {
    try {
        // Simple switch
        if (mimeType.includes('pdf')) {
            // Mock logic: reading raw buffer doesn't give text for PDF.
            return `[PDF Content Stub] Content of ${path.basename(filePath)}. (Install 'pdf-parse' to extract real text).`;
        }
        if (mimeType.includes('word') || mimeType.includes('officedocument')) {
            const buffer = await fs.readFile(filePath);
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        }
        if (mimeType.startsWith('image/')) {
            return `[OCR Stub] Image text from ${path.basename(filePath)}. (Connect OCR service).`;
        }
        if (mimeType.startsWith('text/')) {
            return await fs.readFile(filePath, 'utf-8');
        }

        return `[Unknown File Type] ${mimeType}`;
    } catch (e) {
        console.error("Extraction error", e);
        return "Error extracting text.";
    }
}

export async function transcribeAudioStub(filePath: string): Promise<string> {
    // In a real app, send to OpenAI Whisper or Google Speech API
    return `[Transcription Stub] Audio content from ${path.basename(filePath)}. (Connect Speech-to-Text API).`;
}
