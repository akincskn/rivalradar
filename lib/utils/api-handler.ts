import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors/app-errors";

/**
 * Wraps a route handler with centralized error handling.
 *
 * Services throw AppError subclasses (UnauthorizedError, NotFoundError, etc.).
 * This converts them to typed JSON responses so route handlers stay clean —
 * they throw on error instead of manually building NextResponse objects.
 *
 * Usage:
 *   export const GET = withErrorHandler(async (req) => { ... });
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }
      console.error("[API Error]", error);
      return NextResponse.json(
        { error: "An unexpected error occurred" },
        { status: 500 }
      );
    }
  };
}
