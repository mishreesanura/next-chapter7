import { FileText } from "lucide-react";

type EmptyStateProps = {
  title?: string;
  description?: string;
};

export function EmptyState({
  title = "No saved transactions",
  description = "Paste one of the assignment samples above and save it to see tenant-scoped results here."
}: EmptyStateProps) {
  return (
    <div className="shell-card flex min-h-80 flex-col items-center justify-center border-dashed px-6 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--light-green)] text-primary">
        <FileText className="h-6 w-6" aria-hidden="true" />
      </span>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
