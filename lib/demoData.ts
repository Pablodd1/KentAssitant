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

// Initialize with sample data based on real Americare Wellness patient format
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
                { id: 'file-001', filename: 'test61811_Summary.pdf', mimeType: 'application/pdf', size: 52030, status: 'READY' },
                { id: 'file-002', filename: 'lab-results.pdf', mimeType: 'application/pdf', size: 245000, status: 'READY' }
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
    // Based on real Americare Wellness patient summary format
    return {
        executiveSummary: "Patient (39M) presents with multiple chronic conditions including Obesity, HTN, HLD, DM, GERD, and Anxiety. Current medications include Metformin 500mg BID, Atenolol 25mg daily, Potassium Chloride 10MEQ daily, and Azithromycin (acute). Family history significant for DM (sister), Breast Cancer (mother, brother), Dementia (father), and Prostate Cancer (father). Screen for sleep apnea given obesity as major risk factor. Lifestyle modifications with Mediterranean/DASH diet and vitamin D supplementation recommended.",
        abnormalFindings: [
            "Obesity, unspecified (E66.9) - Major risk factor for multiple comorbidities",
            "Sleep apnea suspected (G47.3) - Screen for symptoms: loud snoring, witnessed apneas, daytime fatigue",
            "Gastro-esophageal reflux disease (K21) - Assess for heartburn, regurgitation, nocturnal cough",
            "Vitamin D level - Requires supplementation 1000-2000 IU/day",
            "BMI elevated - Exact value not recorded in chart"
        ],
        systemCorrelations: [
            "Obesity contributing to HTN, DM, sleep apnea risk, and GERD severity",
            "DM Type 2 linked to obesity and sedentary lifestyle - managed with Metformin",
            "HTN managed with Atenolol - monitor for bradycardia and fatigue",
            "GERD exacerbated by obesity - weight loss expected to improve symptoms",
            "Anxiety may contribute to stress eating and metabolic dysfunction"
        ],
        medicationImpacts: [
            {
                medication: "Metformin HCl 500mg BID",
                intended: "Reduces hepatic glucose production, improves insulin sensitivity for DM management",
                possibleSideEffects: "GI upset (nausea, diarrhea), B12 deficiency with long-term use, lactic acidosis (rare)",
                nutrientDepletions: ["Vitamin B12", "Folate", "CoQ10"]
            },
            {
                medication: "Atenolol 25mg daily",
                intended: "Beta-blocker for HTN management, reduces heart rate and cardiac output",
                possibleSideEffects: "Bradycardia, fatigue, cold extremities, may mask hypoglycemia symptoms in diabetics",
                nutrientDepletions: ["CoQ10", "Melatonin"]
            },
            {
                medication: "Potassium Chloride 10MEQ daily",
                intended: "Electrolyte supplementation, prevents hypokalemia",
                possibleSideEffects: "GI irritation, hyperkalemia if renal function impaired",
                nutrientDepletions: []
            },
            {
                medication: "Azithromycin 250mg (Z-pack)",
                intended: "Macrolide antibiotic for acute infection (sore throat)",
                possibleSideEffects: "QT prolongation, GI upset, antibiotic-associated diarrhea",
                nutrientDepletions: ["B vitamins", "Vitamin K (gut flora disruption)"]
            }
        ],
        redFlags: [
            "Drug Allergy: Penicillin - documented, avoid penicillin-class antibiotics",
            "Food Allergy: Seafood/fish - documented, caution with omega-3 fish oil supplements",
            "Family History: Prostate Cancer (father) - consider early PSA screening and DRE",
            "Family History: Breast Cancer (mother, brother) - increased awareness needed",
            "Social History: Cocaine use documented - screen for cardiovascular complications",
            "Sleep Apnea Risk: High due to obesity - refer for sleep study if symptomatic"
        ],
        providerDataGaps: [
            {
                missingItem: "BMI exact value",
                whyItMatters: "Obesity documented but exact BMI not recorded - needed for risk stratification",
                suggestedQuestion: "Current weight and height to calculate BMI?"
            },
            {
                missingItem: "Recent lab results",
                whyItMatters: "No labs done per assessment - baseline metabolic panel needed",
                suggestedQuestion: "Order comprehensive metabolic panel, lipid panel, HbA1c, vitamin D level"
            },
            {
                missingItem: "Sleep study",
                whyItMatters: "Sleep apnea screening needed given obesity - affects cardiovascular risk",
                suggestedQuestion: "Do you experience loud snoring, witnessed apneas, or excessive daytime sleepiness?"
            },
            {
                missingItem: "Last colonoscopy follow-up",
                whyItMatters: "Last colonoscopy 2019 per history - may be due for repeat",
                suggestedQuestion: "Were there any polyps found? What was the recommended follow-up interval?"
            },
            {
                missingItem: "Diabetes eye exam",
                whyItMatters: "Last exam 07-25-2018, overdue for diabetic retinopathy screening",
                suggestedQuestion: "Schedule dilated eye exam with ophthalmology"
            }
        ],
        therapeuticRecommendations: {
            supplements: [
                "Vitamin D3 1000-2000 IU/day - recheck level in 3 months",
                "Continue current multivitamin",
                "Consider B12 supplementation - monitor for Metformin-induced deficiency",
                "Omega-3 fatty acids (plant-based due to fish allergy) - for cardiovascular protection",
                "Magnesium glycinate 400mg - supports glucose metabolism and sleep"
            ],
            lifestyle: [
                "Mediterranean and DASH diet: emphasize fruits, vegetables, legumes, whole grains, nuts, olive oil, lean proteins",
                "Minimize saturated fats, red meat, processed foods, and added sugars",
                "Limit high-mercury fish in diet (tuna, mackerel) - diversify fish intake",
                "Regular aerobic and resistance exercise: goal 150 min/week",
                "Weight management counseling - consider nutritionist referral",
                "Stress management: mindfulness, breathing exercises, physical activity"
            ],
            biohacking: [
                "Sleep hygiene: consistent bedtime routine to improve sleep quality",
                "Time-restricted eating: finish eating 3 hours before bedtime to reduce GERD",
                "Elevate head of bed for GERD symptom management",
                "Morning sunlight exposure for circadian rhythm regulation",
                "Consider CPAP therapy if sleep apnea diagnosed"
            ]
        },
        diagnosticRecommendations: [
            "Comprehensive metabolic panel - baseline assessment",
            "Lipid panel with CRP - cardiovascular risk stratification",
            "HbA1c - diabetes control assessment",
            "Vitamin D level - confirm deficiency and guide supplementation",
            "Mercury level - given fish consumption concerns",
            "Sleep study referral - if symptomatic for sleep apnea",
            "PSA and DRE - prostate cancer screening due to family history",
            "Dilated eye exam - diabetic retinopathy screening overdue",
            "Repeat labs in 3-6 months after lifestyle adjustments",
            "Follow-up telehealth or in-person in 3 months"
        ],
        qualityCheck: {
            confidence: "90%",
            assumptions: [
                "Patient adherence to Mediterranean/DASH diet recommendations",
                "No acute changes to current medication regimen",
                "Patient will complete recommended lab work and screenings",
                "Fish allergy confirmed - plant-based omega-3 alternatives recommended"
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
