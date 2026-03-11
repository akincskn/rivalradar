import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { analyzeSchema } from "@/lib/validations/analyze";
import { reportService } from "@/lib/services/report.service";
import { withErrorHandler } from "@/lib/utils/api-handler";
import { ValidationError } from "@/lib/errors/app-errors";

export const maxDuration = 60;

export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  const body: unknown = await request.json();
  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Invalid input");

  const { reportId } = await reportService.createAnalysis(parsed.data, {
    userId: session?.user?.id,
    guestId,
  });

  return NextResponse.json({ reportId }, { status: 201 });
});
