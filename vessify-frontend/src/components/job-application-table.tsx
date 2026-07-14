"use client";

import { JobApplicationRow } from "@/components/job-application-row";
import { Button } from "@/components/ui/button";
import type { JobApplication } from "@/lib/types";

type JobApplicationTableProps = {
  applications: JobApplication[];
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  pageNumber: number;
  onStatusUpdate: (id: string, newStatus: string) => Promise<void>;
  onRowClick: (application: JobApplication) => void;
};

export function JobApplicationTable({
  applications,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  pageNumber,
  onStatusUpdate,
  onRowClick
}: JobApplicationTableProps) {
  return (
    <div className="surface-card overflow-hidden p-3 border border-border-subtle rounded-xl shadow-sm bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-subtle bg-muted/30">
              <th className="p-4 text-xs font-bold uppercase text-muted-foreground">Company</th>
              <th className="p-4 text-xs font-bold uppercase text-muted-foreground">Roles</th>
              <th className="p-4 text-xs font-bold uppercase text-muted-foreground">Stipend</th>
              <th className="p-4 text-xs font-bold uppercase text-muted-foreground">Location</th>
              <th className="p-4 text-xs font-bold uppercase text-muted-foreground">Duration</th>
              <th className="p-4 text-xs font-bold uppercase text-muted-foreground">Eligibility</th>
              <th className="p-4 text-xs font-bold uppercase text-muted-foreground text-destructive">Deadline</th>
              <th className="p-4 text-xs font-bold uppercase text-muted-foreground">Date Applied</th>
              <th className="p-4 text-xs font-bold uppercase text-muted-foreground">Apply</th>
              <th className="p-4 text-xs font-bold uppercase text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <JobApplicationRow
                key={app.id}
                application={app}
                onStatusUpdate={onStatusUpdate}
                onRowClick={onRowClick}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border-subtle px-4 py-4 bg-muted/10">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{applications.length}</span> entries on Page <span className="font-semibold text-foreground">{pageNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={!hasPrev}
            className="h-8 px-3 text-xs"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={!hasNext}
            className="h-8 px-3 text-xs"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
