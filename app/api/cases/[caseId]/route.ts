import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isDemoMode, getDemoCase, deleteDemoCase } from '@/lib/demoData';
import { checkRateLimit, logAuditEvent } from '@/lib/security';

type RouteContext = {
    params: Promise<{ caseId: string }>;
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

export async function GET(req: NextRequest, context: RouteContext) {
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    const rateLimit = checkRateLimit(`case-get:${clientIp}`, MAX_REQUESTS_PER_WINDOW, RATE_LIMIT_WINDOW);
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
        console.error(`Error fetching case ${caseId}:`, error);
        return NextResponse.json({ error: 'Error fetching case' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    const rateLimit = checkRateLimit(`case-delete:${clientIp}`, 20, RATE_LIMIT_WINDOW); // More restrictive for delete
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: 'Too many delete requests. Please try again later.' },
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
        deleteDemoCase(caseId);
        logAuditEvent({
            action: 'DELETE_CASE',
            caseId,
            resourceType: 'case',
            resourceId: caseId,
            ipAddress: clientIp,
            userAgent,
            status: 'success'
        });
        return NextResponse.json({ success: true });
    }

    try {
        await db.case.delete({
            where: { id: caseId }
        });
        
        logAuditEvent({
            action: 'DELETE_CASE',
            caseId,
            resourceType: 'case',
            resourceId: caseId,
            ipAddress: clientIp,
            userAgent,
            status: 'success'
        });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Error deleting case ${caseId}:`, error);
        
        logAuditEvent({
            action: 'DELETE_CASE',
            caseId,
            resourceType: 'case',
            resourceId: caseId,
            ipAddress: clientIp,
            userAgent,
            status: 'failure',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        
        return NextResponse.json({ error: 'Error deleting case' }, { status: 500 });
    }
}
