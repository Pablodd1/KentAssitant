import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transcribeAudioStub } from '@/lib/extraction';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export async function POST(req: NextRequest, { params }: { params: { caseId: string } }) {
    let tempDir: string | null = null;
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio uploaded' }, { status: 400 });
        }

        // Save temp file (improved handling using os.tmpdir)
        const bytes = await audioFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create a unique temporary directory
        const tempPrefix = path.join(os.tmpdir(), 'voice-upload-');
        tempDir = await fs.mkdtemp(tempPrefix);

        // Save live recording to the temp directory
        const filePath = path.join(tempDir, `voice-${Date.now()}.webm`);
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
    } finally {
        // Cleanup temp directory and file
        if (tempDir) {
            try {
                await fs.rm(tempDir, { recursive: true, force: true });
            } catch (e) {
                console.error("Failed to cleanup temp dir:", e);
            }
        }
    }
}
