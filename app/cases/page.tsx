'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';

export default function CasesPage() {
    const [cases, setCases] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/cases')
            .then(res => res.json())
            .then(setCases)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const createCase = async () => {
        setIsCreating(true);
        try {
            const res = await fetch('/api/cases', { method: 'POST' });
            const newCase = await res.json();
            router.push(`/case/${newCase.id}/upload`);
        } catch (error) {
            console.error(error);
            setIsCreating(false);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4 sm:px-0">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Cases</h1>
                <button
                    onClick={createCase}
                    disabled={isCreating}
                    aria-label="Create a new case"
                    className="bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none"
                >
                    {isCreating ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Creating...</span>
                        </>
                    ) : (
                        <>
                            <Plus size={18} />
                            <span>New Case</span>
                        </>
                    )}
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <Loader2 className="animate-spin mb-4 text-slate-400" size={48} />
                    <p>Loading cases...</p>
                </div>
            ) : cases.length > 0 ? (
                <div className="grid gap-4">
                    {cases.map((c) => (
                        <div key={c.id} className="border p-4 rounded-lg flex justify-between items-center shadow-sm hover:shadow-md transition-shadow bg-white">
                            <div>
                                <h2 className="font-bold text-xl">{c.caseCode}</h2>
                                <p className="text-gray-500 text-sm mt-1">{new Date(c.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</p>
                                <p className="text-sm mt-1">Status: <span className={`font-medium px-2 py-0.5 rounded text-xs ${
                                    c.status === 'READY' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>{c.status}</span></p>
                            </div>
                            <Link
                                href={`/case/${c.id}/upload`}
                                className="text-blue-600 hover:text-blue-800 font-medium px-4 py-2 rounded-md hover:bg-blue-50 transition-colors focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                aria-label={`Open case ${c.caseCode}`}
                            >
                                Open &rarr;
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                        <Plus className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900">No cases yet</h3>
                    <p className="text-gray-500 mt-2 mb-6 max-w-sm mx-auto">Create your first case to start uploading medical data and generating reports.</p>
                    <button
                        onClick={createCase}
                        className="text-blue-600 font-medium hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-200 rounded px-2 py-1"
                    >
                        Create a case now
                    </button>
                </div>
            )}
        </div>
    );
}
