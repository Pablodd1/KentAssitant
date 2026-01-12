import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function extractText(filePath: string, mimeType: string): Promise<string> {
    try {
        if (mimeType.includes('pdf')) {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdf(dataBuffer);
            return `--- PDF Content (${path.basename(filePath)}) ---\n${data.text}`;
        }
        if (mimeType.includes('word') || mimeType.includes('officedocument')) {
            const buffer = await fs.readFile(filePath);
            const result = await mammoth.extractRawText({ buffer: buffer });
            return `--- DOCX Content (${path.basename(filePath)}) ---\n${result.value}`;
        }
        if (mimeType.startsWith('image/')) {
            // In a real medical grade app, we would send this to Gemini Pro Vision directly.
            // For now, we return a placeholder that instructs the system this file exists.
            return `[IMAGE FILE] ${path.basename(filePath)} (Image analysis requires direct file input to LLM)`;
        }
        if (mimeType.startsWith('text/')) {
            return await fs.readFile(filePath, 'utf-8');
        }

        return `[Unknown File Type] ${mimeType}`;
    } catch (e) {
        console.error("Extraction error", e);
        return `Error extracting text from ${path.basename(filePath)}`;
    }
}

export async function transcribeAudioStub(filePath: string): Promise<string> {
    // In a real app, send to OpenAI Whisper or Google Speech API.
    // Since we are using Gemini, we can also use Gemini 1.5 Pro for audio if we send the file bytes.
    return `[Audio Stub] ${path.basename(filePath)}. (Audio analysis requires Speech-to-Text or Multimodal LLM input).`;
}
