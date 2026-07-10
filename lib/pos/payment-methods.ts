export const POS_PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "esewa", label: "eSewa" },
  { value: "khalti", label: "Khalti" },
  { value: "fonepay", label: "Fonepay" },
  { value: "credit", label: "Credit" },
] as const;

export type PosPaymentMethod = (typeof POS_PAYMENT_METHODS)[number]["value"];

export const POS_DIGITAL_WALLET_METHODS = ["esewa", "khalti", "fonepay"] as const;

export function getPosPaymentMethodLabel(method: string): string {
  return POS_PAYMENT_METHODS.find((item) => item.value === method)?.label ?? method;
}

export function sumDigitalWalletSales(values: {
  esewa_sales?: number | string;
  khalti_sales?: number | string;
  fonepay_sales?: number | string;
}): number {
  return (
    Number(values.esewa_sales ?? 0) +
    Number(values.khalti_sales ?? 0) +
    Number(values.fonepay_sales ?? 0)
  );
}
