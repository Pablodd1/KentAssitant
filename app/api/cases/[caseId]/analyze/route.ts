import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildContext } from '@/lib/contextBuilder';
import { runClinicalAnalysis } from '@/lib/llmClient';

export async function POST(req: NextRequest, { params }: { params: { caseId: string } }) {
    try {
        const { caseId } = params;

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
        await db.case.update({ where: { id: params.caseId }, data: { status: 'ERROR' } });
        return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
    }
}
