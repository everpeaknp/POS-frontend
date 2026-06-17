interface SummaryCard {
  label: string;
  value: string | number;
  change?: number;
  color?: "green" | "red" | "blue" | "purple";
}

export function SummaryCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">{card.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
          {card.change !== undefined && (
            <p className={`text-xs font-medium mt-2 ${card.change >= 0 ? "text-green-600" : "text-red-600"}`}>
              {card.change >= 0 ? "+" : ""}{card.change}% vs last month
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
