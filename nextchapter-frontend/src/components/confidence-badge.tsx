"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ConfidenceBadgeProps = {
  confidence: number;
  reasons: string[];
};

export function ConfidenceBadge({ confidence, reasons }: ConfidenceBadgeProps) {
  const tone =
    confidence >= 0.9
      ? "status-converted"
      : confidence >= 0.78
        ? "status-qualified"
        : "status-lost";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn("badge tabular-nums transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:shadow-focus", tone)}
          >
            {(confidence * 100).toFixed(0)}%
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{confidence.toFixed(2)} confidence</p>
            <ul className="space-y-1">
              {reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
