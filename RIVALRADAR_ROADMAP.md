# RivalRadar — AI-Powered Competitor Analysis Tool

## Proje Özeti

Kullanıcı bir şirket/ürün adı + sektör giriyor. Arkada N8N workflow + AI agent çalışıyor. 60 saniye içinde profesyonel bir rakip analiz raporu çıkıyor. PDF olarak indirebiliyor. Kullanıcı gelir → aracı kullanır → çıktısını alır → gider.

---

## Tech Stack (Sıfır Maliyet)

| Katman | Teknoloji | Free Tier Limiti |
|--------|-----------|-----------------|
| Frontend | Next.js 14 + Tailwind CSS + shadcn/ui | - |
| Deploy (Frontend) | Vercel | 100GB bandwidth/ay |
| Auth + DB + Storage | Supabase | 50K MAU, 500MB DB, 1GB storage |
| Automation Engine | N8N (self-hosted, Render) | Free tier (cold start, UptimeRobot ile çözüm) |
| AI Model (Primary) | Google Gemini 2.0 Flash Free | 15 req/dk, 1500 req/gün |
| AI Model (Fallback) | Groq (Llama 3.3 70B) | 30 req/dk, 14.4K tokens/dk |
| Web Data | Google Custom Search API | 100 query/gün free |
| Web Data (Backup) | SerpAPI | 100 search/ay free |
| PDF Generation | @react-pdf/renderer (client-side) | Ücretsiz |
| Uptime | UptimeRobot | 50 monitor free, 5dk interval |

**Toplam Maliyet: $0/ay**

---

## Mimari Tasarım

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                 │
│              Next.js 14 + Tailwind + shadcn          │
│                                                     │
│  ┌─────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Landing  │  │ Analysis │  │ Report Viewer     │  │
│  │ Page     │  │ Form     │  │ + PDF Download    │  │
│  └─────────┘  └──────────┘  └───────────────────┘  │
│                     │                               │
│              Next.js API Routes                     │
│              (Auth + Validation + N8N trigger)       │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ Webhook POST
                  ▼
