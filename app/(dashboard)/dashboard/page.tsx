import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ReportList } from "@/components/dashboard/ReportList";
import { CreditBadge } from "@/components/dashboard/CreditBadge";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your report history and credit balance",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user, reports] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, image: true, credits: true },
    }),
    prisma.report.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        companyName: true,
        sector: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <DashboardHeader
        userName={user?.name ?? session.user.email ?? "User"}
        avatarUrl={user?.image ?? null}
      />

      <div className="mt-8 grid gap-6">
        <CreditBadge credits={user?.credits ?? 0} />
        <ReportList reports={reports} />
      </div>
    </div>
  );
}
