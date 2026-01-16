import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isDemoMode, getDemoAnalysis, getDemoCase } from '@/lib/demoData';

type RouteContext = {
    params: Promise<{ caseId: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
    const { caseId } = await context.params;
    
    if (isDemoMode) {
        const caseData = getDemoCase(caseId);
        
        // If case doesn't exist or hasn't been analyzed, return null to trigger analysis
        if (!caseData || caseData.status !== 'COMPLETED') {
            return NextResponse.json(null);
        }
        
        const analysis = getDemoAnalysis(caseId);
        
        return NextResponse.json({
            id: `analysis-${caseId}`,
            caseId: caseId,
            modelName: 'Gemini 1.5 Pro (Demo)',
            createdAt: new Date().toISOString(),
            parsed: analysis
        });
    }

    try {
        const result = await db.analysisRun.findFirst({
            where: { caseId: caseId },
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
        console.error('Error fetching results:', error);
        return NextResponse.json({ error: 'Error fetching results' }, { status: 500 });
    }
}
