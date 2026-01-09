import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import OpenAI from 'openai';

// Stub imports (User should install these)
// import pdf from 'pdf-parse';
// import mammoth from 'mammoth';

export async function extractText(filePath: string, mimeType: string): Promise<string> {
    try {
        // Simple switch
        if (mimeType.includes('pdf')) {
            // Mock logic: reading raw buffer doesn't give text for PDF.
            return `[PDF Content Stub] Content of ${path.basename(filePath)}. (Install 'pdf-parse' to extract real text).`;
        }
        if (mimeType.includes('word') || mimeType.includes('officedocument')) {
            return `[DOCX Content Stub] Content of ${path.basename(filePath)}. (Install 'mammoth' to extract real text).`;
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

export async function transcribeAudio(filePath: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.warn("OPENAI_API_KEY not found, returning stub.");
        return `[Transcription Stub] Audio content from ${path.basename(filePath)}. (Connect Speech-to-Text API).`;
    }

    try {
        const openai = new OpenAI({ apiKey });
        const transcription = await openai.audio.transcriptions.create({
            file: createReadStream(filePath),
            model: "whisper-1",
        });

        return transcription.text;
    } catch (error) {
        console.error("OpenAI Transcription error:", error);
        return `[Transcription Error] Could not transcribe ${path.basename(filePath)}.`;
    }
}
