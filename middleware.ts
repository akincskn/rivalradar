export { auth as middleware } from "@/auth";

export const config = {
  // NEDEN sadece /dashboard: /analyze ve /report artık herkese açık.
  // Misafirler guestId cookie ile kendi raporlarına erişebilir.
  matcher: ["/dashboard/:path*"],
};
