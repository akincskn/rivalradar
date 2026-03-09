"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Client-side provider wrapper.
 * NEDEN ayrı dosya: SessionProvider "use client" gerektirir,
 * ama app/layout.tsx Server Component olarak kalmalı (metadata export için).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
