import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatCardProps = {
  caption: string;
  detail?: string;
  icon: ReactNode;
  primary?: boolean;
  spark: "rise" | "fall" | "wave" | "bars";
  title: string;
  value: string;
};

export function StatCard({ caption, detail, icon, primary = false, spark, title, value }: StatCardProps) {
  const line =
    spark === "fall"
      ? "M16 22 C36 22 38 32 54 40 C70 48 88 46 108 66"
      : spark === "wave"
        ? "M16 48 C36 46 38 66 52 64 C68 62 70 18 88 20 C100 22 106 34 116 38"
        : "M16 66 C38 58 48 48 64 40 C82 30 96 22 116 14";

  return (
    <article className={cn("stat-card", primary && "stat-card-primary")}>
      <div className="flex min-w-0 flex-col justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium opacity-75">
            {icon}
            <span>{title}</span>
          </div>
          <div className="mt-10 text-4xl font-bold leading-none">{value}</div>
          <p className="mt-3 text-sm font-medium opacity-[0.72]">{caption}</p>
        </div>
      </div>
      <div className="flex flex-col justify-between text-right text-sm font-bold opacity-[0.72]">
        <svg className="stat-spark" viewBox="0 0 132 88" aria-hidden="true">
          {spark === "bars" ? (
            <>
              <rect x="18" y="64" width="12" height="5" rx="3" fill="currentColor" opacity="0.18" />
              <rect x="40" y="60" width="12" height="9" rx="4" fill="currentColor" opacity="0.22" />
              <rect x="62" y="54" width="12" height="15" rx="4" fill="currentColor" opacity="0.3" />
              <rect x="84" y="38" width="12" height="31" rx="5" fill="currentColor" opacity="0.44" />
              <rect x="106" y="48" width="12" height="21" rx="5" fill="currentColor" />
            </>
          ) : (
            <>
              <path className="stat-spark-area" d={`${line} L116 74 L16 74 Z`} />
              <path className="stat-spark-line" d={line} />
            </>
          )}
        </svg>
        {detail && <span>{detail}</span>}
      </div>
    </article>
  );
}
