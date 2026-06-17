export function PaymentMethodBadge({ method }: { method: "cash" | "esewa" | "khalti" | "card" }) {
  const styles = {
    cash: "bg-blue-100 text-blue-700",
    esewa: "bg-purple-100 text-purple-700",
    khalti: "bg-indigo-100 text-indigo-700",
    card: "bg-orange-100 text-orange-700",
  };

  const labels = {
    cash: "Cash",
    esewa: "eSewa",
    khalti: "Khalti",
    card: "Card",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[method]}`}>
      {labels[method]}
    </span>
  );
}
