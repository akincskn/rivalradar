import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import authConfig from "./auth.config";

/**
 * Server-only auth config — PrismaAdapter ile tam config.
 * NEDEN ayrı dosya: middleware Edge Runtime'da çalışır, Prisma Edge'i desteklemez.
 * API route'lar ve server component'lar bu dosyadan import eder.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async session({ session, user }) {
      // NEDEN: NextAuth session'a user.id default eklemiyor,
      // API route'larda Prisma sorgusu için id gerekli.
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Signup bonusu: yeni kullanıcı oluşturulduğunda transaction logla.
      // NEDEN events: Adapter user'ı oluşturduktan sonra çalışır,
      // böylece user.id garantilidir.
      await prisma.creditTransaction.create({
        data: {
          userId: user.id!,
          amount: 3,
          reason: "signup_bonus",
        },
      });
    },
  },
});
