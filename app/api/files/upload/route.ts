import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { saveFileLocal } from '@/lib/storage';
import { isDemoMode, addFileToDemoCase } from '@/lib/demoData';

export async function POST(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const caseId = searchParams.get('caseId');

        if (!caseId) {
            return NextResponse.json({ error: 'Missing caseId' }, { status: 400 });
        }

        const formData = await req.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
        }

        // Demo mode - return mock file records
        if (isDemoMode) {
            const mockFiles = [];
            for (let index = 0; index < files.length; index++) {
                const file = files[index];
                // Try to save locally even in demo mode to support extraction
                let storedPath = `/tmp/demo/${file.name}`;
                try {
                    const stored = await saveFileLocal(file, caseId);
                    storedPath = stored.path;
                } catch (e) {
                    console.warn("Failed to save demo file locally", e);
                }

                const demoFile = {
                    id: `demo-file-${Date.now()}-${index}`,
                    caseId: caseId,
                    filename: file.name,
                    mimeType: file.type,
                    size: file.size,
                    storagePath: storedPath,
                    status: 'READY',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                addFileToDemoCase(caseId, demoFile);
                mockFiles.push(demoFile);
            }

            return NextResponse.json({ 
                files: mockFiles,
                message: 'Demo mode - files simulated (not persisted)'
            });
        }

        const savedFiles = [];

        for (let index = 0; index < files.length; index++) {
            const file = files[index];
            const stored = await saveFileLocal(file, caseId);

            try {
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
            } catch (dbError) {
                console.error('DB Create File Error, fallback to demo:', dbError);
                // Fallback: create demo file entry
                const demoFile = {
                    id: `demo-file-${Date.now()}-${index}`,
                    caseId: caseId,
                    filename: stored.name,
                    mimeType: stored.mime,
                    size: stored.size,
                    storagePath: stored.path,
                    status: 'READY',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                addFileToDemoCase(caseId, demoFile);
                savedFiles.push(demoFile);
            }
        }

        return NextResponse.json({ files: savedFiles });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
