import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { demoAnalysisResults } from '@/lib/demoData';

const isDemoMode = !process.env.DATABASE_URL;

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
    // Check for demo results first
    const demoResult = demoAnalysisResults[params.caseId];
    if (demoResult) {
        let parsed;
        try {
            parsed = JSON.parse(demoResult.outputJson);
        } catch {
            parsed = {};
        }
        
        return NextResponse.json({
            ...demoResult,
            parsed
        });
    }

    if (isDemoMode) {
        return NextResponse.json(null);
    }

    try {
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
    } catch (error) {
        console.error('Error fetching results from DB:', error);
        // Fallback: If DB fails, and no demo result was found (checked earlier), return null to let UI handle "No analysis"
        return NextResponse.json(null);
    }
}
