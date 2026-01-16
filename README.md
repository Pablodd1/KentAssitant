# Kent Assistant MD

Advanced Clinical intelligence system powered by OpenAI GPT-4.

## Tech Stack
- Frontend: Next.js (App Router), Tailwind CSS, Lucide React
- Backend: Next.js API Routes, Prisma, PostgreSQL
- AI: OpenAI GPT-4o

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```
   *Note: If you encounter issues, ensure Node.js 18+ is in your PATH.*

2. **Environment Variables**:
   Copy `.env.example` to `.env`.
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL`: Connection string for PostgreSQL (Neon, Vercel Postgres, etc.)
   - `OPENAI_API_KEY`: OpenAI API Key from https://platform.openai.com/api-keys

3. **Database Initialization**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run Locally**:
   ```bash
   npm run dev
   ```

## Workflow
1. **Create Case**: Start a new patient session.
2. **Upload Data**: Drag & drop PDFs, images, labs. (Basic text extraction is enabled; full OCR/PDF requires additional libraries).
3. **Voice Context**: Record live audio of patient interactions or doctor notes. 
4. **Analyze**: OpenAI GPT-4 analyzes all files and transcripts against clinical guidelines.
5. **Report**: Generates a "Provider Confidential" report with differentials, medication impacts, and recommendations.

## Deployment
- **Vercel**: Deploy directly. Add environment variables in Vercel settings:
  - `DATABASE_URL` - Your Neon PostgreSQL connection string
  - `OPENAI_API_KEY` - Your OpenAI API key
- **Database**: Use Neon, Vercel Postgres, or Supabase.

## Demo Mode
The app runs in demo mode when `DATABASE_URL` is not set. In demo mode:
- Sample patient cases are pre-loaded
- New cases can be created and navigated
- Analysis returns demo clinical intelligence data

## Extraction Notes
The current extraction pipeline (`lib/extraction.ts`) contains stubs for complex file types (OCR, Audio Transcriptions). Real implementation requires `pdf-parse`, `mammoth`, and an audio transcription API.
