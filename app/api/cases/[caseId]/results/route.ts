import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isDemoMode, getDemoAnalysis, getDemoCase } from '@/lib/demoData';
import { checkRateLimit, logAuditEvent } from '@/lib/security';

type RouteContext = {
    params: Promise<{ caseId: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Rate limiting
    const rateLimit = checkRateLimit(`results:${clientIp}`, 100, 60 * 1000);
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString() } }
        );
    }
    
    const { caseId } = await context.params;
    
    // Validate caseId format
    const uuidRegex = /^[a-f0-9-]{8,}$/i;
    if (!caseId || (!uuidRegex.test(caseId) && !caseId.startsWith('case-'))) {
        return NextResponse.json({ error: 'Invalid case ID format' }, { status: 400 });
    }
    
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
