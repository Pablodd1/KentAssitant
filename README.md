# Kent Assistant MD

Advanced Clinical Intelligence System powered by Google Gemini or OpenAI GPT-4.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide React
- **Backend**: Next.js API Routes, Prisma, PostgreSQL
- **AI**: Google Gemini 1.5 Pro (primary) / OpenAI GPT-4o (fallback)
- **Testing**: Vitest (unit), Playwright (E2E)
- **Security**: Rate limiting, HIPAA-compliant audit logging, input validation

## Setup

### 1. Install Dependencies
```bash
npm install
```
*Note: Requires Node.js 18+*

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure the following variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | No* | PostgreSQL connection string |
| `GEMINI_API_KEY` | Yes** | Google Gemini API key |
| `OPENAI_API_KEY` | Yes** | OpenAI API key (fallback) |

*The app runs in demo mode without a database.
**At least one AI API key is required for analysis.

### 3. Get API Keys

**Google Gemini (Recommended)**:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add to your `.env` as `GEMINI_API_KEY`

**OpenAI (Alternative)**:
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to your `.env` as `OPENAI_API_KEY`

### 4. Database Setup (Optional)
```bash
npx prisma generate
npx prisma db push
```

### 5. Run Locally
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Workflow

1. **Create Case**: Start a new patient session
2. **Upload Data**: Drag & drop PDFs, images, lab results
3. **Voice Context**: Record live audio notes
4. **Analyze**: AI analyzes all data against clinical guidelines
5. **Report**: Generates confidential provider report with:
   - Differential diagnoses
   - Medication impact analysis
   - Nutrient depletion warnings
   - Evidence-based recommendations

## Testing

```bash
# Run unit tests
npm run test

# Run unit tests with watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

## Security Features

- **Rate Limiting**: Configurable per-endpoint rate limits
- **Input Validation**: Zod-based schema validation
- **XSS Prevention**: Input sanitization for all user inputs
- **Audit Logging**: HIPAA-compliant action logging
- **File Validation**: Type and size restrictions on uploads

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `GEMINI_API_KEY` - Your Google Gemini API key

### Environment Variables in Vercel

```
GEMINI_API_KEY=your-gemini-api-key
DATABASE_URL=postgresql://...
```

## Demo Mode

The app runs in demo mode when `DATABASE_URL` is not set:
- Sample patient cases are pre-loaded
- New cases can be created and navigated
- Analysis returns demo clinical intelligence data

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cases` | List all cases |
| POST | `/api/cases` | Create new case |
| GET | `/api/cases/[caseId]` | Get case details |
| DELETE | `/api/cases/[caseId]` | Delete case |
| POST | `/api/cases/[caseId]/analyze` | Run AI analysis |
| GET | `/api/cases/[caseId]/results` | Get analysis results |
| POST | `/api/cases/[caseId]/voice` | Upload voice recording |
| POST | `/api/files/upload` | Upload files |
| POST | `/api/files/[fileId]/process` | Process uploaded file |

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── case/             # Case pages
│   ├── cases/            # Cases list page
│   └── page.tsx          # Home page
├── lib/
│   ├── llmClient.ts      # AI provider abstraction
│   ├── clinicalPrompt.ts # Clinical prompt generation
│   ├── security.ts       # Security utilities
│   ├── demoData.ts       # Demo mode data
│   └── db.ts             # Database client
├── tests/
│   ├── unit/             # Unit tests
│   └── e2e/              # E2E tests
└── prisma/
    └── schema.prisma     # Database schema
```

## License

Private - All rights reserved.

## Changelog

### v0.2.0 (2025-01-17)
- Added Google Gemini API support (primary provider)
- Added comprehensive rate limiting to all endpoints
- Added HIPAA-compliant audit logging
- Added input validation and XSS protection
- Added file type and size validation
- Optimized database connections for serverless
- Added unit test suite (49 tests)
- Added E2E test suite with Playwright
- Improved error handling with safe error messages
