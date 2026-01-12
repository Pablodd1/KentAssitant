
import { extractText } from '../lib/extraction';
import fs from 'fs/promises';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('pdf-parse');
jest.mock('mammoth');

describe('Extraction Logic', () => {
    const mockFilePath = '/tmp/test-file';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('extracts text from PDF', async () => {
        (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('pdf-content'));
        (pdf as jest.Mock).mockResolvedValue({ text: 'Extracted PDF Text' });

        const result = await extractText(mockFilePath, 'application/pdf');

        expect(fs.readFile).toHaveBeenCalledWith(mockFilePath);
        expect(pdf).toHaveBeenCalled();
        expect(result).toContain('Extracted PDF Text');
        expect(result).toContain('--- PDF Content');
    });

    test('extracts text from DOCX', async () => {
        (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('docx-content'));
        (mammoth.extractRawText as jest.Mock).mockResolvedValue({ value: 'Extracted DOCX Text' });

        const result = await extractText(mockFilePath, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        expect(fs.readFile).toHaveBeenCalledWith(mockFilePath);
        expect(mammoth.extractRawText).toHaveBeenCalled();
        expect(result).toContain('Extracted DOCX Text');
        expect(result).toContain('--- DOCX Content');
    });

    test('handles text files', async () => {
        (fs.readFile as jest.Mock).mockResolvedValue('Simple Text Content');

        const result = await extractText(mockFilePath, 'text/plain');

        expect(fs.readFile).toHaveBeenCalledWith(mockFilePath, 'utf-8');
        expect(result).toBe('Simple Text Content');
    });

    test('handles image files (placeholder)', async () => {
        const result = await extractText(mockFilePath, 'image/png');
        expect(result).toContain('[IMAGE FILE]');
    });

    test('handles unknown file types', async () => {
        const result = await extractText(mockFilePath, 'application/octet-stream');
        expect(result).toContain('[Unknown File Type]');
    });

    test('handles errors gracefully', async () => {
        (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

        const result = await extractText(mockFilePath, 'text/plain');

        expect(result).toContain('Error extracting text');
    });
});
