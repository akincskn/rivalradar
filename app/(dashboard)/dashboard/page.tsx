import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { userRepository } from "@/lib/repositories/user.repository";
import { reportRepository } from "@/lib/repositories/report.repository";
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
    userRepository.findProfile(session.user.id),
    reportRepository.findByUserId(session.user.id),
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
