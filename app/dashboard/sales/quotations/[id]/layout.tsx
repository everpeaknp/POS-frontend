export default function QuotationDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-col h-full min-h-0">{children}</div>;
}
