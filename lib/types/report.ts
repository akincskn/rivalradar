export type ReportStatus = "pending" | "processing" | "completed" | "failed";
export type ThreatLevel = "low" | "medium" | "high" | "critical";

// ─── Competitor ────────────────────────────────────────────────────────────────

export interface PricingTier {
  name: string;
  price: string; // "$29/mo", "Ücretsiz", "Özel"
  features: string[];
}

export interface PricingInfo {
  model: "free" | "freemium" | "paid" | "enterprise" | "unknown";
  tiers: PricingTier[];
  hasFreeTrial: boolean;
}

export interface CompetitorNews {
  title: string;
  summary: string;
  date: string;
  type: "funding" | "product" | "partnership" | "hiring" | "other";
}

export interface Competitor {
  name: string;
  website: string | null;
  type: "direct" | "indirect";
  overview: string;
  keyFeatures: string[];
  pricing: PricingInfo;
  targetAudience: string;
  founded: number | null;
  headquarters: string | null;
  employeeRange: string | null;
  fundingStage: string | null;
  fundingStatus: string | null;
  sentimentScore: number; // 1-10
  strengths: string[];
  weaknesses: string[];
  reviewSummary: string | null;
  recentNews: CompetitorNews[];
  techStack: string[];
}

// ─── Analysis Sections ────────────────────────────────────────────────────────

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface MarketPosition {
  competitor: string;
  pricePosition: "budget" | "mid-range" | "premium" | "enterprise";
  marketShare: "leader" | "challenger" | "follower" | "niche";
  primaryAdvantage: string;
}

export interface FeatureGap {
  feature: string;
  competitorsHavingIt: string[];
  priority: "critical" | "high" | "medium" | "low";
  reasoning: string;
}

export interface WinLossScenario {
  scenario: string;
  outcome: "win" | "loss";
  reason: string;
  competitorInvolved?: string;
}

export interface RecentIntelligence {
  company: string;
  event: string;
  summary: string;
  date: string;
  type: "funding" | "product" | "partnership" | "hiring" | "other";
  impact: "high" | "medium" | "low";
}

export interface ReviewInsight {
  company: string;
  sentimentScore: number;
  reviewSummary: string;
  topPraises: string[];
  topComplaints: string[];
}

export interface StrategicRecommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  timeframe: string; // "1-3 ay", "3-6 ay", "6-12 ay"
}

// ─── Full Report ──────────────────────────────────────────────────────────────

export interface ReportData {
  companyName: string;
  sector: string;
  generatedAt: string;
  threatLevel: ThreatLevel;
  executiveSummary: string;
  competitiveLandscapeSummary: string;
  competitors: Competitor[];
  swot: SwotAnalysis;
  marketPositions: MarketPosition[];
  featureGaps: FeatureGap[];
  winLossScenarios: WinLossScenario[];
  recentIntelligence: RecentIntelligence[];
  reviewInsights: ReviewInsight[];
  recommendations: StrategicRecommendation[];
  strategicRecommendations: StrategicRecommendation[];
  disclaimer: string;
}
