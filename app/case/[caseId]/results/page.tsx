'use client';
import { useState, useEffect } from 'react';
import { Loader2, Printer, Copy, Download, Send, FileText, X } from 'lucide-react';

export default function ResultsPage({ params }: { params: Promise<{ caseId: string }> | { caseId: string } }) {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [caseId, setCaseId] = useState<string>("");
    const [mounted, setMounted] = useState(false);
    const [showFaxModal, setShowFaxModal] = useState(false);
    const [faxInfo, setFaxInfo] = useState({ name: '', faxNumber: '', organization: '' });
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    // Resolve params promise if present (Next.js 14 compatibility)
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

    const fetchResults = async () => {
        if (!caseId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/cases/${caseId}/results`);
            if (!res.ok) {
                throw new Error(`API error: ${res.status}`);
            }
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
    };

    const runAnalysis = async () => {
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
    };

    const downloadPDF = async () => {
        if (!analysis) return;
        setDownloadingPdf(true);
        try {
            // Dynamically import to avoid SSR issues
            const { generateClinicalPDF } = await import('@/lib/pdfGenerator');
            const doc = generateClinicalPDF(analysis, caseId);
            doc.save(`clinical-report-${caseId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error('PDF generation error:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setDownloadingPdf(false);
        }
    };

    const downloadFaxReady = async () => {
        if (!analysis) return;
        setDownloadingPdf(true);
        try {
            const { generateClinicalPDF, generateFaxCoverSheet } = await import('@/lib/pdfGenerator');
            
            // Generate cover sheet
            const coverSheet = generateFaxCoverSheet(caseId, faxInfo.name ? faxInfo : undefined);
            
            // Generate main report
            const report = generateClinicalPDF(analysis, caseId);
            
            // Download both files
            coverSheet.save(`fax-cover-${caseId.slice(0, 8)}.pdf`);
            setTimeout(() => {
                report.save(`clinical-report-${caseId.slice(0, 8)}-FAX.pdf`);
            }, 500);
            
            setShowFaxModal(false);
        } catch (err) {
            console.error('Fax PDF generation error:', err);
            alert('Failed to generate fax documents. Please try again.');
        } finally {
            setDownloadingPdf(false);
        }
    };

    // Trigger initial fetch when caseId is ready
    useEffect(() => {
        if (caseId) {
            fetchResults();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseId]);

    // Prevent hydration mismatch by not rendering until mounted
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
            <p className="text-gray-500">Retrieving medical context and applying AI reasoning.</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <p className="text-red-600 font-bold mb-4">{error}</p>
            <button onClick={() => fetchResults()} className="bg-black text-white px-4 py-2 rounded">Retry</button>
        </div>
    );

    if (!analysis) return null;

    return (
        <div className="bg-gray-50 min-h-screen p-8 print:bg-white print:p-0">
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
                        <p className="text-gray-600 text-sm mb-4">
                            Enter recipient details for the fax cover sheet. Leave blank to fill in manually.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
                                <input
                                    type="text"
                                    value={faxInfo.name}
                                    onChange={(e) => setFaxInfo({ ...faxInfo, name: e.target.value })}
                                    placeholder="Dr. John Smith"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                                <input
                                    type="text"
                                    value={faxInfo.organization}
                                    onChange={(e) => setFaxInfo({ ...faxInfo, organization: e.target.value })}
                                    placeholder="City Medical Center"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fax Number</label>
                                <input
                                    type="text"
                                    value={faxInfo.faxNumber}
                                    onChange={(e) => setFaxInfo({ ...faxInfo, faxNumber: e.target.value })}
                                    placeholder="(555) 123-4567"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowFaxModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={downloadFaxReady}
                                disabled={downloadingPdf}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {downloadingPdf ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                                Generate Fax PDFs
                            </button>
                        </div>
                        <p className="mt-4 text-xs text-gray-500 text-center">
                            This will download a cover sheet and the clinical report as separate PDFs.
                        </p>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden print:shadow-none">

                {/* Actions Header */}
                <div className="bg-gray-900 text-white p-4 flex flex-wrap justify-between items-center gap-4 print:hidden">
                    <h1 className="font-bold text-xl">Kent Assistant MD</h1>
                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={downloadPDF}
                            disabled={downloadingPdf}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {downloadingPdf ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                            Download PDF
                        </button>
                        <button 
                            onClick={() => setShowFaxModal(true)}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                        >
                            <Send size={18} /> Prepare for Fax
                        </button>
                        <button onClick={() => window.print()} className="flex items-center gap-2 hover:text-blue-300 px-3 py-2">
                            <Printer size={18} /> Print
                        </button>
                        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(analysis, null, 2))} className="flex items-center gap-2 hover:text-blue-300 px-3 py-2">
                            <Copy size={18} /> Copy JSON
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div className="p-12 print:p-8 space-y-8">
                    <header className="border-b pb-6 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Provider Clinical Intelligence Report</h1>
                        <p className="text-gray-500 mt-2">CONFIDENTIAL - PROVIDER USE ONLY - DO NOT DISTRIBUTE TO PATIENT</p>
                        <div className="mt-4 flex gap-8 text-sm font-medium">
                            <p>CASE CODE: <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded">{caseId.slice(0, 8).toUpperCase()}</span></p>
                            <p>DATE: {new Date().toLocaleDateString()}</p>
                        </div>
                    </header>

                    <Section title="1. Executive Summary">
                        <p className="text-gray-800 leading-relaxed">{analysis.executiveSummary || analysis.summary || "No summary provided."}</p>
                    </Section>

                    <Section title="2. Abnormal Findings">
                        <ul className="list-disc pl-5 space-y-1">
                            {analysis.abnormalFindings?.map((item: string, i: number) => (
                                <li key={i} className="text-red-700 font-medium">{item}</li>
                            ))}
                            {(!analysis.abnormalFindings || analysis.abnormalFindings.length === 0) && <li>No abnormal findings flags.</li>}
                        </ul>
                    </Section>

                    <Section title="3. System Correlations">
                        <ul className="list-disc pl-5 space-y-1">
                            {analysis.systemCorrelations?.map((item: string, i: number) => (
                                <li key={i}>{item}</li>
                            ))}
                            {(!analysis.systemCorrelations || analysis.systemCorrelations.length === 0) && <li>No correlations detected.</li>}
                        </ul>
                    </Section>

                    <Section title="4. Medication Impacts & Side-Effects">
                        {analysis.medicationImpacts?.length > 0 ? (
                            <div className="grid gap-4">
                                {analysis.medicationImpacts.map((med: any, i: number) => (
                                    <div key={i} className="bg-blue-50 p-4 rounded-lg border border-blue-100 print:border-gray-300">
                                        <h4 className="font-bold text-blue-900">{med.medication}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-sm">
                                            <div>
                                                <p className="font-semibold text-gray-700">Intended Effect:</p>
                                                <p>{med.intended}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-red-700">Side Effect Considerations:</p>
                                                <p className="text-red-800">{med.possibleSideEffects}</p>
                                            </div>
                                            {med.nutrientDepletions?.length > 0 && (
                                                <div className="col-span-2">
                                                    <p className="font-semibold text-orange-700">Potential Depletions:</p>
                                                    <p>{med.nutrientDepletions.join(", ")}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-gray-500 italic">No medications detected.</p>}
                    </Section>

                    <Section title="5. Red Flags (Urgent Attention Needed)">
                        <ul className="list-disc pl-5 space-y-1">
                            {analysis.redFlags?.map((item: string, i: number) => (
                                <li key={i} className="text-red-600 font-bold bg-red-50 p-1">{item}</li>
                            ))}
                            {(!analysis.redFlags || analysis.redFlags.length === 0) && <li>None detected.</li>}
                        </ul>
                    </Section>

                    <Section title="6. Data Gaps & Provider Prompts">
                        <table className="w-full text-left text-sm border bg-white">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="p-2">Missing Item</th>
                                    <th className="p-2">Clinical Context</th>
                                    <th className="p-2">Suggested Question</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analysis.providerDataGaps?.map((gap: any, i: number) => (
                                    <tr key={i} className="border-b">
                                        <td className="p-2 font-medium">{gap.missingItem}</td>
                                        <td className="p-2 text-gray-600">{gap.whyItMatters}</td>
                                        <td className="p-2 italic text-blue-800">&quot;{gap.suggestedQuestion}&quot;</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Section>

                    <Section title="7. Therapeutic Considerations">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-green-50 p-4 rounded border-green-100">
                                <h4 className="font-bold text-green-800 mb-2">Supplement Strategy</h4>
                                <ul className="list-disc pl-5 text-sm space-y-1">
                                    {analysis.therapeuticRecommendations?.supplements?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div className="bg-purple-50 p-4 rounded border-purple-100">
                                <h4 className="font-bold text-purple-800 mb-2">Lifestyle & Biohacking</h4>
                                <ul className="list-disc pl-5 text-sm space-y-1">
                                    {analysis.therapeuticRecommendations?.lifestyle?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                    {analysis.therapeuticRecommendations?.biohacking?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        </div>
                    </Section>

                    <Section title="8. Diagnostic Plan (Next Steps)">
                        <ul className="list-disc pl-5 space-y-1">
                            {analysis.diagnosticRecommendations?.map((item: string, i: number) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </Section>

                    <Section title="9. Quality Check">
                        <div className="text-sm text-gray-600">
                            <p><strong>Confidence:</strong> {analysis.qualityCheck?.confidence}</p>
                            <p><strong>Assumptions:</strong> {analysis.qualityCheck?.assumptions?.join("; ")}</p>
                            <p className="mt-2 text-xs text-gray-400">Disclaimer: This report is AI-generated for clinical decision support only. It is not a diagnosis. All findings must be verified by a licensed physician.</p>
                        </div>
                    </Section>
                </div>

                {/* Download Actions Footer */}
                <div className="bg-gray-100 p-6 border-t print:hidden">
                    <div className="max-w-2xl mx-auto text-center">
                        <h3 className="font-bold text-gray-900 mb-2">Export Options</h3>
                        <p className="text-sm text-gray-600 mb-4">Download this report for your records or prepare it for fax transmission.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <button 
                                onClick={downloadPDF}
                                disabled={downloadingPdf}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {downloadingPdf ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                                Download PDF Report
                            </button>
                            <button 
                                onClick={() => setShowFaxModal(true)}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                <Send size={20} /> Prepare for Fax
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">
                            The fax option generates a cover sheet with recipient details and a formatted clinical report suitable for fax transmission.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <section className="break-inside-avoid">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider">{title}</h3>
            {children}
        </section>
    );
}
