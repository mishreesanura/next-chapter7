"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type AuthFormShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthFormShell({ title, subtitle, children }: AuthFormShellProps) {
  const isRegister = title === "Register";

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-4 py-10">
      <section className="shell-card w-full max-w-md p-6 sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none">Next Chapter</p>
              <p className="mt-1 truncate text-sm text-muted-foreground">Placement workspace</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="mb-7 grid grid-cols-2 gap-1 rounded-md border border-border-subtle bg-surface p-1">
          {([
            { active: !isRegister, href: "/login", label: "Log in" },
            { active: isRegister, href: "/register", label: "Register" }
          ] as const).map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center justify-center rounded-[14px] text-sm font-bold transition-[background,box-shadow,color] duration-200 focus-visible:outline-none focus-visible:shadow-focus",
                tab.active
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-[var(--hover-tint)] hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-normal text-foreground">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
        </div>

        {children}
      </section>
    </main>
  );
}
