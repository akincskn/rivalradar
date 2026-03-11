# RivalRadar — Mimari Dokümantasyon

> **Son güncelleme:** 2026-03-10
> Bu döküman projenin tüm katmanlarını, teknik kararlarını ve veri akışını açıklar.

---

## İçindekiler

1. [Genel Mimari Diyagramı](#1-genel-mimari-diyagramı)
2. [Frontend Mimarisi](#2-frontend-mimarisi)
3. [Backend / API Mimarisi](#3-backend--api-mimarisi)
4. [Auth Mimarisi](#4-auth-mimarisi)
5. [Database Mimarisi](#5-database-mimarisi)
6. [N8N Workflow Mimarisi](#6-n8n-workflow-mimarisi)
7. [Deploy Mimarisi](#7-deploy-mimarisi)
8. [Veri Akışı (End-to-End)](#8-veri-akışı-end-to-end)
9. [Maliyet Tablosu](#9-maliyet-tablosu)
10. [Bilinen Limitasyonlar ve İyileştirme Önerileri](#10-bilinen-limitasyonlar-ve-iyileştirme-önerileri)

---

## 1. Genel Mimari Diyagramı

```
┌─────────────────────────────────────────────────────────────────┐
│                        KULLANICI (Browser)                       │
│                    Chrome / Firefox / Safari                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend + API)                        │
│                                                                  │
│  ┌─────────────────┐    ┌──────────────────────────────────┐    │
│  │  Next.js 14     │    │  Next.js API Routes              │    │
│  │  App Router     │    │                                  │    │
│  │                 │    │  POST /api/analyze               │    │
│  │  Sayfa Katmanı  │◄───│  GET  /api/report/[id]          │    │
│  │  Server + Client│    │  GET  /api/credits               │    │
│  │  Components     │    │  GET  /api/auth/[...nextauth]    │    │
│  └────────┬────────┘    └────────────┬─────────────────────┘    │
│           │                          │                           │
│           │ auth()                   │ auth() + prisma           │
└───────────┼──────────────────────────┼───────────────────────────┘
            │                          │
            │ OAuth                    │ SQL (SSL)
            ▼                          ▼
┌───────────────────┐    ┌─────────────────────────────────────┐
│  GOOGLE OAUTH     │    │  NEON PostgreSQL                    │
│  accounts.google  │    │  (Serverless PostgreSQL)            │
│  .com             │    │                                     │
│                   │    │  Users / Accounts / Sessions        │
│  Session token    │    │  Reports / CreditTransactions       │
│  + profile info   │    │                                     │
└───────────────────┘    └─────────────────────────────────────┘
                                        ▲
                                        │ Prisma ORM
                         ┌──────────────┘
                         │
            POST /api/analyze
            (HTTP fetch, 55s timeout)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  RENDER.COM (N8N Self-hosted)                    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              N8N Workflow Engine                         │   │
│  │                                                          │   │
│  │  Webhook ──► Input Validate ──► Agent1 Prompt           │   │
│  │                                      │                   │   │
│  │                                      ▼                   │   │
│  │                               GROQ API (LLM)             │   │
│  │                               llama-3.3-70b              │   │
│  │                               Competitor Discovery       │   │
│  │                                      │                   │   │
│  │                                      ▼                   │   │
│  │                               Agent2 Prompt              │   │
│  │                                      │                   │   │
│  │                                      ▼                   │   │
│  │                               GROQ API (LLM)             │   │
│  │                               Strategic Analysis         │   │
│  │                                      │                   │   │
│  │                                      ▼                   │   │
│  │                               Format Response            │   │
│  │                                      │                   │   │
│  │                                      ▼ JSON              │   │
│  │                               Webhook Response           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  UptimeRobot her 5 dakikada ping → cold start önlenir           │
└─────────────────────────────────────────────────────────────────┘

Her katmanın sorumluluğu:
- Vercel/Next.js: UI render, auth, iş mantığı, DB erişimi
- Neon PostgreSQL: Kalıcı veri saklama (users, reports, credits)
- Render/N8N: AI orchestration, LLM pipeline yönetimi
- Google OAuth: Kimlik doğrulama (third-party)
- Groq: LLM inference (llama-3.3-70b)
- UptimeRobot: Render free tier'ın sleep modunu engelleme
```

---

## 2. Frontend Mimarisi

### Sayfa Yapısı (App Router Routing)

```
app/
├── layout.tsx                    ← Root layout (font, SessionProvider)
├── globals.css                   ← Tailwind base + CSS değişkenleri
│
├── (landing)/
│   └── page.tsx                  ← "/" Ana sayfa (public)
│
├── (auth)/
│   └── login/
│       └── page.tsx              ← "/login" Google OAuth butonu
│
├── (dashboard)/
│   ├── layout.tsx                ← Dashboard layout (Navbar + auth double-check)
│   └── dashboard/
│       ├── page.tsx              ← "/dashboard" Rapor listesi + kredi
│       ├── loading.tsx           ← Skeleton loader
│       └── error.tsx             ← Error boundary
│
├── analyze/
│   ├── page.tsx                  ← "/analyze" Form sayfası (public)
│   └── loading.tsx               ← Skeleton loader
│
├── report/
│   └── [id]/
│       ├── page.tsx              ← "/report/:id" Rapor görüntüleme (public)
│       ├── loading.tsx           ← Skeleton loader
│       └── error.tsx             ← Error boundary
│
└── api/
    ├── analyze/route.ts          ← POST /api/analyze
    ├── report/[id]/route.ts      ← GET  /api/report/:id
    ├── credits/route.ts          ← GET  /api/credits
    └── auth/[...nextauth]/       ← NextAuth handler
        └── route.ts
```

### Component Hiyerarşisi

```
app/layout.tsx
└── Providers (SessionProvider)
    └── children
        ├── Navbar (Server Component)
        │   ├── buttonVariants (lib/button-variants.ts)
        │   └── signIn / signOut (Server Actions)
        │
        ├── Landing Page
        │   ├── Hero
        │   ├── Features
        │   ├── HowItWorks
        │   ├── Pricing
        │   └── Footer
        │
        ├── Login Page
        │   └── LoginButton (Server Component + Server Action)
        │
        ├── Dashboard Page
        │   ├── DashboardHeader (avatar, isim)
        │   ├── CreditBadge (kalan kredi)
        │   └── ReportList
        │       └── ReportCard[] (her rapor için)
        │
        ├── Analyze Page
        │   └── AnalyzeForm (Client Component)
        │       ├── react-hook-form + Zod resolver
        │       ├── Sector suggestion pills
        │       └── Guest trial / credit uyarıları
        │
        └── Report Page
            ├── GuestBanner (misafirler için CTA)
            ├── AutoRefresh (Client Component — processing state)
            ├── PrintButton (Client Component)
            └── Inline report sections (all Server rendered)
```

### State Management

RivalRadar'da **global state yok**. Her sayfa kendi verisini server-side alır:

- **Dashboard**: `auth()` + Prisma query (server-side)
- **Analyze**: `auth()` + kredi sorgusu (server-side) → `AnalyzeForm`'a prop olarak geçer
- **Report**: `auth()` + Prisma query (server-side) → doğrudan render

Client-side state sadece şunlarda var:
- `AnalyzeForm`: `useState` (server error), `react-hook-form` (form state)
- `AutoRefresh`: `useEffect` (timer)

Bu yaklaşımın avantajı: SWR/Zustand/Redux gibi state library ihtiyacı yok, her şey React Server Components ile SSR.

### Auth Flow

```
1. Kullanıcı "/" veya "/login"a gelir
2. Middleware: /dashboard için auth kontrol → session yoksa /login redirect
3. LoginButton: form action="use server" → signIn("google")
4. Google OAuth consent screen
5. Google callback → NextAuth /api/auth/callback/google
6. PrismaAdapter: User + Account kayıtlarını oluşturur
7. createUser event: 3 kredi transaction logu eklenir (credits default=3 zaten)
8. Session cookie set edilir (DB session, JWT değil)
9. /dashboard'a redirect
```

### Client vs Server Component Kararları

| Component | Tip | Neden |
|---|---|---|
| `Navbar` | Server | Auth state okuma (cookies, session) |
| `LoginButton` | Server | Server Action (`"use server"`) kullanıyor |
| `DashboardHeader` | Server | Sadece prop render, interaction yok |
| `CreditBadge` | Server | Sadece prop render |
| `ReportList` | Server | Sadece prop render |
| `ReportCard` | Server | Sadece prop render |
| `AnalyzeForm` | Client | `useState`, `useForm`, `fetch` kullanıyor |
| `AutoRefresh` | Client | `useEffect` (window.location.reload) |
| `PrintButton` | Client | `window.print()` |
| `GuestBanner` | Server | Sadece static UI |
| Tüm Landing components | Server | Static, interaction yok |

**Kural**: `"use client"` sadece browser API'si (window, document, event handler) veya React hooks gereken yerlerde kullanılır.

---

## 3. Backend / API Mimarisi

### API Route Listesi

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| `POST` | `/api/analyze` | Session veya guestId | Rapor analizi başlat |
| `GET` | `/api/report/[id]` | Session veya guestId | Rapor verisi getir |
| `GET` | `/api/credits` | Session (zorunlu) | Kullanıcı kredisi getir |
| `GET/POST` | `/api/auth/[...nextauth]` | — | NextAuth handler |

### Request → Response Akışı: /api/analyze

```
POST /api/analyze
{companyName: "Slack", sector: "Team Communication"}
         │
         ▼
1. Auth kontrolü
   auth() → session?.user?.id
   cookies() → guestId
   isGuest = !session?.user?.id

   if (isGuest && !guestId) → 401
         │
         ▼
2. Input validation (Zod)
   analyzeSchema.safeParse(body)
   companyName: string min(2) max(100) trim()
   sector: string min(2) max(100) trim()

   if (!parsed.success) → 400 + flatten errors
         │
         ▼
3. Kredi / trial kontrolü
   if (isGuest):
     checkGuestTrial(guestId) → count of non-failed reports
     if count > 0 → 402
   else:
     checkUserCredits(userId) → credits > 0?
     if !hasCredits → 402
         │
         ▼
4. Rapor oluştur
   prisma.report.create({ userId, guestId, companyName, sector, status: "processing" })
   → reportId
         │
         ▼
5. Kredi düş (auth kullanıcı)
   deductCredit(userId, reportId)
   → Atomic: UPDATE user WHERE credits > 0 (race condition safe)
   → CreditTransaction log
   if (!credited) → report.status = "failed" → 500
         │
         ▼
6. N8N tetikle
   triggerAnalysis({ company_name, sector, user_id, report_id })
   → fetch(N8N_WEBHOOK_URL, { timeout: 55s })
         │
         ├── N8N başarılı ──────────────────────────────────┐
         │                                                    ▼
         │                                         7. Raporu tamamla
         │                                         prisma.report.update({
         │                                           status: "completed",
         │                                           reportData: toJson(reportData),
         │                                           competitors, swot, ...
         │                                           completedAt: new Date()
         │                                         })
         │                                         → 201 { reportId }
         │
         └── N8N başarısız ─────────────────────────────────┐
                                                              ▼
                                                   Auth kullanıcı: kredi iade
                                                   prisma.$transaction([
                                                     user.credits += 1,
                                                     report.status = "failed"
                                                   ])
                                                   → 500 { error }
```

### Error Handling Stratejisi

Tüm route'lar `try/catch` ile sarılmıştır. Hata kategorileri:

```typescript
// Validation hatası (kullanıcı hatası)
return NextResponse.json({ error: "Invalid input", details: ... }, { status: 400 });

// Auth hatası
return NextResponse.json({ error: "..." }, { status: 401 });

// Yetersiz kaynak (kredi)
return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });

// Beklenmedik sunucu hatası (detay gizlenir)
return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
```

**İç hata detayları client'a gönderilmez.** Sadece generic mesaj döner. Bu, iç sistem bilgisinin (DB yapısı, N8N URL vs.) sızdırılmasını önler.

### Prisma Kullanım Pattern'i

```typescript
// SELECT sadece gerekli field'lar
prisma.user.findUnique({ where: { id }, select: { credits: true } });

// Atomic transaction (race condition önleme)
await prisma.$transaction([
  prisma.user.update({ where: { id, credits: { gt: 0 } }, data: { credits: { decrement: 1 } } }),
  prisma.creditTransaction.create({ data: { ... } }),
]);

// Promise.all ile paralel sorgular
const [user, reports] = await Promise.all([
  prisma.user.findUnique(...),
  prisma.report.findMany(...),
]);

// Authorization: userId VEYA guestId kontrolü
prisma.report.findFirst({
  where: { id, OR: [{ userId }, { guestId }] },
});
```

---

## 4. Auth Mimarisi

### NextAuth.js v5 Konfigürasyonu

**Dosya:** `auth.ts` (root)

```
NextAuth v5-beta (next-auth@beta)
├── Provider: Google OAuth
├── Adapter: PrismaAdapter (@auth/prisma-adapter)
│   → Session/Account/User kayıtlarını otomatik yönetir
├── Session strategy: Database (JWT değil)
│   → Her session DB'de saklanır, token'dan okuma yok
├── Callbacks:
│   └── session: user.id'yi session objesine ekle
└── Events:
    └── createUser: Signup bonus — CreditTransaction logu
```

**Neden Database Session (JWT değil)?**
PrismaAdapter kullanıldığında NextAuth default olarak database session seçer. Bu yaklaşımda:
- Session token → DB'ye kayıt
- Her request'te `auth()` çağrıldığında token DB'den doğrulanır
- Logout anında session silinir → token invalidation anında gerçekleşir
- JWT'de bu olmaz (token expire olana kadar geçerli kalır)

### Google OAuth Flow (Adım Adım)

```
1. Kullanıcı "Sign In with Google" butonuna tıklar
   → Server Action: signIn("google", { redirectTo: "/dashboard" })

2. NextAuth Google OAuth URL oluşturur
   → accounts.google.com/o/oauth2/auth?client_id=...&redirect_uri=...

3. Google consent screen gösterilir

4. Kullanıcı onaylar → Google callback URL'e yönlendirir
   → /api/auth/callback/google?code=...

5. NextAuth authorization code ile access_token alır
   → Google API: token endpoint

6. Google profil bilgileri alınır (name, email, image)

7. PrismaAdapter:
   a. User kaydı var mı? → Yoksa oluştur
   b. Account kaydı oluştur (provider, providerAccountId)
   c. Session kaydı oluştur (sessionToken, expires)

8. createUser event (sadece yeni kullanıcı):
   → CreditTransaction kaydı: amount=3, reason="signup_bonus"
   (User zaten credits=3 ile oluşturulmuş — bu sadece audit trail)

9. Session cookie set edilir (HTTP-only, secure, sameSite)

10. Kullanıcı /dashboard'a redirect edilir
```

### Session Yönetimi

```typescript
// Session augmentation (types/next-auth.d.ts)
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"]
  }
}

// session callback (auth.ts)
async session({ session, user }) {
  if (session.user) {
    session.user.id = user.id; // DB'den gelen gerçek id
  }
  return session;
}

// Kullanım (herhangi bir Server Component / API route)
const session = await auth();
const userId = session?.user?.id; // garanti edilmiş
```

### Middleware ile Route Protection

```typescript
// middleware.ts
export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

Sadece `/dashboard` ve altı korunur. `/analyze` ve `/report` herkese açıktır — misafirler `guestId` cookie ile kendi raporlarına erişebilir.

**Defense in Depth:** Dashboard layout (`app/(dashboard)/layout.tsx`) da bağımsız olarak auth kontrolü yapar. Middleware → Layout çift katman güvenlik sağlar.

---

## 5. Database Mimarisi

### ER Diyagramı

```
┌─────────────────────────────────────────────────────────────────┐
│                         User                                     │
│  id           String  PK  @default(cuid())                      │
│  name         String?                                           │
│  email        String? @unique                                   │
│  emailVerified DateTime?                                        │
│  image        String?                                           │
│  credits      Int     @default(3)                               │
│  createdAt    DateTime                                          │
│  updatedAt    DateTime @updatedAt                               │
└──────────────┬───────────────────┬──────────────────────────────┘
               │ 1:N               │ 1:N
               ▼                   ▼
┌──────────────────────┐  ┌──────────────────────────────────────┐
│      Account         │  │         CreditTransaction            │
│  id        PK        │  │  id        PK                        │
│  userId    FK→User   │  │  userId    FK→User                   │
│  type      String    │  │  amount    Int  (+ veya -)           │
│  provider  String    │  │  reason    String                    │
│  providerAccountId   │  │  reportId  FK→Report? (nullable)     │
│  access_token?       │  │  createdAt DateTime                  │
│  @@unique(provider,  │  └──────────────────────────────────────┘
│    providerAccountId)│
└──────────────────────┘
                                  ┌──────────────────────────────┐
                                  │           Session            │
                                  │  id           PK             │
                                  │  sessionToken String @unique │
                                  │  userId    FK→User           │
                                  │  expires   DateTime          │
                                  └──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                           Report                                 │
│  id                String  PK  @default(cuid())                 │
│  userId            String? FK→User (null = misafir raporu)      │
│  guestId           String? (tarayıcı UUID, misafir takibi)      │
│  companyName       String                                       │
│  sector            String                                       │
│  status            String  @default("pending")                  │
│  reportData        Json?   (tam N8N çıktısı)                    │
│  competitors       Json?   (sadece competitor array)            │
│  swot              Json?   (sadece SWOT)                        │
│  marketPosition    Json?   (sadece market positions)            │
│  pricingComparison Json?   (ad + pricing özeti)                 │
│  recommendations   Json?   (hızlı öneriler)                     │
│  createdAt         DateTime                                     │
│  completedAt       DateTime?                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Tablo Açıklamaları

| Tablo | Amaç |
|---|---|
| `User` | Uygulama kullanıcısı. `credits` alanı gerçek zamanlı kredi bakiyesi. |
| `Account` | OAuth provider bağlantısı (Google hesabı). NextAuth tarafından yönetilir. |
| `Session` | Aktif oturumlar. Token her request'te DB'de doğrulanır. |
| `VerificationToken` | Email doğrulama tokenleri (şu an kullanılmıyor, NextAuth şeması). |
| `Report` | Her analiz raporu. `userId` veya `guestId` ile sahiplik belirlenir. |
| `CreditTransaction` | Kredi hareketleri audit trail (+3 signup, -1 per report). |

### Prisma Şemasındaki Önemli Kararlar

**Neden `@default(cuid())`?**
UUID yerine CUID kullanıldı çünkü CUID'ler daha kısa, URL-friendly ve collision ihtimali pratikte sıfır. Dezavantajı: `.uuid()` Zod validasyonu kullanılamaz, `.min(1)` kullanılır.

**Neden `userId` nullable (Report tablosunda)?**
Misafir kullanıcılar (oturum açmadan) da rapor oluşturabilir. Bu durumda `userId = null`, `guestId = browser UUID`. Kullanıcı sonradan oturum açsa bile eski misafir raporları ona atanmaz (privacy gereği).

**Neden JSON alanlar?**
`reportData`, `competitors`, `swot` gibi alanlar Prisma `Json` tipinde. Bu sayede:
- Çok sayıda tablo (competitors, pricing tiers vs.) oluşturmak yerine tek kaydda tüm veri
- AI çıktısı yapısı değişirse migration gerekmez
- Trade-off: JSON alanlar üzerinde SQL query/filter yapılamaz

**Neden `credits` User tablosunda?**
Alternatif: CreditTransaction'ları toplayarak hesaplamak. Ama her sorguda SUM() yapmak performanssız. `credits` field cache olarak tutuluyor, her değişiklikte hem field hem transaction güncelleniyor.

**Neden status String (Enum değil)?**
Prisma native enum migration gerektiriyor. String + application-level type (`"pending" | "processing" | "completed" | "failed"`) daha esnek. Yeni status eklemek schema migration gerektirmiyor.

### Migration Stratejisi

Geliştirme: `npx prisma db push` (migration dosyası olmadan direkt push)
Production: Neon'a deploy öncesi `npx prisma db push` veya formal migration için `npx prisma migrate deploy`
Build adımında: `package.json` build script'inde `prisma generate && next build` — Vercel'de Prisma Client'ı oluşturur.

---

## 6. N8N Workflow Mimarisi

### N8N Nedir, Bu Projede Neden Kullanıldı?

N8N, open-source bir workflow automation aracı. Vercel'de çalışan Next.js serverless functions'ın 60 saniye timeout limiti var. AI pipeline (2 LLM çağrısı) ~50-60 saniye sürüyor. N8N bu pipeline'ı kendi node'larında çalıştırarak Vercel'in timeout baskısını hafifletiyor.

Ek faydalar:
- LLM çağrıları retry/error handling N8N içinde yönetiliyor
- Pipeline değişikliği için kod deploy gerekmez, sadece N8N workflow güncellemesi
- Credential (Groq API key) N8N'de şifreli saklanıyor, kaynak kodda yok

### Workflow Akışı (Node Detaylı)

```
Node 1: Webhook Tetikleyici (Analiz Tetikleyici)
├── Tip: n8n-nodes-base.webhook
├── Method: POST
├── Path: rivalradar-analyze
├── responseMode: responseNode (bekleme modu — 55s)
└── webhookId: 81ea2280-49ab-45a8-914e-4ac6f3e7fff3

         │
         ▼

Node 2: Input Doğrula (Code Node)
├── body.company_name ve body.sector trim + validate
├── body.report_id ve body.user_id extract
└── Hata: company_name veya sector boşsa throw Error

         │
         ▼

Node 3: Agent1 Prompt Builder (Code Node)
├── company_name ve sector ile rakip keşif prompt'u oluşturur
├── 7 rakip istiyor: 5 direct + 2 indirect
├── Groq request body hazırlar:
│   ├── model: llama-3.3-70b-versatile
│   ├── temperature: 0.1 (düşük = tutarlı JSON)
│   ├── max_tokens: 2000
│   └── response_format: { type: 'json_object' }
└── System prompt: "All text MUST be in English"

         │
         ▼

Node 4: Agent1 - Rakip Keşfi (HTTP Request)
├── POST https://api.groq.com/openai/v1/chat/completions
├── Auth: Header Auth (Groq API Key)
├── timeout: 30000ms (30 saniye)
└── Çıktı: competitors[] JSON dizisi

         │
         ▼

Node 5: Agent2 Prompt Builder (Code Node)
├── Agent1 çıktısını parse eder (competitors[])
├── competitors verisiyle stratejik analiz prompt'u oluşturur
├── Tam rapor template'i içerir (swot, featureGaps, winLoss vs.)
├── Groq request body hazırlar:
│   ├── model: llama-3.3-70b-versatile
│   ├── temperature: 0.15
│   ├── max_tokens: 3500
│   └── response_format: { type: 'json_object' }
└── System prompt: "strategic business analyst"

         │
         ▼

Node 6: Agent2 - Strateji ve Rapor (HTTP Request)
├── POST https://api.groq.com/openai/v1/chat/completions
├── Auth: Header Auth (Groq API Key)
├── timeout: 55000ms (55 saniye)
└── Çıktı: Tam ReportData JSON

         │
         ▼

Node 7: Yanıt Formatla (Code Node)
├── Agent2 çıktısını parse eder
├── Eksik alanlar için default değerler koyar ([], "")
├── success: true ile sarmalar
└── Webhook'a { success: true, data: reportData } döner
```

### AI Agent'ların Prompt'ları ve Sorumlulukları

**Agent 1 — Competitor Discovery:**
- Görevi: Gerçek rakip şirketleri bul, temel bilgileri topla
- Çıktı: 7 competitor objesi (ad, website, tip, fiyatlandırma, özellikler vs.)
- Neden ayrı: Max token limiti nedeniyle discovery ve analysis ayrıldı
- Token: ~500 input + ~2000 output

**Agent 2 — Strategic Analysis:**
- Görevi: Agent1 verisiyle derin analiz yap (SWOT, feature gaps, senaryolar)
- Çıktı: Tam ReportData (executiveSummary, swot, marketPositions, recommendations vs.)
- Token: ~2500 input (Agent1 çıktısı dahil) + ~3500 output

**Neden 2 agent (4 yerine)?**
İlk tasarımda 4 agent vardı. Groq'un 12K TPM (tokens per minute) limiti nedeniyle rate limit hataları aldı. 2 agent'a düşürüldüğünde ~5000-6000 toplam token ile limit içinde kalındı.

### Webhook Trigger Mekanizması

```
Frontend (Next.js API Route)
│
│  fetch(process.env.N8N_WEBHOOK_URL, {
│    method: "POST",
│    headers: { "X-Webhook-Secret": secret },
│    body: JSON.stringify(payload),
│    signal: AbortController (55s timeout)
│  })
│
▼
N8N Webhook Node (responseMode: "responseNode")
│  → Workflow çalışır, tüm node'lar tamamlanır
│  → Son node response döner
│
▼
Next.js fetch response
│  { success: true, data: { ... } }
│
▼
Prisma: report.status = "completed"
```

`responseMode: "responseNode"` sayesinde N8N, tüm workflow tamamlanana kadar HTTP bağlantısını açık tutar. Bu "long-polling" benzeri bir yaklaşım.

### N8N Render'da Deploy Edilmesi

N8N Docker image olarak Render.com'da çalışıyor:
- Render ücretsiz tier: 512MB RAM, 0.5 CPU
- Disk: `/home/node/.n8n` path'inde persistent volume (workflow ve credentials burada)
- SQLite: N8N kendi metadata'sını SQLite'da tutar (workflow_entity, webhook_entity tabloları)
- Environment variables: `N8N_BASIC_AUTH_ACTIVE`, `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD`, `WEBHOOK_URL`

### UptimeRobot ile Cold Start Çözümü

Render ücretsiz tier, 15 dakika inaktivite sonrası instance'ı uyutur (cold start ~30 saniye). Bu N8N webhook'larının yanıtsız kalmasına yol açar.

UptimeRobot her **5 dakikada** N8N health endpoint'ine GET isteği atar → instance sürekli uyanık kalır.

### SQLite DB'deki Webhook Path Fix

N8N'in `getNodeWebhookPath()` fonksiyonu, yalnızca `node.webhookId` tanımlı VE `isFullPath=true` olduğunda tam path döner. Aksi halde rastgele UUID path üretir, her restart'ta değişir.

**Kalıcı Fix (Manuel SQLite Düzeltmesi):**
```sql
-- webhook_entity tablosunda path düzeltme
UPDATE webhook_entity SET webhookPath = 'rivalradar-analyze' WHERE webhookId = '81ea2280...';

-- workflow_entity.nodes JSON'unda webhookId ekleme
-- workflow_history active version'da da aynı düzeltme
```
Webhook node'una `webhookId: "81ea2280-49ab-45a8-914e-4ac6f3e7fff3"` eklenerek path her restart'ta sabit kalıyor.

---

## 7. Deploy Mimarisi

### Vercel (Frontend + API)

```
GitHub master branch → Vercel otomatik deploy

Build komutu: prisma generate && next build
  ↑ NEDEN prisma generate: Vercel build sırasında node_modules
    temiz kurulur. Prisma Client oluşturulmadan next build başarısız olur.

Gerekli Environment Variables:
  DATABASE_URL          = neon postgresql://... (connection string)
  NEXTAUTH_URL          = https://rivalradar.vercel.app
  NEXTAUTH_SECRET       = (openssl rand -base64 32)
  GOOGLE_CLIENT_ID      = (Google Cloud Console)
  GOOGLE_CLIENT_SECRET  = (Google Cloud Console)
  N8N_WEBHOOK_URL       = https://[render-subdomain].onrender.com/webhook/rivalradar-analyze
  N8N_WEBHOOK_SECRET    = (opsiyonel, webhook güvenliği için)

maxDuration: 60  ← api/analyze/route.ts'de tanımlı
  → Vercel Pro'da 60s, Free'de 10s (!)
  → FREE tier kullanılıyorsa N8N 10s içinde dönemez → upgrade gerekli
```

**Google OAuth Redirect URI (Google Cloud Console):**
```
https://rivalradar.vercel.app/api/auth/callback/google
```

### Render.com (N8N)

```
Service Type: Web Service
Docker Image: n8nio/n8n:latest
Region: Frankfurt (EU) veya Oregon (US)
Plan: Free (512MB RAM, 0.5 CPU)

Persistent Disk:
  Mount Path: /home/node/.n8n
  Size: 1GB (workflows, credentials, SQLite DB)

Environment Variables:
  N8N_BASIC_AUTH_ACTIVE = true
  N8N_BASIC_AUTH_USER   = admin
  N8N_BASIC_AUTH_PASSWORD = (strong password)
  WEBHOOK_URL           = https://[subdomain].onrender.com/
  GENERIC_TIMEZONE      = Europe/Istanbul

Port: 5678

Health Check Path: /healthz
```

### Neon (Database)

```
Plan: Free Tier
  - 0.5 GB storage
  - 1 compute unit
  - Auto-suspend after 5 dakika inaktivite (connection pool açık tutar)

Connection String:
  postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

Önemli: sslmode=require zorunlu. Olmadan bağlantı reddedilir.

Connection Pooling:
  Neon Serverless driver (pgBouncer) kullanılabilir
  Şu an direkt bağlantı kullanılıyor (Prisma handle ediyor)
```

### UptimeRobot

```
Monitor Tipi: HTTP(s)
URL: https://[n8n-render-subdomain].onrender.com/healthz
Interval: Her 5 dakika
Alert: Email (N8N down olursa)
Amaç: Render free tier'ın sleep modunu önle
```

---

## 8. Veri Akışı (End-to-End)

Bir kullanıcının ilk kez rapor oluşturma süreci, baştan sona:

### Adım 1: Login

```
Kullanıcı "/" → "Get Started Free" → "/analyze"
                                     (henüz giriş yapmamış)

"/analyze" sayfası yüklenir:
  - auth() → session yok → isGuest = true
  - guestId cookie yok → guestTrialUsed = false
  - AnalyzeForm render: isGuest=true, credits=0, guestTrialUsed=false
  - "You have 1 free analysis" banner görünür
```

### Adım 2: Analiz Başlatma (Guest)

```
Kullanıcı "Slack" + "Team Communication" girer
→ "Start Free Analysis" tıklar

AnalyzeForm.onSubmit():
  1. getOrCreateGuestId() → crypto.randomUUID()
     → cookie: guestId=abc123; expires=30gün; samesite=strict

  2. fetch("/api/analyze", { method: "POST", body: {companyName, sector} })

/api/analyze handler:
  1. auth() → null (guest)
  2. cookies() → guestId = "abc123"
  3. isGuest = true
  4. analyzeSchema.safeParse → { companyName: "Slack", sector: "Team Communication" }
  5. checkGuestTrial("abc123") → count = 0 → hasFreeTrial = true
  6. prisma.report.create({ guestId: "abc123", status: "processing" }) → reportId = "cld123"
  7. triggerAnalysis({ company_name: "Slack", sector: "Team Communication", ... })
```

### Adım 3: N8N Pipeline

```
N8N Webhook alır (POST /webhook/rivalradar-analyze):
  body: { company_name: "Slack", sector: "Team Communication", report_id: "cld123", ... }

Node 1 (Webhook): HTTP bağlantı açık kalır
Node 2 (Validate): company_name ve sector doğrular
Node 3 (Agent1 Prompt): Rakip keşif prompt'u hazırlar
Node 4 (Agent1 HTTP): Groq API'ye POST (30s timeout)
  → Groq: llama-3.3-70b-versatile
  → Çıktı: { competitors: [Zoom, Teams, Discord, Webex, Slack alternatives...] }

Node 5 (Agent2 Prompt): Stratejik analiz prompt'u hazırlar (competitors verisiyle)
Node 6 (Agent2 HTTP): Groq API'ye POST (55s timeout)
  → Çıktı: { executiveSummary, swot, featureGaps, winLoss, recommendations, ... }

Node 7 (Format): { success: true, data: reportData }
  → Webhook response olarak Next.js'e döner
```

### Adım 4: Response İşleme

```
/api/analyze (triggerAnalysis sonucu):
  result.success = true
  result.data = { companyName, competitors, swot, ... }

prisma.report.update({
  status: "completed",
  reportData: toJson(reportData),    // tam JSON
  competitors: toJson(competitors),  // index için ayrı
  swot: toJson(swot),
  ...
  completedAt: new Date()
})

return NextResponse.json({ reportId: "cld123" }, { status: 201 })
```

### Adım 5: Rapor Görüntüleme

```
AnalyzeForm: router.push("/report/cld123")

/report/cld123 Server Component:
  1. auth() → session (guest veya user)
  2. cookies() → guestId = "abc123"
  3. prisma.report.findFirst({
       id: "cld123",
       OR: [{ userId: "none" }, { guestId: "abc123" }]
     })
  → report bulunur

4. report.status = "completed" → reportData render edilir
   Tüm section'lar SSR ile render:
   - Executive Summary
   - Competitive Landscape
   - Competitor Cards (7 adet)
   - SWOT Analysis
   - Feature Gaps
   - Win/Loss Scenarios
   - Recent Intelligence
   - User Reviews
   - Strategic Recommendations

5. PrintButton: window.print() → .no-print class'lı elementler gizlenir
```

### Adım 6: Sonraki Ziyaret

```
Kullanıcı tekrar /analyze'e gider:
  - guestId cookie hâlâ var
  - checkGuestTrial("abc123") → count = 1 → hasFreeTrial = false
  - guestTrialUsed = true → "You've used your free trial" mesajı
  - "Sign In — 3 Free Reports" CTA gösterilir

Kullanıcı Google ile giriş yapar:
  - 3 kredi ile başlar
  - Geçmiş misafir raporları görünmez (privacy gereği)
```

---

## 9. Maliyet Tablosu

| Servis | Plan | Limit | Mevcut Kullanım | Kritik Limit |
|---|---|---|---|---|
| **Vercel** | Free (Hobby) | 10s max duration (!) | API route 60s gerekiyor | ⚠️ Pro plan gerekli (60s için) |
| **Neon** | Free | 0.5 GB storage, auto-suspend | Çok düşük | ✅ |
| **Render** | Free | 512MB RAM, sleep after 15m | N8N çalışıyor | ⚠️ UptimeRobot ile çözüldü |
| **Groq** | Free | 14,400 req/day, 500K TPM | ~5-6K token/rapor | ✅ ~80 rapor/gün |
| **Google OAuth** | Free | 100 users (unverified) | — | ⚠️ Verified app gerekebilir |
| **UptimeRobot** | Free | 50 monitor, 5min interval | 1 monitor | ✅ |
| **GitHub** | Free | — | Source control | ✅ |

**Kritik Not — Vercel Free Tier:**
Vercel Free (Hobby) plan'da Serverless Function max execution süresi 10 saniyedir. `/api/analyze` route'u `maxDuration = 60` ile tanımlanmış, bu **Pro plan gerektirir**. Free tier'da N8N timeout'u 10 saniyeye düşürülmeli veya Vercel Pro'ya geçilmeli.

**Groq Hesabı:**
Groq free tier'da 14,400 request/day ve 500,000 TPM. Her rapor ~5,000-6,000 token tüketiyor. Günde ~80 rapor free limit içinde. Üzerinde `groq.com/settings/limits` üzerinden ücretli plana geçilmeli.

---

## 10. Bilinen Limitasyonlar ve İyileştirme Önerileri

### Şu Anki Teknik Borçlar

**1. Guest Trial Race Condition**
`checkGuestTrial` ve `report.create` arasında TOCTOU (Time of Check, Time of Use) açığı var. İki eş zamanlı istek, ikisi de `count=0` görür ve ikisi de rapor oluşturur (1 yerine 2 ücretsiz rapor). Çözüm: PostgreSQL partial unique index:
```sql
CREATE UNIQUE INDEX unique_guest_trial
ON "Report" ("guestId")
WHERE status != 'failed' AND "guestId" IS NOT NULL;
```

**2. Vercel Free Tier Uyumsuzluğu**
`maxDuration = 60` Pro plan gerektirir. Free tier'da 10 saniye sonra timeout olur, kullanıcı hata alır.

**3. Report Polling Yerine Webhook Yok**
Rapor işlenirken sayfa 5 saniyede bir `window.location.reload()` yapıyor (AutoRefresh). Daha iyi çözüm: Vercel'in Server-Sent Events veya N8N tamamlandığında DB'yi doğrudan güncelleyeceği ayrı bir endpoint (callback URL).

**4. N8N'de Error Handling Eksik**
Agent1 veya Agent2 başarısız olursa N8N "200 OK" ile `{ success: false, error: "..." }` dönüyor. N8N'e özel `Error Trigger` node'ları eklenebilir, Slack/email bildirim gönderilebilir.

**5. Login Sayfasında `error` Parameter XSS Riski**
`login/page.tsx:44` satırında `{decodeURIComponent(error)}` React element içinde render ediliyor. React default escaping ile safe. Ancak `decodeURIComponent` başarısız olursa unhandled exception atar. `try/catch` ile sarılmalı.

**6. Report Sayfası Büyüklüğü**
`app/report/[id]/page.tsx` ~400 satır. Competitor cards, SWOT, feature gaps gibi section'lar ayrı component'lara bölünebilir. Okunabilirlik için düşük öncelikli iyileştirme.

**7. `recommendations` ve `strategicRecommendations` Duplicate**
`ReportData` interface'inde her ikisi de var. N8N her ikisini de dolduruyor. Rapor sayfasında "Strategic Recommendations" ve "Quick Takeaways" olarak ayrı gösteriliyor. Tasarım intentional olabilir ama confusing — tek field'da birleştirilebilir.

### Gelecekte Eklenmesi Gereken Özellikler

1. **Ödeme Sistemi** — Stripe ile credit pack satışı (`/api/payments/webhook`)
2. **Rapor Güncelleme** — Mevcut raporu yeniden çalıştırma (re-analyze butonu)
3. **Rapor Paylaşma** — Public link ile raporu paylaşma (opsiyonel `isPublic` flag)
4. **PDF Export** — Şu an sadece `window.print()`. `@react-pdf/renderer` ile gerçek PDF
5. **Dashboard Filtreleme** — Rapora göre filtre (sector, tarih, status)
6. **Email Bildirimi** — Rapor tamamlandığında email (Resend/Postmark)
7. **Rate Limiting** — API route'larda IP veya userId bazlı rate limit (Vercel Edge + Upstash)
8. **Webhook Secret Validation** — N8N'den gelen response'ta `X-Webhook-Secret` doğrulama (N8N node eklenmeli)

### Scale Ettiğinde Dikkat Edilmesi Gerekenler

**Database:**
- Neon free tier 0.5GB dolunca ücretli plana geçiş
- `Report.reportData` JSON alanı büyük — object storage (S3) + pointer pattern düşünülebilir
- Rapor sayısı arttıkça index: `CREATE INDEX ON "Report" (userId, createdAt DESC)`

**N8N:**
- Render free tier concurrent request desteklemez (single instance, single thread)
- Render paid tier veya N8N Cloud (cloud.n8n.io) gerekebilir
- Groq TPM limiti: Paralel rapor istekleri 429 hatası verir → queue mekanizması

**Auth:**
- Google OAuth "Testing" modunda max 100 user var
- Google Cloud Console'da "In Production" yapılmalı (domain verification gerekli)

**Vercel:**
- Free tier → Pro ($20/mo) geçiş: 60s function timeout ve daha fazla bandwidth için

---

*Bu döküman `ARCHITECTURE.md` olarak proje root'una kaydedilmiştir.*
*Referans dosyalar: `auth.ts`, `middleware.ts`, `prisma/schema.prisma`, `app/api/analyze/route.ts`, `lib/utils/credits.ts`, `lib/n8n/trigger.ts`, `n8n/rivalradar-workflow.json`*
