"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Wand2, X, Link2, Trash2, Briefcase, IndianRupee, Gauge, TrendingUp, Clock } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { JobApplicationTable } from "@/components/job-application-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiClient } from "@/lib/api-client";
import type { JobApplication, JobApplicationStats } from "@/lib/types";

type JobApplicationFormProps = {
  token: string;
};

export function JobApplicationForm({ token }: JobApplicationFormProps) {
  const api = useMemo(() => new ApiClient(token), [token]);
  const [text, setText] = useState("");
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingApplication, setViewingApplication] = useState<JobApplication | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination states
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<JobApplicationStats | null>(null);

  // Fetch stats whenever refreshKey changes
  useEffect(() => {
    let active = true;
    async function loadStats() {
      try {
        const data = await api.getJobApplicationStats();
        if (active) {
          setStats(data);
        }
      } catch (error) {
        console.error("Could not load stats:", error);
      }
    }
    loadStats();
    return () => {
      active = false;
    };
  }, [api, refreshKey]);

  // Search and Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentCursor(null);
    setCursorHistory([]);
  }, [search, statusFilter]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoadingList(true);
        const page = await api.listJobApplications({
          limit: 10,
          cursor: currentCursor,
          search: search || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined
        });

        if (active) {
          setApplications(page.jobApplications);
          setNextCursor(page.nextCursor);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load job applications.");
      } finally {
        if (active) {
          setLoadingList(false);
        }
      }
    }

    // Debounce search slightly
    const timer = setTimeout(() => {
      loadData();
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [api, search, statusFilter, currentCursor, refreshKey]);

  async function parseAndSave() {
    if (text.trim().length < 10) return;
    setLoading(true);

    try {
      await api.extractJobApplication(text);
      toast.success("Job details parsed and saved.");
      setText("");
      setIsModalOpen(false);
      // Reset pagination to first page to see the newly parsed application
      setCurrentCursor(null);
      setCursorHistory([]);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not parse message details.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(id: string, newStatus: string) {
    try {
      const updated = await api.updateJobApplicationStatus(id, newStatus);
      setApplications((current) =>
        current.map((app) => (app.id === id ? updated.application : app))
      );
      toast.success("Application status updated.");
      setRefreshKey((k) => k + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status.");
      throw error;
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this entry?")) {
      return;
    }
    setDeleting(true);
    try {
      await api.deleteJobApplication(id);
      toast.success("Job application removed.");
      setViewingApplication(null);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove entry.");
    } finally {
      setDeleting(false);
    }
  }

  function handleNextPage() {
    if (!nextCursor) return;
    setCursorHistory((prev) => [...prev, currentCursor || ""]);
    setCurrentCursor(nextCursor);
  }

  function handlePrevPage() {
    if (cursorHistory.length === 0) return;
    const prevHistory = [...cursorHistory];
    const prevCursor = prevHistory.pop() || null;
    setCursorHistory(prevHistory);
    setCurrentCursor(prevCursor);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-normal flex items-center gap-2 text-foreground">
            Placement Applications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and search placement details.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge status-converted shrink-0 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
            {applications.length} visible
          </span>
          <Button onClick={() => setIsModalOpen(true)}>
            <Wand2 className="h-4 w-4 mr-2" />
            Paste Message
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          primary
          title="Applied"
          value={String(stats?.appliedCount ?? 0)}
          caption="Applications submitted"
          icon={<Briefcase className="h-4 w-4" aria-hidden="true" />}
          spark="rise"
        />
        <StatCard
          title="Not Applied"
          value={String(stats?.notAppliedCount ?? 0)}
          caption="Ready for application"
          icon={<Clock className="h-4 w-4" aria-hidden="true" />}
          spark="wave"
        />
        <StatCard
          title="Interviewing"
          value={String(stats?.interviewingCount ?? 0)}
          caption="Interview rounds"
          icon={<Gauge className="h-4 w-4" aria-hidden="true" />}
          spark="bars"
        />
        <StatCard
          title="Rejected"
          value={String(stats?.rejectedCount ?? 0)}
          caption="Applications rejected"
          icon={<X className="h-4 w-4" aria-hidden="true" />}
          spark="fall"
        />
      </section>

      <section className="min-w-0 flex flex-col space-y-4">
        {/* Search and Filters Section */}
        <div className="flex flex-col sm:flex-row gap-3 bg-card border border-border-subtle p-3 rounded-lg shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search company, roles, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-input bg-background rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-input bg-background px-3 py-2 text-sm rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring sm:w-48"
          >
            <option value="ALL">All Statuses</option>
            <option value="Not Applied">Not Applied</option>
            <option value="Applied">Applied</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Offered">Offered</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {loadingList ? (
          <div className="shell-card flex min-h-80 items-center justify-center border border-border-subtle rounded-xl bg-card">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : applications.length ? (
          <JobApplicationTable
            applications={applications}
            hasNext={!!nextCursor}
            hasPrev={cursorHistory.length > 0}
            onNext={handleNextPage}
            onPrev={handlePrevPage}
            pageNumber={cursorHistory.length + 1}
            onStatusUpdate={handleStatusUpdate}
            onRowClick={(app) => setViewingApplication(app)}
          />
        ) : (
          <EmptyState
            title="No saved placement applications"
            description="Paste a message or use the parser to save and view placement applications here."
          />
        )}
      </section>

      {/* Modal Dialog for Parsing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-modal-backdrop">
          <div className="relative w-full max-w-2xl bg-card border border-border-subtle rounded-2xl shadow-xl p-6 overflow-hidden flex flex-col gap-4 animate-modal-container">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                Parse Placement Message
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted/80 text-muted-foreground transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Paste the job details from your placement WhatsApp group below to extract and track the application.
            </p>

            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-h-[240px] resize-y font-mono text-sm"
              aria-label="Raw placement text"
              placeholder="Paste text here..."
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border-subtle">
              <p className="text-sm font-medium text-muted-foreground">{text.trim().length} characters</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={parseAndSave} disabled={loading || text.trim().length < 10}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                  Parse & Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog for Viewing Details */}
      {viewingApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-modal-backdrop">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-card border border-border-subtle rounded-2xl shadow-xl flex flex-col overflow-hidden animate-modal-container">
            {/* Header: Fixed */}
            <div className="flex items-center justify-between p-6 pb-3 border-b border-border-subtle shrink-0">
              <div>
                <span className="text-xs font-bold uppercase text-primary tracking-wide">Application Details</span>
                <h2 className="text-2xl font-bold text-foreground mt-1">{viewingApplication.companyName}</h2>
              </div>
              <button
                onClick={() => {
                  setViewingApplication(null);
                }}
                className="p-1.5 rounded-full hover:bg-muted/80 text-muted-foreground transition-colors"
                aria-label="Close details modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content: Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Roles / Positions</span>
                  <p className="font-semibold text-foreground">{viewingApplication.roles || "-"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Stipend / Package</span>
                  <p className="font-semibold text-foreground">{viewingApplication.stipend || "-"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Location</span>
                  <p className="font-semibold text-foreground">{viewingApplication.location || "-"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Duration</span>
                  <p className="font-semibold text-foreground">{viewingApplication.duration || "-"}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Eligibility</span>
                  <p className="font-semibold text-foreground break-words">{viewingApplication.eligibility || "-"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-muted-foreground text-destructive">Deadline</span>
                  <p className="font-semibold text-destructive">{viewingApplication.deadline || "-"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Date Applied (Parsed)</span>
                  <p className="font-semibold text-foreground">
                    {new Date(viewingApplication.createdAt).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Current Status</span>
                  <div>
                    <span className="badge status-converted bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold mt-1 inline-block">
                      {viewingApplication.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Application Link</span>
                  <div>
                    {viewingApplication.applicationLink ? (
                      <a
                        href={viewingApplication.applicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline mt-1"
                      >
                        <Link2 className="h-4 w-4" />
                        <span>Open Application Link</span>
                      </a>
                    ) : (
                      <p className="text-muted-foreground font-semibold">-</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-border-subtle">
                <span className="text-xs font-bold uppercase text-muted-foreground">Raw WhatsApp Message</span>
                <pre className="p-4 bg-muted/40 border border-border-subtle rounded-xl text-xs font-mono overflow-auto max-h-[160px] whitespace-pre-wrap text-foreground">
                  {viewingApplication.rawText}
                </pre>
              </div>
            </div>

            {/* Footer: Fixed */}
            <div className="flex justify-between items-center p-6 border-t border-border-subtle shrink-0 bg-muted/10">
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={() => handleDelete(viewingApplication.id)}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Remove Entry
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
