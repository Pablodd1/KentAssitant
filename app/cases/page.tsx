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
                    // Still in database mode with error
                    setIsDemo(false);
                } else {
                    setCases(data);
                    // Check if demo data (no real database)
                    if (data.length > 0 && data[0].id.startsWith('demo-')) {
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
                // In demo mode, redirect to demo upload page
                if (isDemo || newCase.id.startsWith('demo-')) {
                    alert('Demo Mode: Case created! (No database connected)');
                    setCases(prev => [newCase, ...prev]);
                } else {
                    router.push(`/case/${newCase.id}/upload`);
                }
            }
        } catch (err) {
            alert('Failed to create case. Check console for errors.');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-10 text-center">
                <p>Loading cases...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            {isDemo && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                    <p className="text-yellow-800">
                        <strong>Demo Mode</strong> - No database connected. Create a case to see the UI flow.
                    </p>
                </div>
            )}
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Cases</h1>
                <button
                    onClick={createCase}
                    className="bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-700"
                >
                    New Case
                </button>
            </div>
            <div className="grid gap-4">
                {cases.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">No cases yet. Click &quot;New Case&quot; to create one.</p>
                ) : (
                    cases.map((c) => (
                        <div key={c.id} className="border p-4 rounded flex justify-between items-center shadow-sm">
                            <div>
                                <h2 className="font-bold text-xl">{c.caseCode}</h2>
                                <p className="text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</p>
                                <p className="text-sm">Status: <span className={`font-medium ${c.status === 'COMPLETED' ? 'text-green-600' : c.status === 'DRAFT' ? 'text-blue-600' : ''}`}>{c.status}</span></p>
                            </div>
                            {c.id.startsWith('demo-') ? (
                                <button 
                                    onClick={() => alert('Demo Mode: Database required for full functionality')}
                                    className="text-blue-600 hover:underline font-medium"
                                >
                                    Open
                                </button>
                            ) : (
                                <Link href={`/case/${c.id}/upload`} className="text-blue-600 hover:underline font-medium">
                                    Open
                                </Link>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
