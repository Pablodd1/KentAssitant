/**
 * Shared demo data store for when DATABASE_URL is not set.
 * This provides consistent data across all API routes.
 * Enhanced with comprehensive clinical analysis schema.
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
    riskLevel?: string;
    riskRationale?: string;
    executiveSummary: string;
    patientSnapshot?: {
        age?: string;
        sex?: string;
        chiefComplaint?: string;
        relevantHistory?: string[];
    };
    vitalSigns?: {
        bloodPressure?: string;
        heartRate?: string;
        temperature?: string;
        respiratoryRate?: string;
        oxygenSaturation?: string;
        weight?: string;
        height?: string;
        bmi?: string;
    };
    abnormalFindings: Array<string | { finding: string; severity?: string; source?: string }>;
    systemCorrelations: Array<string | { correlation: string; systems?: string[]; clinicalSignificance?: string }>;
    medicationImpacts: {
        medication: string;
        drugClass?: string;
        intended: string;
        possibleSideEffects: string;
        nutrientDepletions: string[];
        labInteractions?: string;
        considerations?: string;
    }[];
    redFlags: Array<string | { flag: string; urgency?: string; recommendedAction?: string }>;
    providerDataGaps: {
        missingItem: string;
        whyItMatters: string;
        suggestedQuestion: string;
        priority?: string;
    }[];
    telehealthQuestionSet?: Array<string | { question: string; purpose?: string; followUp?: string }>;
    diagnosticRecommendations: Array<string | { test: string; rationale?: string; priority?: string }>;
    therapeuticRecommendations: {
        medications?: Array<string | { suggestion: string; rationale?: string; cautions?: string }>;
        supplements: Array<string | { supplement: string; rationale?: string; duration?: string }>;
        lifestyle: Array<string | { recommendation: string; rationale?: string; implementation?: string }>;
        biohacking: Array<string | { intervention: string; rationale?: string; monitoring?: string }>;
    };
    followUpPlan?: {
        timing?: string;
        metrics?: string[];
        goals?: string[];
        warningSignsForPatient?: string[];
    };
    billingCodes?: {
        icd10?: { code: string; description: string; supportingEvidence?: string }[];
        cpt?: { code: string; description: string; justification?: string }[];
    };
    qualityCheck: {
        confidence: string;
        assumptions: string[];
        limitations?: string[];
        whatWouldChangeConclusion?: string;
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
    return {
        riskLevel: "Moderate",
        riskRationale: "Multiple chronic conditions (DM, HTN, obesity) with family history of cancer require ongoing monitoring. No immediate life-threatening findings, but sleep apnea screening is priority.",
        executiveSummary: "Patient (39M) presents with multiple chronic conditions including Obesity, HTN, HLD, DM, GERD, and Anxiety. Current medications include Metformin 500mg BID, Atenolol 25mg daily, Potassium Chloride 10MEQ daily, and Azithromycin (acute). Family history significant for DM (sister), Breast Cancer (mother, brother), Dementia (father), and Prostate Cancer (father). Screen for sleep apnea given obesity as major risk factor. Lifestyle modifications with Mediterranean/DASH diet and vitamin D supplementation recommended.",
        patientSnapshot: {
            age: "39",
            sex: "Male",
            chiefComplaint: "Routine follow-up for chronic condition management",
            relevantHistory: ["Type 2 Diabetes Mellitus", "Hypertension", "Hyperlipidemia", "Obesity", "GERD", "Anxiety"]
        },
        vitalSigns: {
            bloodPressure: "138/88 mmHg",
            heartRate: "72 bpm",
            temperature: "98.6°F",
            respiratoryRate: "16/min",
            oxygenSaturation: "97%",
            weight: "245 lbs",
            height: "5'10\"",
            bmi: "35.2 (Obese Class II)"
        },
        abnormalFindings: [
            { finding: "Obesity, unspecified (E66.9)", severity: "High", source: "Physical exam" },
            { finding: "Sleep apnea suspected (G47.3)", severity: "Moderate", source: "Risk assessment" },
            { finding: "Gastro-esophageal reflux disease (K21)", severity: "Moderate", source: "Patient history" },
            { finding: "Vitamin D deficiency likely", severity: "Low", source: "Risk factors" },
            { finding: "BMI 35.2 - Obese Class II", severity: "High", source: "Calculated" }
        ],
        systemCorrelations: [
            { 
                correlation: "Obesity contributing to HTN, DM, sleep apnea risk, and GERD severity",
                systems: ["Cardiovascular", "Endocrine", "Respiratory", "GI"],
                clinicalSignificance: "Central driver of metabolic syndrome - weight loss would improve all conditions"
            },
            { 
                correlation: "DM Type 2 linked to obesity and sedentary lifestyle",
                systems: ["Endocrine", "Cardiovascular"],
                clinicalSignificance: "Managed with Metformin, monitor for complications"
            },
            { 
                correlation: "HTN managed with Atenolol",
                systems: ["Cardiovascular"],
                clinicalSignificance: "Monitor for bradycardia and fatigue as side effects"
            },
            { 
                correlation: "GERD exacerbated by obesity",
                systems: ["GI"],
                clinicalSignificance: "Weight loss expected to improve symptoms significantly"
            },
            { 
                correlation: "Anxiety may contribute to stress eating",
                systems: ["Psychiatric", "Endocrine"],
                clinicalSignificance: "Address behavioral component of weight management"
            }
        ],
        medicationImpacts: [
            {
                medication: "Metformin HCl 500mg BID",
                drugClass: "Biguanide",
                intended: "Reduces hepatic glucose production, improves insulin sensitivity for DM management",
                possibleSideEffects: "GI upset (nausea, diarrhea), B12 deficiency with long-term use, lactic acidosis (rare)",
                nutrientDepletions: ["Vitamin B12", "Folate", "CoQ10"],
                labInteractions: "May cause mild reduction in B12 levels over time",
                considerations: "Consider B12 supplementation if on therapy >3 years. Monitor annual B12 levels."
            },
            {
                medication: "Atenolol 25mg daily",
                drugClass: "Beta-blocker (selective β1)",
                intended: "Beta-blocker for HTN management, reduces heart rate and cardiac output",
                possibleSideEffects: "Bradycardia, fatigue, cold extremities, may mask hypoglycemia symptoms in diabetics",
                nutrientDepletions: ["CoQ10", "Melatonin"],
                labInteractions: "May affect glucose tolerance, monitor closely in diabetics",
                considerations: "Patient is diabetic - educate on recognizing hypoglycemia symptoms other than tachycardia"
            },
            {
                medication: "Potassium Chloride 10MEQ daily",
                drugClass: "Electrolyte supplement",
                intended: "Electrolyte supplementation, prevents hypokalemia",
                possibleSideEffects: "GI irritation, hyperkalemia if renal function impaired",
                nutrientDepletions: [],
                labInteractions: "Monitor potassium levels, especially with renal changes",
                considerations: "Ensure adequate hydration. Take with food to minimize GI upset."
            },
            {
                medication: "Azithromycin 250mg (Z-pack)",
                drugClass: "Macrolide antibiotic",
                intended: "Macrolide antibiotic for acute infection (sore throat)",
                possibleSideEffects: "QT prolongation, GI upset, antibiotic-associated diarrhea",
                nutrientDepletions: ["B vitamins", "Vitamin K (gut flora disruption)"],
                labInteractions: "May cause transient LFT elevation",
                considerations: "Short course, monitor for completion. Consider probiotic during/after treatment."
            }
        ],
        redFlags: [
            { flag: "Drug Allergy: Penicillin - documented", urgency: "Immediate", recommendedAction: "Avoid all penicillin-class antibiotics" },
            { flag: "Food Allergy: Seafood/fish - documented", urgency: "24-48 hours", recommendedAction: "Caution with omega-3 fish oil supplements" },
            { flag: "Family History: Prostate Cancer (father)", urgency: "This week", recommendedAction: "Consider early PSA screening and DRE starting now" },
            { flag: "Family History: Breast Cancer (mother, brother)", urgency: "This week", recommendedAction: "Increased awareness, genetic counseling consideration" },
            { flag: "Social History: Cocaine use documented", urgency: "This week", recommendedAction: "Screen for cardiovascular complications, counseling referral" },
            { flag: "Sleep Apnea Risk: High due to obesity", urgency: "This week", recommendedAction: "Refer for sleep study if symptomatic" }
        ],
        providerDataGaps: [
            {
                missingItem: "BMI exact calculation confirmation",
                whyItMatters: "Obesity documented but exact current BMI needed for risk stratification and insurance documentation",
                suggestedQuestion: "Can we confirm current weight and height for BMI calculation?",
                priority: "Essential"
            },
            {
                missingItem: "Recent HbA1c",
                whyItMatters: "No recent labs noted - baseline metabolic panel needed for diabetes management",
                suggestedQuestion: "When was your last blood work? We should order comprehensive labs including HbA1c.",
                priority: "Essential"
            },
            {
                missingItem: "Sleep study results",
                whyItMatters: "Sleep apnea screening needed given obesity - affects cardiovascular risk significantly",
                suggestedQuestion: "Do you experience loud snoring, witnessed apneas, or excessive daytime sleepiness?",
                priority: "Important"
            },
            {
                missingItem: "Last colonoscopy follow-up",
                whyItMatters: "Last colonoscopy 2019 per history - may be due for repeat given family history",
                suggestedQuestion: "Were there any polyps found? What was the recommended follow-up interval?",
                priority: "Important"
            },
            {
                missingItem: "Diabetes eye exam",
                whyItMatters: "Last exam 07-25-2018, overdue for diabetic retinopathy screening",
                suggestedQuestion: "Have you had a dilated eye exam in the past year?",
                priority: "Essential"
            }
        ],
        telehealthQuestionSet: [
            { question: "How has your energy level been over the past month?", purpose: "Assess fatigue related to sleep apnea/diabetes/medications", followUp: "If low, explore sleep quality and blood sugar patterns" },
            { question: "Any episodes of chest pain, shortness of breath, or palpitations?", purpose: "Cardiovascular screening given multiple risk factors", followUp: "If yes, consider urgent in-person evaluation" },
            { question: "How is your blood sugar control? Any readings above 200 or below 70?", purpose: "Diabetes management assessment", followUp: "If uncontrolled, review medication adherence and diet" },
            { question: "Have you experienced any heartburn or acid reflux symptoms recently?", purpose: "GERD assessment", followUp: "If worsening, consider PPI adjustment or upper GI referral" },
            { question: "How would you rate your stress and anxiety on a scale of 1-10?", purpose: "Mental health screening", followUp: "If >6, explore triggers and consider therapy referral" },
            { question: "Are you getting at least 150 minutes of physical activity per week?", purpose: "Lifestyle modification assessment", followUp: "If no, discuss barriers and set achievable goals" }
        ],
        diagnosticRecommendations: [
            { test: "Comprehensive metabolic panel", rationale: "Baseline assessment, renal function for metformin", priority: "Urgent" },
            { test: "Lipid panel with apoB", rationale: "Cardiovascular risk stratification, HLD management", priority: "Urgent" },
            { test: "HbA1c", rationale: "Diabetes control assessment - likely due", priority: "Urgent" },
            { test: "Vitamin D, 25-hydroxy", rationale: "Confirm deficiency and guide supplementation dose", priority: "Routine" },
            { test: "Vitamin B12 level", rationale: "Metformin-induced deficiency screening", priority: "Routine" },
            { test: "Sleep study (polysomnography)", rationale: "High clinical suspicion for OSA given obesity", priority: "Urgent" },
            { test: "PSA and DRE", rationale: "Prostate cancer screening due to family history (father)", priority: "Routine" },
            { test: "Dilated eye exam referral", rationale: "Diabetic retinopathy screening - overdue", priority: "Urgent" },
            { test: "hs-CRP", rationale: "Inflammatory marker for cardiovascular risk", priority: "Optional" },
            { test: "Fasting insulin", rationale: "Assess insulin resistance severity", priority: "Optional" }
        ],
        therapeuticRecommendations: {
            medications: [
                { suggestion: "Consider GLP-1 agonist if HbA1c not at goal", rationale: "Weight loss benefit in addition to glucose control", cautions: "GI side effects, pancreatitis risk" },
                { suggestion: "Evaluate need for statin therapy", rationale: "ASCVD risk likely elevated with multiple factors", cautions: "Muscle symptoms, LFT monitoring" }
            ],
            supplements: [
                { supplement: "Vitamin D3 2000-4000 IU/day", rationale: "Likely deficient, supports metabolic health", duration: "Ongoing, recheck in 3 months" },
                { supplement: "Vitamin B12 1000mcg daily or weekly injection", rationale: "Metformin-induced depletion prevention", duration: "Ongoing while on metformin" },
                { supplement: "CoQ10 100-200mg daily", rationale: "Depleted by both metformin and atenolol", duration: "Ongoing while on these medications" },
                { supplement: "Magnesium glycinate 400mg at bedtime", rationale: "Supports glucose metabolism, blood pressure, sleep", duration: "Ongoing" },
                { supplement: "Omega-3 fatty acids (plant-based due to fish allergy)", rationale: "Cardiovascular protection, algae-derived EPA/DHA", duration: "Ongoing" }
            ],
            lifestyle: [
                { recommendation: "Mediterranean/DASH diet pattern", rationale: "Evidence-based for HTN, DM, and cardiovascular risk", implementation: "Emphasize fruits, vegetables, whole grains, olive oil, lean proteins. Limit processed foods." },
                { recommendation: "Weight loss goal: 10% of body weight", rationale: "Would significantly improve all metabolic parameters", implementation: "Target 1-2 lbs/week through 500-750 cal deficit" },
                { recommendation: "Aerobic exercise 150 min/week minimum", rationale: "Improves insulin sensitivity, BP, and mental health", implementation: "Start with 10-min walks 3x daily, progress gradually" },
                { recommendation: "Resistance training 2x/week", rationale: "Builds muscle mass, improves metabolic rate", implementation: "Can start with bodyweight exercises or light weights" },
                { recommendation: "Stress management practice", rationale: "Reduces cortisol, supports weight loss and BP", implementation: "Daily 10-min meditation or breathing exercises" }
            ],
            biohacking: [
                { intervention: "Time-restricted eating (16:8)", rationale: "May improve insulin sensitivity and support weight loss", monitoring: "Track energy levels and blood sugar patterns" },
                { intervention: "Sleep optimization protocol", rationale: "Critical for metabolic health, especially with sleep apnea risk", monitoring: "Sleep tracking, morning energy assessment" },
                { intervention: "Continuous glucose monitor trial", rationale: "Real-time feedback on food/activity impact on glucose", monitoring: "2-week trial, review patterns with provider" },
                { intervention: "Cold exposure therapy", rationale: "May improve metabolic rate and insulin sensitivity", monitoring: "Start with cold showers, track energy and mood" },
                { intervention: "Morning sunlight exposure", rationale: "Supports circadian rhythm, mood, vitamin D synthesis", monitoring: "10-15 min within 1 hour of waking" }
            ]
        },
        followUpPlan: {
            timing: "3 months for comprehensive review, sooner if sleep study results urgent",
            metrics: ["Weight (weekly)", "Blood pressure (2x weekly)", "Fasting glucose (daily if CGM)", "HbA1c (in 3 months)", "Sleep quality score"],
            goals: ["Lose 5% body weight in 3 months", "BP consistently <130/80", "HbA1c <7.0%", "Complete sleep study", "Establish consistent exercise routine"],
            warningSignsForPatient: ["Chest pain or severe shortness of breath", "Blood sugar <70 or >300", "Severe headache with BP >180/110", "Signs of infection at any site", "Worsening daytime sleepiness or witnessed apneas"]
        },
        billingCodes: {
            icd10: [
                { code: "E11.9", description: "Type 2 diabetes mellitus without complications", supportingEvidence: "Documented in medical history, on Metformin" },
                { code: "I10", description: "Essential (primary) hypertension", supportingEvidence: "Documented, on Atenolol, BP 138/88" },
                { code: "E66.9", description: "Obesity, unspecified", supportingEvidence: "BMI 35.2 calculated" },
                { code: "E78.5", description: "Hyperlipidemia, unspecified", supportingEvidence: "Documented in history" },
                { code: "K21.9", description: "Gastro-esophageal reflux disease without esophagitis", supportingEvidence: "Documented in history" },
                { code: "F41.9", description: "Anxiety disorder, unspecified", supportingEvidence: "Documented in history" },
                { code: "G47.33", description: "Obstructive sleep apnea (suspected)", supportingEvidence: "High risk due to obesity, pending sleep study" }
            ],
            cpt: [
                { code: "99214", description: "Office visit, established patient, moderate complexity", justification: "Multiple chronic conditions requiring management" },
                { code: "83036", description: "Hemoglobin A1c", justification: "Diabetes monitoring" },
                { code: "80053", description: "Comprehensive metabolic panel", justification: "Baseline assessment, medication monitoring" },
                { code: "80061", description: "Lipid panel", justification: "Cardiovascular risk assessment" },
                { code: "82306", description: "Vitamin D, 25-hydroxy", justification: "Deficiency screening" },
                { code: "82607", description: "Vitamin B12", justification: "Metformin-related screening" }
            ]
        },
        qualityCheck: {
            confidence: "High",
            assumptions: [
                "Patient will adhere to recommended lifestyle modifications",
                "No acute changes since last documented visit",
                "Lab values will be obtained as recommended",
                "Fish allergy confirmed - plant-based omega-3 alternatives used"
            ],
            limitations: [
                "No recent lab values available for review",
                "Sleep study not yet completed to confirm OSA",
                "Eye exam significantly overdue"
            ],
            whatWouldChangeConclusion: "Significantly abnormal HbA1c (>9%) would increase urgency and potentially require insulin initiation. Confirmed severe OSA would require immediate CPAP and may affect medication choices."
        }
    };
}

function getDefaultAnalysis(): DemoAnalysis {
    return {
        riskLevel: "Low",
        riskRationale: "New case - awaiting patient data for comprehensive risk assessment.",
        executiveSummary: "New patient case created. Upload medical documents (lab results, imaging, clinical notes) and add voice context to generate a comprehensive clinical intelligence report.",
        abnormalFindings: [{ finding: "No patient data uploaded yet - awaiting medical records", severity: "Low", source: "System" }],
        systemCorrelations: [{ correlation: "Upload medical files to analyze system correlations", systems: [], clinicalSignificance: "Pending data" }],
        medicationImpacts: [],
        redFlags: [{ flag: "No data available for risk assessment", urgency: "This week", recommendedAction: "Upload patient records" }],
        providerDataGaps: [
            {
                missingItem: "Patient medical records",
                whyItMatters: "Required for comprehensive analysis",
                suggestedQuestion: "Please upload lab results, imaging reports, or other medical documents",
                priority: "Essential"
            }
        ],
        telehealthQuestionSet: [
            { question: "What brings you in today?", purpose: "Chief complaint assessment", followUp: "Explore symptoms in detail" }
        ],
        diagnosticRecommendations: [{ test: "Upload patient files to generate recommendations", rationale: "Awaiting data", priority: "Routine" }],
        therapeuticRecommendations: {
            supplements: [{ supplement: "Pending patient data", rationale: "Upload files for personalized recommendations", duration: "TBD" }],
            lifestyle: [{ recommendation: "Upload patient data to receive lifestyle guidance", rationale: "Awaiting data", implementation: "TBD" }],
            biohacking: [{ intervention: "AI analysis pending patient data", rationale: "Awaiting data", monitoring: "TBD" }]
        },
        qualityCheck: {
            confidence: "Low",
            assumptions: ["No patient data available for analysis"],
            limitations: ["Cannot provide clinical recommendations without patient data"],
            whatWouldChangeConclusion: "Any uploaded patient data will enable comprehensive analysis"
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
    
    const existingCase = globalForDemo.demoCases.find(c => c.id === caseId);
    if (existingCase) return existingCase;
    
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
    return `case-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generateDemoCaseCode(): string {
    initializeDemoData();
    const year = new Date().getFullYear();
    const count = globalForDemo.demoCases.length + 1;
    return `AWM-${year}-${count.toString().padStart(4, '0')}`;
}

// Check for any database URL environment variable (supports Neon, Vercel Postgres, etc.)
export const isDemoMode = !(
    process.env.DATABASE_URL || 
    process.env.POSTGRES_URL || 
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED
);
