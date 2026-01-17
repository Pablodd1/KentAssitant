import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Enhanced Clinical Analysis Interface
 * Matches the comprehensive schema from clinicalPrompt.ts
 */
export interface ClinicalAnalysis {
    riskLevel?: 'Critical' | 'High' | 'Moderate' | 'Low';
    riskRationale?: string;
    executiveSummary?: string;
    summary?: string;
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
    abnormalFindings?: Array<string | {
        finding: string;
        severity?: string;
        source?: string;
    }>;
    systemCorrelations?: Array<string | {
        correlation: string;
        systems?: string[];
        clinicalSignificance?: string;
    }>;
    medicationImpacts?: Array<{
        medication: string;
        drugClass?: string;
        intended: string;
        possibleSideEffects: string;
        nutrientDepletions?: string[];
        labInteractions?: string;
        considerations?: string;
    }>;
    redFlags?: Array<string | {
        flag: string;
        urgency?: string;
        recommendedAction?: string;
    }>;
    providerDataGaps?: Array<{
        missingItem: string;
        whyItMatters: string;
        suggestedQuestion: string;
        priority?: string;
    }>;
    telehealthQuestionSet?: Array<string | {
        question: string;
        purpose?: string;
        followUp?: string;
    }>;
    diagnosticRecommendations?: Array<string | {
        test: string;
        rationale?: string;
        priority?: string;
        expectedOutcome?: string;
    }>;
    therapeuticRecommendations?: {
        medications?: Array<string | { suggestion: string; rationale?: string; cautions?: string }>;
        supplements?: Array<string | { supplement: string; rationale?: string; duration?: string }>;
        lifestyle?: Array<string | { recommendation: string; rationale?: string; implementation?: string }>;
        biohacking?: Array<string | { intervention: string; rationale?: string; monitoring?: string }>;
    };
    followUpPlan?: {
        timing?: string;
        metrics?: string[];
        goals?: string[];
        warningSignsForPatient?: string[];
    };
    billingCodes?: {
        icd10?: Array<{ code: string; description: string; supportingEvidence?: string }>;
        cpt?: Array<{ code: string; description: string; justification?: string }>;
    };
    // Legacy fields for backward compatibility
    icd10?: string[];
    cpt?: string[];
    qualityCheck?: {
        confidence: string;
        assumptions?: string[];
        limitations?: string[];
        whatWouldChangeConclusion?: string;
    };
}

// Color schemes - typed as tuples for jsPDF compatibility
type RGB = [number, number, number];

const COLORS: Record<string, RGB> = {
    primary: [30, 41, 59],      // slate-800
    accent: [59, 130, 246],     // blue-500
    success: [22, 163, 74],     // green-600
    warning: [234, 179, 8],     // yellow-500
    danger: [220, 38, 38],      // red-600
    muted: [107, 114, 128],     // gray-500
    light: [243, 244, 246],     // gray-100
    white: [255, 255, 255],
    black: [0, 0, 0],
};

const RISK_COLORS: Record<string, RGB> = {
    'Critical': [153, 27, 27],   // red-800
    'High': [194, 65, 12],       // orange-700
    'Moderate': [161, 98, 7],    // yellow-700
    'Low': [22, 101, 52],        // green-800
};

/**
 * Helper to normalize items that could be strings or objects
 */
function normalizeItem<T>(item: string | T, key: keyof T): string {
    if (typeof item === 'string') return item;
    return String((item as any)[key] || '');
}

/**
 * Generate the main clinical PDF report
 */
