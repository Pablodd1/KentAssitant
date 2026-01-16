import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { saveFileLocal } from '@/lib/storage';

const isDemoMode = !process.env.DATABASE_URL;

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
            const mockFiles = files.map((file, index) => ({
                id: `demo-file-${Date.now()}-${index}`,
                caseId: caseId,
                filename: file.name,
                mimeType: file.type,
                size: file.size,
                storagePath: `/tmp/demo/${file.name}`,
                status: 'READY',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));
            return NextResponse.json({ 
                files: mockFiles,
                message: 'Demo mode - files simulated (not persisted)'
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

        return NextResponse.json({ files: savedFiles });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
