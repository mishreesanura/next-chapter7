"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { CreditCard, Gauge, IndianRupee, Loader2, TrendingUp, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { EmptyState } from "@/components/empty-state";
import { TransactionTable } from "@/components/transaction-table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiClient } from "@/lib/api-client";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

const samples = [
  {
    label: "Sample 1",
    text: "Date: 11 Dec 2025\nDescription: STARBUCKS COFFEE MUMBAI\nAmount: -420.00\nBalance after transaction: 18,420.50"
  },
  {
    label: "Sample 2",
    text: "Uber Ride * Airport Drop\n12/11/2025 → ₹1,250.00 debited\nAvailable Balance → ₹17,170.50"
  },
  {
    label: "Sample 3",
    text: "txn123 2025-12-10 Amazon.in Order #403-1234567-8901234 ₹2,999.00 Dr Bal 14171.50 Shopping"
  }
];

type TransactionFormProps = {
  token: string;
};

function toNumber(value: string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

type StatCardProps = {
  caption: string;
  detail: string;
  icon: ReactNode;
  primary?: boolean;
  spark: "rise" | "fall" | "wave" | "bars";
  title: string;
  value: string;
};

function StatCard({ caption, detail, icon, primary = false, spark, title, value }: StatCardProps) {
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
        <span>{detail}</span>
      </div>
    </article>
  );
}

export function TransactionForm({ token }: TransactionFormProps) {
  const api = useMemo(() => new ApiClient(token), [token]);
  const [text, setText] = useState(samples[0]?.text ?? "");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [justParsed, setJustParsed] = useState<Transaction | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      try {
        const page = await api.listTransactions({ limit: 20 });

        if (active) {
          setTransactions(page.transactions);
          setNextCursor(page.nextCursor);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load transactions.");
      } finally {
        if (active) {
          setLoadingList(false);
        }
      }
    }

    loadInitial();

    return () => {
      active = false;
    };
  }, [api]);

  async function parseAndSave() {
    setLoading(true);

    try {
      const result = await api.extractTransaction(text);
      setJustParsed(result.transaction);
      setTransactions((current) => [
        result.transaction,
        ...current.filter((transaction) => transaction.id !== result.transaction.id)
      ]);
      toast.success("Transaction parsed and saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not parse this transaction.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor) {
      return;
    }

    setLoadingMore(true);

    try {
      const page = await api.listTransactions({
        cursor: nextCursor,
        limit: 20
      });
      setTransactions((current) => [...current, ...page.transactions]);
      setNextCursor(page.nextCursor);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load more transactions.");
    } finally {
      setLoadingMore(false);
    }
  }

  const metrics = useMemo(() => {
    const debitTotal = transactions
      .filter((transaction) => transaction.direction === "DEBIT")
      .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);
    const avgConfidence = transactions.length
      ? transactions.reduce((sum, transaction) => sum + transaction.confidence, 0) / transactions.length
      : justParsed?.confidence ?? 0;
    const latestBalance = transactions.find((transaction) => transaction.balanceAfter)?.balanceAfter ?? justParsed?.balanceAfter;

    return {
      avgConfidence,
      debitTotal,
      latestBalance: latestBalance ? toNumber(latestBalance) : 0,
      savedCount: transactions.length
    };
  }, [justParsed, transactions]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          primary
          title="Saved records"
          value={String(metrics.savedCount)}
          caption={justParsed ? "1 new transaction parsed" : "Ready for extraction"}
          detail="Organization scoped"
          icon={<CreditCard className="h-4 w-4" aria-hidden="true" />}
          spark="rise"
        />
        <StatCard
          title="Debit value"
          value={formatCurrency(metrics.debitTotal)}
          caption="Total debits in this view"
          detail="Current page"
          icon={<IndianRupee className="h-4 w-4" aria-hidden="true" />}
          spark="bars"
        />
        <StatCard
          title="Confidence"
          value={`${Math.round(metrics.avgConfidence * 100)}%`}
          caption="Average extraction score"
          detail="Latest model output"
          icon={<Gauge className="h-4 w-4" aria-hidden="true" />}
          spark={metrics.avgConfidence >= 0.78 ? "wave" : "fall"}
        />
        <StatCard
          title="Latest balance"
          value={formatCurrency(metrics.latestBalance)}
          caption="Most recent parsed balance"
          detail="After transaction"
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
          spark="wave"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.82fr)_minmax(0,1.18fr)]">
        <section className="shell-card p-5 sm:p-6">
          <div className="mb-5">
            <h1 className="text-3xl font-bold tracking-normal">Transaction extractor</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Securely parse bank statement text into organization-scoped transaction records.
            </p>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {samples.map((sample) => (
              <Button key={sample.label} type="button" variant="secondary" size="sm" onClick={() => setText(sample.text)}>
                {sample.label}
              </Button>
            ))}
          </div>

          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="min-h-60 resize-y"
            aria-label="Raw transaction text"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-muted-foreground">{text.trim().length} characters</p>
            <Button onClick={parseAndSave} disabled={loading || text.trim().length < 10}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Wand2 className="h-4 w-4" aria-hidden="true" />}
              Parse & Save
            </Button>
          </div>

          {justParsed ? (
            <div className="mt-6 border-t border-border-subtle pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Just parsed</p>
                  <h2 className="mt-2 text-2xl font-bold">{justParsed.merchant}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {justParsed.date} / {justParsed.sourceFormat}
                  </p>
                </div>
                <ConfidenceBadge confidence={justParsed.confidence} reasons={justParsed.confidenceReasons} />
              </div>
            </div>
          ) : null}
        </section>

        <section className="min-w-0">
          <div className="control-bar mb-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-normal">Saved transactions</h2>
              <p className="mt-1 text-sm text-muted-foreground">Cursor-paginated and scoped to your organization.</p>
            </div>
            <span className="badge status-converted shrink-0">{transactions.length} rows</span>
          </div>

          {loadingList ? (
            <div className="shell-card flex min-h-80 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
            </div>
          ) : transactions.length ? (
            <TransactionTable
              transactions={transactions}
              nextCursor={nextCursor}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
            />
          ) : (
            <EmptyState />
          )}
        </section>
      </div>
    </div>
  );
}
