import Image from "next/image";

interface DashboardHeaderProps {
  userName: string;
  avatarUrl: string | null;
}

export function DashboardHeader({ userName, avatarUrl }: DashboardHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={userName}
          width={48}
          height={48}
          className="rounded-full"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-lg">
          {userName.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <h1 className="font-semibold text-lg">Welcome, {userName.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">Your Reports</p>
      </div>
    </div>
  );
}
