# SYSTEM CONTRACT

## 1. Purpose
Kent Assistant MD is a specialized clinical assistant application designed to ingest medical case data (files, transcripts), extract relevant information, and perform clinical analysis using AI models. It aims to streamline the workflow for medical professionals by automating data organization and preliminary analysis.

## 2. Core Features
- **Case Management:** Create, view, and manage medical cases identified by unique codes (e.g., KMD-2024-001).
- **File Ingestion:** Upload and store medical documents (PDF, DOCX) and media files.
- **Text Extraction:** Extract text content from uploaded files (OCR/Text parsing) for analysis.
- **Transcription:** Handle live microphone input or file uploads for audio transcription.
- **Clinical Analysis:** Analyze case data using AI models (Google Gemini) to generate structured clinical insights.
- **Results Visualization:** Present analysis results in a structured format.

## 3. Data Models
Defined in `prisma/schema.prisma`. Key entities:
- **User:** System users (authentication/profile).
- **Case:** Central entity aggregating files, transcripts, and analyses.
- **File:** Uploaded documents linked to a case.
- **ExtractionArtifact:** Processed text/content derived from files.
- **Transcript:** Audio-to-text records.
- **AnalysisRun:** AI-generated analysis outputs stored as JSON.

## 4. APIs
- **/api/cases:** CRUD operations for cases.
- **/api/files:** File upload and processing endpoints.
- **/api/cases/[caseId]/analyze:** Trigger AI analysis for a specific case.
- **/api/cases/[caseId]/results:** Retrieve analysis results.
- **/api/cases/[caseId]/voice:** Handle voice/audio data.

## 5. UI
- **Framework:** Next.js (App Router).
- **Styling:** Tailwind CSS with `lucide-react` icons.
- **Components:** Shadcn/UI (Radix UI primitives).
- **Key Pages:**
  - Dashboard (Case list).
  - Case View (Details, Files, Transcripts).
  - Results View (Analysis output).

## 6. Business Logic
- **One-Branch Reconstruction:** `main` is the single source of truth.
- **Extraction:** Occurs asynchronously; results stored as `ExtractionArtifacts`.
- **Analysis:** Aggregates all `ExtractionArtifacts` and `Transcripts` for a case to prompt the LLM.
- **Storage:** Local filesystem or cloud storage (abstracted in `lib/storage.ts`).

## 7. Deployment Rules
- **Platform:** Vercel.
- **Database:** PostgreSQL (via Prisma).
- **Build Command:** `prisma generate && next build`.
- **Package Manager:** `pnpm`.
- **Environment:** Requires `DATABASE_URL`, `GEMINI_API_KEY`.
- **Constraint:** Production deployment must always reflect the `main` branch state defined by this contract.
