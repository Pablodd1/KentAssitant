'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CasesPage() {
    const [cases, setCases] = useState<any[]>([]);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/cases')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCases(data);
                } else {
                    console.error('Invalid cases data:', data);
                    setError('Failed to load cases.');
                }
            })
            .catch(err => {
                console.error(err);
                setError('Failed to connect to server.');
            })
            .finally(() => setLoading(false));
    }, []);

    const createCase = async () => {
        try {
            const res = await fetch('/api/cases', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to create case');
            const newCase = await res.json();
            router.push(`/case/${newCase.id}/upload`);
        } catch (e) {
            alert('Error creating case. Please try again.');
        }
    };

    if (loading) return <div className="container mx-auto py-10">Loading cases...</div>;
    if (error) return <div className="container mx-auto py-10 text-red-600">Error: {error}</div>;

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
                    <p className="text-gray-500">No cases found. Create one to get started.</p>
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
