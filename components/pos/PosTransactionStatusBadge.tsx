import { getPosPaymentMethodLabel, type PosPaymentMethod } from "@/lib/pos/payment-methods";

const statusStyles = {
  completed: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  refunded: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
} as const;

const paymentStyles = {
  cash: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  card: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  esewa: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  khalti: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  fonepay: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
  credit: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
} as const;

export function PosTransactionStatusBadge({
  status,
}: {
  status?: "completed" | "cancelled" | "refunded" | string;
}) {
  const key = (status ?? "completed") as keyof typeof statusStyles;
  const style = statusStyles[key] ?? "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground";

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${style}`}>
      {status ?? "unknown"}
    </span>
  );
}

export function PosPaymentMethodBadge({
  method,
}: {
  method: PosPaymentMethod | string;
}) {
  const key = method as keyof typeof paymentStyles;
  const style = paymentStyles[key] ?? "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground";

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
      {getPosPaymentMethodLabel(method)}
    </span>
  );
}
