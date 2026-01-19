import fs from 'fs/promises';
import path from 'path';

export async function extractText(filePath: string, mimeType: string): Promise<string> {
    try {
        // PDF extraction
        if (mimeType.includes('pdf')) {
            try {
                const pdfParse = require('pdf-parse');
                const dataBuffer = await fs.readFile(filePath);
                const data = await pdfParse(dataBuffer);
                if (data.text && data.text.trim().length > 0) {
                    return data.text;
                }
                return `[PDF] ${data.numpages} pages extracted. Content may be image-based (OCR required).`;
            } catch (pdfError: any) {
                if (pdfError.code === 'MODULE_NOT_FOUND') {
                    return `[PDF Content] File: ${path.basename(filePath)}. Install 'pdf-parse' for text extraction.`;
                }
                console.error('PDF extraction error:', pdfError);
                return `[PDF Error] Could not extract text from ${path.basename(filePath)}. File may be corrupted or password-protected.`;
            }
        }
        
        // Word document extraction
        if (mimeType.includes('word') || mimeType.includes('officedocument.wordprocessingml')) {
            try {
                const mammoth = require('mammoth');
                const dataBuffer = await fs.readFile(filePath);
                const result = await mammoth.extractRawText({ buffer: dataBuffer });
                if (result.value && result.value.trim().length > 0) {
                    return result.value;
                }
                return `[DOCX] Document extracted but contains no text content.`;
            } catch (docxError: any) {
                if (docxError.code === 'MODULE_NOT_FOUND') {
                    return `[DOCX Content] File: ${path.basename(filePath)}. Install 'mammoth' for text extraction.`;
                }
                console.error('DOCX extraction error:', docxError);
                return `[DOCX Error] Could not extract text from ${path.basename(filePath)}.`;
            }
        }
        
        // Image files - would need OCR service
        if (mimeType.startsWith('image/')) {
            return `[Image] ${path.basename(filePath)} - OCR processing would be needed for text extraction. Consider using a service like Google Cloud Vision or AWS Textract.`;
        }
        
        // Plain text files
        if (mimeType.startsWith('text/') || mimeType === 'application/json') {
            const content = await fs.readFile(filePath, 'utf-8');
            return content;
        }

        return `[Unsupported] File type ${mimeType} - ${path.basename(filePath)}`;
    } catch (e) {
        console.error("Extraction error:", e);
        return `[Error] Failed to extract text from ${path.basename(filePath)}: ${e instanceof Error ? e.message : 'Unknown error'}`;
    }
}

export async function transcribeAudioStub(filePath: string): Promise<string> {
    // In a real implementation, this would send to OpenAI Whisper API or Google Speech-to-Text
    const filename = path.basename(filePath);
    return `[Audio Transcription] File: ${filename}

This audio file has been uploaded successfully. To enable actual transcription:

1. **OpenAI Whisper API**: Add OPENAI_API_KEY to environment and implement Whisper transcription
2. **Google Speech-to-Text**: Add Google Cloud credentials and implement Speech API

For now, please manually review the audio content and add any relevant notes using the Voice Capture feature.

File details:
- Filename: ${filename}
- Upload time: ${new Date().toISOString()}
`;
}

// Helper function to get file type description
export function getFileTypeDescription(mimeType: string): string {
    const typeMap: Record<string, string> = {
        'application/pdf': 'PDF Document',
        'application/msword': 'Word Document (DOC)',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document (DOCX)',
        'image/jpeg': 'JPEG Image',
        'image/png': 'PNG Image',
        'image/gif': 'GIF Image',
        'audio/mpeg': 'MP3 Audio',
        'audio/wav': 'WAV Audio',
        'audio/webm': 'WebM Audio',
        'video/mp4': 'MP4 Video',
        'video/webm': 'WebM Video',
        'text/plain': 'Plain Text'
    };
    return typeMap[mimeType] || mimeType;
}
