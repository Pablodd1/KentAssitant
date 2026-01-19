import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { saveFileLocal } from '@/lib/storage';
import { checkRateLimit, logAuditEvent } from '@/lib/security';

const isDemoMode = !process.env.DATABASE_URL;

// Allowed file types for medical documents
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'video/mp4',
    'video/webm',
    'text/plain'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
const MAX_FILES_PER_UPLOAD = 10;

export async function POST(req: NextRequest) {
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Rate limiting for file uploads
    const rateLimit = checkRateLimit(`upload:${clientIp}`, 30, 60 * 1000); // 30 uploads per minute
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: 'Too many upload requests. Please wait before uploading more files.' },
            { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString() } }
        );
    }
    
    try {
        const searchParams = req.nextUrl.searchParams;
        const caseId = searchParams.get('caseId');

        if (!caseId) {
            return NextResponse.json({ error: 'Missing caseId' }, { status: 400 });
        }
        
        // Validate caseId format
        const uuidRegex = /^[a-f0-9-]{8,}$/i;
        if (!uuidRegex.test(caseId) && !caseId.startsWith('case-')) {
            return NextResponse.json({ error: 'Invalid case ID format' }, { status: 400 });
        }

        const formData = await req.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
        }
        
        // Validate file count
        if (files.length > MAX_FILES_PER_UPLOAD) {
            return NextResponse.json({ error: `Maximum ${MAX_FILES_PER_UPLOAD} files allowed per upload` }, { status: 400 });
        }
        
        // Validate each file
        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json({ error: `File "${file.name}" exceeds maximum size of 50MB` }, { status: 400 });
            }
            
            if (!ALLOWED_MIME_TYPES.includes(file.type)) {
                return NextResponse.json({ 
                    error: `File type "${file.type}" not allowed. Allowed: PDF, Word, Images, Audio, Video, Text` 
                }, { status: 400 });
            }
        }

        // Demo mode - add files to demo case
        if (isDemoMode) {
            const { addFileToDemoCase, getDemoCase } = await import('@/lib/demoData');
            
            // Ensure the case exists
            const demoCase = getDemoCase(caseId);
            if (!demoCase) {
                return NextResponse.json({ error: 'Case not found' }, { status: 404 });
            }
            
            const mockFiles = [];
            for (let index = 0; index < files.length; index++) {
                const file = files[index];
                const mockFile = {
                    id: `demo-file-${Date.now()}-${index}`,
                    caseId: caseId,
                    filename: file.name,
                    mimeType: file.type,
                    size: file.size,
                    storagePath: `/tmp/demo/${file.name}`,
                    status: 'READY',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                // Add file to the demo case
                addFileToDemoCase(caseId, mockFile);
                mockFiles.push(mockFile);
            }
            
            return NextResponse.json({ 
                files: mockFiles,
                message: 'Demo mode - files added to case'
            });
        }

        const savedFiles = [];

        for (const file of files) {
            const stored = await saveFileLocal(file, caseId);

            const dbFile = await db.file.create({
                data: {
                    caseId: caseId,
                    filename: stored.name,
                    mimeType: stored.mime,
                    size: stored.size,
                    storagePath: stored.path,
                    status: 'UPLOADED'
                }
            });
            savedFiles.push(dbFile);
        }

        // Audit log for success
        logAuditEvent({
            action: 'UPLOAD_FILES',
            caseId,
            resourceType: 'file',
            ipAddress: clientIp,
            userAgent,
            status: 'success'
        });
        
        return NextResponse.json({ files: savedFiles });
    } catch (error) {
        console.error('Upload error:', error);
        
        logAuditEvent({
            action: 'UPLOAD_FILES',
            resourceType: 'file',
            ipAddress: clientIp,
            userAgent,
            status: 'failure',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
