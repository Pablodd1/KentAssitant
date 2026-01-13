'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, FolderOpen } from 'lucide-react';

export default function CasesPage() {
    const [cases, setCases] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/cases')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCases(data);
                } else {
                    console.error('API returned non-array:', data);
                    setCases([]);
                }
            })
            .catch(err => {
                console.error(err);
                setCases([]);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    const createCase = async () => {
        setIsCreating(true);
        try {
            const res = await fetch('/api/cases', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to create case');
            const newCase = await res.json();
            router.push(`/case/${newCase.id}/upload`);
        } catch (error) {
            console.error(error);
            setIsCreating(false);
            // Optionally show error toast here
        }
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Patient Cases</h1>
                    <p className="text-gray-500 mt-1">Manage and analyze your patient records</p>
                </div>
                <button
                    onClick={createCase}
                    disabled={isCreating}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    aria-label={isCreating ? "Creating new case..." : "Create new patient case"}
                >
                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {isCreating ? 'Creating...' : 'New Case'}
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p>Loading cases...</p>
                </div>
            ) : cases.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <div className="flex justify-center mb-4">
                        <div className="bg-white p-4 rounded-full shadow-sm">
                            <FolderOpen className="w-8 h-8 text-slate-400" />
                        </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No cases yet</h3>
                    <p className="text-gray-500 mt-1 mb-6 max-w-sm mx-auto">
                        Get started by creating a new patient case to upload records and generate insights.
                    </p>
                    <button
                        onClick={createCase}
                        disabled={isCreating}
                        className="text-slate-900 bg-white border border-gray-300 hover:bg-gray-50 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex items-center gap-2 transition-colors"
                    >
                         {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Create your first case
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {cases.map((c) => (
                        <div key={c.id} className="border border-gray-200 bg-white p-5 rounded-xl flex justify-between items-center shadow-sm hover:shadow-md transition-shadow group">
                            <div>
                                <h2 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{c.caseCode}</h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</p>
                                    <span className="text-gray-300">•</span>
                                    <p className="text-sm text-gray-600">
                                        Status: <span className="font-medium">{c.status}</span>
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={`/case/${c.id}/upload`}
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                aria-label={`Open case ${c.caseCode}`}
                            >
                                Open Case
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
