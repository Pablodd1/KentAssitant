import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Saves a file to local storage.
 * On Vercel serverless, uses /tmp directory which is ephemeral.
 * For production, consider using cloud storage (S3, Vercel Blob, etc.)
 */
export async function saveFileLocal(file: File, caseId: string): Promise<{ path: string; size: number; mime: string; name: string }> {
    // file is a Web API File object from request.formData()
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use /tmp directory on Vercel for serverless compatibility
    // Note: /tmp is ephemeral and files will be lost between invocations
    const baseDir = process.env.VERCEL ? '/tmp' : process.cwd();
    const uploadDir = path.join(baseDir, 'uploads', caseId);
    
    try {
        await fs.mkdir(uploadDir, { recursive: true });
    } catch (e) {
        // Directory may already exist or permission issue
        console.warn('Could not create upload directory:', e);
    }

    const fileName = file.name;
    // Sanitize filename to prevent path traversal and other issues
    const safeName = fileName.replace(/[^a-z0-9._-]/gi, '_').substring(0, 100);
    const uniqueName = `${uuidv4()}-${safeName}`;
    const filePath = path.join(uploadDir, uniqueName);

    try {
        await fs.writeFile(filePath, buffer);
    } catch (writeError) {
        console.error('Failed to write file:', writeError);
        throw new Error('Failed to save uploaded file');
    }

    return {
        path: filePath,
        size: file.size,
        mime: file.type,
        name: fileName // Keep original name for display
    };
}

/**
 * Checks if file exists at given path
 */
export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Deletes a file at the given path
 */
export async function deleteFile(filePath: string): Promise<boolean> {
    try {
        await fs.unlink(filePath);
        return true;
    } catch {
        return false;
    }
}
