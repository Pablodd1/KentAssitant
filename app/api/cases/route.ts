import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, logAuditEvent, sanitizeCaseCode } from '@/lib/security';

// Demo mode: Use in-memory storage when no database
const isDemoMode = !process.env.DATABASE_URL;

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 50;

// Comprehensive demo data
const demoCases: any[] = [
    {
        id: 'case-001',
        caseCode: 'AWM-2025-0001',
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        files: [
            {
                id: 'file-001',
                filename: 'lab-results.pdf',
                mimeType: 'application/pdf',
                size: 245000,
                status: 'READY'
            },
            {
                id: 'file-002',
                filename: 'patient-intake.docx',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                size: 56000,
                status: 'READY'
            }
        ]
    },
    {
        id: 'case-002',
        caseCode: 'AWM-2025-0002',
        status: 'DRAFT',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        files: []
    },
    {
        id: 'case-003',
        caseCode: 'AWM-2025-0003',
        status: 'ANALYZING',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        files: [
            {
                id: 'file-003',
                filename: 'vital-signs.jpg',
                mimeType: 'image/jpeg',
                size: 1200000,
                status: 'READY'
            }
        ]
    }
];

const demoAnalysisResults: Record<string, any> = {
    'case-001': {
        executiveSummary: "Patient presents with metabolic syndrome indicators including elevated fasting glucose, hypertension, and dyslipidemia. Comprehensive analysis suggests lifestyle modifications and targeted supplementation may improve biomarkers within 3-6 months.",
        abnormalFindings: [
            "Fasting glucose: 118 mg/dL (elevated, prediabetic range)",
            "Blood pressure: 145/92 mmHg (stage 1 hypertension)",
            "LDL cholesterol: 165 mg/dL (above optimal)",
            "Triglycerides: 198 mg/dL (borderline high)"
        ],
        systemCorrelations: [
            "Insulin resistance linked to visceral adiposity",
            "Elevated cortisol contributing to blood pressure",
            "Gut microbiome dysbiosis affecting lipid metabolism",
            "Mitochondrial dysfunction impacting energy production"
        ],
        medicationImpacts: [
            {
                medication: "Metformin 500mg",
                intended: "Reduces hepatic glucose production",
                possibleSideEffects: "GI upset, B12 deficiency, potential mitochondrial interference",
                nutrientDepletions: ["Vitamin B12", "Folate", "CoQ10"]
            },
            {
                medication: "Lisinopril 10mg",
                intended: "ACE inhibitor for blood pressure",
                possibleSideEffects: "Dry cough, potassium elevation, zinc depletion",
                nutrientDepletions: ["Zinc", "Sodium"]
            },
            {
                medication: "Atorvastatin 20mg",
                intended: "Lowers LDL cholesterol",
                possibleSideEffects: "Muscle pain, CoQ10 depletion",
                nutrientDepletions: ["CoQ10", "Vitamin D"]
            }
        ],
        redFlags: [
            "Fasting glucose approaching diabetic threshold",
            "Family history of cardiovascular disease"
        ],
        providerDataGaps: [
            {
                missingItem: "HbA1c value",
                whyItMatters: "Provides 3-month average glucose control picture",
                suggestedQuestion: "What was the most recent HbA1c result and when was it taken?"
            },
            {
                missingItem: "Waist circumference",
                whyItMatters: "Key indicator of visceral adiposity and metabolic risk",
                suggestedQuestion: "Can you provide your current waist measurement?"
            },
            {
                missingItem: "Sleep quality data",
                whyItMatters: "Poor sleep exacerbates insulin resistance",
                suggestedQuestion: "How many hours of sleep do you get on average, and do you feel rested?"
            }
        ],
        therapeuticRecommendations: {
            supplements: [
                "Berberine 500mg 2x daily - improves insulin sensitivity",
                "Omega-3 fish oil 2g daily - reduces triglycerides, inflammation",
                "Magnesium glycinate 400mg before bed - supports BP, glucose",
                "Alpha lipoic acid 300mg 2x daily - mitochondrial support",
                "Vitamin D3 5000 IU daily - often deficient in metabolic syndrome"
            ],
            lifestyle: [
                "Intermittent fasting 16:8 - improves insulin sensitivity",
                "Resistance training 3x weekly - builds muscle mass",
                "Stress reduction: meditation 10min daily",
                "Sleep hygiene: consistent bedtime, cool room"
            ],
            biohacking: [
                "Cold exposure: 2min cold shower post-workout",
                "Time-restricted eating: finish eating by 7pm",
                "Morning sunlight: 10min within 30min of waking"
            ]
        },
        diagnosticRecommendations: [
            "Comprehensive metabolic panel in 6 weeks",
            "Lipid panel reassessment in 8 weeks",
            "Recheck blood pressure with home monitoring",
            "Consider continuous glucose monitoring for 2 weeks"
        ],
        qualityCheck: {
            confidence: "85%",
            assumptions: [
                "Patient adherence to supplementation protocol",
                "No significant changes to current medications",
                "Standard metabolic response patterns"
            ]
        }
    }
};

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
        
        return NextResponse.json(cases);
    } catch (error) {
        console.error('Error fetching cases:', error);
        return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
    }
}
