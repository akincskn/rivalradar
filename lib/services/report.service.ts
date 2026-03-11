import { creditService } from "@/lib/services/credit.service";
import { n8nService } from "@/lib/services/n8n.service";
import { reportRepository } from "@/lib/repositories/report.repository";
import {
  UnauthorizedError,
  PaymentRequiredError,
  NotFoundError,
} from "@/lib/errors/app-errors";
import type { AnalyzeInput } from "@/lib/validations/analyze";

interface AccessContext {
  userId?: string;
  guestId?: string;
}

/**
 * Orchestrates the full analysis pipeline:
 *   1. Validate caller identity (auth or guest)
 *   2. Check credit / free trial
 *   3. Create pending report record
 *   4. Deduct credit (auth users only)
 *   5. Trigger N8N AI pipeline
 *   6. On success → mark report completed
 *   7. On failure → refund credit + mark report failed
 *
 * Route handlers call this; they don't know the steps above.
 */
export const reportService = {
  async createAnalysis(
    input: AnalyzeInput,
    ctx: AccessContext
  ): Promise<{ reportId: string }> {
    const { userId, guestId } = ctx;
    const isGuest = !userId;

    if (isGuest && !guestId) {
      throw new UnauthorizedError(
        "You must be signed in or continue as a guest"
      );
    }

    if (isGuest) {
      const hasFreeTrial = await creditService.checkGuestTrial(guestId!);
      if (!hasFreeTrial) {
        throw new PaymentRequiredError(
          "You've used your free trial. Sign in to continue."
        );
      }
    } else {
      const { hasCredits } = await creditService.checkUser(userId!);
      if (!hasCredits) {
        throw new PaymentRequiredError("Insufficient credits");
      }
    }

    const report = await reportRepository.create({
      userId: userId ?? null,
      guestId: isGuest ? guestId! : null,
      companyName: input.companyName,
      sector: input.sector,
    });

    // Deduct before N8N — refund on failure below
    if (!isGuest) {
      await creditService.deduct(userId!, report.id);
    }

    const result = await n8nService.triggerAnalysis({
      company_name: input.companyName,
      sector: input.sector,
      user_id: userId ?? guestId ?? "guest",
      report_id: report.id,
    });

    if (!result.success || !result.data) {
      if (!isGuest) await creditService.refund(userId!);
      await reportRepository.setFailed(report.id);
      throw new Error(result.error ?? "Analysis failed");
    }

    await reportRepository.complete(report.id, result.data);

    return { reportId: report.id };
  },

  async getReport(id: string, ctx: AccessContext) {
    const report = await reportRepository.findByAccess(id, ctx.userId, ctx.guestId);
    if (!report) throw new NotFoundError("Report");
    return report;
  },
};
