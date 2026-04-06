import NextAuth from "next-auth";
import authConfig from "./auth.config";

// Edge-compatible middleware — Prisma adapter olmadan sadece authConfig kullanır.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // NEDEN sadece /dashboard: /analyze ve /report artık herkese açık.
  // Misafirler guestId cookie ile kendi raporlarına erişebilir.
  matcher: ["/dashboard/:path*"],
};
