# SYSTEM CONTRACT

**Status:** ACTIVE
**Anchor Branch:** main (via optimize-backend-extraction)
**Last Audit:** 2024 (Initial Lock)

---

## 1. Purpose
Kent Assistant MD is an advanced clinical intelligence system designed to assist physicians by analyzing patient data (files, transcripts) and generating professional clinical reports using the Gemini 1.5 Pro LLM.

**Target Audience:** Licensed Physicians (Provider Use Only).
**Core Value:** Speed up differential diagnosis and uncover hidden correlations in patient data.

---

## 2. Core Features
| Feature | Status | Implementation |
| :--- | :--- | :--- |
| **Case Management** | ✅ Active | Create/View cases with unique `CaseCode` (KMD-YYYY-XXX). |
| **Data Ingestion** | ✅ Active | Upload PDF/DOCX (extracted via `pdf-parse`/`mammoth`). Images/Audio are stubs awaiting Multimodal API. |
| **Live Context** | ✅ Active | Capture text transcripts (simulated voice notes). |
| **Clinical Analysis** | ✅ Active | Google Gemini 1.5 Pro analysis via `@google/generative-ai`. Strict JSON output. |
| **Report Generation** | ✅ Active | Structured "Provider Confidential" report with differentials, medication impacts, and gaps. |

---

## 3. Data Models (Prisma/PostgreSQL)
*Strict adherence to `prisma/schema.prisma` is required.*

- **User:** System users (ID, Email).
- **Case:** The central unit of work.
  - `status`: DRAFT -> ANALYZING -> COMPLETED.
- **File:** Uploaded documents.
  - `storagePath`: Local FS (Dev) / Secure Blob (Prod).
  - `status`: UPLOADED -> EXTRACTING -> READY.
- **ExtractionArtifact:** Parsed text from files. Used as context for the LLM.
- **Transcript:** Voice/Text notes added to a case.
- **AnalysisRun:** Audit log of LLM outputs (stores raw JSON).

---

## 4. APIs & Architecture
**Framework:** Next.js 14 (App Router).
**Database:** PostgreSQL (via Prisma ORM).

### Key Routes
- `POST /api/files/upload`: Ingests files, saves to `uploads/{caseId}/{uuid}`, triggers extraction.
- `POST /api/cases/{caseId}/analyze`: Aggregates `ExtractionArtifact` + `Transcript`, sends to Gemini, saves `AnalysisRun`.
- `GET /api/cases/{caseId}/results`: Retrieves latest analysis.

### External Integrations
- **LLM:** Google Gemini API (`gemini-1.5-pro`).
- **File Processing:** `pdf-parse` (PDF), `mammoth` (DOCX).
- **Storage:** Local Filesystem (current) -> S3 (planned).

---

## 5. UI & Design System
**Framework:** Tailwind CSS + Radix UI + Lucide React.
**Theme:** "Medical Clean" (Slate/Gray/Blue).
**Rules:**
- Use `lucide-react` for all icons.
- Use `components/ui` (shadcn/ui pattern) for primitives.
- Mobile-responsive layout required.

---

## 6. Business Logic
1. **Extraction First:** Files must be successfully extracted into `ExtractionArtifacts` before analysis.
2. **Context Window:** All artifacts are concatenated. If context exceeds limit, prioritization logic (newer > older) applies (future impl).
3. **Medical Safety:**
   - Reports must be labeled "CONFIDENTIAL - PROVIDER USE ONLY".
   - No patient PII in LLM prompt if possible (currently uses `CaseCode`).
   - LLM Output must be JSON. Failure to parse = Error.

---

## 7. Deployment Rules
1. **Environment Variables:** `DATABASE_URL`, `GEMINI_API_KEY` are mandatory.
2. **Build:** Must run `prisma generate` (via postinstall).
3. **Linting:** Must pass `next lint` (non-interactive).
4. **Testing:** Must pass `jest` suite (Extraction logic).
5. **Branching:** NO direct commits to `main`. All changes via PR + Audit.

---

**LOCKED FOR DEPLOYMENT.**
Any changes violating this contract must be rejected.
