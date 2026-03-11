import { prisma } from "@/lib/prisma";

/**
 * Data access layer for User.
 * Only raw DB queries — no business logic here.
 */
export const userRepository = {
  findCredits: (userId: string) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    }),

  findProfile: (userId: string) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, image: true, credits: true },
    }),

  incrementCredits: (userId: string, amount: number) =>
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    }),
};
