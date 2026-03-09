import { prisma } from "@/lib/prisma";

interface CreditCheckResult {
  hasCredits: boolean;
  credits: number;
}

export async function checkUserCredits(
  userId: string
): Promise<CreditCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  return {
    hasCredits: (user?.credits ?? 0) > 0,
    credits: user?.credits ?? 0,
  };
}

/**
 * Misafirin ücretsiz deneme hakkını kullanıp kullanmadığını kontrol eder.
 * NEDEN failed hariç: Başarısız raporlar tekrar deneme hakkı tüketmemeli.
 */
export async function checkGuestTrial(guestId: string): Promise<boolean> {
  const count = await prisma.report.count({
    where: {
      guestId,
      status: { not: "failed" },
    },
  });
  return count === 0; // true = hakkı var, false = hakkı yok
}

export async function deductCredit(
  userId: string,
  reportId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user || user.credits <= 0) return false;

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: 1 } },
      }),
      prisma.creditTransaction.create({
        data: { userId, amount: -1, reason: "report_generated", reportId },
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}
