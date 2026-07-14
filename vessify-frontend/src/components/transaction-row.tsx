import { ConfidenceBadge } from "@/components/confidence-badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

type TransactionRowProps = {
  transaction: Transaction;
};

function formatMoney(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(Number(value));
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const isDebit = transaction.direction === "DEBIT";

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-muted-foreground">{transaction.date}</TableCell>
      <TableCell className="min-w-52 font-bold text-foreground">{transaction.merchant}</TableCell>
      <TableCell
        className={cn(
          "whitespace-nowrap text-right font-semibold tabular-nums",
          isDebit ? "text-destructive" : "text-success"
        )}
      >
        {isDebit ? "-" : "+"}
        {formatMoney(transaction.amount)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right text-muted-foreground tabular-nums">
        {formatMoney(transaction.balanceAfter)}
      </TableCell>
      <TableCell>
        <ConfidenceBadge confidence={transaction.confidence} reasons={transaction.confidenceReasons} />
      </TableCell>
      <TableCell className="text-muted-foreground">{transaction.category ?? "-"}</TableCell>
    </TableRow>
  );
}