┌─────────────────────────────────────────────────────┐
│                 N8N (Render — Self-hosted)            │
│                                                     │
│  [Webhook Trigger]                                  │
│       ↓                                             │
│  [AI Agent #1: Competitor Finder]                   │
│       → Google Search API ile rakip bul             │
│       ↓                                             │
│  [Split In Batches] → Her rakip için:               │
│       ↓                                             │
│  [AI Agent #2: Company Analyzer]                    │
│       → Şirket profili, ürün, fiyatlandırma         │
│  [AI Agent #3: Sentiment Analyzer]                  │
│       → Public review/feedback analizi              │
│       ↓                                             │
│  [Merge] → Tüm veriler birleşir                    │
│       ↓                                             │
│  [AI Agent #4: Report Generator]                    │
│       → SWOT, pazar haritası, öneriler              │
│       ↓                                             │
│  [HTTP Response] → JSON rapor döner                 │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ Rapor JSON
                  ▼
┌─────────────────────────────────────────────────────┐
│              SUPABASE (Auth + DB + Storage)           │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ users    │  │ reports  │  │ credits          │  │
│  │ table    │  │ table    │  │ table            │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Veritabanı Şeması (Supabase/PostgreSQL)

```sql
-- Users (Supabase Auth handles this, but we extend)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 3, -- 3 ücretsiz rapor
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending | processing | completed | failed
  report_data JSONB, -- AI tarafından üretilen rapor verisi
  competitors JSONB, -- rakip listesi
  swot JSONB, -- SWOT analizi
  market_position JSONB, -- pazar konumlandırma
  pricing_comparison JSONB, -- fiyat karşılaştırma
  recommendations JSONB, -- AI önerileri
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Credit Transactions (audit trail)
CREATE TABLE public.credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- +3 (signup bonus), -1 (report used)
  reason TEXT NOT NULL, -- 'signup_bonus', 'report_generated', 'admin_grant'
  report_id UUID REFERENCES public.reports(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## N8N Workflow Detayı

### Workflow 1: Main Analysis Pipeline

**Trigger:** Webhook (POST /analyze)

**Input:**
```json
{
  "company_name": "Slack",
  "sector": "Team Communication",
  "user_id": "uuid",
  "report_id": "uuid"
}
```

**Step 1 — Competitor Finder (AI Agent)**
- Google Custom Search API ile "{company_name} competitors {sector}" arar
- AI agent sonuçları parse eder, top 5 rakibi çıkarır
- Output: `["Microsoft Teams", "Discord", "Zoom", "Google Chat", "Mattermost"]`

**Step 2 — Split In Batches**
- Her rakip için paralel analiz başlatır

**Step 3 — Company Analyzer (AI Agent per competitor)**
- Google Search ile şirket hakkında bilgi toplar
- AI agent şu veriyi çıkarır:
  - Company overview (1-2 paragraf)
  - Key products/features
  - Pricing model (free/freemium/paid + fiyatlar)
  - Target audience
  - Founded year, HQ, employee count (tahmini)

**Step 4 — Sentiment Analyzer (AI Agent per competitor)**
- Google Search ile "{competitor} reviews", "{competitor} pros cons" arar
- AI agent sentiment skoru (1-10) + key strengths/weaknesses çıkarır

**Step 5 — Merge**
- Tüm rakip verilerini tek bir JSON'a birleştirir

**Step 6 — Report Generator (AI Agent)**
- Tüm veriyi alır, şunları üretir:
  - SWOT analizi (hedef şirket için)
  - Competitive landscape özeti
  - Fiyatlandırma karşılaştırma tablosu
  - Market positioning (her rakibin güçlü/zayıf yönü)
  - Actionable recommendations (3-5 madde)

**Step 7 — HTTP Response**
- Raporu JSON olarak frontend'e döner

**AI Model Config (N8N):**
```
Primary: Gemini 2.0 Flash (Google AI node)
Fallback: Groq Llama 3.3 70B (HTTP Request node)

Fallback mantığı:
- Gemini rate limit'e takılırsa → Groq'a geç
- IF node ile error check → Switch
```

---

## Sayfa Yapısı (Frontend)

```
/                       → Landing Page (hero, features, demo, pricing)
/login                  → Auth (Supabase Google OAuth)
/dashboard              → Rapor geçmişi + kredi durumu
/analyze                → Analiz formu (şirket adı + sektör)
/report/[id]            → Rapor görüntüleme sayfası
/report/[id]/pdf        → PDF indirme (client-side generation)
```

### Klasör Yapısı

```
rivalradar/
├── app/
│   ├── (landing)/
│   │   └── page.tsx              # Landing page
│   ├── (auth)/
│   │   ├── login/page.tsx        # Login
│   │   └── callback/route.ts     # Supabase OAuth callback
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Auth-protected layout
│   │   ├── dashboard/page.tsx    # Rapor geçmişi
│   │   ├── analyze/page.tsx      # Analiz formu
│   │   └── report/
│   │       └── [id]/page.tsx     # Rapor detay
│   ├── api/
│   │   ├── analyze/route.ts      # N8N webhook trigger
│   │   ├── report/[id]/route.ts  # Rapor getir
│   │   └── credits/route.ts      # Kredi kontrolü
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Pricing.tsx
│   │   └── Footer.tsx
│   ├── dashboard/
│   │   ├── ReportCard.tsx
│   │   ├── CreditBadge.tsx
│   │   └── ReportList.tsx
│   ├── analyze/
│   │   ├── AnalyzeForm.tsx
│   │   └── AnalyzingAnimation.tsx
│   └── report/
│       ├── ReportHeader.tsx
│       ├── CompetitorCard.tsx
│       ├── SwotChart.tsx
│       ├── PricingTable.tsx
│       ├── MarketMap.tsx
│       ├── Recommendations.tsx
│       └── PdfExport.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Auth middleware
│   ├── n8n/
│   │   └── trigger.ts            # N8N webhook caller
│   ├── types/
│   │   ├── report.ts             # Report types
│   │   ├── competitor.ts         # Competitor types
│   │   └── database.ts           # DB types (Supabase generated)
│   ├── validations/
│   │   └── analyze.ts            # Zod schemas
│   └── utils/
│       ├── credits.ts            # Credit management
│       └── pdf.ts                # PDF generation helpers
├── middleware.ts                  # Auth route protection
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Implementation Plan (Faz 1 — MVP)

### : Temel Altyapı

**: Proje Setup + N8N Kurulumu**
- [ ] Next.js 14 projesi oluştur (App Router)
- [ ] Tailwind + shadcn/ui kur
- [ ] Supabase projesi oluştur
- [ ] DB şemasını oluştur (profiles, reports, credit_transactions)
- [ ] Supabase Auth (Google OAuth) kur
- [ ] N8N'i Render'da deploy et (Docker)
- [ ] UptimeRobot ayarla (5dk interval ping)
- [ ] Ortam değişkenlerini ayarla (.env.local)

**: Auth + Layout**
- [ ] Supabase client/server helpers
- [ ] Auth middleware (route protection)
- [ ] Login sayfası (Google OAuth)
- [ ] Dashboard layout (sidebar + header)
- [ ] Credit badge component

**: N8N — İlk Workflow**
- [ ] N8N'de Webhook trigger oluştur
- [ ] Gemini AI model credential'ı ekle
- [ ] Groq credential'ı ekle (fallback)
- [ ] Basit test: webhook → AI agent → response
- [ ] Fallback mantığı: Gemini hata → Groq'a geç

### : Core Feature — Analiz Pipeline

**: N8N Full Pipeline**
- [ ] AI Agent #1: Competitor Finder workflow
- [ ] Google Custom Search API entegrasyonu
- [ ] Split In Batches: her rakip için loop
- [ ] AI Agent #2: Company Analyzer
- [ ] AI Agent #3: Sentiment Analyzer
- [ ] Merge node: veri birleştirme
- [ ] AI Agent #4: Report Generator (SWOT, recommendations)
- [ ] Error handling: timeout, rate limit, fallback

**: Frontend — Analiz Akışı**
- [ ] Analyze form sayfası (şirket adı + sektör + sector suggestions)
- [ ] Zod validation
- [ ] API route: /api/analyze (N8N webhook trigger + kredi kontrolü)
- [ ] Analyzing animation (progress steps göster)
- [ ] Polling mekanizması (rapor hazır mı kontrol)

**: Frontend — Rapor Görüntüleme**
- [ ] Report page (/report/[id])
- [ ] CompetitorCard component
- [ ] SwotChart (basit grid veya radar chart — recharts)
- [ ] PricingTable component
- [ ] Recommendations listesi

### : Polish + Deploy

**: Dashboard + PDF**
- [ ] Dashboard sayfası (rapor geçmişi listesi)
- [ ] ReportCard component (status badge, tarih, şirket adı)
- [ ] PDF export (@react-pdf/renderer)
- [ ] Kredi sistemi (3 free, sonra "coming soon" göster)

**: Landing Page + Deploy**
- [ ] Landing page (Hero, Features, HowItWorks, Pricing, Footer)
- [ ] Mobile responsive kontrol
- [ ] SEO meta tags
- [ ] Vercel'e deploy
- [ ] Custom domain (opsiyonel)
- [ ] Final test: uçtan uca akış

**: README + Tanıtım**
- [ ] GitHub README (screenshots, tech stack, architecture diagram)
- [ ] LinkedIn post hazırla
- [ ] Portfolio sitesine ekle

---

## N8N Öğrenme Haritası (Bu Projede Öğreneceğin Kavramlar)

| Kavram | Nerede Kullanılıyor |
|--------|-------------------|
| Webhook Trigger | Ana analiz endpoint'i |
| HTTP Response | Raporu frontend'e dönme |
| AI Agent (LangChain) | 4 farklı agent (finder, analyzer, sentiment, report) |
| HTTP Request Node | Google Search API, Groq API çağrıları |
| Split In Batches | Her rakip için paralel işlem |
| Merge Node | Rakip verilerini birleştirme |
| IF Node | Fallback: Gemini hata → Groq |
| Switch Node | Rapor tipine göre branching |
| Set Node | Veri dönüştürme/formatlama |
| Error Trigger | Hata yakalama ve loglama |
| Sub-workflow | Tekrar eden agent'ları modülerleştirme |
| Credentials | Gemini, Groq, Google Search API key yönetimi |
| Expressions | Dynamic veri: {{$json.company_name}} |
| Binary Data | PDF oluşturma (opsiyonel) |

---

## Faz 2 — Genişleme (MVP Sonrası)

- [ ] Karşılaştırmalı analiz (2 şirketi yan yana)
- [ ] Email ile rapor gönderme (Resend free tier)
- [ ] Rapor paylaşma (public link)
- [ ] Stripe entegrasyonu (ödeme)
- [ ] API erişimi (developer'lar için)
- [ ] Scheduled monitoring (haftalık rakip takibi — cron trigger)
- [ ] MCP entegrasyonu (Browser MCP ile canlı web scraping)

---

## Risk ve Çözümler

| Risk | Çözüm |
|------|-------|
| Gemini rate limit | Groq fallback + request queue |
| Google Search API 100/gün limit | SerpAPI free tier (100/ay) backup + cache (aynı şirket tekrar aranmasın) |
| N8N Render cold start (30s) | UptimeRobot 5dk ping |
| N8N workflow timeout | 60s timeout set, uzun işlemleri split |
| AI hallucination (yanlış veri) | "AI-generated disclaimer" ekle, kaynak URL'leri göster |
| Supabase free tier limiti | İlk 1000 kullanıcıya kadar yeterli |

---

## Maliyet Tahmini (Scale Ettiğinde)

| Kullanıcı Sayısı | Maliyet | Notlar |
|-------------------|---------|--------|
| 0-100 | $0/ay | Free tier'lar yeterli |
| 100-500 | ~$20/ay | N8N hosting upgrade gerekebilir |
| 500-1000 | ~$50/ay | Gemini paid tier, daha fazla search |
| 1000+ | ~$100+/ay | Supabase Pro, dedicated N8N |

---

## Claude Code Prompt (Bu projeye başlarken Claude Code'a verilecek)

```
Sen benim senior mentor/tech lead'imsin. RivalRadar projesinde çalışıyoruz.

Proje: AI-powered competitor analysis tool
Stack: Next.js 14 + Tailwind + shadcn/ui + Supabase + N8N (Render) + Gemini/Groq
Mimari: Frontend (Vercel) → API Routes → N8N Webhook → AI Agents → Response

Kurallar:
- TypeScript strict mode, any YASAK
- Zod validation tüm input'larda
- Her API route'ta auth kontrolü + try/catch
- loading.tsx, error.tsx her sayfada
- Mobile responsive
- Dosya başına tek sorumluluk, max 200 satır
- Conventional commits
- Production-ready, placeholder/TODO YASAK
- Her kararın NEDEN'ini açıkla

ROADMAP dosyasına bak: RIVALRADAR_ROADMAP.md
```