'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mic, Square, Loader2 } from 'lucide-react';

export default function VoicePage({ params }: { params: Promise<{ caseId: string }> | { caseId: string } }) {
    const [recording, setRecording] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [caseId, setCaseId] = useState<string>("");
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
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

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = uploadAudio;
            mediaRecorder.start();
            setRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Ensure your browser allows permission.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
            // Stop all tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const uploadAudio = async () => {
        if (!caseId) {
            alert("Case ID not loaded");
            return;
        }
        setTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
            const res = await fetch(`/api/cases/${caseId}/voice`, {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) {
                throw new Error(`API error: ${res.status}`);
            }
            const data = await res.json();
            if (data.transcript?.content) {
                setTranscript(data.transcript.content);
            } else {
                throw new Error('Invalid response structure: missing transcript content');
            }
        } catch (err) {
            console.error(err);
            alert("Transcription failed");
        } finally {
            setTranscribing(false);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-2xl text-center">
            <h1 className="text-3xl font-bold mb-8">Voice Context Capture</h1>

            <div className="mb-8 p-10 bg-gray-50 rounded-full inline-block ring-1 ring-gray-200">
                {!recording ? (
                    <button
                        onClick={startRecording}
                        disabled={transcribing}
                        aria-label="Start recording"
                        title="Start recording"
                        className="bg-red-600 text-white p-8 rounded-full hover:bg-red-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300 transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                        <Mic size={48} />
                    </button>
                ) : (
                    <button
                        onClick={stopRecording}
                        aria-label="Stop recording"
                        title="Stop recording"
                        className="bg-gray-800 text-white p-8 rounded-full hover:bg-gray-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-400 transition-all shadow-lg hover:scale-105 active:scale-95"
                    >
                        <Square size={48} />
                    </button>
                )}
            </div>

            <div className="h-12 text-lg" aria-live="polite">
                {recording && <p className="text-red-600 font-bold animate-pulse">Recording... Click square to stop.</p>}
                {transcribing && <p className="text-blue-600 font-bold flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Transcribing...</p>}
            </div>

            {transcript && (
                <div className="mt-8 text-left bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="font-bold mb-2 text-lg">Latest Transcript:</h3>
                    <p className="whitespace-pre-wrap text-gray-700">{transcript}</p>
                </div>
            )}

            <div className="mt-10 flex justify-center gap-6 items-center">
                <Link
                    href={`/case/${caseId}/upload`}
                    className="text-gray-600 hover:text-gray-900 underline"
                >
                    &larr; Back to Upload
                </Link>
                <Link
                    href={`/case/${caseId}/results`}
                    className="bg-black text-white px-8 py-3 rounded-lg text-lg hover:bg-gray-800 shadow-md transition-colors"
                >
                    Run Analysis &rarr;
                </Link>
            </div>
        </div>
    );
}
