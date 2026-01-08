import { db } from '@/lib/db';

export async function buildContext(caseId: string) {
    const kase = await db.case.findUnique({
        where: { id: caseId },
        include: {
            files: {
                include: {
                    artifacts: true
                }
            },
            transcripts: true
        }
    });

    if (!kase) throw new Error("Case not found");

    const extractedTexts: string[] = [];
    const transcriptTexts: string[] = [];

    // Group text
    kase.files.forEach(f => {
        f.artifacts.forEach(a => {
            extractedTexts.push(`--- File: ${f.filename} (${f.mimeType}) ---\n${a.content}`);
        });
    });

    kase.transcripts.forEach(t => {
        transcriptTexts.push(`--- Live Voice Note (${t.createdAt.toISOString()}) ---\n${t.content}`);
    });

    // Construct context object for LLM
    return {
        caseCode: kase.caseCode,
        rawDocuments: extractedTexts.join("\n\n"),
        activeTranscripts: transcriptTexts.join("\n\n"),
        timestamp: new Date().toISOString()
    };
}
