import { z } from "zod";
import type { N8NPayload } from "@/lib/validations/analyze";
import type { ReportData } from "@/lib/types/report";

const n8nResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

interface TriggerResult {
  success: boolean;
  data?: ReportData;
  error?: string;
}

/**
 * N8N webhook integration — server-only.
 *
 * WHY 55s timeout: N8N AI pipeline takes ~60s. Vercel max execution is 60s.
 * WHY server-only: N8N_WEBHOOK_URL + secret must never be exposed to the client.
 */
export const n8nService = {
  async triggerAnalysis(payload: N8NPayload): Promise<TriggerResult> {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    const secret = process.env.N8N_WEBHOOK_SECRET;

    if (!webhookUrl) {
      return { success: false, error: "N8N webhook URL not configured" };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55_000);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { "X-Webhook-Secret": secret } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        return { success: false, error: `N8N error: ${response.status} — ${text}` };
      }

      const responseText = await response.text();
      if (!responseText?.trim()) {
        return {
          success: false,
          error: "N8N returned empty response — check N8N Executions.",
        };
      }

      const rawData: unknown = JSON.parse(responseText);
      const parsed = n8nResponseSchema.safeParse(rawData);

      if (!parsed.success) {
        return { success: false, error: "Invalid N8N response format" };
      }

      if (!parsed.data.success) {
        return { success: false, error: parsed.data.error ?? "N8N analysis failed" };
      }

      return { success: true, data: parsed.data.data as ReportData };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        return { success: false, error: "Analysis timed out (55s)" };
      }

      const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      return { success: false, error: `N8N connection error: ${msg}` };
    }
  },
};
