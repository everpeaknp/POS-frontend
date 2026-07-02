export default function CustomerDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-col h-full min-h-0">{children}</div>;
}
