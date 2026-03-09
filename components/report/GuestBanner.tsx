import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";

/**
 * Misafir kullanıcılara rapor sayfasında gösterilen kayıt CTA'sı.
 * NEDEN ayrı component: Report sayfası Server Component, bu da
 * server-side render edilebilir, "use client" gerektirmez.
 */
export function GuestBanner() {
  return (
    <div className="mb-8 bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="font-semibold text-sm">Want to save this report?</p>
        <p className="text-sm text-muted-foreground">
          Sign in with Google — get <span className="font-medium text-foreground">3 free reports</span> and access all your reports from the dashboard.
        </p>
      </div>
      <Link
        href="/login"
        className={buttonVariants({ size: "sm" })}
      >
        Sign In — 3 Free Reports
      </Link>
    </div>
  );
}
