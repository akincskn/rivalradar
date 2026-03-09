import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/**
 * NextAuth v5 ile Google OAuth.
 * NEDEN PrismaAdapter: Session ve Account kayıtlarını otomatik yönetir,
 * elle tablo oluşturmaya gerek kalmaz.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
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
  pages: {
    signIn: "/login",
  },
});
