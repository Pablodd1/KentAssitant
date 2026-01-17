import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, logAuditEvent } from '@/lib/security';
import { 
    getDemoCases, 
    addDemoCase, 
    generateDemoCaseId, 
    generateDemoCaseCode 
} from '@/lib/demoData';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 50;

// Runtime check for demo mode (environment variables are available at runtime on Vercel)
function isInDemoMode(): boolean {
    return !(
        process.env.DATABASE_URL || 
        process.env.POSTGRES_URL || 
        process.env.POSTGRES_PRISMA_URL ||
        process.env.DATABASE_URL_UNPOOLED
    );
}

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

    // Check demo mode at runtime
    if (isInDemoMode() || !db) {
        console.log('Running in demo mode - no database configured');
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
        console.log('Creating case with database connection...');
        const count = await db.case.count();
        const caseCode = `AWM-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        const newCase = await db.case.create({
            data: {
                caseCode,
                status: 'DRAFT'
            }
        });

        console.log('Case created successfully:', newCase.id);
        
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
        
        return NextResponse.json({ 
            error: 'Failed to create case', 
            details: error instanceof Error ? error.message : 'Database connection error'
        }, { status: 500 });
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

    // Check demo mode at runtime
    if (isInDemoMode() || !db) {
        console.log('Fetching cases in demo mode');
        return NextResponse.json(getDemoCases());
    }

    try {
        console.log('Fetching cases from database...');
        const cases = await db.case.findMany({ orderBy: { createdAt: 'desc' } });
        
        // Audit log
        logAuditEvent({
            action: 'LIST_CASES',
            resourceType: 'case',
            ipAddress: clientIp,
            userAgent: req.headers.get('user-agent') || 'unknown',
            status: 'success'
        });
        
        console.log(`Found ${cases.length} cases`);
        return NextResponse.json(cases);
    } catch (error) {
        console.error('Error fetching cases:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch cases',
            details: error instanceof Error ? error.message : 'Database error'
        }, { status: 500 });
    }
}
