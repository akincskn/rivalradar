import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginButton } from "@/components/auth/LoginButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your RivalRadar account with Google",
};

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const { redirectTo, error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">RivalRadar</h1>
          <p className="mt-2 text-muted-foreground">
            AI-powered competitor intelligence platform
          </p>
        </div>

        <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-semibold">Sign in to your account</h2>
            <p className="text-sm text-muted-foreground">
              Start with 3 free reports
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3">
              {decodeURIComponent(error)}
            </div>
          )}

          <LoginButton redirectTo={redirectTo} />

          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our{" "}
            <span className="underline cursor-pointer">Terms of Service</span>{" "}
            and{" "}
            <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
