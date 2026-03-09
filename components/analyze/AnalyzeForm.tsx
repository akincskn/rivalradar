"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { analyzeSchema, type AnalyzeInput } from "@/lib/validations/analyze";
import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";

const SECTOR_SUGGESTIONS = [
  "SaaS / B2B Software",
  "E-Commerce",
  "Fintech",
  "Health Tech",
  "EdTech",
  "Logistics",
  "Food & Restaurant",
  "Real Estate",
  "HR Tech",
  "Marketing Tools",
];

interface AnalyzeFormProps {
  credits: number;
  isGuest?: boolean;
  guestTrialUsed?: boolean;
}

/**
 * Misafir guestId yönetimi: cookie client-side oluşturulur.
 * NEDEN crypto.randomUUID: Harici paket gerektirmez, modern tarayıcılarda
 * native desteklenir (Chrome 92+, Firefox 95+, Safari 15.4+).
 */
function getOrCreateGuestId(): string {
  const match = document.cookie.match(/(?:^|;\s*)guestId=([^;]+)/);
  if (match?.[1]) return match[1];

  const id = crypto.randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `guestId=${id}; expires=${expires}; path=/; samesite=strict`;
  return id;
}

export function AnalyzeForm({ credits, isGuest = false, guestTrialUsed = false }: AnalyzeFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AnalyzeInput>({
    resolver: zodResolver(analyzeSchema),
  });

  const currentSector = watch("sector");

  async function onSubmit(data: AnalyzeInput) {
    setServerError(null);

    // Misafir için guestId oluştur/al — fetch öncesi cookie set edilmeli
    if (isGuest) {
      getOrCreateGuestId();
    }

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: data.companyName,
        sector: data.sector,
      }),
    });

    const result: unknown = await response.json();

    if (!response.ok) {
      const errorResult = result as { error?: string };
      setServerError(errorResult.error ?? "Failed to start analysis");
      return;
    }

    const successResult = result as { reportId: string };
    router.push(`/report/${successResult.reportId}`);
  }

  const isDisabled = isGuest ? guestTrialUsed : credits === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Misafir bilgilendirme bandı */}
      {isGuest && !guestTrialUsed && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">You have 1 free analysis</p>
            <p className="text-xs text-muted-foreground">
              Try without an account.{" "}
              <Link href="/login" className="underline hover:text-foreground">
                Sign in to get 3 free reports.
              </Link>
            </p>
          </div>
          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full shrink-0 font-medium">
            Free
          </span>
        </div>
      )}

      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company / Product Name</Label>
            <Input
              id="companyName"
              placeholder="e.g. Slack, Notion, Figma"
              {...register("companyName")}
              aria-describedby={errors.companyName ? "companyName-error" : undefined}
            />
            {errors.companyName && (
              <p id="companyName-error" className="text-sm text-destructive">
                {errors.companyName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <Input
              id="sector"
              placeholder="e.g. Team Communication, Project Management"
              {...register("sector")}
              aria-describedby={errors.sector ? "sector-error" : undefined}
            />
            {errors.sector && (
              <p id="sector-error" className="text-sm text-destructive">
                {errors.sector.message}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {SECTOR_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setValue("sector", suggestion)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    currentSector === suggestion
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {serverError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3">
          {serverError}
        </div>
      )}

      {/* Hak yok durumları */}
      {isGuest && guestTrialUsed && (
        <div className="bg-muted border rounded-xl p-5 text-center space-y-3">
          <p className="text-sm font-medium">You&apos;ve used your free trial</p>
          <p className="text-sm text-muted-foreground">
            Sign in with Google to continue — 3 free reports on us!
          </p>
          <Link href="/login" className={buttonVariants({ size: "sm" })}>
            Sign In — 3 Free Reports
          </Link>
        </div>
      )}

      {!isGuest && credits === 0 && (
        <div className="bg-muted border rounded-lg p-4 text-sm text-center text-muted-foreground">
          You&apos;re out of credits. Credit packs are coming soon!
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting || isDisabled}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Starting analysis...
          </span>
        ) : isGuest ? (
          "Start Free Analysis"
        ) : (
          "Start Analysis (1 Credit)"
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Analysis takes approximately 60 seconds. Don&apos;t close the page.
      </p>
    </form>
  );
}
