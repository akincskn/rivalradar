import { z } from "zod";

export const analyzeSchema = z.object({
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters")
    .trim(),
  sector: z
    .string()
    .min(2, "Sector must be at least 2 characters")
    .max(100, "Sector cannot exceed 100 characters")
    .trim(),
});

export type AnalyzeInput = z.infer<typeof analyzeSchema>;

// NEDEN min(1) değil .uuid(): Prisma CUID kullanıyor, UUID değil.
// .cuid() validasyonu uygulanır.
export const reportIdSchema = z.object({
  id: z.string().min(1, "Geçersiz rapor ID"),
});

export type ReportIdInput = z.infer<typeof reportIdSchema>;

// N8N'e gönderilecek payload şeması
export const n8nPayloadSchema = z.object({
  company_name: z.string().min(1),
  sector: z.string().min(1),
  user_id: z.string().min(1),
  report_id: z.string().min(1),
});

export type N8NPayload = z.infer<typeof n8nPayloadSchema>;
