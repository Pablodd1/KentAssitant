import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transcribeAudioStub } from '@/lib/extraction';
import { checkRateLimit, logAuditEvent } from '@/lib/security';
import path from 'path';
import fs from 'fs/promises';

const isDemoMode = !process.env.DATABASE_URL;

// Audio file validation
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg'];
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB max

type RouteContext = {
    params: Promise<{ caseId: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Rate limiting for voice uploads
    const rateLimit = checkRateLimit(`voice:${clientIp}`, 20, 60 * 1000); // 20 uploads per minute
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: 'Too many voice upload requests. Please wait before trying again.' },
            { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString() } }
        );
    }
    
    const { caseId } = await context.params;
    
    // Validate caseId format
    const uuidRegex = /^[a-f0-9-]{8,}$/i;
    if (!caseId || (!uuidRegex.test(caseId) && !caseId.startsWith('case-'))) {
        return NextResponse.json({ error: 'Invalid case ID format' }, { status: 400 });
    }
    
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio uploaded' }, { status: 400 });
        }
        
        // Validate audio file
        if (audioFile.size > MAX_AUDIO_SIZE) {
            return NextResponse.json({ error: 'Audio file too large. Maximum size is 25MB.' }, { status: 400 });
        }
        
        // Check MIME type (be lenient for browser-recorded audio)
        const isValidAudio = ALLOWED_AUDIO_TYPES.some(type => audioFile.type.startsWith(type.split('/')[0]));
        if (!isValidAudio && audioFile.type && !audioFile.type.startsWith('audio/')) {
            return NextResponse.json({ error: 'Invalid audio file type' }, { status: 400 });
        }

        // Demo mode - return a mock transcript
        if (isDemoMode) {
            const mockTranscript = {
                id: `transcript-${Date.now()}`,
                caseId: caseId,
                source: 'LIVE_MIC',
                content: '[Demo Mode] Voice recording received. Connect database to save transcriptions. Sample transcript: Patient reports mild fatigue and occasional headaches over the past two weeks.',
                createdAt: new Date().toISOString()
            };
            return NextResponse.json({ transcript: mockTranscript });
        }

        // Save temp file (optional, just for stub)
        const bytes = await audioFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Use /tmp directory for Vercel serverless compatibility
        const uploadDir = process.env.VERCEL 
            ? path.join('/tmp', 'uploads', caseId)
            : path.join(process.cwd(), 'uploads', caseId);
            
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (e) { 
            // Directory may already exist
        }

        // Save live recording
        const filePath = path.join(uploadDir, `voice-${Date.now()}.webm`);
        await fs.writeFile(filePath, buffer);

        const text = await transcribeAudioStub(filePath);

        const transcript = await db.transcript.create({
            data: {
                caseId: caseId,
                source: 'LIVE_MIC',
                content: text
            }
        });

        // Audit log success
        logAuditEvent({
            action: 'VOICE_UPLOAD',
            caseId,
            resourceType: 'transcript',
            resourceId: transcript.id,
            ipAddress: clientIp,
            userAgent,
            status: 'success'
        });
        
        return NextResponse.json({ transcript });
    } catch (error) {
        console.error('Voice upload error:', error);
        
        logAuditEvent({
            action: 'VOICE_UPLOAD',
            caseId,
            resourceType: 'transcript',
            ipAddress: clientIp,
            userAgent,
            status: 'failure',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        
        return NextResponse.json({ error: 'Failed to save voice note' }, { status: 500 });
    }
}
