'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UploadPage({ params }: { params: { caseId: string } }) {
    const [files, setFiles] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();
    const { caseId } = params;

    const fetchCase = useCallback(async () => {
        const res = await fetch(`/api/cases/${caseId}`);
        if (res.ok) {
            const data = await res.json();
            setFiles(data.files || []);
        }
    }, [caseId]);

    useEffect(() => {
        fetchCase();
        const interval = setInterval(fetchCase, 2000); // Polling for status updates
        return () => clearInterval(interval);
    }, [caseId]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await uploadFiles(Array.from(e.target.files));
        }
    };

    const uploadFiles = async (fileList: File[]) => {
        setUploading(true);
        const formData = new FormData();
        fileList.forEach(f => formData.append('files', f));

        try {
            const res = await fetch(`/api/files/upload?caseId=${caseId}`, {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                // Trigger processing for each
                for (const f of data.files) {
                    try {
                        const processRes = await fetch(`/api/files/${f.id}/process`, { method: 'POST' });
                        if (!processRes.ok) {
                            console.error(`Failed to process file ${f.id}:`, await processRes.text());
                        }
                    } catch (processError) {
                        console.error(`Error processing file ${f.id}:`, processError);
                    }
                }
                await fetchCase();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold">Upload Medical Data</h1>
                <Link
                    href={`/case/${caseId}/voice`}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 shadow-md transition-colors"
                >
                    Next: Voice Capture &rarr;
                </Link>
            </div>

            <div className="bg-white p-8 border-2 border-dashed border-gray-300 rounded-xl text-center hover:bg-gray-50 transition-colors relative cursor-pointer">
                <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2 pointer-events-none">
                    <p className="text-xl font-medium text-gray-700">Drop files here or click to upload</p>
                    <p className="text-sm text-gray-500">PDF, DOCX, Images, Audio, Video</p>
                </div>
                {uploading && <p className="mt-4 text-blue-600 font-bold">Uploading...</p>}
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Uploaded Files ({files.length})</h2>
                <div className="space-y-2">
                    {files.map((file) => (
                        <div key={file.id} className="flex justify-between items-center p-4 bg-gray-50 rounded border">
                            <div>
                                <p className="font-medium truncate max-w-md">{file.filename}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB • {file.mimeType}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded ${file.status === 'READY' ? 'bg-green-100 text-green-700' :
                                        file.status === 'EXTRACTING' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100'
                                    }`}>
                                    {file.status}
                                </span>
                            </div>
                        </div>
                    ))}
                    {files.length === 0 && <p className="text-gray-400 italic">No files yet.</p>}
                </div>
            </div>
        </div>
    );
}
