"use client";

import { Loader2 } from "lucide-react";
import { TransactionRow } from "@/components/transaction-row";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Transaction } from "@/lib/types";

type TransactionTableProps = {
  transactions: Transaction[];
  nextCursor: string | null;
  loadingMore: boolean;
  onLoadMore: () => void;
};

export function TransactionTable({
  transactions,
  nextCursor,
  loadingMore,
  onLoadMore
}: TransactionTableProps) {
  return (
    <div className="surface-card overflow-hidden p-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Merchant</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Category</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </TableBody>
      </Table>
      {nextCursor ? (
        <div className="flex justify-center border-t border-border-subtle px-3 pb-1 pt-4">
          <Button variant="outline" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
