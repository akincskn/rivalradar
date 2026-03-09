import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";
import { Badge } from "@/components/ui/badge";

const FREE_FEATURES = [
  "3 free reports",
  "5 competitors analyzed",
  "SWOT analysis",
  "Pricing comparison",
  "PDF export",
  "Report history",
];

export function Pricing() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <h2 className="text-3xl font-bold">Pricing</h2>
        <p className="mt-3 text-muted-foreground">No credit card required to get started</p>

        <div className="mt-10 bg-card border rounded-2xl p-8 space-y-6 text-left">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Free Plan</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Sign in with Google and start instantly
              </p>
            </div>
            <Badge>Free right now</Badge>
          </div>

          <div className="text-4xl font-bold">
            $0<span className="text-lg text-muted-foreground font-normal">/ay</span>
          </div>

          <ul className="space-y-3">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm">
                <span className="text-green-500 font-bold">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          <Link
            href="/analyze"
            className={buttonVariants({ size: "lg", className: "w-full justify-center" })}
          >
            Try Free — No Account Required
          </Link>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Used your 3 reports? Credit packs coming soon.
        </p>
      </div>
    </section>
  );
}
