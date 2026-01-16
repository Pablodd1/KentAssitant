import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ClinicalAnalysis {
    executiveSummary?: string;
    summary?: string;
    abnormalFindings?: string[];
    systemCorrelations?: string[];
    medicationImpacts?: {
        medication: string;
        intended: string;
        possibleSideEffects: string;
        nutrientDepletions?: string[];
    }[];
    redFlags?: string[];
    providerDataGaps?: {
        missingItem: string;
        whyItMatters: string;
        suggestedQuestion: string;
    }[];
    therapeuticRecommendations?: {
        supplements?: string[];
        lifestyle?: string[];
        biohacking?: string[];
    };
    diagnosticRecommendations?: string[];
    qualityCheck?: {
        confidence: string;
        assumptions?: string[];
    };
}

export function generateClinicalPDF(analysis: ClinicalAnalysis, caseId: string): jsPDF {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter' // Standard fax format
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Helper functions
    const addHeader = () => {
        // Header bar
        doc.setFillColor(30, 41, 59); // slate-800
        doc.rect(0, 0, pageWidth, 25, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('KENT ASSISTANT MD', margin, 12);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Provider Clinical Intelligence Report', margin, 19);
        
        doc.setFontSize(9);
        doc.text(`Case: ${caseId.slice(0, 12).toUpperCase()}`, pageWidth - margin - 50, 12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, 18);
        
        yPos = 35;
    };

    const addFooter = (pageNum: number) => {
        doc.setFillColor(243, 244, 246); // gray-100
        doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        
        doc.setTextColor(107, 114, 128); // gray-500
        doc.setFontSize(8);
        doc.text('CONFIDENTIAL - PROVIDER USE ONLY - NOT FOR PATIENT DISTRIBUTION', margin, pageHeight - 8);
        doc.text(`Page ${pageNum}`, pageWidth - margin - 15, pageHeight - 8);
    };

    const checkPageBreak = (neededSpace: number) => {
        if (yPos + neededSpace > pageHeight - 25) {
            addFooter(doc.getNumberOfPages());
            doc.addPage();
            addHeader();
        }
    };

    const addSectionTitle = (title: string) => {
        checkPageBreak(15);
        doc.setFillColor(59, 130, 246); // blue-500
        doc.rect(margin, yPos, 3, 8, 'F');
        
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin + 6, yPos + 6);
        yPos += 12;
    };

    const addParagraph = (text: string, color: number[] = [55, 65, 81]) => {
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const lines = doc.splitTextToSize(text, contentWidth);
        checkPageBreak(lines.length * 5 + 5);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 5 + 3;
    };

    const addBulletList = (items: string[], color: number[] = [55, 65, 81]) => {
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        items.forEach(item => {
            const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 5);
            checkPageBreak(lines.length * 5 + 2);
            doc.text(lines, margin + 3, yPos);
            yPos += lines.length * 5 + 1;
        });
        yPos += 3;
    };

    // Build PDF
    addHeader();

    // Confidentiality notice
    doc.setFillColor(254, 243, 199); // yellow-100
    doc.rect(margin, yPos, contentWidth, 10, 'F');
    doc.setTextColor(146, 64, 14); // yellow-800
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('⚠ CONFIDENTIAL MEDICAL DOCUMENT - AUTHORIZED RECIPIENTS ONLY', margin + 3, yPos + 6);
    yPos += 15;

    // 1. Executive Summary
    addSectionTitle('1. EXECUTIVE SUMMARY');
    addParagraph(analysis.executiveSummary || analysis.summary || 'No summary available.');
    yPos += 5;

    // 2. Abnormal Findings
    if (analysis.abnormalFindings && analysis.abnormalFindings.length > 0) {
        addSectionTitle('2. ABNORMAL FINDINGS');
        addBulletList(analysis.abnormalFindings, [185, 28, 28]); // red-700
    }

    // 3. System Correlations
    if (analysis.systemCorrelations && analysis.systemCorrelations.length > 0) {
        addSectionTitle('3. SYSTEM CORRELATIONS');
        addBulletList(analysis.systemCorrelations);
    }

    // 4. Medication Impacts
    if (analysis.medicationImpacts && analysis.medicationImpacts.length > 0) {
        addSectionTitle('4. MEDICATION IMPACTS & SIDE EFFECTS');
        
        const medTableData = analysis.medicationImpacts.map(med => [
            med.medication,
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
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [59, 130, 246], textColor: 255 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 35 },
                1: { cellWidth: 45 },
                2: { cellWidth: 50, textColor: [185, 28, 28] },
                3: { cellWidth: 35 }
            }
        });
        yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // 5. Red Flags
    if (analysis.redFlags && analysis.redFlags.length > 0) {
        addSectionTitle('5. RED FLAGS - URGENT ATTENTION NEEDED');
        
        doc.setFillColor(254, 226, 226); // red-100
        doc.rect(margin, yPos, contentWidth, analysis.redFlags.length * 7 + 6, 'F');
        doc.setDrawColor(239, 68, 68); // red-500
        doc.rect(margin, yPos, contentWidth, analysis.redFlags.length * 7 + 6, 'S');
        yPos += 4;
        
        analysis.redFlags.forEach(flag => {
            checkPageBreak(8);
            doc.setTextColor(153, 27, 27); // red-800
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`⚠ ${flag}`, margin + 3, yPos + 4);
            yPos += 7;
        });
        yPos += 5;
    }

    // 6. Provider Data Gaps
    if (analysis.providerDataGaps && analysis.providerDataGaps.length > 0) {
        addSectionTitle('6. DATA GAPS & PROVIDER PROMPTS');
        
        const gapTableData = analysis.providerDataGaps.map(gap => [
            gap.missingItem,
            gap.whyItMatters,
            `"${gap.suggestedQuestion}"`
        ]);

        checkPageBreak(40);
        autoTable(doc, {
            startY: yPos,
            head: [['Missing Item', 'Clinical Context', 'Suggested Question']],
            body: gapTableData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [107, 114, 128], textColor: 255 },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 35 },
                1: { cellWidth: 60 },
                2: { cellWidth: 70, fontStyle: 'italic', textColor: [37, 99, 235] }
            }
        });
        yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // 7. Therapeutic Recommendations
    if (analysis.therapeuticRecommendations) {
        addSectionTitle('7. THERAPEUTIC RECOMMENDATIONS');
        
        if (analysis.therapeuticRecommendations.supplements?.length) {
            doc.setTextColor(22, 101, 52); // green-800
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Supplements:', margin, yPos);
            yPos += 5;
            addBulletList(analysis.therapeuticRecommendations.supplements, [22, 101, 52]);
        }
        
        if (analysis.therapeuticRecommendations.lifestyle?.length) {
            doc.setTextColor(88, 28, 135); // purple-800
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Lifestyle:', margin, yPos);
            yPos += 5;
            addBulletList(analysis.therapeuticRecommendations.lifestyle, [88, 28, 135]);
        }
        
        if (analysis.therapeuticRecommendations.biohacking?.length) {
            doc.setTextColor(30, 64, 175); // blue-800
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Biohacking:', margin, yPos);
            yPos += 5;
            addBulletList(analysis.therapeuticRecommendations.biohacking, [30, 64, 175]);
        }
    }

    // 8. Diagnostic Plan
    if (analysis.diagnosticRecommendations && analysis.diagnosticRecommendations.length > 0) {
        addSectionTitle('8. DIAGNOSTIC PLAN (NEXT STEPS)');
        addBulletList(analysis.diagnosticRecommendations);
    }

    // 9. Quality Check
    if (analysis.qualityCheck) {
        addSectionTitle('9. QUALITY CHECK');
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, yPos, contentWidth, 20, 'F');
        
        doc.setTextColor(55, 65, 81);
        doc.setFontSize(9);
        doc.text(`Confidence Level: ${analysis.qualityCheck.confidence}`, margin + 3, yPos + 6);
        
        if (analysis.qualityCheck.assumptions?.length) {
            doc.text(`Assumptions: ${analysis.qualityCheck.assumptions.join('; ')}`, margin + 3, yPos + 12);
        }
        yPos += 25;
    }

    // Disclaimer
    checkPageBreak(20);
    doc.setFillColor(229, 231, 235);
    doc.rect(margin, yPos, contentWidth, 15, 'F');
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(7);
    doc.text('DISCLAIMER: This report is AI-generated for clinical decision support only. It is not a diagnosis.', margin + 3, yPos + 5);
    doc.text('All findings must be verified by a licensed physician. Do not use as sole basis for treatment decisions.', margin + 3, yPos + 10);

    // Add footer to last page
    addFooter(doc.getNumberOfPages());

    return doc;
}

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
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FAX COVER SHEET', pageWidth / 2, 13, { align: 'center' });

    // From section
    doc.setTextColor(0, 0, 0);
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
    doc.setDrawColor(0);
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
