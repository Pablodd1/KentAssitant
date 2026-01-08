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
        return NextResponse.json({ error: 'Error fetching case' }, { status: 500 });
    }
}
