import posApi, { POSTransaction, POSSession } from "@/lib/api/pos";
import { CartItem } from "./types";
import { formatDecimal } from "./calculations";
import toast from "react-hot-toast";

interface TransactionData {
  cart: CartItem[];
  selectedWarehouse: string;
  selectedCustomer: string;
  paymentMethod: string;
  subtotal: number;
  discountValue: number;
  taxAmount: number;
  total: number;
  cashGiven: number;
  changeAmount: number;
}

export async function createTransaction(
  data: TransactionData,
  openSession: POSSession | null,
  onInvalidProducts?: (productIds: string[]) => void
): Promise<POSTransaction | null> {
  const { cart, selectedWarehouse, selectedCustomer, paymentMethod, subtotal, discountValue, taxAmount, total, cashGiven, changeAmount } = data;

  if (cart.length === 0) {
    toast.error("Cart is empty");
    return null;
  }

  if (!openSession) {
    toast.error("No active POS session. Please start a session first.");
    return null;
  }

  if (!selectedWarehouse) {
    toast.error("Please select a warehouse");
    return null;
  }

  if (paymentMethod === "credit" && !selectedCustomer) {
    toast.error("Please select a customer for credit sales");
    return null;
  }

  if (paymentMethod === "cash" && cashGiven < total) {
    toast.error(`Cash received (Rs. ${cashGiven.toFixed(2)}) must be ≥ total (Rs. ${total.toFixed(2)})`);
    return null;
  }

  // Validate all products in cart still exist
  const invalidProducts = cart.filter(item => !item.product || !item.product.id);
  if (invalidProducts.length > 0) {
    toast.error("Some products in your cart are invalid. Please remove them and try again.");
    return null;
  }

  console.log("Cart items:", cart.map(item => ({
    id: item.product.id,
    name: item.product.name,
    quantity: item.quantity
  })));

  try {
    const transactionData = {
      warehouse: parseInt(selectedWarehouse),
      customer: selectedCustomer ? parseInt(selectedCustomer) : null,
      payment_method: paymentMethod,
      amount_paid: formatDecimal(paymentMethod === "cash" ? cashGiven : total),
      change_given: formatDecimal(paymentMethod === "cash" ? changeAmount : 0),
      subtotal: formatDecimal(subtotal),
      discount_amount: formatDecimal(discountValue),
      tax_amount: formatDecimal(taxAmount),
      total: formatDecimal(total),
      lines: cart.map((item) => {
        const productId = parseInt(String(item.product.id));
        return {
          product: productId,
          quantity: item.quantity,
          unit_price: formatDecimal(Number(item.product.selling_price)),
          discount_amount: 0,
        };
      }),
    };

    console.log('Transaction data being sent:', JSON.stringify(transactionData, null, 2));

    const response = await posApi.createTransaction(transactionData as any);
    
    // Show success feedback
    toast.success("Sale completed successfully! 🎉", { duration: 4000 });
    console.log("Transaction created successfully:", response);
    
    return response;
  } catch (error: any) {
    console.error("Transaction error:", error);
    console.error("Error response:", error.response?.data);
    console.error("Error status:", error.response?.status);
    console.error("Error headers:", error.response?.headers);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    
    const invalidProductIds = handleTransactionError(error);
    if (invalidProductIds.length > 0 && onInvalidProducts) {
      onInvalidProducts(invalidProductIds);
    }
    return null;
  }
}

function handleTransactionError(error: any): string[] {
  console.log("=== Handling Transaction Error ===");
  console.log("Full error:", error);
  console.log("Response data:", error.response?.data);
  
  let errorMsg = "Failed to complete sale";
  const invalidProductIds: string[] = [];
  
  if (error.response?.data) {
    const errorData = error.response.data;
    
    if (errorData.errors) {
      const errors = errorData.errors;
      console.log("Errors object:", errors);
      
      // Check for product not found error in lines array
      if (errors.lines && Array.isArray(errors.lines)) {
        console.log("Processing lines errors:", errors.lines);
        
        // Handle string error messages (e.g., "Colgate is out of stock at the selected warehouse.")
        const lineErrors: string[] = [];
        errors.lines.forEach((lineError: any, index: number) => {
          console.log(`Line ${index} error:`, lineError);
          
          if (typeof lineError === 'string') {
            // String error message - display directly
            lineErrors.push(lineError);
          } else if (lineError && lineError.product) {
            // Object error with product field
            const productErrors = Array.isArray(lineError.product) ? lineError.product : [lineError.product];
            
            productErrors.forEach((errMsg: string) => {
              console.log("Product error message:", errMsg);
              
              if (errMsg && errMsg.includes('does not exist')) {
                const match = errMsg.match(/pk "(\d+)"|pk (\d+)/);
                if (match) {
                  const productId = match[1] || match[2];
                  console.log("Extracted invalid product ID:", productId);
                  invalidProductIds.push(productId);
                }
              }
            });
          }
        });
        
        // If we have string errors, show them
        if (lineErrors.length > 0) {
          errorMsg = lineErrors.join('; ');
          toast.error(errorMsg, { duration: 7000 });
          return invalidProductIds;
        }
        
        if (invalidProductIds.length > 0) {
          console.log("Invalid product IDs to remove:", invalidProductIds);
          errorMsg = `${invalidProductIds.length} product(s) no longer exist in your inventory. Removing from cart...`;
          toast.error(errorMsg);
          toast.info(`Removed ${invalidProductIds.length} invalid product(s) from cart. Please review and try again.`, { duration: 5000 });
          return invalidProductIds;
        }
      }
      
      // Check for decimal precision errors
      if (errors.tax_amount || errors.total || errors.amount_paid) {
        errorMsg = "Transaction amount is too large. Please contact support.";
        toast.error(errorMsg);
        return invalidProductIds;
      }
      
      // Generic error parsing
      const errorMessages = Object.entries(errors)
        .map(([field, messages]: [string, any]) => {
          if (Array.isArray(messages)) {
            return `${field}: ${messages.join(', ')}`;
          } else if (typeof messages === 'object') {
            return `${field}: ${JSON.stringify(messages)}`;
          }
          return `${field}: ${messages}`;
        });
      errorMsg = errorMessages.length > 0 
        ? errorMessages.join('; ')
        : 'Validation failed';
    } else if (errorData.detail) {
      errorMsg = errorData.detail;
    } else if (errorData.message) {
      errorMsg = errorData.message;
    } else {
      errorMsg = `Validation failed: ${JSON.stringify(errorData)}`;
    }
  } else if (error.response?.status === 403) {
    errorMsg = "You don't have permission to complete sales.";
  } else if (error.response?.status === 500) {
    errorMsg = "Server error. Please try again or contact support.";
  } else if (error.message) {
    errorMsg = error.message;
  }
  
  toast.error(errorMsg, { duration: 10000 });
  return invalidProductIds;
}

export { handleTransactionError };
