'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
    Loader2, Printer, Copy, Download, Send, FileText, X, 
    AlertTriangle, Activity, Pill, FileSpreadsheet, User,
    Stethoscope, ClipboardList, Heart, TrendingUp, AlertCircle
} from 'lucide-react';

export default function ResultsPage({ params }: { params: Promise<{ caseId: string }> | { caseId: string } }) {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [caseId, setCaseId] = useState<string>("");
    const [mounted, setMounted] = useState(false);
    const [showFaxModal, setShowFaxModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [faxInfo, setFaxInfo] = useState({ name: '', faxNumber: '', organization: '' });
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [generatingPatientSummary, setGeneratingPatientSummary] = useState(false);

    useEffect(() => {
        setMounted(true);
        const getCaseId = async () => {
            try {
                const resolvedParams = await params;
                setCaseId(resolvedParams.caseId);
            } catch (err) {
                setError("Invalid case ID");
                setLoading(false);
            }
        };
        getCaseId();
    }, [params]);

    const runAnalysis = useCallback(async () => {
        if (!caseId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/cases/${caseId}/analyze`, { method: 'POST' });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Analysis failed: ${res.status}`);
            }
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setAnalysis(data);
        } catch (e: any) {
            setError(e.message || "Analysis failed");
        } finally {
            setLoading(false);
        }
    }, [caseId]);

    const fetchResults = useCallback(async () => {
        if (!caseId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/cases/${caseId}/results`);
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const data = await res.json();
            if (data && data.parsed) {
                setAnalysis(data.parsed);
            } else if (data === null) {
                await runAnalysis();
            }
        } catch (e: any) {
            setError(e.message || "Failed to load results");
        } finally {
            setLoading(false);
        }
    }, [caseId, runAnalysis]);



    const downloadPDF = async (type: 'full' | 'executive' = 'full') => {
        if (!analysis) return;
        setDownloadingPdf(true);
        try {
            const { generateClinicalPDF, generateExecutiveSummaryPDF } = await import('@/lib/pdfGenerator');
            const doc = type === 'executive' 
                ? generateExecutiveSummaryPDF(analysis, caseId)
                : generateClinicalPDF(analysis, caseId);
            const prefix = type === 'executive' ? 'executive-summary' : 'clinical-report';
            doc.save(`${prefix}-${caseId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error('PDF generation error:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setDownloadingPdf(false);
        }
    };

    const downloadCSV = async () => {
        if (!analysis) return;
        try {
            const { generateCSVExport } = await import('@/lib/pdfGenerator');
            const csv = generateCSVExport(analysis, caseId);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `clinical-data-${caseId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('CSV generation error:', err);
            alert('Failed to generate CSV.');
        }
    };

    const downloadFaxReady = async () => {
        if (!analysis) return;
        setDownloadingPdf(true);
        try {
            const { generateClinicalPDF, generateFaxCoverSheet } = await import('@/lib/pdfGenerator');
            const coverSheet = generateFaxCoverSheet(caseId, faxInfo.name ? faxInfo : undefined);
            const report = generateClinicalPDF(analysis, caseId);
            coverSheet.save(`fax-cover-${caseId.slice(0, 8)}.pdf`);
            setTimeout(() => {
                report.save(`clinical-report-${caseId.slice(0, 8)}-FAX.pdf`);
            }, 500);
            setShowFaxModal(false);
        } catch (err) {
            console.error('Fax PDF generation error:', err);
            alert('Failed to generate fax documents.');
        } finally {
            setDownloadingPdf(false);
        }
    };

    const downloadPatientSummary = async () => {
        if (!analysis) return;
        setGeneratingPatientSummary(true);
        try {
            // For now, generate a simplified version from existing data
            const patientSummary = {
                greeting: "Hello! Here's a summary of your recent health check.",
                overallStatus: analysis.executiveSummary || analysis.summary || "Your health information has been reviewed.",
                keyFindings: analysis.abnormalFindings?.slice(0, 5).map((f: any) => 
                    typeof f === 'string' ? f : f.finding
                ) || [],
                actionItems: analysis.diagnosticRecommendations?.slice(0, 4).map((d: any) => ({
                    action: typeof d === 'string' ? d : d.test,
                    why: typeof d === 'object' ? d.rationale : 'Recommended by your doctor',
                    when: typeof d === 'object' ? d.priority : 'As scheduled'
                })) || [],
                lifestyleTips: analysis.therapeuticRecommendations?.lifestyle?.slice(0, 5).map((l: any) =>
                    typeof l === 'string' ? l : l.recommendation
                ) || [],
                whenToSeekHelp: analysis.redFlags?.slice(0, 3).map((f: any) =>
                    typeof f === 'string' ? f : f.flag
                ) || [],
                encouragement: "Taking care of your health is a journey. Every step you take matters!"
            };

            const { generatePatientSummaryPDF } = await import('@/lib/pdfGenerator');
            const doc = generatePatientSummaryPDF(patientSummary, caseId);
            doc.save(`patient-summary-${caseId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error('Patient summary error:', err);
            alert('Failed to generate patient summary.');
        } finally {
            setGeneratingPatientSummary(false);
        }
    };

    useEffect(() => {
        if (caseId) fetchResults();
    }, [caseId, fetchResults]);

    if (!mounted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="animate-spin w-16 h-16 text-blue-600" />
                <p className="mt-4 text-xl font-bold">Loading...</p>
            </div>
        );
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader2 className="animate-spin w-16 h-16 text-blue-600" />
            <p className="mt-4 text-xl font-bold">Generating Clinical Intelligence...</p>
            <p className="text-gray-500">Analyzing medical context with AI reasoning.</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-red-600 font-bold mb-4">{error}</p>
            <button onClick={() => fetchResults()} className="bg-black text-white px-4 py-2 rounded">Retry</button>
        </div>
    );

    if (!analysis) return null;

    const riskColors: Record<string, string> = {
        'Critical': 'bg-red-600',
        'High': 'bg-orange-500',
        'Moderate': 'bg-yellow-500',
        'Low': 'bg-green-500'
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4 md:p-8 print:bg-white print:p-0">
            {/* Fax Modal */}
            {showFaxModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Prepare for Fax</h2>
                            <button onClick={() => setShowFaxModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
                                <input
                                    type="text"
                                    value={faxInfo.name}
                                    onChange={(e) => setFaxInfo({ ...faxInfo, name: e.target.value })}
                                    placeholder="Dr. John Smith"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                                <input
                                    type="text"
                                    value={faxInfo.organization}
                                    onChange={(e) => setFaxInfo({ ...faxInfo, organization: e.target.value })}
                                    placeholder="City Medical Center"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fax Number</label>
                                <input
                                    type="text"
                                    value={faxInfo.faxNumber}
                                    onChange={(e) => setFaxInfo({ ...faxInfo, faxNumber: e.target.value })}
                                    placeholder="(555) 123-4567"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => setShowFaxModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                                Cancel
                            </button>
                            <button onClick={downloadFaxReady} disabled={downloadingPdf}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                                {downloadingPdf ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Options Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Export Options</h2>
                            <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => { downloadPDF('full'); setShowExportModal(false); }}
                                className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                                <FileText className="text-blue-600 mb-2" size={24} />
                                <p className="font-medium">Full Report PDF</p>
                                <p className="text-xs text-gray-500">Complete clinical intelligence report</p>
                            </button>
                            <button onClick={() => { downloadPDF('executive'); setShowExportModal(false); }}
                                className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                                <ClipboardList className="text-green-600 mb-2" size={24} />
                                <p className="font-medium">Executive Summary</p>
                                <p className="text-xs text-gray-500">1-page quick overview</p>
                            </button>
                            <button onClick={() => { downloadCSV(); setShowExportModal(false); }}
                                className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                                <FileSpreadsheet className="text-emerald-600 mb-2" size={24} />
                                <p className="font-medium">CSV Export</p>
                                <p className="text-xs text-gray-500">Data for spreadsheets/EHR</p>
                            </button>
                            <button onClick={() => { downloadPatientSummary(); setShowExportModal(false); }}
                                disabled={generatingPatientSummary}
                                className="p-4 border rounded-lg hover:bg-gray-50 text-left disabled:opacity-50">
                                <User className="text-purple-600 mb-2" size={24} />
                                <p className="font-medium">Patient Summary</p>
                                <p className="text-xs text-gray-500">Simple, patient-friendly version</p>
                            </button>
                        </div>
                        <button onClick={() => setShowExportModal(false)}
                            className="mt-4 w-full px-4 py-2 border rounded-lg hover:bg-gray-50">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden print:shadow-none">
                {/* Actions Header */}
                <div className="bg-gray-900 text-white p-4 flex flex-wrap justify-between items-center gap-4 print:hidden">
                    <div className="flex items-center gap-3">
                        <h1 className="font-bold text-xl">Kent Assistant MD</h1>
                        {analysis.riskLevel && (
                            <span className={`${riskColors[analysis.riskLevel]} px-3 py-1 rounded-full text-sm font-bold`}>
                                {analysis.riskLevel} Risk
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setShowExportModal(true)}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg">
                            <Download size={18} /> Export
                        </button>
                        <button onClick={() => setShowFaxModal(true)}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg">
                            <Send size={18} /> Fax
                        </button>
                        <button onClick={() => window.print()} className="flex items-center gap-2 hover:text-blue-300 px-3 py-2">
                            <Printer size={18} /> Print
                        </button>
                        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(analysis, null, 2))} 
                            className="flex items-center gap-2 hover:text-blue-300 px-3 py-2">
                            <Copy size={18} /> JSON
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div className="p-6 md:p-10 print:p-6 space-y-8">
                    {/* Header */}
                    <header className="border-b pb-6 mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Provider Clinical Intelligence Report</h1>
                        <p className="text-gray-500 mt-2 text-sm">CONFIDENTIAL - PROVIDER USE ONLY - DO NOT DISTRIBUTE TO PATIENT</p>
                        <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
                            <p>CASE: <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded">{caseId.slice(0, 8).toUpperCase()}</span></p>
                            <p>DATE: {new Date().toLocaleDateString()}</p>
                            {analysis.riskLevel && (
                                <p>RISK: <span className={`${riskColors[analysis.riskLevel]} text-white px-2 py-1 rounded`}>
                                    {analysis.riskLevel}
                                </span></p>
                            )}
                        </div>
                        {analysis.riskRationale && (
                            <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">{analysis.riskRationale}</p>
                        )}
                    </header>

                    {/* Patient Snapshot & Vitals */}
                    {(analysis.patientSnapshot || analysis.vitalSigns) && (
                        <Section title="Patient Snapshot & Vital Signs" icon={<User className="text-blue-600" />}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {analysis.patientSnapshot && (
                                    <>
                                        <InfoCard label="Age" value={analysis.patientSnapshot.age} />
                                        <InfoCard label="Sex" value={analysis.patientSnapshot.sex} />
                                        <InfoCard label="Chief Complaint" value={analysis.patientSnapshot.chiefComplaint} className="col-span-2" />
                                    </>
                                )}
                                {analysis.vitalSigns && (
                                    <>
                                        <InfoCard label="Blood Pressure" value={analysis.vitalSigns.bloodPressure} icon={<Heart className="text-red-500" size={16} />} />
                                        <InfoCard label="Heart Rate" value={analysis.vitalSigns.heartRate} icon={<Activity className="text-red-500" size={16} />} />
                                        <InfoCard label="Weight" value={analysis.vitalSigns.weight} />
                                        <InfoCard label="BMI" value={analysis.vitalSigns.bmi} />
                                    </>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Executive Summary */}
                    <Section title="Executive Summary" icon={<ClipboardList className="text-blue-600" />}>
                        <p className="text-gray-800 leading-relaxed">{analysis.executiveSummary || analysis.summary || "No summary provided."}</p>
                    </Section>

                    {/* Red Flags */}
                    {analysis.redFlags && analysis.redFlags.length > 0 && (
                        <Section title="Red Flags - Urgent Attention" icon={<AlertTriangle className="text-red-600" />} className="bg-red-50 border-red-200">
                            <div className="space-y-2">
                                {analysis.redFlags.map((flag: any, i: number) => {
                                    const flagText = typeof flag === 'string' ? flag : flag.flag;
                                    const urgency = typeof flag === 'object' ? flag.urgency : null;
                                    return (
                                        <div key={i} className="flex items-start gap-2 p-3 bg-red-100 rounded-lg">
                                            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                                            <div>
                                                <p className="text-red-800 font-medium">{flagText}</p>
                                                {urgency && <p className="text-red-600 text-sm">Urgency: {urgency}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Section>
                    )}

                    {/* Abnormal Findings */}
                    {analysis.abnormalFindings && analysis.abnormalFindings.length > 0 && (
                        <Section title="Abnormal Findings" icon={<AlertCircle className="text-orange-600" />}>
                            <div className="grid gap-2">
                                {analysis.abnormalFindings.map((finding: any, i: number) => {
                                    const text = typeof finding === 'string' ? finding : finding.finding;
                                    const severity = typeof finding === 'object' ? finding.severity : null;
                                    const source = typeof finding === 'object' ? finding.source : null;
                                    return (
                                        <div key={i} className="flex items-start gap-2 p-2 bg-orange-50 rounded">
                                            <span className="text-orange-600">•</span>
                                            <div>
                                                <span className="text-gray-800">{text}</span>
                                                {severity && <span className="ml-2 text-xs bg-orange-200 px-1.5 py-0.5 rounded">{severity}</span>}
                                                {source && <span className="ml-2 text-xs text-gray-500">({source})</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Section>
                    )}

                    {/* System Correlations */}
                    {analysis.systemCorrelations && analysis.systemCorrelations.length > 0 && (
                        <Section title="System Correlations" icon={<TrendingUp className="text-blue-600" />}>
                            <ul className="space-y-2">
                                {analysis.systemCorrelations.map((corr: any, i: number) => {
                                    const text = typeof corr === 'string' ? corr : corr.correlation;
                                    const significance = typeof corr === 'object' ? corr.clinicalSignificance : null;
                                    return (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-blue-600">→</span>
                                            <div>
                                                <span>{text}</span>
                                                {significance && <p className="text-sm text-gray-600 mt-1">{significance}</p>}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </Section>
                    )}

                    {/* Medication Impacts */}
                    {analysis.medicationImpacts && analysis.medicationImpacts.length > 0 && (
                        <Section title="Medication Impacts & Side Effects" icon={<Pill className="text-purple-600" />}>
                            <div className="grid gap-4">
                                {analysis.medicationImpacts.map((med: any, i: number) => (
                                    <div key={i} className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                        <h4 className="font-bold text-purple-900">{med.medication}</h4>
                                        {med.drugClass && <p className="text-sm text-purple-700">({med.drugClass})</p>}
                                        <div className="grid md:grid-cols-2 gap-3 mt-3 text-sm">
                                            <div>
                                                <p className="font-semibold text-gray-700">Intended:</p>
                                                <p>{med.intended}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-red-700">Side Effects:</p>
                                                <p className="text-red-800">{med.possibleSideEffects}</p>
                                            </div>
                                            {med.nutrientDepletions?.length > 0 && (
                                                <div className="md:col-span-2">
                                                    <p className="font-semibold text-orange-700">Nutrient Depletions:</p>
                                                    <p>{med.nutrientDepletions.join(", ")}</p>
                                                </div>
                                            )}
                                            {med.considerations && (
                                                <div className="md:col-span-2 bg-yellow-50 p-2 rounded">
                                                    <p className="font-semibold text-yellow-800">Considerations:</p>
                                                    <p className="text-yellow-900">{med.considerations}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Data Gaps */}
                    {analysis.providerDataGaps && analysis.providerDataGaps.length > 0 && (
                        <Section title="Data Gaps & Provider Prompts" icon={<ClipboardList className="text-gray-600" />}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-3">Missing Item</th>
                                            <th className="p-3">Why It Matters</th>
                                            <th className="p-3">Suggested Question</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysis.providerDataGaps.map((gap: any, i: number) => (
                                            <tr key={i} className="border-t">
                                                <td className="p-3 font-medium">
                                                    {gap.missingItem}
                                                    {gap.priority && <span className="ml-2 text-xs bg-gray-200 px-1.5 py-0.5 rounded">{gap.priority}</span>}
                                                </td>
                                                <td className="p-3 text-gray-600">{gap.whyItMatters}</td>
                                                <td className="p-3 text-blue-700 italic">&quot;{gap.suggestedQuestion}&quot;</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Section>
                    )}

                    {/* Telehealth Questions */}
                    {analysis.telehealthQuestionSet && analysis.telehealthQuestionSet.length > 0 && (
                        <Section title="Telehealth Question Set" icon={<Stethoscope className="text-green-600" />} className="bg-green-50 border-green-200">
                            <ol className="list-decimal list-inside space-y-2">
                                {analysis.telehealthQuestionSet.map((q: any, i: number) => {
                                    const question = typeof q === 'string' ? q : q.question;
                                    const purpose = typeof q === 'object' ? q.purpose : null;
                                    return (
                                        <li key={i} className="text-gray-800">
                                            {question}
                                            {purpose && <span className="text-green-700 text-sm ml-2">({purpose})</span>}
                                        </li>
                                    );
                                })}
                            </ol>
                        </Section>
                    )}

                    {/* Diagnostic Recommendations */}
                    {analysis.diagnosticRecommendations && analysis.diagnosticRecommendations.length > 0 && (
                        <Section title="Diagnostic Plan (Next Steps)" icon={<Activity className="text-blue-600" />}>
                            <div className="grid gap-2">
                                {analysis.diagnosticRecommendations.map((rec: any, i: number) => {
                                    const test = typeof rec === 'string' ? rec : rec.test;
                                    const rationale = typeof rec === 'object' ? rec.rationale : null;
                                    const priority = typeof rec === 'object' ? rec.priority : null;
                                    return (
                                        <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded">
                                            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                                                {i + 1}
                                            </span>
                                            <div>
                                                <p className="font-medium">{test}</p>
                                                {rationale && <p className="text-sm text-gray-600">{rationale}</p>}
                                                {priority && <span className="text-xs bg-blue-200 px-1.5 py-0.5 rounded">{priority}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Section>
                    )}

                    {/* Therapeutic Recommendations */}
                    {analysis.therapeuticRecommendations && (
                        <Section title="Therapeutic Recommendations" icon={<Heart className="text-pink-600" />}>
                            <div className="grid md:grid-cols-2 gap-4">
                                {analysis.therapeuticRecommendations.medications?.length > 0 && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                                            <Pill size={18} /> Medication Considerations
                                        </h4>
                                        <ul className="list-disc pl-5 text-sm space-y-1">
                                            {analysis.therapeuticRecommendations.medications.map((m: any, i: number) => (
                                                <li key={i}>{typeof m === 'string' ? m : m.suggestion}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {analysis.therapeuticRecommendations.supplements?.length > 0 && (
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <h4 className="font-bold text-green-800 mb-2">Supplements</h4>
                                        <ul className="list-disc pl-5 text-sm space-y-1">
                                            {analysis.therapeuticRecommendations.supplements.map((s: any, i: number) => (
                                                <li key={i}>{typeof s === 'string' ? s : s.supplement}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {analysis.therapeuticRecommendations.lifestyle?.length > 0 && (
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <h4 className="font-bold text-purple-800 mb-2">Lifestyle</h4>
                                        <ul className="list-disc pl-5 text-sm space-y-1">
                                            {analysis.therapeuticRecommendations.lifestyle.map((l: any, i: number) => (
                                                <li key={i}>{typeof l === 'string' ? l : l.recommendation}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {analysis.therapeuticRecommendations.biohacking?.length > 0 && (
                                    <div className="bg-cyan-50 p-4 rounded-lg">
                                        <h4 className="font-bold text-cyan-800 mb-2">Biohacking</h4>
                                        <ul className="list-disc pl-5 text-sm space-y-1">
                                            {analysis.therapeuticRecommendations.biohacking.map((b: any, i: number) => (
                                                <li key={i}>{typeof b === 'string' ? b : b.intervention}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Follow-Up Plan */}
                    {analysis.followUpPlan && (
                        <Section title="Follow-Up Plan" icon={<TrendingUp className="text-indigo-600" />}>
                            <div className="grid md:grid-cols-2 gap-4">
                                {analysis.followUpPlan.timing && (
                                    <div className="bg-indigo-50 p-4 rounded-lg">
                                        <h4 className="font-bold text-indigo-800">Timing</h4>
                                        <p>{analysis.followUpPlan.timing}</p>
                                    </div>
                                )}
                                {analysis.followUpPlan.metrics?.length > 0 && (
                                    <div className="bg-indigo-50 p-4 rounded-lg">
                                        <h4 className="font-bold text-indigo-800">Metrics to Track</h4>
                                        <ul className="list-disc pl-5 text-sm">
                                            {analysis.followUpPlan.metrics.map((m: string, i: number) => <li key={i}>{m}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {analysis.followUpPlan.goals?.length > 0 && (
                                    <div className="bg-green-50 p-4 rounded-lg md:col-span-2">
                                        <h4 className="font-bold text-green-800">Goals</h4>
                                        <ul className="list-disc pl-5 text-sm">
                                            {analysis.followUpPlan.goals.map((g: string, i: number) => <li key={i}>{g}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Billing Codes */}
                    {((analysis.billingCodes?.icd10?.length > 0) || (analysis.billingCodes?.cpt?.length > 0) || 
                      (analysis.icd10?.length > 0) || (analysis.cpt?.length > 0)) && (
                        <Section title="Billing & Documentation Codes" icon={<FileText className="text-indigo-600" />} className="bg-indigo-50 border-indigo-200">
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* ICD-10 */}
                                {(analysis.billingCodes?.icd10?.length > 0 || analysis.icd10?.length > 0) && (
                                    <div>
                                        <h4 className="font-bold text-indigo-800 mb-2">ICD-10 Diagnosis Codes</h4>
                                        <div className="space-y-1">
                                            {(analysis.billingCodes?.icd10 || analysis.icd10?.map((c: string) => ({ code: c, description: '' }))).map((c: any, i: number) => (
                                                <div key={i} className="flex gap-2 bg-white p-2 rounded text-sm">
                                                    <span className="font-mono font-bold text-indigo-700">{c.code}</span>
                                                    <span className="text-gray-600">{c.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* CPT */}
                                {(analysis.billingCodes?.cpt?.length > 0 || analysis.cpt?.length > 0) && (
                                    <div>
                                        <h4 className="font-bold text-green-800 mb-2">CPT Procedure Codes</h4>
                                        <div className="space-y-1">
                                            {(analysis.billingCodes?.cpt || analysis.cpt?.map((c: string) => ({ code: c, description: '' }))).map((c: any, i: number) => (
                                                <div key={i} className="flex gap-2 bg-white p-2 rounded text-sm">
                                                    <span className="font-mono font-bold text-green-700">{c.code}</span>
                                                    <span className="text-gray-600">{c.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Quality Check */}
                    {analysis.qualityCheck && (
                        <Section title="Quality & Confidence Check" icon={<AlertCircle className="text-gray-600" />}>
                            <div className="bg-gray-50 p-4 rounded-lg text-sm">
                                <p><strong>Confidence Level:</strong> {analysis.qualityCheck.confidence}</p>
                                {analysis.qualityCheck.assumptions?.length > 0 && (
                                    <p className="mt-2"><strong>Assumptions:</strong> {analysis.qualityCheck.assumptions.join("; ")}</p>
                                )}
                                {analysis.qualityCheck.limitations?.length > 0 && (
                                    <p className="mt-2"><strong>Limitations:</strong> {analysis.qualityCheck.limitations.join("; ")}</p>
                                )}
                                {analysis.qualityCheck.whatWouldChangeConclusion && (
                                    <p className="mt-2"><strong>Would change if:</strong> {analysis.qualityCheck.whatWouldChangeConclusion}</p>
                                )}
                                <p className="mt-4 text-xs text-gray-400">
                                    Disclaimer: This report is AI-generated for clinical decision support only. 
                                    It is not a diagnosis. All findings must be verified by a licensed physician.
                                </p>
                            </div>
                        </Section>
                    )}
                </div>

                {/* Download Actions Footer */}
                <div className="bg-gray-100 p-6 border-t print:hidden">
                    <div className="max-w-2xl mx-auto text-center">
                        <h3 className="font-bold text-gray-900 mb-2">Export Options</h3>
                        <p className="text-sm text-gray-600 mb-4">Download this report in various formats for your workflow.</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <button onClick={() => setShowExportModal(true)}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium">
                                <Download size={20} /> Export Options
                            </button>
                            <button onClick={() => setShowFaxModal(true)}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium">
                                <Send size={20} /> Prepare for Fax
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children, icon, className = "" }: { 
    title: string; 
    children: React.ReactNode; 
    icon?: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={`break-inside-avoid border rounded-lg p-5 ${className}`}>
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
                {icon}
                {title}
            </h3>
            {children}
        </section>
    );
}

function InfoCard({ label, value, icon, className = "" }: { 
    label: string; 
    value?: string; 
    icon?: React.ReactNode;
    className?: string;
}) {
    if (!value || value === 'Not provided') return null;
    return (
        <div className={`bg-gray-50 p-3 rounded ${className}`}>
            <p className="text-xs text-gray-500 flex items-center gap-1">{icon}{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    );
}
