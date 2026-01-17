import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isDemoMode, getDemoCase, deleteDemoCase } from '@/lib/demoData';

type RouteContext = {
    params: Promise<{ caseId: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
    const { caseId } = await context.params;
    
    if (isDemoMode) {
        const kase = getDemoCase(caseId);
        if (!kase) {
            return NextResponse.json({ error: 'Case not found' }, { status: 404 });
        }
        return NextResponse.json(kase);
    }

    try {
        const kase = await db.case.findUnique({
            where: { id: caseId },
            include: { files: true }
        });
        if (!kase) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
        return NextResponse.json(kase);
    } catch (error) {
        console.error(`Error fetching case ${caseId} (DB failed), falling back to demo:`, error);

        const kase = getDemoCase(caseId);
        if (!kase) {
            return NextResponse.json({ error: 'Case not found' }, { status: 404 });
        }
        return NextResponse.json(kase);
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    const { caseId } = await context.params;
    
    if (isDemoMode) {
        deleteDemoCase(caseId);
        return NextResponse.json({ success: true });
    }

    try {
        await db.case.delete({
            where: { id: caseId }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Error deleting case ${caseId} (DB failed), falling back to demo:`, error);

        deleteDemoCase(caseId);
        return NextResponse.json({ success: true, warning: 'Operated on demo data due to DB failure' });
    }
}
