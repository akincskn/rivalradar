import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { creditService } from "@/lib/services/credit.service";
import { withErrorHandler } from "@/lib/utils/api-handler";
import { UnauthorizedError } from "@/lib/errors/app-errors";

export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();

  const { credits } = await creditService.checkUser(session.user.id);
  return NextResponse.json({ credits }, { status: 200 });
});
