# LLM Lab :- LLM Parameter Experimentation Tool

A production-ready Next.js application for experimenting with LLM parameters (temperature, top_p) and comparing response quality using custom metrics algorithms.

## Features

- **Multi-Parameter Generation**: Generate multiple LLM responses with different parameter combinations
- **Quality Metrics**: Three custom algorithms measuring:
  - **Coherence**: Sentence flow and logical connectivity (Jaccard similarity + transition words)
  - **Completeness**: Content coverage and depth (keyword matching + length appropriateness)
  - **Structural**: Formatting and organization quality (paragraphs, sentence variety, punctuation)
- **Comparison Dashboard**: Side-by-side comparison with color-coded scores
- **Data Visualization**: Interactive charts using Recharts (bar charts, radar charts)
- **Data Persistence**: Vercel Postgres database for storing experiments and responses
- **Export Functionality**: Download experiments as JSON or CSV
- **Professional UI**: Built with shadcn/ui components, Tailwind CSS and responsive design

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Database**: Vercel Postgres (Neon)
- **LLM Integration**: OpenAI API (gpt-4o-mini)
- **Charts**: Recharts
- **Tables**: TanStack Table

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key
- Vercel account (for Postgres)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/anjola-adeuyi/llm-lab.git
cd llm-lab
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
POSTGRES_URL=your_postgres_url_here
POSTGRES_PRISMA_URL=your_postgres_prisma_url_here
POSTGRES_URL_NON_POOLING=your_postgres_url_non_pooling_here
```

4. Set up the database:
   Run the migration SQL script in your Vercel Postgres database:

```bash
# Connect to your Vercel Postgres database and run:
psql < scripts/migrate.sql
```

Or manually execute the SQL from `scripts/migrate.sql` in your database console.

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
llm-lab/
├── app/
│   ├── api/                    # API routes
│   │   ├── generate/           # POST: Generate responses
│   │   ├── experiments/        # GET/POST: CRUD operations
│   │   └── export/             # GET: Export as JSON/CSV
│   ├── experiments/            # Experiment pages
│   │   ├── page.tsx            # List all experiments
│   │   └── [id]/page.tsx       # Single experiment view
│   ├── layout.tsx              # Root layout with QueryClientProvider
│   ├── page.tsx                # Home: Experiment creator
│   └── globals.css             # Global styles
├── components/
│   ├── ui/                     # shadcn/ui base components
│   ├── experiment-form.tsx     # Parameter input form
│   ├── response-card.tsx       # Individual response display
│   ├── comparison-table.tsx    # TanStack Table comparison
│   ├── metrics-chart.tsx       # Recharts visualization
│   └── export-button.tsx        # Download trigger
├── lib/
│   ├── types.ts                 # TypeScript interfaces
│   ├── llm-service.ts           # OpenAI integration
│   ├── metrics-calculator.ts    # Quality algorithms
│   ├── storage-service.ts      # Database operations
│   └── utils.ts                 # Utility functions
└── scripts/
    └── migrate.sql              # Database schema
```

## Usage

### Creating an Experiment

1. Navigate to the home page
2. Enter your prompt in the text area
3. Specify temperature values (comma-separated, e.g., "0.1, 0.5, 0.9")
4. Specify top_p values (comma-separated, e.g., "0.5, 0.9, 1.0")
5. Click "Generate Responses"

The system will:

- Generate all parameter combinations
- Call OpenAI API in parallel for each combination
- Calculate quality metrics for each response
- Store everything in the database
- Redirect you to the comparison dashboard

### Viewing Experiments

- **List View**: Navigate to `/experiments` to see all experiments
- **Detail View**: Click on any experiment to see:
  - Response cards with color-coded scores
  - Interactive comparison table (sortable)
  - Metrics visualization charts
  - Export options (JSON/CSV)

## Quality Metrics Explained

### Coherence Score (0-100)

Measures logical flow and sentence connectivity:

- Calculates Jaccard similarity between consecutive sentences
- Rewards use of transition words
- Higher scores indicate better logical flow

### Completeness Score (0-100)

Measures content depth and coverage:

- Extracts keywords from prompt
- Checks coverage in response
- Evaluates response length appropriateness
- Higher scores indicate better prompt coverage

### Structural Score (0-100)

Measures formatting and organization:

- Paragraph structure (line breaks)
- Sentence variety (length distribution)
- Punctuation quality
- Markdown formatting usage
- Higher scores indicate better organization

### Overall Score

Weighted average: Coherence (40%) + Completeness (35%) + Structural (25%)

## API Endpoints

- `POST /api/generate` - Generate responses with parameter combinations
- `GET /api/experiments` - List all experiments
- `GET /api/experiments/[id]` - Get single experiment with responses
- `GET /api/export/[id]?format=json|csv` - Export experiment data

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

The application will automatically:

- Build using Next.js
- Connect to Vercel Postgres
- Use environment variables from Vercel

## Development

### Running Tests

```bash
npm run lint
```

### Building for Production

```bash
npm run build
npm start
```

## Architecture Decisions

- **Monorepo Next.js**: Single deployment unit, SSR benefits, shared types
- **Vercel Postgres**: Free tier, zero config, SQL familiarity
- **Server Components**: Leverage Next.js 16 performance
- **Parallel API Calls**: Use Promise.allSettled for concurrent LLM requests
- **Custom Metrics**: Production-grade algorithms, not just word counts

## License

MIT

## Author

LLM Labs built by [Anjola Adeuyi](https://www.anjolaadeuyi.com/) demonstrating production-ready AI application development.
