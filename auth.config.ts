import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-compatible auth config — Prisma adapter YOK.
 * NEDEN: Vercel Edge Runtime (middleware) Prisma'yı desteklemiyor.
 * Bu config sadece middleware'de kullanılır.
 * Tam config (PrismaAdapter + callbacks) auth.ts'de.
 */
export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
