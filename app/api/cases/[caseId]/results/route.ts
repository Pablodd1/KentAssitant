import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
    const result = await db.analysisRun.findFirst({
        where: { caseId: params.caseId },
        orderBy: { createdAt: 'desc' }
    });

    if (!result) return NextResponse.json(null);

    return NextResponse.json({
        ...result,
        parsed: JSON.parse(result.outputJson)
    });
}
