"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type AppHeaderProps = {
  email?: string | null;
  userName?: string | null;
  organizationName: string;
};

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "Next Chapter User";
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "NC";
}

export function AppHeader({ email, userName, organizationName }: AppHeaderProps) {
  const displayName = userName ?? "Signed in";

  return (
    <header className="topbar">
      <div className="flex min-w-0 items-center gap-4">
        <div className="min-w-0">
          <div className="text-3xl font-bold leading-none text-foreground sm:text-4xl">Next Chapter</div>
          <p className="mt-2 truncate text-sm font-medium text-muted-foreground">{organizationName}</p>
        </div>
      </div>

      <div className="topbar-actions">
        <ThemeToggle />
        <div className="hidden min-w-0 items-center gap-3 rounded-full border border-border-subtle bg-card py-2 pl-2 pr-4 shadow-soft sm:flex">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {getInitials(userName, email)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-foreground">{displayName}</span>
            {email ? <span className="block truncate text-xs text-muted-foreground">{email}</span> : null}
          </span>
        </div>
        <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Logout
        </Button>
      </div>
    </header>
  );
}
