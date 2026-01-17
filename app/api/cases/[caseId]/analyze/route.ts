import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildContext } from '@/lib/contextBuilder';
import { runClinicalAnalysis, getLLMProviderInfo } from '@/lib/llmClient';
import { isDemoMode, getDemoAnalysis, updateDemoCase } from '@/lib/demoData';
import { checkRateLimit, logAuditEvent } from '@/lib/security';

type RouteContext = {
    params: Promise<{ caseId: string }>;
};

// Rate limiting configuration for analysis (more restrictive)
const ANALYSIS_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ANALYSIS_REQUESTS = 10; // Max 10 analyses per minute

export async function POST(req: NextRequest, routeContext: RouteContext) {
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Rate limiting for expensive analysis operations
    const rateLimit = checkRateLimit(`analyze:${clientIp}`, MAX_ANALYSIS_REQUESTS, ANALYSIS_RATE_LIMIT_WINDOW);
    if (!rateLimit.allowed) {
        logAuditEvent({
            action: 'ANALYZE_RATE_LIMITED',
            resourceType: 'case',
            ipAddress: clientIp,
            userAgent,
            status: 'failure',
            errorMessage: 'Rate limit exceeded'
        });
        return NextResponse.json(
            { error: 'Too many analysis requests. Please wait before trying again.' },
            { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString() } }
        );
    }
    
    const { caseId } = await routeContext.params;
    
    // Validate caseId format (basic UUID validation)
    const uuidRegex = /^[a-f0-9-]{8,}$/i;
    if (!caseId || (!uuidRegex.test(caseId) && !caseId.startsWith('case-'))) {
        return NextResponse.json({ error: 'Invalid case ID format' }, { status: 400 });
    }
    
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
        
        // Get the LLM provider info for logging
        const llmInfo = getLLMProviderInfo();

        // Save
        await db.analysisRun.create({
            data: {
                caseId,
                modelName: `${llmInfo.provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} (${llmInfo.model})`,
                outputJson: JSON.stringify(analysis)
            }
        });

        await db.case.update({ where: { id: caseId }, data: { status: 'COMPLETED' } });
        
        // Audit log for success
        logAuditEvent({
            action: 'ANALYZE_CASE',
            caseId,
            resourceType: 'case',
            resourceId: caseId,
            ipAddress: clientIp,
            userAgent,
            status: 'success'
        });

        return NextResponse.json(analysis);
    } catch (error: any) {
        console.error("Analysis Error:", error);
        
        // Audit log for failure
        logAuditEvent({
            action: 'ANALYZE_CASE',
            caseId,
            resourceType: 'case',
            resourceId: caseId,
            ipAddress: clientIp,
            userAgent,
            status: 'failure',
            errorMessage: error.message || 'Unknown error'
        });
        
        try {
            await db.case.update({ where: { id: caseId }, data: { status: 'ERROR' } });
        } catch (updateError) {
            console.error("Failed to update case status:", updateError);
        }
        
        // Don't expose internal error details to client
        const safeErrorMessage = error.message?.includes('API') 
            ? 'AI analysis service temporarily unavailable. Please try again.'
            : 'Analysis failed. Please try again.';
        
        return NextResponse.json({ error: safeErrorMessage }, { status: 500 });
    }
}
