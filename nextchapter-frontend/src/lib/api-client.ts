import type { JobApplication, JobApplicationsPage, JobApplicationStats, Transaction, TransactionsPage } from "./types";

const backendBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

export class ApiClient {
  constructor(private readonly token: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${backendBaseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.token}`,
        ...init?.headers
      }
    });

    const payload = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;

    if (!response.ok) {
      throw new Error(payload.error ?? payload.message ?? "Request failed.");
    }

    return payload;
  }

  async extractTransaction(text: string) {
    return this.request<{
      transaction: Transaction;
    }>("/api/transactions/extract", {
      method: "POST",
      body: JSON.stringify({
        text
      })
    });
  }

  async listTransactions(options?: { cursor?: string | null; limit?: number }) {
    const params = new URLSearchParams();

    if (options?.cursor) {
      params.set("cursor", options.cursor);
    }

    if (options?.limit) {
      params.set("limit", String(options.limit));
    }

    const query = params.toString();
    return this.request<TransactionsPage>(`/api/transactions${query ? `?${query}` : ""}`, {
      method: "GET"
    });
  }

  async extractJobApplication(text: string) {
    return this.request<{
      application: JobApplication;
    }>("/api/job-applications/extract", {
      method: "POST",
      body: JSON.stringify({
        text
      })
    });
  }

  async listJobApplications(options?: {
    cursor?: string | null;
    limit?: number;
    search?: string;
    status?: string;
    sortOrder?: string;
  }) {
    const params = new URLSearchParams();

    if (options?.cursor) {
      params.set("cursor", options.cursor);
    }

    if (options?.limit) {
      params.set("limit", String(options.limit));
    }

    if (options?.search) {
      params.set("search", options.search);
    }

    if (options?.status) {
      params.set("status", options.status);
    }

    if (options?.sortOrder) {
      params.set("sortOrder", options.sortOrder);
    }

    const query = params.toString();
    return this.request<JobApplicationsPage>(`/api/job-applications${query ? `?${query}` : ""}`, {
      method: "GET"
    });
  }

  async updateJobApplicationStatus(id: string, status: string) {
    return this.request<{
      application: JobApplication;
    }>(`/api/job-applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status
      })
    });
  }

  async deleteJobApplication(id: string) {
    return this.request<{
      success: boolean;
    }>(`/api/job-applications/${id}`, {
      method: "DELETE"
    });
  }

  async getJobApplicationStats() {
    return this.request<JobApplicationStats>("/api/job-applications/stats", {
      method: "GET"
    });
  }
}

