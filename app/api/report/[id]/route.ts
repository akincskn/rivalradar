import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { reportIdSchema } from "@/lib/validations/analyze";
import { reportService } from "@/lib/services/report.service";
import { withErrorHandler } from "@/lib/utils/api-handler";
import { ValidationError } from "@/lib/errors/app-errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const session = await auth();
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guestId")?.value;

    const { id } = await params;
    const parsed = reportIdSchema.safeParse({ id });
    if (!parsed.success) throw new ValidationError("Invalid report ID");

    const report = await reportService.getReport(parsed.data.id, {
      userId: session?.user?.id,
      guestId,
    });

    return NextResponse.json({ report }, { status: 200 });
  }
);
