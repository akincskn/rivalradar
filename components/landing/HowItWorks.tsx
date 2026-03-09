const STEPS = [
  {
    step: "01",
    title: "Enter Company & Sector",
    description:
      "Type the company you want to analyze and its sector. Takes about 10 seconds.",
  },
  {
    step: "02",
    title: "AI Runs the Analysis",
    description:
      "A 2-agent AI pipeline discovers competitors, builds profiles, and generates strategic insights.",
  },
  {
    step: "03",
    title: "Report Ready in 60 Seconds",
    description:
      "SWOT analysis, competitor profiles, pricing comparison, and recommendations appear instantly. Download as PDF.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <p className="mt-3 text-muted-foreground">
            Professional competitor analysis in 3 steps
          </p>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute left-8 top-8 bottom-8 w-0.5 bg-border" />

          <div className="space-y-8">
            {STEPS.map((step) => (
              <div key={step.step} className="flex gap-6 md:gap-8">
                <div className="shrink-0 w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{step.step}</span>
                </div>
                <div className="pt-3 space-y-1">
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
