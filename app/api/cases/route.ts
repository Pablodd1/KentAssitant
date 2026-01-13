import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        // Generate a case code
        const count = await db.case.count();
        const caseCode = `KMD-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

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
    try {
        const cases = await db.case.findMany({ orderBy: { createdAt: 'desc' } });
        return NextResponse.json(cases);
    } catch (error) {
        console.error('Error fetching cases:', error);
        return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
    }
}
