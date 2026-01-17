import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, logAuditEvent } from '@/lib/security';
import { 
    isDemoMode, 
    getDemoCases, 
    addDemoCase, 
    generateDemoCaseId, 
    generateDemoCaseCode 
} from '@/lib/demoData';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 50;

export async function POST(req: NextRequest) {
    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`cases:${clientIp}`, MAX_REQUESTS_PER_WINDOW, RATE_LIMIT_WINDOW);
    
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString() } }
        );
    }

    if (isDemoMode) {
        const demoCase = {
            id: generateDemoCaseId(),
            caseCode: generateDemoCaseCode(),
            status: 'DRAFT',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            files: []
        };
        addDemoCase(demoCase);
        
        // Audit log
        logAuditEvent({
            action: 'CREATE_CASE',
            resourceType: 'case',
            resourceId: demoCase.id,
            ipAddress: clientIp,
            userAgent: req.headers.get('user-agent') || 'unknown',
            status: 'success'
        });
        
        return NextResponse.json(demoCase);
    }

    try {
        const count = await db.case.count();
        const caseCode = `AWM-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        const newCase = await db.case.create({
            data: {
                caseCode,
                status: 'DRAFT'
            }
        });

        // Audit log
        logAuditEvent({
            action: 'CREATE_CASE',
            userId: 'unknown', // Would come from auth in production
            caseId: newCase.id,
            resourceType: 'case',
            resourceId: newCase.id,
            ipAddress: clientIp,
            userAgent: req.headers.get('user-agent') || 'unknown',
            status: 'success'
        });

        return NextResponse.json(newCase);
    } catch (error) {
        console.error('Error creating case (DB failed), falling back to demo:', error);
        
        // FALLBACK LOGIC
        const demoCase = {
            id: generateDemoCaseId(),
            caseCode: generateDemoCaseCode(),
            status: 'DRAFT',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            files: []
        };
        addDemoCase(demoCase);

        // Audit log for fallback
        logAuditEvent({
            action: 'CREATE_CASE',
            resourceType: 'case',
            resourceId: demoCase.id,
            ipAddress: clientIp,
            userAgent: req.headers.get('user-agent') || 'unknown',
            status: 'warning',
            details: { message: 'Database failure, fell back to demo mode', error: error instanceof Error ? error.message : String(error) }
        });
        
        return NextResponse.json(demoCase);
    }
}

export async function GET(req: NextRequest) {
    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`cases-list:${clientIp}`, MAX_REQUESTS_PER_WINDOW, RATE_LIMIT_WINDOW);
    
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString() } }
        );
    }

    if (isDemoMode) {
        return NextResponse.json(getDemoCases());
    }

    try {
        const cases = await db.case.findMany({ orderBy: { createdAt: 'desc' } });
        
        // Audit log
        logAuditEvent({
            action: 'LIST_CASES',
            resourceType: 'case',
            ipAddress: clientIp,
            userAgent: req.headers.get('user-agent') || 'unknown',
            status: 'success'
        });
        
        return NextResponse.json(cases);
    } catch (error) {
        console.error('Error fetching cases (DB failed), falling back to demo:', error);

        // Audit log for fallback
        logAuditEvent({
            action: 'LIST_CASES',
            resourceType: 'case',
            ipAddress: clientIp,
            userAgent: req.headers.get('user-agent') || 'unknown',
            status: 'warning',
            details: { message: 'Database failure, fell back to demo mode', error: error instanceof Error ? error.message : String(error) }
        });

        return NextResponse.json(getDemoCases());
    }
}
