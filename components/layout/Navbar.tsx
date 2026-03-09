import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { buttonVariants } from "@/lib/button-variants";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-5xl flex items-center justify-between h-14">
        <Link href="/" className="font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
          RivalRadar
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Dashboard
              </Link>
              <Link
                href="/analyze"
                className={buttonVariants({ size: "sm" })}
              >
                New Analysis
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/analyze"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Try Free
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/dashboard" });
                }}
              >
                <button
                  type="submit"
                  className={buttonVariants({ size: "sm" })}
                >
                  Sign In with Google
                </button>
              </form>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
