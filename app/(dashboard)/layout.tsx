import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Navbar } from "@/components/layout/Navbar";

/**
 * NEDEN burada da auth kontrolü: Middleware redirect yapar ama
 * layout'ta double-check defense-in-depth sağlar. Race condition
 * edge case'lerde güvence verir.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
