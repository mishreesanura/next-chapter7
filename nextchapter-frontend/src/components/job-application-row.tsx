"use client";

import { type ChangeEvent, useState } from "react";
import { Link2 } from "lucide-react";
import type { JobApplication } from "@/lib/types";

type JobApplicationRowProps = {
  application: JobApplication;
  onStatusUpdate: (id: string, newStatus: string) => Promise<void>;
  onRowClick: (application: JobApplication) => void;
};

export function JobApplicationRow({ application, onStatusUpdate, onRowClick }: JobApplicationRowProps) {
  const [status, setStatus] = useState(application.status);
  const [updating, setUpdating] = useState(false);

  async function handleStatusChange(e: ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setStatus(val);
    setUpdating(true);
    try {
      await onStatusUpdate(application.id, val);
    } catch {
      // Revert if error
      setStatus(application.status);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <tr
      onClick={() => onRowClick(application)}
      className="cursor-pointer border-b border-border-subtle hover:bg-muted/50 transition-colors"
    >
      <td className="p-4 font-bold text-foreground max-w-[180px] truncate" title={application.companyName}>
        {application.companyName}
      </td>
      <td className="p-4 text-sm text-foreground max-w-[200px] truncate" title={application.roles}>
        {application.roles}
      </td>
      <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
        {application.stipend || "-"}
      </td>
      <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
        {application.location || "-"}
      </td>
      <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
        {application.duration || "-"}
      </td>
      <td className="p-4 text-sm text-muted-foreground max-w-[200px] truncate" title={application.eligibility ?? ""}>
        {application.eligibility || "-"}
      </td>
      <td className="p-4 text-sm text-destructive font-semibold whitespace-nowrap">
        {application.deadline || "-"}
      </td>
      <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
        {new Date(application.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric"
        })}
      </td>
      <td className="p-4 text-sm">
        {application.applicationLink ? (
          <a
            href={application.applicationLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            <Link2 className="h-4 w-4" />
            <span>Apply</span>
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="p-4 text-sm" onClick={(e) => e.stopPropagation()}>
        <select
          value={status}
          onChange={handleStatusChange}
          disabled={updating}
          className="select-status border border-input bg-background px-2.5 py-1 text-xs rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        >
          <option value="Not Applied">Not Applied</option>
          <option value="Applied">Applied</option>
          <option value="Interviewing">Interviewing</option>
          <option value="Offered">Offered</option>
          <option value="Rejected">Rejected</option>
        </select>
      </td>
    </tr>
  );
}
