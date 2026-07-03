import { redirect } from "next/navigation";

export default async function SalesOrderEditRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/sales/orders/${id}`);
}
