import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildContext } from '@/lib/contextBuilder';
import { runClinicalAnalysis } from '@/lib/llmClient';
import { isDemoMode, getDemoAnalysis, updateDemoCase } from '@/lib/demoData';

type RouteContext = {
    params: Promise<{ caseId: string }>;
};

export async function POST(req: NextRequest, routeContext: RouteContext) {
    const { caseId } = await routeContext.params;
    
    // Demo mode handling
    if (isDemoMode) {
        // Update case status to COMPLETED
        updateDemoCase(caseId, { status: 'COMPLETED', updatedAt: new Date().toISOString() });
        // Return demo results based on caseId
        const analysis = getDemoAnalysis(caseId);
        return NextResponse.json(analysis);
    }
    
    try {
        // Update status
        await db.case.update({ where: { id: caseId }, data: { status: 'ANALYZING' } });

        const context = await buildContext(caseId);
        if (!context) throw new Error("Context build failed");

        const analysis = await runClinicalAnalysis(context);

        // Save
        await db.analysisRun.create({
            data: {
                caseId,
                modelName: 'Gemini 3 Pro (via 1.5-pro)',
                outputJson: JSON.stringify(analysis)
            }
        });

        await db.case.update({ where: { id: caseId }, data: { status: 'COMPLETED' } });

        return NextResponse.json(analysis);
    } catch (error: any) {
        console.error("Analysis Error:", error);
        try {
            await db.case.update({ where: { id: caseId }, data: { status: 'ERROR' } });
        } catch (updateError) {
            console.error("Failed to update case status:", updateError);
        }
        return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
    }
}
