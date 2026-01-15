import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function extractText(filePath: string, mimeType: string): Promise<string> {
    try {
        if (mimeType.includes('pdf')) {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdf(dataBuffer);
            return data.text;
        }
        if (mimeType.includes('word') || mimeType.includes('officedocument')) {
            const result = await mammoth.extractRawText({ path: filePath });
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
