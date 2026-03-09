const FEATURES = [
  {
    title: "Competitor Discovery",
    description:
      "AI automatically finds and profiles the top 5 competitors in your sector.",
    icon: "🎯",
  },
  {
    title: "SWOT Analysis",
    description:
      "Strengths, weaknesses, opportunities, and threats analyzed from your position in the market.",
    icon: "📊",
  },
  {
    title: "Pricing Comparison",
    description:
      "Each competitor's pricing model, tiers, and standout features laid out side by side.",
    icon: "💰",
  },
  {
    title: "Sentiment Analysis",
    description:
      "Competitor strengths and weaknesses distilled from user reviews and public sentiment.",
    icon: "💬",
  },
  {
    title: "Strategic Recommendations",
    description:
      "AI surfaces 3–5 actionable next steps directly from the analysis. Ready to execute.",
    icon: "🚀",
  },
  {
    title: "PDF Export",
    description:
      "Download your report as a professional PDF. Share with your team or save for later.",
    icon: "📄",
  },
];

export function Features() {
  return (
    <section className="bg-muted/30 py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold">What You Get</h2>
          <p className="mt-3 text-muted-foreground">
            Every report includes these components
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-card border rounded-xl p-6 space-y-3"
            >
              <span className="text-3xl">{feature.icon}</span>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
