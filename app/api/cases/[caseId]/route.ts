import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
    try {
        const kase = await db.case.findUnique({
            where: { id: params.caseId },
            include: { files: true }
        });
        if (!kase) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
        return NextResponse.json(kase);
    } catch (error) {
        console.error(`Error fetching case ${params.caseId}:`, error);
        return NextResponse.json({ error: 'Error fetching case' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { caseId: string } }) {
    try {
        // Delete the case - related records will be deleted via cascade
        await db.case.delete({
            where: { id: params.caseId }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Error deleting case ${params.caseId}:`, error);
        return NextResponse.json({ error: 'Error deleting case' }, { status: 500 });
    }
}
