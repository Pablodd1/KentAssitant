import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function saveFileLocal(file: File, caseId: string): Promise<{ path: string; size: number; mime: string; name: string }> {
    // file is a Web API File object from request.formData()
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    // Note: In a production "medical grade" deployment, files should be stored in an encrypted S3 bucket or similar Blob storage
    // with strict access controls and audit logging. Local storage is for development only.
    const uploadDir = path.join(process.cwd(), 'uploads', caseId);
    try {
        await fs.mkdir(uploadDir, { recursive: true });
    } catch (e) {
        // ignore if exists
    }

    const fileName = file.name;
    // Sanitize filename to prevent issues
    const ext = path.extname(fileName);
    const uniqueId = uuidv4();
    const safeName = `${uniqueId}${ext}`;
    const filePath = path.join(uploadDir, safeName);

    await fs.writeFile(filePath, buffer);

    return {
        path: filePath,
        size: file.size,
        mime: file.type,
        name: fileName // Keep original name for display, but store securely with UUID
    };
}
