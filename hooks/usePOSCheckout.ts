import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { inventoryApi, type Product, type Warehouse } from "@/lib/api/inventory";
import { customerAPI, type Customer } from "@/lib/api/sales";
import posApi, { 
  type POSSession, 
  type POSTransaction, 
  type POSDiscount, 
  type POSHeldOrder, 
  type POSCashMovement, 
  type POSLoyaltyProgram, 
  type POSCustomerLoyalty, 
  type POSPaymentEntry 
} from "@/lib/api/pos";
import { toast } from "sonner";

export interface CartItem {
  product: Product;
  quantity: number;
}

export function usePOSCheckout() {
  const router = useRouter();
  const { refreshUser, user } = useAuth();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [openSession, setOpenSession] = useState<POSSession | null>(null);
  const [taxRate, setTaxRate] = useState<number>(0.13);
  const [paymentSettings, setPaymentSettings] = useState<any>({
    esewa_enabled: true,
    khalti_enabled: true,
    fonepay_enabled: true,
    bank_transfer_enabled: true,
  });
  
  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Search & Selection
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "esewa" | "khalti" | "fonepay" | "bank_transfer" | "card" | "credit">("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [newCustomerType, setNewCustomerType] = useState<"Individual" | "Business">("Individual");
  
  // Checkout confirmation dialog
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [cameFromCheckout, setCameFromCheckout] = useState(false);
  const [showThankYouDialog, setShowThankYouDialog] = useState(false);
  
  // Coupon dialog
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [availableDiscounts, setAvailableDiscounts] = useState<POSDiscount[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<POSDiscount | null>(null);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  
  // QR Code Dialog
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrPaymentMethod, setQRPaymentMethod] = useState<string>("");
  const [qrPaymentNumber, setQRPaymentNumber] = useState<string>("");
  const [qrImageUrl, setQRImageUrl] = useState<string>("");
  
  // Receipt
  const [completedTransaction, setCompletedTransaction] = useState<POSTransaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  
  // Barcode Scanner
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  
  // Held Orders State
  const [heldOrders, setHeldOrders] = useState<POSHeldOrder[]>([]);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  
  // Cash Movement State
  const [showCashMovement, setShowCashMovement] = useState(false);
  
  // Split Payment State
  const [splitPaymentMode, setSplitPaymentMode] = useState(false);
  const [payments, setPayments] = useState<POSPaymentEntry[]>([]);
  const [showSplitPayment, setShowSplitPayment] = useState(false);
  
  // Loyalty State
  const [loyaltyProgram, setLoyaltyProgram] = useState<POSLoyaltyProgram | null>(null);
  const [customerLoyalty, setCustomerLoyalty] = useState<POSCustomerLoyalty | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  
  // Today's transactions for summary
  const [todayTransactions, setTodayTransactions] = useState<POSTransaction[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Add keyboard shortcut to refresh user (Ctrl/Cmd + Shift + R)
  useEffect(() => {
    const handleKeyPress = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        try {
          await refreshUser();
          toast.success("User data refreshed! Please reload the page.");
          window.location.reload();
        } catch (error) {
          console.error("Failed to refresh user:", error);
          toast.error("Failed to refresh user data");
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [refreshUser]);
  
  // Fetch customer loyalty when customer changes
  useEffect(() => {
    if (selectedCustomer && loyaltyProgram?.is_active) {
      posApi.getCustomerLoyalty(selectedCustomer).then(setCustomerLoyalty).catch(() => {});
    } else {
      setCustomerLoyalty(null);
      setUsePoints(false);
      setPointsToRedeem(0);
    }
  }, [selectedCustomer, loyaltyProgram]);

  // Keyboard shortcuts (F1, F2, ESC)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearchQuery("");
        barcodeInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, warehousesRes, customersRes, sessionRes, settingsRes, heldRes, loyaltyRes] = await Promise.all([
          inventoryApi.products.list({ limit: 1000, status: "active" }),
          inventoryApi.warehouses.list({ limit: 100 }),
          customerAPI.list({ status: "active", page_size: 500 }),
          posApi.getOpenSession(),
          posApi.getSettings(),
          posApi.getHeldOrders(),
          posApi.getLoyaltyProgram(),
        ]);

        const allProducts = productsRes.data?.results || [];
        setProducts(allProducts);
        setFilteredProducts(allProducts);
        setWarehouses(warehousesRes.data?.results || []);
        setCustomers(customersRes.data?.results || []);
        setOpenSession(sessionRes);
        setHeldOrders(heldRes);
        setLoyaltyProgram(loyaltyRes);
        
        if (settingsRes && settingsRes.tax_rate !== undefined) {
          setTaxRate(settingsRes.tax_rate / 100);
        }
        if (settingsRes) {
          setPaymentSettings({
            esewa_enabled: settingsRes.esewa_enabled ?? true,
            esewa_number: settingsRes.esewa_number || "",
            esewa_qr: settingsRes.esewa_qr || "",
            khalti_enabled: settingsRes.khalti_enabled ?? true,
            khalti_number: settingsRes.khalti_number || "",
            khalti_qr: settingsRes.khalti_qr || "",
            fonepay_enabled: settingsRes.fonepay_enabled ?? true,
            fonepay_number: settingsRes.fonepay_number || "",
            fonepay_qr: settingsRes.fonepay_qr || "",
            bank_transfer_enabled: settingsRes.bank_transfer_enabled ?? true,
            bank_qr: settingsRes.bank_qr || "",
            bank_name: settingsRes.bank_name || "",
            bank_account_number: settingsRes.bank_account_number || "",
            bank_account_name: settingsRes.bank_account_name || "",
          });
        }

        if (sessionRes?.warehouse) {
          setSelectedWarehouse(String(sessionRes.warehouse));
        } else if (warehousesRes.data?.results && warehousesRes.data.results.length > 0) {
          setSelectedWarehouse(String(warehousesRes.data.results[0].id));
        }
        
        try {
          const todayTxns = await posApi.getTodayTransactions();
          setTodayTransactions(todayTxns);
        } catch (error) {
          console.error("Failed to load today's transactions:", error);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter products by search and availability
  useEffect(() => {
    let filtered = products;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.category_name?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => {
        return String(p.category) === selectedCategory || p.category_name === selectedCategory;
      });
    }

    if (showOnlyAvailable) {
      filtered = filtered.filter((p) => (p.total_stock || 0) > 0);
    }

    setFilteredProducts(filtered);
  }, [searchQuery, products, selectedCategory, showOnlyAvailable]);

  // Add to cart
  const addToCart = useCallback((product: Product) => {
    // Validate product has valid ID and name
    if (!product || !product.id || !product.name) {
      toast.error("Invalid product - cannot add to cart");
      console.error("Invalid product:", product);
      return;
    }

    const stock = product.total_stock || 0;
    
    if (stock <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      
      if (existing) {
        const newQty = existing.quantity + 1;
        if (newQty > stock) {
          toast.error(`Only ${stock} units available`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQty }
            : item
        );
      }
      
      return [...prevCart, { product, quantity: 1 }];
    });
  }, []);

  // Update quantity
  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id !== productId) return item;
          
          const newQty = item.quantity + delta;
          const stock = item.product.total_stock || 0;
          
          if (newQty <= 0) return null;
          if (newQty > stock) {
            toast.error(`Only ${stock} units available`);
            return item;
          }
          
          return { ...item, quantity: newQty };
        })
        .filter((item): item is CartItem => item !== null);
    });
  }, []);

  // Remove from cart
  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  }, []);

  // Quick add customer
  const quickAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (!newCustomerPhone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    try {
      const customerData = {
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        email: newCustomerEmail.trim() || undefined,
        address: newCustomerAddress.trim() || undefined,
        type: newCustomerType,
        credit_limit: 0,
        payment_terms: "Net 30",
        status: "active",
      };

      const newCustomer = await customerAPI.create(customerData);
      setCustomers((prev) => [newCustomer, ...prev]);
      setSelectedCustomer(String(newCustomer.id));
      setShowCustomerDialog(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerEmail("");
      setNewCustomerAddress("");
      setNewCustomerType("Individual");
      toast.success(`Customer "${newCustomer.name}" added successfully`);
    } catch (error: any) {
      console.error("Failed to add customer:", error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          "Failed to add customer";
      toast.error(errorMessage);
    }
  };

  // Show QR code for digital payments
  const showQRCodeDialog = (method: string) => {
    let qrImageUrl = "";
    let paymentInfo = "";
    let methodName = "";

    switch (method) {
      case "esewa":
        qrImageUrl = paymentSettings.esewa_qr || "";
        paymentInfo = paymentSettings.esewa_number || "Not configured";
        methodName = "eSewa";
        break;
      case "khalti":
        qrImageUrl = paymentSettings.khalti_qr || "";
        paymentInfo = paymentSettings.khalti_number || "Not configured";
        methodName = "Khalti";
        break;
      case "fonepay":
        qrImageUrl = paymentSettings.fonepay_qr || "";
        paymentInfo = paymentSettings.fonepay_number || "Not configured";
        methodName = "FonePay";
        break;
      case "bank_transfer":
        qrImageUrl = paymentSettings.bank_qr || "";
        if (paymentSettings.bank_name && paymentSettings.bank_account_number) {
          paymentInfo = `${paymentSettings.bank_name}|${paymentSettings.bank_account_number}|${paymentSettings.bank_account_name || ""}`;
        } else {
          paymentInfo = "Not configured";
        }
        methodName = "Bank Transfer";
        break;
      default:
        return;
    }

    setQRPaymentMethod(methodName);
    setQRPaymentNumber(paymentInfo);
    setQRImageUrl(qrImageUrl);
    setShowQRDialog(true);
  };

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * Number(item.product.selling_price),
    0
  );
  
  let discountValue = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountValue = (subtotal * appliedCoupon.discount_value) / 100;
    } else {
      discountValue = appliedCoupon.discount_value;
    }
  } else if (discountAmount) {
    discountValue = parseFloat(discountAmount) || 0;
  }
  
  const netAmount = Math.max(0, subtotal - discountValue);
  const taxAmount = netAmount * taxRate;
  const total = netAmount + taxAmount;
  const cashGiven = cashAmount ? parseFloat(cashAmount) || 0 : 0;
  const changeAmount = Math.max(0, cashGiven - total);

  // Load active discounts when coupon dialog opens
  const loadActiveDiscounts = async () => {
    try {
      setLoadingDiscounts(true);
      const discounts = await posApi.getActiveDiscounts();
      setAvailableDiscounts(discounts);
    } catch (error) {
      console.error('Failed to load discounts:', error);
      toast.error('Failed to load available coupons');
    } finally {
      setLoadingDiscounts(false);
    }
  };

  // Apply coupon by code
  const applyCouponCode = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    const discount = availableDiscounts.find(
      d => d.code.toLowerCase() === couponCode.trim().toLowerCase()
    );

    if (!discount) {
      toast.error('Invalid coupon code');
      return;
    }

    if (!discount.is_active) {
      toast.error('This coupon is no longer active');
      return;
    }

    const now = new Date();
    if (discount.valid_from && new Date(discount.valid_from) > now) {
      toast.error('This coupon is not yet valid');
      return;
    }
    if (discount.valid_until && new Date(discount.valid_until) < now) {
      toast.error('This coupon has expired');
      return;
    }

    if (discount.min_order_amount && subtotal < discount.min_order_amount) {
      toast.error(`Minimum order amount of Rs. ${discount.min_order_amount} required`);
      return;
    }

    setAppliedCoupon(discount);
    setDiscountAmount('');
    setCouponCode('');
    setShowCouponDialog(false);
    toast.success(`Coupon "${discount.name}" applied!`);
  };

  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast.info('Coupon removed');
  };

  // Reset form for next sale
  const resetForm = () => {
    setCart([]);
    setSelectedCustomer("");
    setPaymentMethod("cash");
    setCashAmount("");
    setDiscountAmount("");
    setAppliedCoupon(null);
    setCouponCode("");
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewCustomerEmail("");
    setNewCustomerAddress("");
    setNewCustomerType("Individual");
    setSearchQuery("");
    setCompletedTransaction(null);
    setShowReceipt(false);
  };

  // Clear cart only
  const clearCart = () => {
    setCart([]);
    toast.info("Cart cleared");
  };

  // Handle barcode scan
  const handleBarcodeProductScanned = (product: Product, action: "received" | "sold") => {
    if (action === "sold") {
      addToCart(product);
      toast.success(`${product.name} added to cart`);
    }
    setShowBarcodeScanner(false);
  };

  // Handle barcode input (Enter key press)
  const handleBarcodeInputSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !barcodeInput.trim()) return;

    e.preventDefault();
    const barcode = barcodeInput.trim();

    try {
      const response = await inventoryApi.products.list({ search: barcode });
      const productsFound = response.data?.results || [];
      const product = productsFound.find((p: Product) => p.sku === barcode);

      if (product) {
        addToCart(product);
        toast.success(`${product.name} added to cart`);
        setBarcodeInput("");
      } else {
        toast.error("Product doesn't exist");
      }
    } catch (error) {
      console.error("Barcode lookup error:", error);
      toast.error("Error looking up product");
    }
  };

  // Hold Order
  const handleHoldOrder = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    
    try {
      await posApi.createHeldOrder({
        customer: selectedCustomer || null,
        items: cart.map(item => ({
          product: item.product.id,
          product_name: item.product.name,
          product_sku: item.product.sku || '',
          quantity: item.quantity,
          unit_price: Number(item.product.selling_price),
          discount_amount: 0,
          line_total: item.quantity * Number(item.product.selling_price),
        })),
        notes: undefined,
      });
      toast.success("Order held successfully");
      
      setCart([]);
      setSelectedCustomer("");
      
      const updated = await posApi.getHeldOrders();
      setHeldOrders(updated);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to hold order");
    }
  };

  // Resume Order
  const handleResumeOrder = (order: POSHeldOrder) => {
    const resumedCart: CartItem[] = order.items.map((item: any) => {
      const product = products.find(p => p.id === item.product);
      return {
        product: product || {
          id: item.product,
          name: item.product_name,
          sku: item.product_sku,
          selling_price: item.unit_price,
          total_stock: 999,
        } as Product,
        quantity: item.quantity,
      };
    });
    
    setCart(resumedCart);
    setSelectedCustomer(order.customer || "");
    toast.success("Order resumed");
    setShowHeldOrders(false);
  };

  // Delete Held Order
  const handleDeleteHeldOrder = async (orderId: string) => {
    try {
      await posApi.deleteHeldOrder(orderId);
      const updated = await posApi.getHeldOrders();
      setHeldOrders(updated);
      toast.success("Held order deleted");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete held order");
    }
  };

  // Split Payment
  const handleSplitPaymentConfirm = (paymentEntries: POSPaymentEntry[]) => {
    setPayments(paymentEntries);
    const totalPaid = paymentEntries.reduce((sum, p) => sum + p.amount, 0);
    setCashAmount(totalPaid.toFixed(2));
    toast.success(`Split payment configured: ${paymentEntries.length} methods`);
  };

  // Complete sale
  const completeSale = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!openSession) {
      toast.error("No active POS session. Please start a session first.");
      return;
    }

    if (!selectedWarehouse) {
      toast.error("Please select a warehouse");
      return;
    }

    if (paymentMethod === "credit" && !selectedCustomer) {
      toast.error("Please select a customer for credit sales");
      return;
    }

    if (paymentMethod === "cash" && cashGiven < total) {
      toast.error(`Cash received (Rs. ${cashGiven.toFixed(2)}) must be ≥ total (Rs. ${total.toFixed(2)})`);
      return;
    }

    // Validate all products in cart still exist
    const invalidProducts = cart.filter(item => !item.product || !item.product.id);
    if (invalidProducts.length > 0) {
      toast.error("Some products in your cart are invalid. Please remove them and try again.");
      setProcessing(false);
      return;
    }

    console.log("Cart items:", cart.map(item => ({
      id: item.product.id,
      name: item.product.name,
      quantity: item.quantity
    })));

    setProcessing(true);

    try {
      // Helper function to safely format decimal values (max 12 digits total, 2 decimal places)
      const formatDecimal = (value: number): number => {
        return Math.round(value * 100) / 100;
      };

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
        lines: cart.map((item) => ({
          product: parseInt(item.product.id),
          quantity: item.quantity,
          unit_price: formatDecimal(Number(item.product.selling_price)),
          discount_amount: 0,
        })),
      };

      console.log('Transaction data being sent:', JSON.stringify(transactionData, null, 2));

      const response = await posApi.createTransaction(transactionData);
      setCompletedTransaction(response);
      setShowThankYouDialog(true);
      
    } catch (error: any) {
      console.error("Transaction error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Full error object:", JSON.stringify({
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      }, null, 2));
      
      // Immediate feedback
      toast.error("Transaction failed - analyzing error...");
      
      let errorMsg = "Failed to complete sale";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check for specific error patterns
        if (errorData.errors) {
          const errors = errorData.errors;
          
          // Check for product not found error
          if (errors.lines && Array.isArray(errors.lines)) {
            const productError = errors.lines.find((line: any) => 
              line.product && line.product[0]?.includes('does not exist')
            );
            if (productError) {
              const productId = productError.product[0].match(/pk "(\d+)"/)?.[1];
              errorMsg = `Product ID ${productId || 'unknown'} no longer exists. Removing from cart...`;
              toast.error(errorMsg);
              // Auto-remove invalid products from cart
              if (productId) {
                setCart(prevCart => {
                  const filtered = prevCart.filter(item => String(item.product.id) !== String(productId));
                  console.log(`Removed product ${productId} from cart. Cart size: ${prevCart.length} -> ${filtered.length}`);
                  return filtered;
                });
                toast.info(`Product ${productId} removed from cart. Please try again.`);
              }
              setProcessing(false);
              return;
            }
          }
          
          // Check for decimal precision errors
          if (errors.tax_amount || errors.total || errors.amount_paid) {
            errorMsg = "Transaction amount is too large. Please contact support.";
            toast.error(errorMsg);
            setProcessing(false);
            return;
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
    } finally {
      setProcessing(false);
    }
  };

  return {
    // Refs
    invoiceRef,
    barcodeInputRef,
    searchInputRef,
    
    // Data
    products,
    filteredProducts,
    customers,
    warehouses,
    openSession,
    taxRate,
    paymentSettings,
    
    // Cart
    cart,
    
    // Search & Selection
    searchQuery,
    setSearchQuery,
    selectedWarehouse,
    setSelectedWarehouse,
    selectedCustomer,
    setSelectedCustomer,
    selectedCategory,
    setSelectedCategory,
    showOnlyAvailable,
    setShowOnlyAvailable,
    paymentMethod,
    setPaymentMethod,
    cashAmount,
    setCashAmount,
    discountAmount,
    setDiscountAmount,
    
    // Customer Dialog
    showCustomerDialog,
    setShowCustomerDialog,
    newCustomerName,
    setNewCustomerName,
    newCustomerPhone,
    setNewCustomerPhone,
    newCustomerEmail,
    setNewCustomerEmail,
    newCustomerAddress,
    setNewCustomerAddress,
    newCustomerType,
    setNewCustomerType,
    cameFromCheckout,
    setCameFromCheckout,
    
    // Dialogs
    showCheckoutDialog,
    setShowCheckoutDialog,
    showThankYouDialog,
    setShowThankYouDialog,
    showCouponDialog,
    setShowCouponDialog,
    showQRDialog,
    setShowQRDialog,
    showReceipt,
    setShowReceipt,
    showBarcodeScanner,
    setShowBarcodeScanner,
    showHeldOrders,
    setShowHeldOrders,
    showCashMovement,
    setShowCashMovement,
    showSplitPayment,
    setShowSplitPayment,
    
    // Coupon
    availableDiscounts,
    couponCode,
    setCouponCode,
    appliedCoupon,
    setAppliedCoupon,
    loadingDiscounts,
    
    // QR Payment
    qrPaymentMethod,
    qrPaymentNumber,
    qrImageUrl,
    
    // Receipt
    completedTransaction,
    
    // Barcode
    barcodeInput,
    setBarcodeInput,
    
    // Held Orders
    heldOrders,
    
    // Split Payment
    splitPaymentMode,
    setSplitPaymentMode,
    payments,
    setPayments,
    
    // Loyalty
    loyaltyProgram,
    customerLoyalty,
    usePoints,
    pointsToRedeem,
    
    // Today's transactions
    todayTransactions,
    
    // UI State
    loading,
    processing,
    
    // Calculated values
    subtotal,
    discountValue,
    taxAmount,
    total,
    cashGiven,
    changeAmount,
    
    // Handlers
    addToCart,
    updateQuantity,
    removeFromCart,
    quickAddCustomer,
    showQRCodeDialog,
    loadActiveDiscounts,
    applyCouponCode,
    removeCoupon,
    resetForm,
    clearCart,
    handleBarcodeProductScanned,
    handleBarcodeInputSubmit,
    handleHoldOrder,
    handleResumeOrder,
    handleDeleteHeldOrder,
    handleSplitPaymentConfirm,
    completeSale,
    
    // Router
    router,
    user,
  };
}
