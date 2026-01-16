
export const demoCases: any[] = [
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

export const demoAnalysisResults: Record<string, any> = {
    'case-001': {
        id: 'analysis-001',
        caseId: 'case-001',
        modelName: 'Gemini 1.5 Pro',
        outputJson: JSON.stringify({
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
        }),
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    }
};
