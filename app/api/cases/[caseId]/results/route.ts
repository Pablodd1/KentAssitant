import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const isDemoMode = !process.env.DATABASE_URL;

// Demo analysis results
const demoResults: Record<string, any> = {
    'case-001': {
        id: 'analysis-001',
        caseId: 'case-001',
        modelName: 'Gemini 1.5 Pro',
        outputJson: JSON.stringify({
            executiveSummary: "Patient John Smith (52M) presents with metabolic syndrome indicators including elevated fasting glucose, hypertension, and dyslipidemia. Comprehensive analysis suggests lifestyle modifications and targeted supplementation may improve biomarkers within 3-6 months.",
            abnormalFindings: [
                "Fasting glucose: 118 mg/dL (elevated, prediabetic range)",
                "Blood pressure: 145/92 mmHg (stage 1 hypertension)",
                "LDL cholesterol: 165 mg/dL (above optimal)",
                "Triglycerides: 198 mg/dL (borderline high)",
                "Waist circumference: 42 inches (elevated cardiovascular risk)"
            ],
            systemCorrelations: [
                "Insulin resistance linked to visceral adiposity and chronic inflammation",
                "Elevated cortisol from stress contributing to blood pressure dysregulation",
                "Gut microbiome dysbiosis affecting lipid metabolism and glucose control",
                "Mitochondrial dysfunction impacting energy production and metabolism",
                "Chronic low-grade inflammation driving insulin resistance"
            ],
            medicationImpacts: [
                {
                    medication: "Metformin 500mg BID",
                    intended: "Reduces hepatic glucose production and improves insulin sensitivity",
                    possibleSideEffects: "GI upset, B12 deficiency, potential mitochondrial interference",
                    nutrientDepletions: ["Vitamin B12", "Folate", "CoQ10"]
                },
                {
                    medication: "Lisinopril 10mg daily",
                    intended: "ACE inhibitor for blood pressure and cardiovascular protection",
                    possibleSideEffects: "Dry cough, potassium elevation, zinc depletion",
                    nutrientDepletions: ["Zinc", "Sodium"]
                },
                {
                    medication: "Atorvastatin 20mg daily",
                    intended: "Lowers LDL cholesterol and stabilizes plaques",
                    possibleSideEffects: "Muscle pain, liver enzyme elevation, CoQ10 depletion",
                    nutrientDepletions: ["CoQ10", "Vitamin D"]
                }
            ],
            redFlags: [
                "Fasting glucose approaching diabetic threshold (118 mg/dL)",
                "Family history of cardiovascular disease (father MI at 55)",
                "Elevated hs-CRP indicating systemic inflammation",
                "Progressive weight gain despite moderate diet efforts"
            ],
            providerDataGaps: [
                {
                    missingItem: "HbA1c value",
                    whyItMatters: "Provides 3-month average glucose control picture and confirms prediabetes diagnosis",
                    suggestedQuestion: "What was the most recent HbA1c result and when was it taken? Target is <5.7% for normal, 5.7-6.4% for prediabetes."
                },
                {
                    missingItem: "Waist circumference and body composition",
                    whyItMatters: "Key indicator of visceral adiposity and metabolic risk - waist >40inches in men significantly increases CV risk",
                    suggestedQuestion: "Current waist measurement? Body fat percentage if known? These guide intervention priorities."
                },
                {
                    missingItem: "Sleep study results",
                    whyItMatters: "Undiagnosed sleep apnea is common in metabolic syndrome and exacerbates insulin resistance",
                    suggestedQuestion: "Have you had a sleep study? Do you experience daytime fatigue, snoring, or witnessed apneas?"
                },
                {
                    missingItem: "Thyroid panel",
                    whyItMatters: "Hypothyroidism can mimic and contribute to metabolic syndrome symptoms",
                    suggestedQuestion: "Last TSH result? Symptoms of low thyroid (cold intolerance, fatigue, weight gain)?"
                }
            ],
            therapeuticRecommendations: {
                supplements: [
                    "Berberine 500mg 2x daily - clinically proven to improve insulin sensitivity comparable to metformin",
                    "Omega-3 fish oil 2g daily (EPA/DHA) - reduces triglycerides, inflammation, supports heart health",
                    "Magnesium glycinate 400mg before bed - supports BP, glucose metabolism, sleep quality",
                    "Alpha lipoic acid 300mg 2x daily - mitochondrial support, improves insulin sensitivity",
                    "Vitamin D3 5000 IU daily - often deficient in metabolic syndrome, supports immune function",
                    "Probiotic (50+ billion CFU) - supports gut microbiome, improves metabolic markers"
                ],
                lifestyle: [
                    "Intermittent fasting 16:8 - start with 12:12, progress to 16:8 for improved insulin sensitivity",
                    "Resistance training 3x weekly - builds muscle mass, improves glucose uptake",
                    "Daily walking 30-45 minutes - cardiovascular health, stress reduction",
                    "Stress management: meditation 10min daily, breathwork, nature exposure",
                    "Sleep hygiene: consistent bedtime, cool room (65-68°F), no screens 1hr before bed",
                    "Reduce alcohol to <2 drinks/week - significant impact on triglycerides and liver health"
                ],
                biohacking: [
                    "Morning sunlight exposure: 10-15min within 30min of waking - regulates circadian rhythm, cortisol",
                    "Cold exposure: start with cold shower 30sec, build to 2min post-workout - brown fat activation",
                    "Time-restricted eating: finish eating by 7pm minimum - metabolic switch benefits",
                    "Sauna sessions 2-3x weekly - cardiovascular conditioning, detoxification",
                    "Zone 2 cardio: 45min at conversational pace - efficient fat metabolism training"
                ]
            },
            diagnosticRecommendations: [
                "Comprehensive metabolic panel in 6 weeks to track progress",
                "Lipid panel reassessment in 8 weeks - expected improvement with omega-3 and lifestyle",
                "Recheck blood pressure with home monitoring - target <130/80",
                "Consider continuous glucose monitoring for 2 weeks - identify food sensitivities",
                "Follow-up appointment in 8 weeks to adjust protocol based on results"
            ],
            qualityCheck: {
                confidence: "85%",
                assumptions: [
                    "Patient adherence to supplementation and lifestyle protocol",
                    "No significant changes to current medication regimen",
                    "Standard metabolic response patterns for this patient profile",
                    "Patient will schedule recommended follow-up labs"
                ]
            }
        }),
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    }
};

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
    if (isDemoMode) {
        const result = demoResults[params.caseId];
        if (!result) {
            // No analysis yet - return null to trigger analysis
            return NextResponse.json(null);
        }
        
        let parsed;
        try {
            parsed = JSON.parse(result.outputJson);
        } catch {
            parsed = {};
        }
        
        return NextResponse.json({
            ...result,
            parsed
        });
    }

    try {
        const result = await db.analysisRun.findFirst({
            where: { caseId: params.caseId },
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
