'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Image, Music, Video, Upload, X } from 'lucide-react';

export default function UploadPage({ params }: { params: Promise<{ caseId: string }> | { caseId: string } }) {
    const [files, setFiles] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    const [caseId, setCaseId] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        const getCaseId = async () => {
            try {
                const resolvedParams = await params;
                setCaseId(resolvedParams.caseId);
            } catch (err) {
                console.error("Failed to resolve case ID");
            }
        };
        getCaseId();
    }, [params]);

    const fetchCase = useCallback(async () => {
        if (!caseId) return;
        
        // Demo mode check
        if (caseId.startsWith('case-') || caseId.startsWith('demo-')) {
            setIsDemo(true);
            // Load demo files for case-001
            if (caseId === 'case-001') {
                setFiles([
                    { id: 'file-001', filename: 'lab-results.pdf', mimeType: 'application/pdf', size: 245000, status: 'READY' },
                    { id: 'file-002', filename: 'patient-intake.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 56000, status: 'READY' }
                ]);
            } else {
                setFiles([]);
            }
            return;
        }
        
        // Normal mode
        const res = await fetch(`/api/cases/${caseId}`);
        if (res.ok) {
            const data = await res.json();
            setFiles(data.files || []);
        }
    }, [caseId]);

    useEffect(() => {
        if (!caseId) return;
        fetchCase();
        // In demo mode, don't poll
        if (isDemo) return;
        const interval = setInterval(fetchCase, 2000);
        return () => clearInterval(interval);
    }, [caseId, fetchCase, isDemo]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            if (isDemo) {
                alert('Demo Mode: File upload is disabled. Connect a database to test full functionality.');
                return;
            }
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

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <Image className="text-green-500" size={20} />;
        if (mimeType.startsWith('audio/')) return <Music className="text-purple-500" size={20} />;
        if (mimeType.startsWith('video/')) return <Video className="text-blue-500" size={20} />;
        return <FileText className="text-gray-500" size={20} />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            {isDemo && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                    <p className="text-yellow-800">
                        <strong>Demo Mode</strong> - File upload is disabled. View the pre-loaded files or proceed to voice capture.
                    </p>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Upload Medical Data</h1>
                <Link
                    href={`/case/${caseId}/voice`}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md transition-colors font-medium"
                >
                    Next: Voice Capture →
                </Link>
            </div>

            <div className="bg-white p-8 border-2 border-dashed border-gray-300 rounded-xl text-center hover:bg-gray-50 transition-colors relative cursor-pointer">
                <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.wav,.mp3,.mp4"
                    onChange={handleFileChange}
                    disabled={uploading || isDemo}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="space-y-2 pointer-events-none">
                    <Upload className="mx-auto text-gray-400" size={48} />
                    <p className="text-xl font-medium text-gray-700">
                        {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
                    </p>
                    <p className="text-sm text-gray-500">PDF, DOCX, Images, Audio, Video</p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Uploaded Files ({files.length})</h2>
                <div className="space-y-2">
                    {files.map((file) => (
                        <div key={file.id} className="flex justify-between items-center p-4 bg-white rounded-lg border shadow-sm">
                            <div className="flex items-center gap-3">
                                {getFileIcon(file.mimeType)}
                                <div>
                                    <p className="font-medium">{file.filename}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)} • {file.mimeType.split('/')[1].toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    file.status === 'READY' ? 'bg-green-100 text-green-700' :
                                    file.status === 'EXTRACTING' ? 'bg-blue-100 text-blue-700' :
                                    file.status === 'ERROR' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {file.status}
                                </span>
                                {file.status === 'READY' && (
                                    <button
                                        className="text-red-500 hover:text-red-700"
                                        aria-label={`Remove ${file.filename}`}
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {files.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p className="text-gray-400 italic">No files uploaded yet</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 flex justify-between">
                <Link
                    href="/cases"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                >
                    ← Back to Cases
                </Link>
                {files.length > 0 && (
                    <Link
                        href={`/case/${caseId}/voice`}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md transition-colors font-medium"
                    >
                        Continue to Voice Capture →
                    </Link>
                )}
            </div>
        </div>
    );
}
