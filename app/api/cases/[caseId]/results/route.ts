import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
    const result = await db.analysisRun.findFirst({
        where: { caseId: params.caseId },
        orderBy: { createdAt: 'desc' }
    });

    if (!result) return NextResponse.json(null);

    let parsedData;
    try {
        parsedData = JSON.parse(result.outputJson);
    } catch (parseError) {
        console.error("Error parsing analysis result JSON:", parseError);
        return NextResponse.json({ error: 'Invalid analysis result format' }, { status: 500 });
    }

    return NextResponse.json({
        ...result,
        parsed: parsedData
    });
}
