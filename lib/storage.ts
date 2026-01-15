import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function saveFileLocal(file: File, caseId: string): Promise<{ path: string; size: number; mime: string; name: string }> {
    // file is a Web API File object from request.formData()
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'uploads', caseId);
    try {
        await fs.mkdir(uploadDir, { recursive: true });
    } catch (e) {
        // ignore if exists
    }

    const fileName = file.name;
    const extension = path.extname(fileName) || '';
    // Use uuid for unique filename
    const uniqueName = `${uuidv4()}${extension}`;
    const filePath = path.join(uploadDir, uniqueName);

    await fs.writeFile(filePath, buffer);

    return {
        path: filePath,
        size: file.size,
        mime: file.type,
        name: fileName // Keep original name for display
    };
}
