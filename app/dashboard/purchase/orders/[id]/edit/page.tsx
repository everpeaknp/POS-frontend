import { redirect } from "next/navigation";

export default async function EditPurchaseOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/purchase/orders/${id}`);
}
