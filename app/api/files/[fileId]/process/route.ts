import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractText, transcribeAudioStub } from '@/lib/extraction';

export async function POST(req: NextRequest, { params }: { params: { fileId: string } }) {
    try {
        const file = await db.file.findUnique({ where: { id: params.fileId } });
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
                where: { id: params.fileId },
                data: { status: "ERROR" }
            });
        } catch (updateError) {
            console.error("Failed to update file status to ERROR:", updateError);
        }
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}
