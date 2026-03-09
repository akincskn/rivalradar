import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="container mx-auto px-4 py-20 md:py-32 max-w-5xl text-center">
        <Badge variant="secondary" className="mb-6">
          AI-Powered — Start Free
        </Badge>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
          Analyze Your Competitors{" "}
          <span className="text-primary">in 60 Seconds</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Enter your company name and sector. AI finds your competitors, compares pricing,
          builds a SWOT analysis, and delivers strategic recommendations. Download as PDF.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/analyze"
            className={buttonVariants({ size: "lg", className: "text-base px-8" })}
          >
            Try Free — No Account Required
          </Link>
          <Link
            href="#how-it-works"
            className={buttonVariants({ variant: "outline", size: "lg", className: "text-base px-8" })}
          >
            How It Works
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-8 max-w-lg mx-auto text-center">
          {[
            { value: "60s", label: "Average Time" },
            { value: "5+", label: "Competitors Found" },
            { value: "SWOT", label: "Instant Report" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
