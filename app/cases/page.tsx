'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';

export default function CasesPage() {
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/cases')
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    console.error('Error loading cases:', data.error);
                } else {
                    setCases(data);
                }
            })
            .catch(err => {
                console.error('Failed to fetch cases:', err);
            })
            .finally(() => setLoading(false));
    }, []);

    const createCase = async () => {
        if (creating) return;
        setCreating(true);
        
        try {
            const res = await fetch('/api/cases', { method: 'POST' });
            const newCase = await res.json();
            
            if (newCase.error) {
                alert(newCase.error);
                return;
            }
            
            // Always navigate to the upload page for the new case
            router.push(`/case/${newCase.id}/upload`);
        } catch (err) {
            console.error('Failed to create case:', err);
            alert('Failed to create case. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-700';
            case 'ANALYZING': return 'bg-blue-100 text-blue-700';
            case 'DRAFT': return 'bg-yellow-100 text-yellow-700';
            case 'ERROR': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-10 text-center">
                <p className="text-xl">Loading cases...</p>
            </div>
        );
    }

    // Check if we're in demo mode (no real database)
    const isDemoMode = cases.some(c => c.id === 'case-001' || c.id === 'case-002' || c.id === 'case-003');

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            {isDemoMode && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                    <p className="text-yellow-800">
                        <strong>🏥 Demo Mode</strong> - Sample patient cases loaded. Database not connected. 
                        Click &quot;Open Case&quot; on AWM-2025-0001 to see the full analysis workflow.
                    </p>
                </div>
            )}
            
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Patient Cases</h1>
                <button
                    onClick={createCase}
                    disabled={creating}
                    aria-busy={creating}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {creating ? (
                        <>
                            <Loader2 className="animate-spin h-5 w-5" />
                            <span>Creating...</span>
                        </>
                    ) : (
                        '+ New Case'
                    )}
                </button>
            </div>
            
            <div className="grid gap-4">
                {cases.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 text-lg mb-4">No patient cases yet</p>
                        <button
                            onClick={createCase}
                            disabled={creating}
                            aria-busy={creating}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center disabled:opacity-50"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                'Create First Case'
                            )}
                        </button>
                    </div>
                ) : (
                    cases.map((c) => (
                        <div key={c.id} className="border p-6 rounded-lg flex justify-between items-center shadow-sm hover:shadow-md transition-shadow bg-white">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="font-bold text-xl">{c.caseCode}</h2>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>
                                        {c.status}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm mb-1">
                                    Created: {new Date(c.createdAt).toLocaleDateString()}
                                </p>
                                <p className="text-gray-500 text-sm">
                                    {c.files?.length > 0 ? `${c.files.length} file(s) uploaded` : 'No files uploaded'}
                                </p>
                            </div>
                            <Link 
                                href={`/case/${c.id}/upload`}
                                aria-label={'Open case ' + c.caseCode}
                                className="group bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors font-medium flex items-center gap-2"
                            >
                                <span>Open Case</span>
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
