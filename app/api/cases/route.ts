import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, logAuditEvent, sanitizeCaseCode } from '@/lib/security';
import { demoCases } from '@/lib/demoData';

// Demo mode: Use in-memory storage when no database
const isDemoMode = !process.env.DATABASE_URL;

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
            id: `case-${Date.now()}`,
            caseCode: `AWM-${new Date().getFullYear()}-${(demoCases.length + 1).toString().padStart(4, '0')}`,
            status: 'DRAFT',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            files: []
        };
        demoCases.unshift(demoCase);
        
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
        console.error('Error creating case:', error);
        
        // Audit log for failure
        logAuditEvent({
            action: 'CREATE_CASE',
            resourceType: 'case',
            ipAddress: clientIp,
            userAgent: req.headers.get('user-agent') || 'unknown',
            status: 'failure',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        
        return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
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
        return NextResponse.json(demoCases);
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
        
        // Merge DB cases with Demo cases for hybrid view
        return NextResponse.json([...cases, ...demoCases]);
    } catch (error) {
        console.error('Error fetching cases:', error);
        return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
    }
}
