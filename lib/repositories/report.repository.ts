import { prisma } from "@/lib/prisma";
import type { ReportData } from "@/lib/types/report";

interface CreateReportData {
  userId: string | null;
  guestId: string | null;
  companyName: string;
  sector: string;
}

function toJson(value: unknown): object {
  return JSON.parse(JSON.stringify(value)) as object;
}

/**
 * Data access layer for Report.
 * Only raw DB queries — no business logic here.
 */
export const reportRepository = {
  create: (data: CreateReportData) =>
    prisma.report.create({
      data: { ...data, status: "processing" },
      select: { id: true },
    }),

  /**
   * Finds a report by ID if the caller has access via userId OR guestId.
   * "none" prevents accidental full-table matches when both are undefined.
   */
  findByAccess: (id: string, userId?: string, guestId?: string) =>
    prisma.report.findFirst({
      where: {
        id,
        OR: [
          { userId: userId ?? "none" },
          { guestId: guestId ?? "none" },
        ],
      },
    }),

  findByUserId: (userId: string, limit = 20) =>
    prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        companyName: true,
        sector: true,
        status: true,
        createdAt: true,
      },
    }),

  setFailed: (id: string) =>
    prisma.report.update({
      where: { id },
      data: { status: "failed" },
    }),

  complete: (id: string, reportData: ReportData) =>
    prisma.report.update({
      where: { id },
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
    }),

  countGuestNonFailed: (guestId: string) =>
    prisma.report.count({
      where: { guestId, status: { not: "failed" } },
    }),
};
