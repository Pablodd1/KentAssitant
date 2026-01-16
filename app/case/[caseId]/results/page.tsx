'use client';
import { useState, useEffect, useCallback } from 'react';
import { Loader2, Printer, Copy } from 'lucide-react';

export default function ResultsPage({ params }: { params: Promise<{ caseId: string }> | { caseId: string } }) {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [caseId, setCaseId] = useState<string>("");
    const [mounted, setMounted] = useState(false);

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
    }, [caseId, runAnalysis]);

    // Trigger initial fetch when caseId is ready
    useEffect(() => {
        if (caseId) {
            fetchResults();
        }
    }, [caseId, fetchResults]);

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
            <p className="text-gray-500">Retrieving medical context and applying Gemini 3 Pro reasoning.</p>
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
            <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden print:shadow-none">

                {/* Actions Header */}
                <div className="bg-gray-900 text-white p-4 flex justify-between items-center print:hidden">
                    <h1 className="font-bold text-xl">Kent Assistant MD</h1>
                    <div className="flex gap-4">
                        <button onClick={() => window.print()} className="flex items-center gap-2 hover:text-blue-300">
                            <Printer size={18} /> Print Report
                        </button>
                        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(analysis, null, 2))} className="flex items-center gap-2 hover:text-blue-300">
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

                    <Section title="3. System Correllations">
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

                    <Section title="5. Red Flags (Urgent Attention Ineeded)">
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
