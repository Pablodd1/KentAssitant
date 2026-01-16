/**
 * Shared demo data store for when DATABASE_URL is not set.
 * This provides consistent data across all API routes.
 */

export interface DemoFile {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    status: string;
    caseId?: string;
    storagePath?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface DemoCase {
    id: string;
    caseCode: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    files: DemoFile[];
}

export interface DemoAnalysis {
    executiveSummary: string;
    abnormalFindings: string[];
    systemCorrelations: string[];
    medicationImpacts: {
        medication: string;
        intended: string;
        possibleSideEffects: string;
        nutrientDepletions: string[];
    }[];
    redFlags: string[];
    providerDataGaps: {
        missingItem: string;
        whyItMatters: string;
        suggestedQuestion: string;
    }[];
    therapeuticRecommendations: {
        supplements: string[];
        lifestyle: string[];
        biohacking: string[];
    };
    diagnosticRecommendations: string[];
    qualityCheck: {
        confidence: string;
        assumptions: string[];
    };
}

// Global demo data store (persists across API calls in same server instance)
const globalForDemo = globalThis as unknown as {
    demoCases: DemoCase[];
    demoAnalyses: Record<string, DemoAnalysis>;
    initialized: boolean;
};

// Initialize with sample data
function initializeDemoData() {
    if (globalForDemo.initialized) return;

    globalForDemo.demoCases = [
        {
            id: 'case-001',
            caseCode: 'AWM-2025-0001',
            status: 'COMPLETED',
            createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
            files: [
                { id: 'file-001', filename: 'lab-results.pdf', mimeType: 'application/pdf', size: 245000, status: 'READY' },
                { id: 'file-002', filename: 'patient-intake.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 56000, status: 'READY' }
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
                { id: 'file-003', filename: 'vital-signs.jpg', mimeType: 'image/jpeg', size: 1200000, status: 'READY' }
            ]
        }
    ];

    globalForDemo.demoAnalyses = {
        'case-001': getSampleAnalysis(),
        'default': getDefaultAnalysis()
    };

    globalForDemo.initialized = true;
}

function getSampleAnalysis(): DemoAnalysis {
    return {
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
            "Mitochondrial dysfunction impacting energy production and metabolism"
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
            "Elevated hs-CRP indicating systemic inflammation"
        ],
        providerDataGaps: [
            {
                missingItem: "HbA1c value",
                whyItMatters: "Provides 3-month average glucose control picture",
                suggestedQuestion: "What was the most recent HbA1c result and when was it taken?"
            },
            {
                missingItem: "Sleep study results",
                whyItMatters: "Undiagnosed sleep apnea is common in metabolic syndrome",
                suggestedQuestion: "Have you had a sleep study? Do you experience daytime fatigue or snoring?"
            }
        ],
        therapeuticRecommendations: {
            supplements: [
                "Berberine 500mg 2x daily - improves insulin sensitivity",
                "Omega-3 fish oil 2g daily - reduces triglycerides, inflammation",
                "Magnesium glycinate 400mg before bed - supports BP, glucose metabolism",
                "Alpha lipoic acid 300mg 2x daily - mitochondrial support"
            ],
            lifestyle: [
                "Intermittent fasting 16:8 - improved insulin sensitivity",
                "Resistance training 3x weekly - builds muscle mass",
                "Daily walking 30-45 minutes - cardiovascular health"
            ],
            biohacking: [
                "Morning sunlight exposure: 10-15min within 30min of waking",
                "Cold exposure: start with cold shower 30sec post-workout",
                "Time-restricted eating: finish eating by 7pm"
            ]
        },
        diagnosticRecommendations: [
            "Comprehensive metabolic panel in 6 weeks",
            "Lipid panel reassessment in 8 weeks",
            "Home blood pressure monitoring",
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
    };
}

function getDefaultAnalysis(): DemoAnalysis {
    return {
        executiveSummary: "New patient case created. Upload medical documents (lab results, imaging, clinical notes) and add voice context to generate a comprehensive clinical intelligence report.",
        abnormalFindings: ["No patient data uploaded yet - awaiting medical records"],
        systemCorrelations: ["Upload medical files to analyze system correlations"],
        medicationImpacts: [],
        redFlags: ["No data available for risk assessment"],
        providerDataGaps: [
            {
                missingItem: "Patient medical records",
                whyItMatters: "Required for comprehensive analysis",
                suggestedQuestion: "Please upload lab results, imaging reports, or other medical documents"
            }
        ],
        therapeuticRecommendations: {
            supplements: ["Upload patient data for personalized recommendations"],
            lifestyle: ["Upload patient data to receive lifestyle guidance"],
            biohacking: ["AI analysis pending patient data"]
        },
        diagnosticRecommendations: ["Upload patient files to generate diagnostic recommendations"],
        qualityCheck: {
            confidence: "N/A - Awaiting Data",
            assumptions: ["No patient data available for analysis"]
        }
    };
}

// Ensure initialization
initializeDemoData();

// Export functions to access and modify demo data
export function getDemoCases(): DemoCase[] {
    initializeDemoData();
    return globalForDemo.demoCases;
}

export function getDemoCase(caseId: string): DemoCase | undefined {
    initializeDemoData();
    
    // First check if it's in our stored cases
    const existingCase = globalForDemo.demoCases.find(c => c.id === caseId);
    if (existingCase) return existingCase;
    
    // If caseId matches demo pattern but not found, create a dynamic one
    // This handles cases created in other serverless instances
    if (caseId.startsWith('case-') && caseId !== 'case-001' && caseId !== 'case-002' && caseId !== 'case-003') {
        const timestamp = caseId.replace('case-', '');
        const dynamicCase: DemoCase = {
            id: caseId,
            caseCode: `AWM-2026-${timestamp.slice(-4)}`,
            status: 'DRAFT',
            createdAt: new Date(parseInt(timestamp) || Date.now()).toISOString(),
            updatedAt: new Date().toISOString(),
            files: []
        };
        // Add to global store for this instance
        globalForDemo.demoCases.push(dynamicCase);
        return dynamicCase;
    }
    
    return undefined;
}

export function addDemoCase(newCase: DemoCase): void {
    initializeDemoData();
    globalForDemo.demoCases.unshift(newCase);
}

export function updateDemoCase(caseId: string, updates: Partial<DemoCase>): DemoCase | undefined {
    initializeDemoData();
    const index = globalForDemo.demoCases.findIndex(c => c.id === caseId);
    if (index !== -1) {
        globalForDemo.demoCases[index] = { ...globalForDemo.demoCases[index], ...updates };
        return globalForDemo.demoCases[index];
    }
    return undefined;
}

export function deleteDemoCase(caseId: string): boolean {
    initializeDemoData();
    const index = globalForDemo.demoCases.findIndex(c => c.id === caseId);
    if (index !== -1) {
        globalForDemo.demoCases.splice(index, 1);
        return true;
    }
    return false;
}

export function getDemoAnalysis(caseId: string): DemoAnalysis {
    initializeDemoData();
    return globalForDemo.demoAnalyses[caseId] || globalForDemo.demoAnalyses['default'];
}

export function addFileToDemoCase(caseId: string, file: DemoFile): boolean {
    initializeDemoData();
    const caseItem = globalForDemo.demoCases.find(c => c.id === caseId);
    if (caseItem) {
        caseItem.files.push(file);
        return true;
    }
    return false;
}

export function generateDemoCaseId(): string {
    return `case-${Date.now()}`;
}

export function generateDemoCaseCode(): string {
    initializeDemoData();
    const year = new Date().getFullYear();
    const count = globalForDemo.demoCases.length + 1;
    return `AWM-${year}-${count.toString().padStart(4, '0')}`;
}

export const isDemoMode = !process.env.DATABASE_URL;
