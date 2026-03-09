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
 * N8N webhook'unu tetikler ve rapor verisini bekler.
 *
 * NEDEN timeout: N8N üzerinde çalışan AI pipeline ~60 saniye sürer.
 * Default fetch timeout yok ama üretim ortamında Vercel'in 60s max
 * execution limiti var. Bu yüzden 55s timeout ayarladık.
 *
 * NEDEN burada değil API route'ta fetch: N8N URL ve secret
 * sadece server-side'da olmalı. Client'a sızdırılmamalı.
 */
export async function triggerAnalysis(
  payload: N8NPayload
): Promise<TriggerResult> {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  const n8nSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!n8nWebhookUrl) {
    return { success: false, error: "N8N webhook URL not configured" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55_000);

  try {
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(n8nSecret ? { "X-Webhook-Secret": n8nSecret } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `N8N response error: ${response.status} - ${errorText}`,
      };
    }

    const responseText = await response.text();
    if (!responseText || !responseText.trim()) {
      return {
        success: false,
        error: "N8N returned empty response — workflow failed on a node. Check N8N Executions.",
      };
    }
    const rawData: unknown = JSON.parse(responseText);
    const parsed = n8nResponseSchema.safeParse(rawData);

    if (!parsed.success) {
      return { success: false, error: "Invalid N8N response format" };
    }

    if (!parsed.data.success) {
      return {
        success: false,
        error: parsed.data.error ?? "N8N analysis failed",
      };
    }

    return {
      success: true,
      data: parsed.data.data as ReportData,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, error: "Analysis timed out (55s)" };
    }

    const errMsg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    return {
      success: false,
      error: `N8N connection error: ${errMsg}`,
    };
  }
}
