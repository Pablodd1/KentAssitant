'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, FolderOpen, Calendar, Activity } from 'lucide-react';

export default function CasesPage() {
    const [cases, setCases] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsLoading(true);
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
            if (res.ok) {
                const newCase = await res.json();
                router.push(`/case/${newCase.id}/upload`);
            } else {
                console.error('Failed to create case');
                setIsCreating(false);
            }
        } catch (error) {
            console.error('Error creating case:', error);
            setIsCreating(false);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <FolderOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Cases</h1>
                </div>
                <button
                    onClick={createCase}
                    disabled={isCreating}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm active:scale-95"
                    aria-busy={isCreating}
                >
                    {isCreating ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Creating...</span>
                        </>
                    ) : (
                        <>
                            <Plus className="h-4 w-4" />
                            <span>New Case</span>
                        </>
                    )}
                </button>
            </div>

            {isLoading ? (
                <div className="grid gap-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="border p-6 rounded-xl bg-gray-50 h-32"></div>
                    ))}
                </div>
            ) : cases.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <div className="mx-auto bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center shadow-sm mb-4">
                        <FolderOpen className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No cases yet</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Create your first case to start uploading medical data and generating reports.
                    </p>
                    <button
                        onClick={createCase}
                        disabled={isCreating}
                        className="text-blue-600 font-medium hover:text-blue-800 flex items-center gap-2 mx-auto"
                    >
                        {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Create First Case
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {cases.map((c) => (
                        <div key={c.id} className="group border p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm hover:shadow-md transition-all bg-white hover:border-blue-200">
                            <div className="mb-4 sm:mb-0">
                                <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                                    {c.caseCode}
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        c.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                        c.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                        {c.status}
                                    </span>
                                </h2>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Activity className="h-3.5 w-3.5" />
                                        <span>Last active today</span>
                                    </div>
                                </div>
                            </div>
                            <Link
                                href={`/case/${c.id}/upload`}
                                className="w-full sm:w-auto text-center px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
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
