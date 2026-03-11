import { prisma } from "@/lib/prisma";
import { userRepository } from "@/lib/repositories/user.repository";
import { reportRepository } from "@/lib/repositories/report.repository";
import { PaymentRequiredError } from "@/lib/errors/app-errors";

export const creditService = {
  async checkUser(userId: string) {
    const user = await userRepository.findCredits(userId);
    return {
      hasCredits: (user?.credits ?? 0) > 0,
      credits: user?.credits ?? 0,
    };
  },

  /**
   * Returns true if the guest has NOT used their free trial.
   * WHY exclude failed: Failed reports shouldn't consume the one-time trial.
   */
  async checkGuestTrial(guestId: string): Promise<boolean> {
    const count = await reportRepository.countGuestNonFailed(guestId);
    return count === 0;
  },

  /**
   * Atomically deducts 1 credit and records a CreditTransaction.
   * WHY WHERE credits > 0: Prevents going negative under concurrent requests.
   * Prisma throws P2025 if the condition fails — we catch and throw a domain error.
   */
  async deduct(userId: string, reportId: string): Promise<void> {
    try {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId, credits: { gt: 0 } },
          data: { credits: { decrement: 1 } },
        }),
        prisma.creditTransaction.create({
          data: { userId, amount: -1, reason: "report_generated", reportId },
        }),
      ]);
    } catch {
      // P2025: record not found — credits already 0 or concurrent deduction won
      throw new PaymentRequiredError("Credit transaction failed");
    }
  },

  async refund(userId: string): Promise<void> {
    await userRepository.incrementCredits(userId, 1);
  },
};
