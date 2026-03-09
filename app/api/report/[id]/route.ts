import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reportIdSchema } from "@/lib/validations/analyze";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guestId")?.value;

    const { id } = await params;
    const parsed = reportIdSchema.safeParse({ id });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    // userId veya guestId ile erişim — authorization
    const report = await prisma.report.findFirst({
      where: {
        id: parsed.data.id,
        OR: [
          { userId: session?.user?.id ?? "none" },
          { guestId: guestId ?? "none" },
        ],
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ report }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
