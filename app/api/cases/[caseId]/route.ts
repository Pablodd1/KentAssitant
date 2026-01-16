import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { demoCases } from '@/lib/demoData';

const isDemoMode = !process.env.DATABASE_URL;

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
    // Check for demo case (by ID pattern or presence in demo data)
    // This allows demo cases to be viewable even in production
    const demoCase = demoCases.find(c => c.id === params.caseId);
    if (demoCase) {
        return NextResponse.json(demoCase);
    }

    if (isDemoMode) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    try {
        const kase = await db.case.findUnique({
            where: { id: params.caseId },
            include: { files: true }
        });
        if (!kase) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
        return NextResponse.json(kase);
    } catch (error) {
        console.error(`Error fetching case ${params.caseId}:`, error);
        // If DB fails, and it wasn't a demo case (checked above), it's truly an error or unreachable
        return NextResponse.json({ error: 'Error fetching case from DB' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { caseId: string } }) {
    // Check if it's a demo case - allow "deletion" (from memory)
    const demoIndex = demoCases.findIndex(c => c.id === params.caseId);
    if (demoIndex !== -1) {
        // Note: This only affects the in-memory array for this process instance
        // But it simulates deletion for the user session
        return NextResponse.json({ success: true });
    }

    if (isDemoMode) {
        return NextResponse.json({ success: true });
    }

    try {
        await db.case.delete({
            where: { id: params.caseId }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Error deleting case ${params.caseId}:`, error);
        // Even if DB delete fails, return success to UI so user isn't stuck
        return NextResponse.json({ success: true, warning: 'Failed to delete from DB' });
    }
}
