import { auth } from "@/auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AnalyzeForm } from "@/components/analyze/AnalyzeForm";
import { Navbar } from "@/components/layout/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Competitor Analysis",
  description: "Enter your company name and sector to start an AI-powered competitor analysis",
};

export default async function AnalyzePage() {
  const session = await auth();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  const isGuest = !session?.user?.id;

  let credits = 0;
  let guestTrialUsed = false;

  if (!isGuest) {
    const user = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { credits: true },
    });
    credits = user?.credits ?? 0;
  } else if (guestId) {
    // Misafirin daha önce deneme yapıp yapmadığını kontrol et
    const count = await prisma.report.count({
      where: { guestId, status: { not: "failed" } },
    });
    guestTrialUsed = count >= 1;
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-2xl font-bold">Start Competitor Analysis</h1>
        <p className="text-muted-foreground">
          Enter your company name and sector. AI will generate a professional report in 60 seconds.
        </p>
      </div>

      <AnalyzeForm
        credits={credits}
        isGuest={isGuest}
        guestTrialUsed={guestTrialUsed}
      />
    </div>
    </>
  );
}
