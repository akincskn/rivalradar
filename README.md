# RivalRadar — AI Competitor Intelligence

Professional competitor analysis in 60 seconds. Enter your company and sector — AI finds your competitors, builds SWOT analysis, compares pricing, and delivers strategic recommendations.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Auth | NextAuth.js v5 + Google OAuth |
| Database | Neon PostgreSQL + Prisma 5 |
| AI Pipeline | N8N (self-hosted) + Groq Llama 3.3 70B |
| Styling | Tailwind CSS + shadcn/ui |
| Deployment | Vercel |

## Features

- **Competitor Discovery** — AI finds 5 direct + 2 indirect competitors automatically
- **SWOT Analysis** — Strengths, weaknesses, opportunities, threats from your market position
- **Pricing Comparison** — Each competitor's pricing model and tiers
- **Feature Gaps** — What competitors have that you don't
- **Win/Loss Scenarios** — When you win or lose against each competitor
- **Strategic Recommendations** — Actionable next steps
- **PDF Export** — Browser print to PDF
- **Guest Trial** — 1 free analysis without an account
- **Credit System** — 3 free reports on sign-up

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/akincskn/rivalradar.git
cd rivalradar
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
N8N_WEBHOOK_URL=""
N8N_WEBHOOK_SECRET=""
```

### 3. Database

```bash
npx prisma db push
```

### 4. N8N Setup

1. Start N8N: `npx n8n`
2. Import `n8n/workflow.json` via N8N UI
3. Add Groq API credential (Header Auth: `Authorization: Bearer YOUR_KEY`)
4. Activate the workflow

### 5. Run

```bash
npm run dev
```

## Project Structure

```
rivalradar/
├── app/
│   ├── (landing)/          # Landing page
│   ├── (auth)/login/       # Google sign-in
│   ├── (dashboard)/        # Protected dashboard
│   ├── analyze/            # Analysis form
│   ├── report/[id]/        # Report view
│   └── api/                # API routes
├── components/
│   ├── layout/Navbar.tsx
│   ├── landing/
│   ├── dashboard/
│   ├── analyze/
│   └── report/
├── lib/
│   ├── n8n/trigger.ts
│   ├── utils/credits.ts
│   ├── validations/
│   └── types/report.ts
├── prisma/schema.prisma
└── n8n/workflow.json       # N8N pipeline definition
```

## N8N Pipeline

Two-agent AI pipeline using `llama-3.3-70b-versatile` via Groq:

1. **Agent 1** — Competitor Discovery (7 competitors, full profiles)
2. **Agent 2** — Strategy & Report (SWOT, gaps, scenarios, recommendations)

## Deployment

```bash
npm i -g vercel
vercel --prod
```

Set env vars in Vercel Dashboard. For N8N, deploy via Docker on Render.com.

## License

MIT
