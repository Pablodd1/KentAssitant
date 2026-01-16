# Kent Assistant MD

Advanced Clinical intelligence system powered by Gemini 3 Pro intent (using Gemini 1.5 Pro).

## Tech Stack
- Frontend: Next.js (App Router), Tailwind CSS, Lucide React
- Backend: Next.js API Routes, Prisma, PostgreSQL
- AI: Google Gemini Pro

## Setup

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```
   *Note: This project uses `pnpm`. If you encounter issues, ensure Node.js 18+ is in your PATH.*

2. **Environment Variables**:
   Copy `.env.example` to `.env`.
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL`: Connection string for PostgreSQL.
   - `GEMINI_API_KEY`: (Optional) Google AI Studio API Key.
   - `OPENAI_API_KEY`: (Optional) OpenAI API Key (GPT-4) - Used if Gemini key is missing.

3. **Database Initialization**:
   ```bash
   pnpm exec prisma generate
   pnpm exec prisma db push
   ```

4. **Run Locally**:
   ```bash
   pnpm dev
   ```

## Workflow
1. **Create Case**: Start a new patient session.
2. **Upload Data**: Drag & drop PDFs, images, labs. (Basic text extraction is enabled; full OCR/PDF requires additional libraries).
3. **Voice Context**: Record live audio of patient interactions or doctor notes. 
4. **Analyze**: Gemini analyzes all files and transcripts against clinical guidelines.
5. **Report**: Generates a "Provider Confidential" report with differentials, medication impacts, and recommendations.

## Deployment
- **Vercel**: Deploy directly. Add environment variables in Vercel settings.
- **Database**:
  1. Go to the "Storage" tab in your Vercel dashboard.
  2. Click "Connect Store" or "Create Database".
  3. Select **Neon** (Serverless Postgres) from the Marketplace list.
  4. Follow the prompts to connect. Vercel will automatically populate `DATABASE_URL` and other variables.

## Extraction Notes
The current extraction pipeline (`lib/extraction.ts`) contains stubs for complex file types (OCR, Audio Transcriptions). Real implementation requires sticking `pdf-parse`, `mammoth`, and an audio transcription API key.
