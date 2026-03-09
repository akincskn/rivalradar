import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { triggerAnalysis } from "@/lib/n8n/trigger";
import { checkUserCredits, checkGuestTrial, deductCredit } from "@/lib/utils/credits";
import { analyzeSchema } from "@/lib/validations/analyze";

export const maxDuration = 60;

function toJson(value: unknown): object {
  return JSON.parse(JSON.stringify(value)) as object;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guestId")?.value;
    const isGuest = !session?.user?.id;

    // 1. Auth veya guest zorunlu
    if (isGuest && !guestId) {
      return NextResponse.json(
        { error: "You must be signed in or continue as a guest" },
        { status: 401 }
      );
    }

    // 2. Input validation
    const body: unknown = await request.json();
    const parsed = analyzeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { companyName, sector } = parsed.data;

    // 3. Kredi / misafir hakkı kontrolü
    if (isGuest) {
      const hasFreeTrial = await checkGuestTrial(guestId!);
      if (!hasFreeTrial) {
        return NextResponse.json(
          { error: "You've used your free trial. Sign in to continue." },
          { status: 402 }
        );
      }
    } else {
      const creditCheck = await checkUserCredits(session!.user.id);
      if (!creditCheck.hasCredits) {
        return NextResponse.json(
          { error: "Insufficient credits" },
          { status: 402 }
        );
      }
    }

    // 4. Raporu oluştur
    const report = await prisma.report.create({
      data: {
        userId: session?.user?.id ?? null,
        guestId: isGuest ? guestId : null,
        companyName,
        sector,
        status: "processing",
      },
      select: { id: true },
    });

    // 5. Auth kullanıcıdan kredi düş (misafirden düşülmez)
    if (!isGuest) {
      const credited = await deductCredit(session!.user.id, report.id);
      if (!credited) {
        await prisma.report.update({
          where: { id: report.id },
          data: { status: "failed" },
        });
        return NextResponse.json(
          { error: "Credit transaction failed" },
          { status: 500 }
        );
      }
    }

    // 6. N8N tetikle
    const result = await triggerAnalysis({
      company_name: companyName,
      sector,
      user_id: session?.user?.id ?? guestId ?? "guest",
      report_id: report.id,
    });

    if (!result.success || !result.data) {
      // Auth kullanıcının kredisini iade et
      if (!isGuest) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: session!.user.id },
            data: { credits: { increment: 1 } },
          }),
          prisma.report.update({
            where: { id: report.id },
            data: { status: "failed" },
          }),
        ]);
      } else {
        await prisma.report.update({
          where: { id: report.id },
          data: { status: "failed" },
        });
      }

      return NextResponse.json(
        { error: result.error ?? "Analysis failed" },
        { status: 500 }
      );
    }

    const reportData = result.data;

    // 7. Raporu tamamla
    await prisma.report.update({
      where: { id: report.id },
      data: {
        status: "completed",
        reportData: toJson(reportData),
        competitors: toJson(reportData.competitors),
        swot: toJson(reportData.swot),
        marketPosition: toJson(reportData.marketPositions),
        pricingComparison: toJson(
          reportData.competitors.map((c) => ({ name: c.name, pricing: c.pricing }))
        ),
        recommendations: toJson(reportData.recommendations),
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ reportId: report.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
