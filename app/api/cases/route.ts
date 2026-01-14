import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Demo mode: Use in-memory storage when no database
const isDemoMode = !process.env.DATABASE_URL;

// In-memory storage for demo mode
const demoCases: any[] = [
    {
        id: 'demo-case-001',
        caseCode: 'AWM-2025-0001',
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'demo-case-002',
        caseCode: 'AWM-2025-0002',
        status: 'DRAFT',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
    }
];

export async function POST(req: NextRequest) {
    if (isDemoMode) {
        // Demo mode - create mock case
        const demoCase = {
            id: `demo-case-${Date.now()}`,
            caseCode: `AWM-${new Date().getFullYear()}-${(demoCases.length + 1).toString().padStart(4, '0')}`,
            status: 'DRAFT',
            createdAt: new Date().toISOString(),
        };
        demoCases.unshift(demoCase);
        return NextResponse.json(demoCase);
    }

    try {
        // Normal mode - use database
        const count = await db.case.count();
        const caseCode = `AWM-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        const newCase = await db.case.create({
            data: {
                caseCode,
                status: 'DRAFT'
            }
        });

        return NextResponse.json(newCase);
    } catch (error) {
        console.error('Error creating case:', error);
        return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
    }
}

export async function GET() {
    if (isDemoMode) {
        // Demo mode - return mock data
        return NextResponse.json(demoCases);
    }

    try {
        const cases = await db.case.findMany({ orderBy: { createdAt: 'desc' } });
        return NextResponse.json(cases);
    } catch (error) {
        console.error('Error fetching cases:', error);
        return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
    }
}
