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
import {
  type CartItem,
  calculateTotals,
  calculateChange,
  addProductToCart,
  updateCartQuantity,
  removeFromCart as removeCartItem,
  clearCart as clearCartHelper,
  createQuickCustomer,
  createTransaction,
  loadActiveDiscounts as loadDiscounts,
  validateAndApplyCoupon,
  getQRPaymentInfo,
  holdOrder,
  resumeHeldOrder,
  deleteHeldOrder,
} from "@/lib/pos";

// Type definitions
export type PaymentMethod = "cash" | "esewa" | "khalti" | "fonepay" | "bank_transfer" | "card" | "credit";

// Re-export CartItem for backward compatibility
export type { CartItem };

export function usePOSCheckout() {
  // ============================================================================
  // REFS & CONTEXT
  // ============================================================================
  const router = useRouter();
  const { refreshUser, user } = useAuth();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // ============================================================================
  // STATE - DATA & SETTINGS
  // ============================================================================
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
  
  // ============================================================================
  // STATE - CART
  // ============================================================================
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // ============================================================================
  // STATE - SEARCH & SELECTION
  // ============================================================================
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [newCustomerType, setNewCustomerType] = useState<"Individual" | "Business">("Individual");
  
  // ============================================================================
  // STATE - DIALOGS & UI
  // ============================================================================
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

  // ============================================================================
  // EFFECTS - KEYBOARD SHORTCUTS & LISTENERS
  // ============================================================================
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
  
  // ============================================================================
  // EFFECTS - DATA LOADING
  // ============================================================================
  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // FORCE CLEAR: Remove any persisted cart data from localStorage
        try {
          localStorage.removeItem('pos-cart');
          localStorage.removeItem('pos-checkout-cart');
          localStorage.removeItem('cart');
          console.log('Force cleared all cart data from localStorage');
        } catch (e) {
          console.warn('Could not clear localStorage:', e);
        }
        
        const [productsRes, warehousesRes, customersRes, sessionRes, settingsRes, heldRes, loyaltyRes] = await Promise.all([
          inventoryApi.products.list({ limit: 1000, status: "active", _t: Date.now() } as any),
          inventoryApi.warehouses.list({ limit: 100 }),
          customerAPI.list({ status: "active", page_size: 500 }),
          posApi.getOpenSession(),
          posApi.getSettings(),
          posApi.getHeldOrders(),
          posApi.getLoyaltyProgram(),
        ]);

        const allProducts = productsRes.data?.results || [];
        console.log('POS Checkout: Loaded products:', allProducts.length);
        console.log('First 5 product IDs:', allProducts.slice(0, 5).map((p: Product) => ({ id: p.id, name: p.name, sku: p.sku })));
        
        setProducts(allProducts);
        setFilteredProducts(allProducts);
        
        // CRITICAL: Clear cart completely - remove ALL items to force fresh start
        console.log('Clearing entire cart to ensure clean state');
        setCart([]);
        
        // Also clean up cart from any products that don't exist in current product list
        const validProductIds = new Set(allProducts.map((p: Product) => String(p.id)));
        const validWarehouseIds = new Set((warehousesRes.data?.results || []).map((w: any) => String(w.id)));
        
        // If warehouse in state doesn't exist, clear it
        if (selectedWarehouse && !validWarehouseIds.has(selectedWarehouse)) {
          console.warn(`Clearing invalid warehouse: ${selectedWarehouse}`);
          setSelectedWarehouse('');
        }
        
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

  // ============================================================================
  // HANDLERS - CART OPERATIONS
  // ============================================================================
  // Add to cart
  const addToCart = useCallback((product: Product) => {
    setCart((prevCart) => addProductToCart(prevCart, product));
  }, []);

  // Update quantity
  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prevCart) => updateCartQuantity(prevCart, productId, delta));
  }, []);

  // Remove from cart
  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => removeCartItem(prevCart, productId));
  }, []);

  // ============================================================================
  // HANDLERS - CUSTOMER OPERATIONS
  // ============================================================================
  // Quick add customer
  const quickAddCustomer = async () => {
    const newCustomer = await createQuickCustomer(
      newCustomerName,
      newCustomerPhone,
      newCustomerEmail,
      newCustomerAddress,
      newCustomerType
    );
    
    if (newCustomer) {
      setCustomers((prev) => [newCustomer, ...prev]);
      setSelectedCustomer(String(newCustomer.id));
      setShowCustomerDialog(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerEmail("");
      setNewCustomerAddress("");
      setNewCustomerType("Individual");
    }
  };

  // ============================================================================
  // HANDLERS - PAYMENT & DISCOUNTS
  // ============================================================================
  // Show QR code for digital payments
  const showQRCodeDialog = (method: string) => {
    const result = getQRPaymentInfo(method, paymentSettings);
    if (result) {
      setQRPaymentMethod(result.methodName);
      setQRPaymentNumber(result.paymentInfo);
      setQRImageUrl(result.qrImageUrl);
      setShowQRDialog(true);
    }
  };

  // ============================================================================
  // CALCULATED VALUES
  // ============================================================================
  // Calculate totals
  const totals = calculateTotals(cart, taxRate, appliedCoupon, discountAmount);
  const { subtotal, discountValue, netAmount, taxAmount, total } = totals;
  const { cashGiven, changeAmount } = calculateChange(cashAmount, total);

  // ============================================================================
  // HANDLERS - COUPONS & DISCOUNTS
  // ============================================================================
  // Load active discounts when coupon dialog opens
  const loadActiveDiscounts = async () => {
    setLoadingDiscounts(true);
    const discounts = await loadDiscounts();
    setAvailableDiscounts(discounts);
    setLoadingDiscounts(false);
  };

  // Apply coupon by code
  const applyCouponCode = () => {
    const result = validateAndApplyCoupon(couponCode, availableDiscounts, subtotal);
    
    if (!result.success) {
      toast.error(result.error!);
      return;
    }

    setAppliedCoupon(result.discount!);
    setDiscountAmount('');
    setCouponCode('');
    setShowCouponDialog(false);
    toast.success(`Coupon "${result.discount!.name}" applied!`);
  };

  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast.info('Coupon removed');
  };

  // ============================================================================
  // HANDLERS - FORM & UI OPERATIONS
  // ============================================================================
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
    setCart(clearCartHelper());
  };

  // ============================================================================
  // HANDLERS - BARCODE OPERATIONS
  // ============================================================================
  // Handle barcode scan
  const handleBarcodeProductScanned = (product: Product, action: "received" | "sold"): void => {
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

  // ============================================================================
  // HANDLERS - HELD ORDERS
  // ============================================================================
  // Hold Order
  const handleHoldOrder = async () => {
    const updated = await holdOrder(cart, selectedCustomer);
    if (updated) {
      setCart([]);
      setSelectedCustomer("");
      setHeldOrders(updated);
    }
  };

  // Resume Order
  const handleResumeOrder = (order: POSHeldOrder) => {
    const resumedCart = resumeHeldOrder(order, products);
    setCart(resumedCart);
    setSelectedCustomer(order.customer || "");
    setShowHeldOrders(false);
  };

  // Delete Held Order
  const handleDeleteHeldOrder = async (orderId: string) => {
    const updated = await deleteHeldOrder(orderId);
    if (updated) {
      setHeldOrders(updated);
    }
  };

  // ============================================================================
  // HANDLERS - SPLIT PAYMENT
  // ============================================================================
  // Split Payment
  const handleSplitPaymentConfirm = (paymentEntries: POSPaymentEntry[]) => {
    setPayments(paymentEntries);
    const totalPaid = paymentEntries.reduce((sum, p) => sum + p.amount, 0);
    setCashAmount(totalPaid.toFixed(2));
    toast.success(`Split payment configured: ${paymentEntries.length} methods`);
  };

  // ============================================================================
  // HANDLERS - TRANSACTION COMPLETION
  // ============================================================================
  // Complete sale
  const completeSale = async () => {
    // Validate session exists
    if (!openSession) {
      toast.error("No active POS session. Please start a session first.");
      router.push("/dashboard/pos/sessions/new");
      return;
    }

    // Validate cart has items
    if (cart.length === 0) {
      toast.error("Cart is empty. Add items before completing sale.");
      return;
    }

    // Validate warehouse is selected
    if (!selectedWarehouse) {
      toast.error("Please select a warehouse.");
      return;
    }
    
    // CRITICAL: Validate all products in cart actually exist in products list
    const validProductIds = new Set(products.map(p => String(p.id)));
    const invalidItems = cart.filter(item => !validProductIds.has(String(item.product.id)));
    
    if (invalidItems.length > 0) {
      console.error('Invalid products in cart:', invalidItems.map(i => ({ id: i.product.id, name: i.product.name })));
      toast.error(`Cart contains ${invalidItems.length} invalid product(s). Removing them...`);
      setCart(prevCart => prevCart.filter(item => validProductIds.has(String(item.product.id))));
      return;
    }
    
    // CRITICAL: Validate warehouse exists in warehouse list
    const validWarehouseIds = new Set(warehouses.map(w => String(w.id)));
    if (!validWarehouseIds.has(selectedWarehouse)) {
      console.error('Invalid warehouse:', selectedWarehouse);
      toast.error('Invalid warehouse selected. Please select a valid warehouse.');
      setSelectedWarehouse('');
      return;
    }

    // Validate payment method specific requirements
    if (paymentMethod === "cash" && cashGiven < total) {
      toast.error("Cash given is less than total amount.");
      return;
    }

    if (paymentMethod === "credit" && !selectedCustomer) {
      toast.error("Customer is required for credit sales.");
      return;
    }

    setProcessing(true);
    
    try {
      const transaction = await createTransaction(
        {
          cart,
          selectedWarehouse,
          selectedCustomer,
          paymentMethod,
          subtotal,
          discountValue,
          taxAmount,
          total,
          cashGiven,
          changeAmount,
        },
        openSession,
        // Callback to handle invalid products
        (invalidProductIds: string[]) => {
          setCart(prevCart => 
            prevCart.filter(item => !invalidProductIds.includes(String(item.product.id)))
          );
        }
      );
      
      if (transaction) {
        setCompletedTransaction(transaction);
        setShowThankYouDialog(true);
      } else {
        toast.error("Failed to complete sale. Please try again.");
      }
    } catch (error: any) {
      console.error("Complete sale error:", error);
      toast.error(error.message || "Failed to complete sale");
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================================
  // RETURN - EXPOSED API
  // ============================================================================
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