export function generateClinicalPDF(analysis: ClinicalAnalysis, caseId: string): jsPDF {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Helper functions
    const addHeader = () => {
        doc.setFillColor(...COLORS.primary);
        doc.rect(0, 0, pageWidth, 28, 'F');
        
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('KENT ASSISTANT MD', margin, 12);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Provider Clinical Intelligence Report', margin, 19);
        
        // Risk badge
        const riskLevel = analysis.riskLevel || 'Moderate';
        const riskColor = RISK_COLORS[riskLevel] || COLORS.muted;
        doc.setFillColor(...riskColor);
        doc.roundedRect(pageWidth - margin - 35, 8, 35, 12, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(riskLevel.toUpperCase(), pageWidth - margin - 17.5, 15.5, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Case: ${caseId.slice(0, 12).toUpperCase()}`, pageWidth - margin - 50, 24);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, 25);
        
        yPos = 35;
    };

    const addFooter = (pageNum: number, totalPages?: number) => {
        doc.setFillColor(...COLORS.light);
        doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        
        doc.setTextColor(...COLORS.muted);
        doc.setFontSize(7);
        doc.text('CONFIDENTIAL - PROVIDER USE ONLY - NOT FOR PATIENT DISTRIBUTION', margin, pageHeight - 8);
        doc.text(`Page ${pageNum}${totalPages ? ` of ${totalPages}` : ''}`, pageWidth - margin - 20, pageHeight - 8);
    };

    const checkPageBreak = (neededSpace: number) => {
        if (yPos + neededSpace > pageHeight - 25) {
            addFooter(doc.getNumberOfPages());
            doc.addPage();
            addHeader();
        }
    };

    const addSectionTitle = (title: string, color: RGB = COLORS.accent) => {
        checkPageBreak(15);
        doc.setFillColor(...color);
        doc.rect(margin, yPos, 3, 8, 'F');
        
        doc.setTextColor(...COLORS.primary);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), margin + 6, yPos + 6);
        yPos += 12;
    };

    const addParagraph = (text: string, color: RGB = COLORS.primary) => {
        doc.setTextColor(...color);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        const lines = doc.splitTextToSize(text, contentWidth);
        checkPageBreak(lines.length * 4 + 4);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 4 + 2;
    };

    const addBulletList = (items: string[], color: RGB = COLORS.primary) => {
        doc.setTextColor(...color);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        items.forEach(item => {
            const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 5);
            checkPageBreak(lines.length * 4 + 2);
            doc.text(lines, margin + 3, yPos);
            yPos += lines.length * 4 + 1;
        });
        yPos += 2;
    };

    // Build PDF
    addHeader();

    // Confidentiality notice
    doc.setFillColor(254, 243, 199);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CONFIDENTIAL MEDICAL DOCUMENT - AUTHORIZED RECIPIENTS ONLY', margin + 3, yPos + 5);
    yPos += 12;

    // Risk Assessment Banner
    if (analysis.riskLevel) {
        const riskColor = RISK_COLORS[analysis.riskLevel] || COLORS.muted;
        doc.setFillColor(...riskColor);
        doc.rect(margin, yPos, contentWidth, 12, 'F');
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`RISK ASSESSMENT: ${analysis.riskLevel.toUpperCase()}`, margin + 3, yPos + 5);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        if (analysis.riskRationale) {
            const rationale = doc.splitTextToSize(analysis.riskRationale, contentWidth - 60);
            doc.text(rationale[0], margin + 50, yPos + 5);
        }
        yPos += 16;
    }

    // 1. Patient Snapshot & Vitals (Side by side)
    if (analysis.patientSnapshot || analysis.vitalSigns) {
        addSectionTitle('1. Patient Snapshot & Vital Signs');
        
        const snapshotData: string[][] = [];
        if (analysis.patientSnapshot) {
            const ps = analysis.patientSnapshot;
            if (ps.age && ps.age !== 'Not provided') snapshotData.push(['Age', ps.age]);
            if (ps.sex && ps.sex !== 'Not provided') snapshotData.push(['Sex', ps.sex]);
            if (ps.chiefComplaint && ps.chiefComplaint !== 'Not provided') snapshotData.push(['Chief Complaint', ps.chiefComplaint]);
        }
        if (analysis.vitalSigns) {
            const vs = analysis.vitalSigns;
            if (vs.bloodPressure && vs.bloodPressure !== 'Not provided') snapshotData.push(['Blood Pressure', vs.bloodPressure]);
            if (vs.heartRate && vs.heartRate !== 'Not provided') snapshotData.push(['Heart Rate', vs.heartRate]);
            if (vs.weight && vs.weight !== 'Not provided') snapshotData.push(['Weight', vs.weight]);
            if (vs.bmi && vs.bmi !== 'Not provided') snapshotData.push(['BMI', vs.bmi]);
        }

        if (snapshotData.length > 0) {
            autoTable(doc, {
                startY: yPos,
                body: snapshotData,
                margin: { left: margin, right: margin },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 40 },
                    1: { cellWidth: contentWidth - 40 }
                },
                theme: 'plain',
                alternateRowStyles: { fillColor: [248, 250, 252] }
            });
            yPos = (doc as any).lastAutoTable.finalY + 6;
        }
    }

    // 2. Executive Summary
    addSectionTitle('2. Executive Summary');
    addParagraph(analysis.executiveSummary || analysis.summary || 'No summary available.');
    yPos += 4;

    // 3. Abnormal Findings
    if (analysis.abnormalFindings && analysis.abnormalFindings.length > 0) {
        addSectionTitle('3. Abnormal Findings', COLORS.danger);
        
        const findings = analysis.abnormalFindings.map(f => {
            if (typeof f === 'string') return f;
            const severity = f.severity ? ` [${f.severity}]` : '';
            const source = f.source ? ` (${f.source})` : '';
            return `${f.finding}${severity}${source}`;
        });
        addBulletList(findings, [185, 28, 28]);
    }

    // 4. Red Flags
    if (analysis.redFlags && analysis.redFlags.length > 0) {
        addSectionTitle('4. Red Flags - Urgent Attention', COLORS.danger);
        
        doc.setFillColor(254, 226, 226);
        const flagHeight = analysis.redFlags.length * 10 + 6;
        checkPageBreak(flagHeight);
        doc.rect(margin, yPos, contentWidth, flagHeight, 'F');
        doc.setDrawColor(239, 68, 68);
        doc.rect(margin, yPos, contentWidth, flagHeight, 'S');
        yPos += 4;
        
        analysis.redFlags.forEach(flag => {
            const flagText = typeof flag === 'string' ? flag : flag.flag;
            const urgency = typeof flag === 'object' && flag.urgency ? ` [${flag.urgency}]` : '';
            doc.setTextColor(153, 27, 27);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`⚠ ${flagText}${urgency}`, margin + 3, yPos + 4);
            yPos += 10;
        });
        yPos += 4;
    }

    // 5. System Correlations
    if (analysis.systemCorrelations && analysis.systemCorrelations.length > 0) {
        addSectionTitle('5. System Correlations');
        const correlations = analysis.systemCorrelations.map(c => {
            if (typeof c === 'string') return c;
            return `${c.correlation}${c.clinicalSignificance ? ` - ${c.clinicalSignificance}` : ''}`;
        });
        addBulletList(correlations);
    }

    // 6. Medication Impacts
    if (analysis.medicationImpacts && analysis.medicationImpacts.length > 0) {
        addSectionTitle('6. Medication Impacts & Side Effects');
        
        const medTableData = analysis.medicationImpacts.map(med => [
            med.medication + (med.drugClass ? `\n(${med.drugClass})` : ''),
            med.intended,
            med.possibleSideEffects,
            med.nutrientDepletions?.join(', ') || 'None listed'
        ]);

        checkPageBreak(40);
        autoTable(doc, {
            startY: yPos,
            head: [['Medication', 'Intended Effect', 'Side Effects', 'Depletions']],
            body: medTableData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: COLORS.accent, textColor: COLORS.white },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 35 },
                1: { cellWidth: 40 },
                2: { cellWidth: 50, textColor: [185, 28, 28] },
                3: { cellWidth: 35 }
            }
        });
        yPos = (doc as any).lastAutoTable.finalY + 6;
    }

    // 7. Provider Data Gaps
    if (analysis.providerDataGaps && analysis.providerDataGaps.length > 0) {
        addSectionTitle('7. Data Gaps & Provider Prompts');
        
        const gapTableData = analysis.providerDataGaps.map(gap => [
            gap.missingItem + (gap.priority ? `\n[${gap.priority}]` : ''),
            gap.whyItMatters,
            `"${gap.suggestedQuestion}"`
        ]);

        checkPageBreak(40);
        autoTable(doc, {
            startY: yPos,
            head: [['Missing Item', 'Clinical Context', 'Suggested Question']],
            body: gapTableData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: COLORS.muted, textColor: COLORS.white },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 35 },
                1: { cellWidth: 55 },
                2: { cellWidth: 70, fontStyle: 'italic', textColor: [37, 99, 235] }
            }
        });
        yPos = (doc as any).lastAutoTable.finalY + 6;
    }

    // 8. Telehealth Question Set
    if (analysis.telehealthQuestionSet && analysis.telehealthQuestionSet.length > 0) {
        addSectionTitle('8. Telehealth Question Set', COLORS.success);
        const questions = analysis.telehealthQuestionSet.map((q, i) => {
            const text = typeof q === 'string' ? q : q.question;
            return `Q${i + 1}: ${text}`;
        });
        addBulletList(questions, [22, 101, 52]);
    }

    // 9. Diagnostic Recommendations
    if (analysis.diagnosticRecommendations && analysis.diagnosticRecommendations.length > 0) {
        addSectionTitle('9. Diagnostic Plan (Next Steps)');
        
        const diagData = analysis.diagnosticRecommendations.map(d => {
            if (typeof d === 'string') return [d, '', ''];
            return [
                d.test,
                d.rationale || '',
                d.priority || 'Routine'
            ];
        });

        checkPageBreak(30);
        autoTable(doc, {
            startY: yPos,
            head: [['Test/Study', 'Rationale', 'Priority']],
            body: diagData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: COLORS.accent, textColor: COLORS.white },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 50 },
                1: { cellWidth: 85 },
                2: { cellWidth: 25, halign: 'center' }
            }
        });
        yPos = (doc as any).lastAutoTable.finalY + 6;
    }

    // 10. Therapeutic Recommendations
    if (analysis.therapeuticRecommendations) {
        addSectionTitle('10. Therapeutic Recommendations');
        
        const tr = analysis.therapeuticRecommendations;
        
        // Medications
        if (tr.medications && tr.medications.length > 0) {
            doc.setTextColor(30, 64, 175);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Medication Considerations:', margin, yPos);
            yPos += 5;
            const meds = tr.medications.map(m => typeof m === 'string' ? m : m.suggestion);
            addBulletList(meds, [30, 64, 175]);
        }
        
        // Supplements
        if (tr.supplements && tr.supplements.length > 0) {
            doc.setTextColor(22, 101, 52);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Supplements:', margin, yPos);
            yPos += 5;
            const supps = tr.supplements.map(s => typeof s === 'string' ? s : `${s.supplement}${s.duration ? ` (${s.duration})` : ''}`);
            addBulletList(supps, [22, 101, 52]);
        }
        
        // Lifestyle
        if (tr.lifestyle && tr.lifestyle.length > 0) {
            doc.setTextColor(88, 28, 135);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Lifestyle Modifications:', margin, yPos);
            yPos += 5;
            const life = tr.lifestyle.map(l => typeof l === 'string' ? l : l.recommendation);
            addBulletList(life, [88, 28, 135]);
        }
        
        // Biohacking
        if (tr.biohacking && tr.biohacking.length > 0) {
            doc.setTextColor(14, 116, 144);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Advanced Optimization:', margin, yPos);
            yPos += 5;
            const bio = tr.biohacking.map(b => typeof b === 'string' ? b : b.intervention);
            addBulletList(bio, [14, 116, 144]);
        }
    }

    // 11. Follow-Up Plan
    if (analysis.followUpPlan) {
        addSectionTitle('11. Follow-Up Plan');
        const fp = analysis.followUpPlan;
        
        if (fp.timing) addParagraph(`Follow-up Timing: ${fp.timing}`);
        if (fp.metrics && fp.metrics.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.text('Metrics to Track:', margin, yPos);
            yPos += 4;
            addBulletList(fp.metrics);
        }
        if (fp.goals && fp.goals.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.text('Goals:', margin, yPos);
            yPos += 4;
            addBulletList(fp.goals, [22, 101, 52]);
        }
    }

    // 12. Billing Codes (ICD-10 & CPT)
    const hasICD10 = (analysis.billingCodes?.icd10?.length ?? 0) > 0 || (analysis.icd10?.length ?? 0) > 0;
    const hasCPT = (analysis.billingCodes?.cpt?.length ?? 0) > 0 || (analysis.cpt?.length ?? 0) > 0;
    
    if (hasICD10 || hasCPT) {
        addSectionTitle('12. Billing & Documentation Codes');
        
        // ICD-10
        if (hasICD10) {
            doc.setTextColor(...COLORS.primary);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('ICD-10 Diagnosis Codes:', margin, yPos);
            yPos += 5;
            
            const icd10Data = analysis.billingCodes?.icd10?.map(c => [c.code, c.description]) 
                || analysis.icd10?.map(c => [c, '']) || [];
            
            if (icd10Data.length > 0) {
                autoTable(doc, {
                    startY: yPos,
                    head: [['Code', 'Description']],
                    body: icd10Data,
                    margin: { left: margin, right: margin },
                    styles: { fontSize: 8, cellPadding: 2 },
                    headStyles: { fillColor: [99, 102, 241], textColor: COLORS.white },
                    columnStyles: {
                        0: { fontStyle: 'bold', cellWidth: 30 },
                        1: { cellWidth: contentWidth - 30 }
                    }
                });
                yPos = (doc as any).lastAutoTable.finalY + 4;
            }
        }
        
        // CPT
        if (hasCPT) {
            doc.setTextColor(...COLORS.primary);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('CPT Procedure Codes:', margin, yPos);
            yPos += 5;
            
            const cptData = analysis.billingCodes?.cpt?.map(c => [c.code, c.description])
                || analysis.cpt?.map(c => [c, '']) || [];
            
            if (cptData.length > 0) {
                autoTable(doc, {
                    startY: yPos,
                    head: [['Code', 'Description']],
                    body: cptData,
                    margin: { left: margin, right: margin },
                    styles: { fontSize: 8, cellPadding: 2 },
                    headStyles: { fillColor: [16, 185, 129], textColor: COLORS.white },
                    columnStyles: {
                        0: { fontStyle: 'bold', cellWidth: 30 },
                        1: { cellWidth: contentWidth - 30 }
                    }
                });
                yPos = (doc as any).lastAutoTable.finalY + 4;
            }
        }
    }

    // 13. Quality Check
    if (analysis.qualityCheck) {
        addSectionTitle('13. Quality & Confidence Check');
        doc.setFillColor(...COLORS.light);
        
        const qcHeight = 25 + (analysis.qualityCheck.limitations?.length ? 10 : 0);
        checkPageBreak(qcHeight);
        doc.rect(margin, yPos, contentWidth, qcHeight, 'F');
        
        doc.setTextColor(...COLORS.primary);
        doc.setFontSize(9);
        doc.text(`Confidence Level: ${analysis.qualityCheck.confidence}`, margin + 3, yPos + 6);
        
        if (analysis.qualityCheck.assumptions?.length) {
            doc.text(`Assumptions: ${analysis.qualityCheck.assumptions.slice(0, 2).join('; ')}`, margin + 3, yPos + 12);
        }
        if (analysis.qualityCheck.whatWouldChangeConclusion) {
            const change = doc.splitTextToSize(`Would change if: ${analysis.qualityCheck.whatWouldChangeConclusion}`, contentWidth - 6);
            doc.text(change, margin + 3, yPos + 18);
        }
        yPos += qcHeight + 4;
    }

    // Disclaimer
    checkPageBreak(18);
    doc.setFillColor(229, 231, 235);
    doc.rect(margin, yPos, contentWidth, 14, 'F');
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(7);
    doc.text('DISCLAIMER: This report is AI-generated for clinical decision support only. It is not a diagnosis.', margin + 3, yPos + 5);
    doc.text('All findings must be verified by a licensed physician. Do not use as sole basis for treatment decisions.', margin + 3, yPos + 10);

    // Add footer to last page
    addFooter(doc.getNumberOfPages());

    return doc;
}

/**
 * Generate Executive Summary PDF (1-page quick view)
 */
export function generateExecutiveSummaryPDF(analysis: ClinicalAnalysis, caseId: string): jsPDF {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Header
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('KENT ASSISTANT MD - EXECUTIVE SUMMARY', margin, 12);
    doc.setFontSize(9);
    doc.text(`Case: ${caseId.slice(0, 12).toUpperCase()} | Date: ${new Date().toLocaleDateString()}`, margin, 20);
    
    // Risk badge
    const riskLevel = analysis.riskLevel || 'Moderate';
    const riskColor = RISK_COLORS[riskLevel] || COLORS.muted;
    doc.setFillColor(...riskColor);
    doc.roundedRect(pageWidth - margin - 30, 7, 28, 14, 2, 2, 'F');
    doc.setFontSize(10);
    doc.text(riskLevel.toUpperCase(), pageWidth - margin - 16, 16, { align: 'center' });
    
    yPos = 35;

    // Patient Info Box
    if (analysis.patientSnapshot) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPos, contentWidth, 20, 'F');
        doc.setTextColor(...COLORS.primary);
        doc.setFontSize(9);
        const ps = analysis.patientSnapshot;
        doc.text(`Age: ${ps.age || 'N/A'} | Sex: ${ps.sex || 'N/A'}`, margin + 3, yPos + 6);
        doc.text(`Chief Complaint: ${ps.chiefComplaint || 'N/A'}`, margin + 3, yPos + 14);
        yPos += 25;
    }

    // Summary
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const summaryLines = doc.splitTextToSize(analysis.executiveSummary || analysis.summary || 'No summary.', contentWidth);
    doc.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 4 + 8;

    // Key Findings (3 columns)
    const colWidth = (contentWidth - 10) / 3;
    
    // Red Flags
    doc.setFillColor(254, 226, 226);
    doc.rect(margin, yPos, colWidth, 50, 'F');
    doc.setTextColor(153, 27, 27);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('RED FLAGS', margin + 2, yPos + 6);
    doc.setFont('helvetica', 'normal');
    const redFlags = analysis.redFlags?.slice(0, 4).map(f => typeof f === 'string' ? f : f.flag) || ['None'];
    redFlags.forEach((flag, i) => {
        const lines = doc.splitTextToSize(`• ${flag}`, colWidth - 4);
        doc.text(lines[0], margin + 2, yPos + 12 + (i * 9));
    });

    // Abnormal Findings
    doc.setFillColor(254, 243, 199);
    doc.rect(margin + colWidth + 5, yPos, colWidth, 50, 'F');
    doc.setTextColor(146, 64, 14);
    doc.setFont('helvetica', 'bold');
    doc.text('KEY FINDINGS', margin + colWidth + 7, yPos + 6);
    doc.setFont('helvetica', 'normal');
    const findings = analysis.abnormalFindings?.slice(0, 4).map(f => typeof f === 'string' ? f : f.finding) || ['None'];
    findings.forEach((finding, i) => {
        const lines = doc.splitTextToSize(`• ${finding}`, colWidth - 4);
        doc.text(lines[0], margin + colWidth + 7, yPos + 12 + (i * 9));
    });

    // Priority Actions
    doc.setFillColor(220, 252, 231);
    doc.rect(margin + (colWidth + 5) * 2, yPos, colWidth, 50, 'F');
    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'bold');
    doc.text('PRIORITY ACTIONS', margin + (colWidth + 5) * 2 + 2, yPos + 6);
    doc.setFont('helvetica', 'normal');
    const actions = analysis.diagnosticRecommendations?.slice(0, 4).map(d => typeof d === 'string' ? d : d.test) || ['None'];
    actions.forEach((action, i) => {
        const lines = doc.splitTextToSize(`• ${action}`, colWidth - 4);
        doc.text(lines[0], margin + (colWidth + 5) * 2 + 2, yPos + 12 + (i * 9));
    });

    yPos += 58;

    // Billing Codes Summary
    const icd10Codes = analysis.billingCodes?.icd10?.map(c => c.code) || analysis.icd10 || [];
    if (icd10Codes.length > 0) {
        doc.setTextColor(...COLORS.primary);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('ICD-10 CODES: ', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(icd10Codes.slice(0, 5).join(', '), margin + 25, yPos);
        yPos += 8;
    }

    // Footer
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(7);
    doc.text('CONFIDENTIAL - This is an AI-generated summary for provider reference only.', margin, 270);

    return doc;
}

/**
 * Generate Patient-Friendly Summary PDF
 */
export function generatePatientSummaryPDF(patientSummary: any, caseId: string): jsPDF {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Friendly Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Your Health Summary', margin, 18);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, 18);
    
    yPos = 40;

    // Greeting
    if (patientSummary.greeting) {
        doc.setTextColor(...COLORS.primary);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(patientSummary.greeting, margin, yPos);
        yPos += 10;
    }

    // Overall Status
    if (patientSummary.overallStatus) {
        doc.setFillColor(240, 249, 255);
        doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');
        doc.setTextColor(30, 64, 175);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('How You\'re Doing', margin + 5, yPos + 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const statusLines = doc.splitTextToSize(patientSummary.overallStatus, contentWidth - 10);
        doc.text(statusLines, margin + 5, yPos + 16);
        yPos += 32;
    }

    // Key Findings
    if (patientSummary.keyFindings?.length > 0) {
        doc.setTextColor(...COLORS.primary);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('What We Found', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        patientSummary.keyFindings.forEach((finding: string) => {
            doc.text(`✓ ${finding}`, margin + 3, yPos);
            yPos += 6;
        });
        yPos += 6;
    }

    // Action Items
    if (patientSummary.actionItems?.length > 0) {
        doc.setFillColor(254, 252, 232);
        doc.roundedRect(margin, yPos, contentWidth, 8 + patientSummary.actionItems.length * 15, 3, 3, 'F');
        doc.setTextColor(161, 98, 7);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('What You Should Do', margin + 5, yPos + 7);
        yPos += 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        patientSummary.actionItems.forEach((item: any, i: number) => {
            doc.text(`${i + 1}. ${item.action}`, margin + 5, yPos);
            if (item.when) {
                doc.setTextColor(...COLORS.muted);
                doc.text(`   When: ${item.when}`, margin + 5, yPos + 5);
                doc.setTextColor(161, 98, 7);
            }
            yPos += 12;
        });
        yPos += 6;
    }

    // Lifestyle Tips
    if (patientSummary.lifestyleTips?.length > 0) {
        doc.setTextColor(22, 101, 52);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Daily Tips for Better Health', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        patientSummary.lifestyleTips.slice(0, 5).forEach((tip: string) => {
            doc.text(`💡 ${tip}`, margin + 3, yPos);
            yPos += 6;
        });
        yPos += 6;
    }

    // When to Seek Help
    if (patientSummary.whenToSeekHelp?.length > 0) {
        doc.setFillColor(254, 226, 226);
        doc.roundedRect(margin, yPos, contentWidth, 8 + patientSummary.whenToSeekHelp.length * 6, 3, 3, 'F');
        doc.setTextColor(153, 27, 27);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Call Your Doctor If...', margin + 5, yPos + 7);
        yPos += 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        patientSummary.whenToSeekHelp.forEach((sign: string) => {
            doc.text(`⚠ ${sign}`, margin + 5, yPos);
            yPos += 6;
        });
        yPos += 6;
    }

    // Encouragement
    if (patientSummary.encouragement) {
        doc.setFillColor(236, 253, 245);
        doc.roundedRect(margin, yPos, contentWidth, 20, 3, 3, 'F');
        doc.setTextColor(22, 101, 52);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        const encLines = doc.splitTextToSize(patientSummary.encouragement, contentWidth - 10);
        doc.text(encLines, margin + 5, yPos + 8);
    }

    // Footer
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(8);
    doc.text('This summary is for your information only. Always follow your doctor\'s advice.', margin, 270);

    return doc;
}

/**
 * Generate Fax Cover Sheet
 */
export function generateFaxCoverSheet(caseId: string, recipientInfo?: {
    name?: string;
    faxNumber?: string;
    organization?: string;
}): jsPDF {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 30;

    // Header
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FAX COVER SHEET', pageWidth / 2, 13, { align: 'center' });

    // From section
    doc.setTextColor(...COLORS.black);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FROM:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('Kent Assistant MD - Clinical Intelligence System', margin + 20, yPos);
    yPos += 8;
    doc.text(`Case Reference: ${caseId.toUpperCase()}`, margin + 20, yPos);
    yPos += 8;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin + 20, yPos);
    yPos += 8;
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, margin + 20, yPos);
    yPos += 15;

    // To section
    doc.setFont('helvetica', 'bold');
    doc.text('TO:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(recipientInfo?.name || '____________________________', margin + 20, yPos);
    yPos += 8;
    doc.text(`Organization: ${recipientInfo?.organization || '____________________________'}`, margin + 20, yPos);
    yPos += 8;
    doc.text(`Fax Number: ${recipientInfo?.faxNumber || '____________________________'}`, margin + 20, yPos);
    yPos += 20;

    // Message box
    doc.setDrawColor(...COLORS.black);
    doc.rect(margin, yPos, pageWidth - (margin * 2), 50, 'S');
    doc.setFontSize(10);
    doc.text('MESSAGE:', margin + 3, yPos + 8);
    doc.text('Please find attached the Provider Clinical Intelligence Report for the referenced case.', margin + 3, yPos + 18);
    doc.text('This document contains confidential medical information intended for authorized', margin + 3, yPos + 26);
    doc.text('healthcare providers only.', margin + 3, yPos + 34);
    yPos += 60;

    // Page count
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PAGES (including cover):', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('_______', margin + 65, yPos);
    yPos += 20;

    // Confidentiality notice
    doc.setFillColor(254, 243, 199);
    doc.rect(margin, yPos, pageWidth - (margin * 2), 40, 'F');
    doc.setDrawColor(234, 179, 8);
    doc.rect(margin, yPos, pageWidth - (margin * 2), 40, 'S');
    
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CONFIDENTIALITY NOTICE', margin + 3, yPos + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const notice = 'This facsimile transmission contains confidential information intended only for the use of the individual or entity named above. If you are not the intended recipient, you are hereby notified that any disclosure, copying, distribution, or taking of any action in reliance on the contents of this information is strictly prohibited. If you have received this transmission in error, please notify the sender immediately and destroy all copies.';
    const lines = doc.splitTextToSize(notice, pageWidth - (margin * 2) - 6);
    doc.text(lines, margin + 3, yPos + 16);

    return doc;
}

/**
 * Generate CSV export of lab values and medications
 */
export function generateCSVExport(analysis: ClinicalAnalysis, caseId: string): string {
    const lines: string[] = [];
    
    // Header
    lines.push(`Kent Assistant MD - Clinical Data Export`);
    lines.push(`Case ID,${caseId}`);
    lines.push(`Export Date,${new Date().toISOString()}`);
    lines.push(`Risk Level,${analysis.riskLevel || 'Not assessed'}`);
    lines.push('');
    
    // Patient Info
    if (analysis.patientSnapshot) {
        lines.push('PATIENT INFORMATION');
        lines.push(`Age,${analysis.patientSnapshot.age || 'N/A'}`);
        lines.push(`Sex,${analysis.patientSnapshot.sex || 'N/A'}`);
        lines.push(`Chief Complaint,${analysis.patientSnapshot.chiefComplaint || 'N/A'}`);
        lines.push('');
    }
    
    // Vital Signs
    if (analysis.vitalSigns) {
        lines.push('VITAL SIGNS');
        lines.push('Parameter,Value');
        const vs = analysis.vitalSigns;
        if (vs.bloodPressure) lines.push(`Blood Pressure,${vs.bloodPressure}`);
        if (vs.heartRate) lines.push(`Heart Rate,${vs.heartRate}`);
        if (vs.weight) lines.push(`Weight,${vs.weight}`);
        if (vs.height) lines.push(`Height,${vs.height}`);
        if (vs.bmi) lines.push(`BMI,${vs.bmi}`);
        lines.push('');
    }
    
    // Medications
    if (analysis.medicationImpacts && analysis.medicationImpacts.length > 0) {
        lines.push('MEDICATIONS');
        lines.push('Medication,Drug Class,Intended Effect,Side Effects,Nutrient Depletions');
        analysis.medicationImpacts.forEach(med => {
            const depletions = med.nutrientDepletions?.join('; ') || '';
            lines.push(`"${med.medication}","${med.drugClass || ''}","${med.intended}","${med.possibleSideEffects}","${depletions}"`);
        });
        lines.push('');
    }
    
    // Abnormal Findings
    if (analysis.abnormalFindings && analysis.abnormalFindings.length > 0) {
        lines.push('ABNORMAL FINDINGS');
        lines.push('Finding,Severity,Source');
        analysis.abnormalFindings.forEach(f => {
            if (typeof f === 'string') {
                lines.push(`"${f}",,`);
            } else {
                lines.push(`"${f.finding}","${f.severity || ''}","${f.source || ''}"`);
            }
        });
        lines.push('');
    }
    
    // ICD-10 Codes
    const icd10 = analysis.billingCodes?.icd10 || [];
    if (icd10.length > 0) {
        lines.push('ICD-10 CODES');
        lines.push('Code,Description,Supporting Evidence');
        icd10.forEach(c => {
            lines.push(`${c.code},"${c.description}","${c.supportingEvidence || ''}"`);
        });
        lines.push('');
    }
    
    // CPT Codes
    const cpt = analysis.billingCodes?.cpt || [];
    if (cpt.length > 0) {
        lines.push('CPT CODES');
        lines.push('Code,Description,Justification');
        cpt.forEach(c => {
            lines.push(`${c.code},"${c.description}","${c.justification || ''}"`);
        });
    }
    
    return lines.join('\n');
}
