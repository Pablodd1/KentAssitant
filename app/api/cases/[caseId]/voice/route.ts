import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transcribeAudioStub } from '@/lib/extraction';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: NextRequest, { params }: { params: { caseId: string } }) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio uploaded' }, { status: 400 });
        }

        // Save temp file (optional, just for stub)
        const bytes = await audioFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadDir = path.join(process.cwd(), 'uploads', params.caseId);
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (e) { }

        // Save live recording
        const filePath = path.join(uploadDir, `voice-${Date.now()}.webm`);
        await fs.writeFile(filePath, buffer);

        const text = await transcribeAudioStub(filePath);

        const transcript = await db.transcript.create({
            data: {
                caseId: params.caseId,
                source: 'LIVE_MIC',
                content: text
            }
        });

        return NextResponse.json({ transcript });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to save voice note' }, { status: 500 });
    }
}
