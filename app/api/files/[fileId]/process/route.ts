import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractText, transcribeAudioStub } from '@/lib/extraction';
import { checkRateLimit, logAuditEvent } from '@/lib/security';

const isDemoMode = !process.env.DATABASE_URL;

type RouteContext = {
    params: Promise<{ fileId: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Rate limiting for file processing
    const rateLimit = checkRateLimit(`process:${clientIp}`, 50, 60 * 1000);
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: 'Too many processing requests. Please wait before trying again.' },
            { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString() } }
        );
    }
    
    const { fileId } = await context.params;
    
    // Validate fileId format
    const uuidRegex = /^[a-f0-9-]{8,}$/i;
    if (!fileId || (!uuidRegex.test(fileId) && !fileId.startsWith('demo-file-'))) {
        return NextResponse.json({ error: 'Invalid file ID format' }, { status: 400 });
    }
    
    // Demo mode - return mock success
    if (isDemoMode) {
        return NextResponse.json({ 
            success: true, 
            message: 'Demo mode - file processing simulated'
        });
    }
    
    try {
        const file = await db.file.findUnique({ where: { id: fileId } });
        if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

        let content = "";
        let type = "TEXT";

        // Update status to EXTRACTING
        await db.file.update({ where: { id: file.id }, data: { status: "EXTRACTING" } });

        if (file.mimeType.startsWith('audio/') || file.mimeType.startsWith('video/')) {
            content = await transcribeAudioStub(file.storagePath);
            type = "TRANSCRIPT";
        } else if (file.mimeType.startsWith('image/')) {
            content = await extractText(file.storagePath, file.mimeType);
            type = "OCR";
        } else {
            content = await extractText(file.storagePath, file.mimeType);
            type = "TEXT";
        }

        // Save artifact
        await db.extractionArtifact.create({
            data: {
                fileId: file.id,
                type: type,
                content: content,
                status: "COMPLETED"
            }
        });

        // Update file status
        await db.file.update({
            where: { id: file.id },
            data: { status: "READY" }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Processing error:", error);
        // Update file status to ERROR on failure
        try {
            await db.file.update({
                where: { id: fileId },
                data: { status: "ERROR" }
            });
        } catch (updateError) {
            console.error("Failed to update file status to ERROR:", updateError);
        }
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}
