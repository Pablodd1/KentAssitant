'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CasesPage() {
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/cases')
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setCases(data);
                }
            })
            .catch(err => {
                setError('Failed to load cases. Make sure DATABASE_URL is configured.');
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
                router.push(`/case/${newCase.id}/upload`);
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

    if (error) {
        return (
            <div className="container mx-auto py-10 text-center">
                <h1 className="text-3xl font-bold mb-6">American Wellness MD Assistant</h1>
                <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-md mx-auto">
                    <h2 className="text-red-600 font-bold text-xl mb-2">Database Error</h2>
                    <p className="text-red-700 mb-4">{error}</p>
                    <p className="text-sm text-gray-600">
                        Please configure the DATABASE_URL environment variable in your deployment platform (Vercel/Railway/etc).
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
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
                                <p className="text-sm">Status: <span className="font-medium">{c.status}</span></p>
                            </div>
                            <Link href={`/case/${c.id}/upload`} className="text-blue-600 hover:underline font-medium">
                                Open
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
