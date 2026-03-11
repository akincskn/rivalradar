import { auth } from "@/auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { reportIdSchema } from "@/lib/validations/analyze";
import { GuestBanner } from "@/components/report/GuestBanner";
import { PrintButton } from "@/components/report/PrintButton";
import { AutoRefresh } from "@/components/report/AutoRefresh";
import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";
import type { Metadata } from "next";
import type {
  ReportData,
  Competitor,
  ThreatLevel,
  FeatureGap,
  WinLossScenario,
  RecentIntelligence,
  ReviewInsight,
  StrategicRecommendation,
} from "@/lib/types/report";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Report #${id.slice(0, 8)}`, description: "AI-powered competitor analysis report" };
}

function sanitizeUrl(url: string | null): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : null;
}

function parseReportData(value: unknown): ReportData | null {
  if (
    typeof value !== "object" || value === null || Array.isArray(value) ||
    !("companyName" in value) || !("competitors" in value) || !("swot" in value)
  ) return null;
  return value as ReportData;
}

const THREAT_CONFIG: Record<ThreatLevel, { label: string; className: string }> = {
  low:      { label: "Low",      className: "bg-green-100 text-green-700 border-green-200" },
  medium:   { label: "Medium",   className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  high:     { label: "High",     className: "bg-orange-100 text-orange-700 border-orange-200" },
  critical: { label: "Critical", className: "bg-red-100 text-red-700 border-red-200" },
};

const SWOT_SECTIONS = [
  { key: "strengths"     as const, label: "Strengths",    color: "text-green-600"  },
  { key: "weaknesses"    as const, label: "Weaknesses",   color: "text-red-600"    },
  { key: "opportunities" as const, label: "Opportunities",color: "text-blue-600"   },
  { key: "threats"       as const, label: "Threats",      color: "text-orange-600" },
];

const PRIORITY_COLORS = {
  critical: "bg-red-100 text-red-700",
  high:     "bg-orange-100 text-orange-700",
  medium:   "bg-yellow-100 text-yellow-700",
  low:      "bg-green-100 text-green-700",
};

const INTEL_TYPE_LABELS: Record<string, string> = {
  funding: "💰 Funding", product: "🚀 Product", partnership: "🤝 Partnership",
  hiring: "👥 Hiring", other: "📰 News",
};

export default async function ReportPage({ params }: ReportPageProps) {
  const session = await auth();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;
  const isGuest = !session?.user?.id;

  const { id } = await params;
  const parsed = reportIdSchema.safeParse({ id });
  if (!parsed.success) notFound();

  const report = await prisma.report.findFirst({
    where: {
      id: parsed.data.id,
      OR: [
        { userId: session?.user?.id ?? "none" },
        { guestId: guestId ?? "none" },
      ],
    },
  });

  if (!report) notFound();

  const reportData = parseReportData(report.reportData);

  return (
    <>
      <div className="no-print">
        <Navbar />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {isGuest && <div className="no-print"><GuestBanner /></div>}

        {/* Back + Actions bar */}
        <div className="flex items-center justify-between mb-6 no-print">
          <Link
            href={isGuest ? "/analyze" : "/dashboard"}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {isGuest ? "Back to Analyze" : "Back to Dashboard"}
          </Link>
          {report.status === "completed" && <PrintButton />}
        </div>

        {/* Header */}
        <div className="space-y-2 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{report.companyName}</h1>
            <span className="text-sm bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
              {report.sector}
            </span>
            {reportData?.threatLevel && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${THREAT_CONFIG[reportData.threatLevel].className}`}>
                Threat: {THREAT_CONFIG[reportData.threatLevel].label}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {report.createdAt.toLocaleDateString("en-US", {
              day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>

      {/* Durum: İşleniyor / Başarısız */}
      {(report.status === "processing" || report.status === "pending") && (
        <>
          <AutoRefresh intervalMs={5000} />
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-muted-foreground">Analysis in progress...</p>
            <p className="text-xs text-muted-foreground">This page refreshes automatically every 5 seconds.</p>
          </div>
        </>
      )}

      {report.status === "failed" && (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
          <p className="text-destructive font-semibold">Analysis failed</p>
          <p className="text-muted-foreground text-sm">
            {isGuest ? "Go back to the analyze page to try again." : "Your credit has been refunded. You can try again."}
          </p>
        </div>
      )}

      {/* Ana Rapor İçeriği */}
      {report.status === "completed" && reportData && (
        <div className="space-y-10">

          {/* Yönetici Özeti */}
          {reportData.executiveSummary && (
            <section className="bg-muted/40 rounded-xl p-5 border">
              <h2 className="text-base font-semibold mb-2">Executive Summary</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{reportData.executiveSummary}</p>
            </section>
          )}

          {/* Rekabet Ortamı */}
          <section>
            <h2 className="text-lg font-semibold mb-2">Competitive Landscape</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{reportData.competitiveLandscapeSummary}</p>
          </section>

          {/* Rakipler */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Competitors ({reportData.competitors.length})</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {reportData.competitors.map((c: Competitor) => (
                <div key={c.name} className="border rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{c.name}</h3>
                      {sanitizeUrl(c.website) && (
                        <a href={sanitizeUrl(c.website)!} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline">
                          {c.website!.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{c.sentimentScore}/10</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.type === "direct" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                        {c.type === "direct" ? "Direct" : "Indirect"}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{c.overview}</p>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{c.pricing.model}</span>
                    {c.pricing.hasFreeTrial && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Free trial</span>
                    )}
                    {c.fundingStage && c.fundingStage !== "unknown" && (
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{c.fundingStage}</span>
                    )}
                  </div>
                  {c.pricing.tiers.length > 0 && (
                    <div className="text-xs space-y-1 border-t pt-2">
                      {c.pricing.tiers.slice(0, 3).map(t => (
                        <div key={t.name} className="flex justify-between">
                          <span className="font-medium">{t.name}</span>
                          <span className="text-muted-foreground">{t.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {c.reviewSummary && (
                    <p className="text-xs text-muted-foreground italic border-t pt-2">{c.reviewSummary}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* SWOT */}
          <section>
            <h2 className="text-lg font-semibold mb-4">SWOT Analysis</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {SWOT_SECTIONS.map(({ key, label, color }) => (
                <div key={key} className="border rounded-xl p-4">
                  <h3 className={`font-medium mb-2 ${color}`}>{label}</h3>
                  <ul className="space-y-1">
                    {reportData.swot[key].map((item: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground">• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Feature Gap */}
          {reportData.featureGaps?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Feature Gaps</h2>
              <p className="text-sm text-muted-foreground mb-4">Features competitors have that you don&apos;t</p>
              <div className="space-y-3">
                {reportData.featureGaps.map((gap: FeatureGap, i: number) => (
                  <div key={i} className="border rounded-xl p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{gap.feature}</p>
                      <p className="text-xs text-muted-foreground">{gap.reasoning}</p>
                      <p className="text-xs text-muted-foreground">
                        Competitors with it: <span className="font-medium">{gap.competitorsHavingIt.join(", ")}</span>
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${PRIORITY_COLORS[gap.priority] ?? "bg-secondary"}`}>
                      {gap.priority}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Win/Loss Senaryoları */}
          {reportData.winLossScenarios?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Win / Loss Scenarios</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {reportData.winLossScenarios.map((s: WinLossScenario, i: number) => (
                  <div key={i} className={`border rounded-xl p-4 ${s.outcome === "win" ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{s.outcome === "win" ? "✅" : "❌"}</span>
                      <span className="text-xs font-semibold text-muted-foreground">{s.competitorInvolved}</span>
                    </div>
                    <p className="text-sm font-medium">{s.scenario}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Son Haberler & Intel */}
          {reportData.recentIntelligence?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Recent Intelligence (90 Days)</h2>
              <div className="space-y-3">
                {reportData.recentIntelligence.map((intel: RecentIntelligence, i: number) => (
                  <div key={i} className="border rounded-xl p-4 flex items-start gap-4">
                    <span className="text-sm shrink-0">{INTEL_TYPE_LABELS[intel.type] ?? "📰"}</span>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{intel.company}</span>
                        <span className="text-xs text-muted-foreground">{intel.date}</span>
                      </div>
                      <p className="text-sm font-medium">{intel.event}</p>
                      <p className="text-xs text-muted-foreground">{intel.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Kullanıcı Yorumları */}
          {reportData.reviewInsights?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">User Reviews</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {reportData.reviewInsights.map((r: ReviewInsight) => (
                  <div key={r.company} className="border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">{r.company}</h3>
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{r.sentimentScore}/10</span>
                    </div>
                    {r.reviewSummary && <p className="text-xs text-muted-foreground italic">{r.reviewSummary}</p>}
                    {r.topPraises.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-green-600 mb-1">👍 Top Praises</p>
                        {r.topPraises.slice(0, 3).map((p, i) => (
                          <p key={i} className="text-xs text-muted-foreground">• {p}</p>
                        ))}
                      </div>
                    )}
                    {r.topComplaints.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-red-600 mb-1">👎 Top Complaints</p>
                        {r.topComplaints.slice(0, 3).map((c, i) => (
                          <p key={i} className="text-xs text-muted-foreground">• {c}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Stratejik Öneriler */}
          {reportData.strategicRecommendations?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Strategic Recommendations</h2>
              <div className="space-y-3">
                {reportData.strategicRecommendations.map((rec: StrategicRecommendation, i: number) => (
                  <div key={i} className="border rounded-xl p-4 flex items-start gap-4">
                    <span className="text-lg font-bold text-primary shrink-0">{i + 1}</span>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-sm">{rec.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[rec.priority] ?? "bg-secondary"}`}>
                          {rec.priority}
                        </span>
                        <span className="text-xs text-muted-foreground">{rec.timeframe}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Quick Takeaways */}
          {reportData.recommendations?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Quick Takeaways</h2>
              <div className="space-y-3">
                {reportData.recommendations.map((rec: StrategicRecommendation, i: number) => (
                  <div key={i} className="border rounded-xl p-4 flex items-start gap-4">
                    <span className="text-lg font-bold text-primary shrink-0">{i + 1}</span>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-sm">{rec.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[rec.priority] ?? "bg-secondary"}`}>
                          {rec.priority}
                        </span>
                        <span className="text-xs text-muted-foreground">{rec.timeframe}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <p className="text-xs text-muted-foreground border-t pt-4">{reportData.disclaimer}</p>
        </div>
      )}

        {report.status === "completed" && !reportData && (
          <p className="text-muted-foreground">Report data not found.</p>
        )}
      </div>
    </>
  );
}
