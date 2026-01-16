import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transcribeAudioStub } from '@/lib/extraction';
import path from 'path';
import fs from 'fs/promises';

const isDemoMode = !process.env.DATABASE_URL;

type RouteContext = {
    params: Promise<{ caseId: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
    const { caseId } = await context.params;
    
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio uploaded' }, { status: 400 });
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

        return NextResponse.json({ transcript });
    } catch (error) {
        console.error('Voice upload error:', error);
        return NextResponse.json({ error: 'Failed to save voice note' }, { status: 500 });
    }
}
