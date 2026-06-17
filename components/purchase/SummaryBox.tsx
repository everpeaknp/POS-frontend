interface SummaryBoxProps {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
}

export function SummaryBox({ subtotal, totalDiscount, totalTax, grandTotal }: SummaryBoxProps) {
  const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2 min-w-[240px]">
      <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
      <div className="flex justify-between text-sm text-gray-600"><span>Total Discount</span><span className="text-red-500">- {fmt(totalDiscount)}</span></div>
      <div className="flex justify-between text-sm text-gray-600"><span>VAT (13%)</span><span>{fmt(totalTax)}</span></div>
      <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-base">
        <span>Grand Total</span><span className="text-[#22C55E]">{fmt(grandTotal)}</span>
      </div>
    </div>
  );
}
