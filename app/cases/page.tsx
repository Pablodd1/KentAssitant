'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CasesPage() {
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/cases')
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setIsDemo(false);
                } else {
                    setCases(data);
                    // Check if demo data
                    if (data.length > 0 && (data[0].id.startsWith('case-') || data[0].id.startsWith('demo-'))) {
                        setIsDemo(true);
                    }
                }
            })
            .catch(err => {
                console.error(err);
            })
            .finally(() => setLoading(false));
    }, []);

    const createCase = async () => {
        try {
            const res = await fetch('/api/cases', { method: 'POST' });
            const newCase = await res.json();
            if (newCase.error) {
                alert(newCase.error);
            } else {
                if (isDemo || newCase.id.startsWith('case-') || newCase.id.startsWith('demo-')) {
                    alert('Demo Mode: Case created!');
                    setCases(prev => [newCase, ...prev]);
                } else {
                    router.push(`/case/${newCase.id}/upload`);
                }
            }
        } catch (err) {
            alert('Failed to create case.');
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

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            {isDemo && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                    <p className="text-yellow-800">
                        <strong>🏥 Demo Mode</strong> - Sample patient cases loaded. Click &quot;Open&quot; on case AWM-2025-0001 to see the full analysis report workflow.
                    </p>
                </div>
            )}
            
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Patient Cases</h1>
                <button
                    onClick={createCase}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-md transition-colors font-medium"
                >
                    + New Case
                </button>
            </div>
            
            <div className="grid gap-4">
                {cases.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 text-lg mb-4">No patient cases yet</p>
                        <button
                            onClick={createCase}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Create First Case
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
                                className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors font-medium"
                            >
                                Open Case →
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
