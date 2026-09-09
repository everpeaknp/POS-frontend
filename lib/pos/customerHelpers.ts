import { customerAPI, Customer } from "@/lib/api/sales";
import { toast } from "sonner";

export async function createQuickCustomer(
  name: string,
  phone: string,
  email: string,
  address: string,
  type: "Individual" | "Business"
): Promise<Customer | null> {
  if (!name.trim()) {
    toast.error("Customer name is required");
    return null;
  }

  if (!phone.trim()) {
    toast.error("Phone number is required");
    return null;
  }

  try {
    const customerData = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      type,
      credit_limit: 0,
      payment_terms: "Net 30",
      status: "active",
    };

    const response = await customerAPI.create(customerData);
    const newCustomer = response.data;
    toast.success(`Customer "${newCustomer.name}" added successfully`);
    return newCustomer;
  } catch (error: any) {
    console.error("Failed to add customer:", error);
    const errorMessage = error.response?.data?.detail || 
                        error.response?.data?.message || 
                        "Failed to add customer";
    toast.error(errorMessage);
    return null;
  }
}
