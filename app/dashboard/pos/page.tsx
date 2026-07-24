"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Barcode, ShoppingCart, Trash2, Plus, Minus, X, Pause, Play, Split, Settings, Monitor } from "lucide-react";

import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { PrintablePosReceipt } from "@/components/print/PrintablePosReceipt";
import posApi, { type POSProduct, type POSTransactionLine, type POSDiscount, type POSTransaction, type POSSession, type POSSettings, type POSHeldOrder, type POSPayment } from "@/lib/api/pos";
import { POS_VAT_RATE_DEFAULT } from "@/lib/api/pos-helpers";
import { customerAPI, type Customer } from "@/lib/api/sales";
import { inventoryApi, type Warehouse } from "@/lib/api/inventory";
import { tenantApi } from "@/lib/api/tenant";
import { tenantToCompanyInfo, type CompanyPrintInfo } from "@/lib/print/company-info";
import toast from "react-hot-toast";
import { POS_PAYMENT_METHODS, type PosPaymentMethod, getPosPaymentMethodLabel } from "@/lib/pos/payment-methods";

interface CartItem extends POSTransactionLine {
  product_name: string;
  product_sku: string;
  stock_quantity: number;
  unit_name?: string;
  image?: string | null;
}

interface SplitPaymentEntry {
  method: PosPaymentMethod;
  amount: string;
  reference: string;
}

export default function POSPage() {
  const router = useRouter();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [discounts, setDiscounts] = useState<POSDiscount[]>([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [selectedDiscount, setSelectedDiscount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>("cash");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [notes, setNotes] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanningBarcode, setScanningBarcode] = useState(false);
  const [todayTransactions, setTodayTransactions] = useState<POSTransaction[]>([]);
  const [openSession, setOpenSession] = useState<POSSession | null>(null);

  // New feature state
  const [posSettings, setPosSettings] = useState<POSSettings | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyPrintInfo | null>(null);
  const [heldOrders, setHeldOrders] = useState<POSHeldOrder[]>([]);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [useSplitPayment, setUseSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<SplitPaymentEntry[]>([
    { method: "cash", amount: "", reference: "" },
  ]);
  const [lastTransaction, setLastTransaction] = useState<POSTransaction | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Auto-print hook
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt_${new Date().toISOString().split("T")[0]}`,
  });

  // Loyalty program states
  const [loyaltyProgram, setLoyaltyProgram] = useState<any | null>(null);
  const [customerLoyalty, setCustomerLoyalty] = useState<any | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<number>(0);

  // Keyboard shortcut states
  const [selectedCartIndex, setSelectedCartIndex] = useState<number | null>(null);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Keyboard shortcut refs
  const amountPaidRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const customerTriggerRef = useRef<HTMLButtonElement>(null);
  const discountTriggerRef = useRef<HTMLButtonElement>(null);

  // Real-time synchronization BroadcastChannel for customer display
  const customerDisplayChannel = useRef<BroadcastChannel | null>(null);
  
  useEffect(() => {
    customerDisplayChannel.current = new BroadcastChannel("pos-customer-display");
    return () => {
      customerDisplayChannel.current?.close();
    };
  }, []);

  // Dynamic tax rate from settings
  const taxRate = posSettings ? posSettings.tax_rate / 100 : POS_VAT_RATE_DEFAULT;
  const taxLabel = posSettings?.tax_label || "VAT";
  const taxPercent = posSettings?.tax_rate ?? 13;

  const fetchTodayTransactions = async () => {
    try {
      const data = await posApi.getTodayTransactions();
      setTodayTransactions(data);
    } catch {
      // non-blocking
    }
  };

  // Load held orders for current session
  const fetchHeldOrders = useCallback(async (sessionId?: string) => {
    try {
      const orders = await posApi.getHeldOrders(sessionId);
      setHeldOrders(orders);
    } catch {
      // non-blocking
    }
  }, []);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, warehousesRes, discountsRes, sessionRes, settingsRes, tenantRes, loyaltyProgramRes] = await Promise.all([
          customerAPI.list({ status: 'active', page_size: 500 }),
          inventoryApi.warehouses.list({ page_size: 500 }),
          posApi.getActiveDiscounts(),
          posApi.getOpenSession(),
          posApi.getSettings().catch(() => null),
          tenantApi.getCurrent().catch(() => null),
          posApi.getLoyaltyProgram().catch(() => null),
        ]);
        setCustomers(customersRes.data.results);
        setWarehouses(warehousesRes.data.results);
        setDiscounts(discountsRes);
        setOpenSession(sessionRes);
        if (settingsRes) setPosSettings(settingsRes);
        if (tenantRes) setCompanyInfo(tenantToCompanyInfo(tenantRes));
        if (loyaltyProgramRes) setLoyaltyProgram(loyaltyProgramRes);

        if (sessionRes?.warehouse) {
          setSelectedWarehouse(String(sessionRes.warehouse));
        } else if (warehousesRes.data.results.length > 0) {
          setSelectedWarehouse(String(warehousesRes.data.results[0].id));
        }

        // Load held orders for the open session
        if (sessionRes) {
          fetchHeldOrders(sessionRes.id);
        }
      } catch (error: any) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    fetchTodayTransactions();
  }, []);

  // Auto-focus barcode input on mount and after each scan
  useEffect(() => {
    if (!loading && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [loading, cart]);

  // Global barcode listener - captures scans even when input is not focused
  useEffect(() => {
    let barcodeBuffer = '';
    let barcodeTimeout: NodeJS.Timeout;

    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Enter key - process barcode
      if (e.key === 'Enter' && barcodeBuffer.length > 0) {
        e.preventDefault();
        setBarcodeQuery(barcodeBuffer);
        // Trigger scan
        handleBarcodeScanDirect(barcodeBuffer);
        barcodeBuffer = '';
        return;
      }

      // Alphanumeric keys - add to buffer
      if (e.key.length === 1) {
        barcodeBuffer += e.key;
        
        // Clear buffer after 100ms of inactivity (scanner types fast)
        clearTimeout(barcodeTimeout);
        barcodeTimeout = setTimeout(() => {
          barcodeBuffer = '';
        }, 100);
      }
    };

    window.addEventListener('keypress', handleGlobalKeyPress);
    return () => {
      window.removeEventListener('keypress', handleGlobalKeyPress);
      clearTimeout(barcodeTimeout);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // F1: Focus barcode scanner
      if (e.key === "F1") {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }

      // F2: Focus product search
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Escape: Clear search, close modals/menus
      if (e.key === "Escape") {
        e.preventDefault();
        setSearchQuery("");
        setProducts([]);
        setBarcodeQuery("");
        setShowHeldOrders(false);
        setDiscountOpen(false);
        setCustomerOpen(false);
        setShowShortcutsModal(false);
        toast.dismiss(); // Dismiss active toast confirmations
        barcodeInputRef.current?.focus();
      }

      // Cart Item modifications (only when not typing in fields)
      const currentSelectedIndex = selectedCartIndex !== null && selectedCartIndex < cart.length
        ? selectedCartIndex
        : (cart.length > 0 ? cart.length - 1 : null);

      if (!isTyping && currentSelectedIndex !== null) {
        // + (Numpad Plus or regular Plus): Increase quantity
        if (e.key === "+" || e.key === "Add") {
          e.preventDefault();
          updateQuantity(currentSelectedIndex, 1);
        }
        // - (Numpad Minus or regular Minus): Decrease quantity
        if (e.key === "-" || e.key === "Subtract") {
          e.preventDefault();
          updateQuantity(currentSelectedIndex, -1);
        }
        // Delete: Remove selected item
        if (e.key === "Delete") {
          e.preventDefault();
          removeFromCart(currentSelectedIndex);
        }
      }

      // Ctrl + D: Open Discount Selector
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setDiscountOpen(true);
        setTimeout(() => {
          discountTriggerRef.current?.focus();
        }, 50);
      }

      // Ctrl + C: Focus Customer selector
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        setCustomerOpen(true);
        setTimeout(() => {
          customerTriggerRef.current?.focus();
        }, 50);
      }

      // Ctrl + N: Focus Notes field
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        notesRef.current?.focus();
      }

      // Ctrl + Enter: Complete Checkout
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleCheckout();
      }

      // Ctrl + P: Print last receipt
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        if (lastTransaction) {
          handlePrint();
        } else {
          toast.error("No completed transaction to print");
        }
      }

      // F8: Focus Payment/Checkout (Amount Paid)
      if (e.key === "F8") {
        e.preventDefault();
        if (useSplitPayment) {
          // Focus first split payment amount input
          const firstSplitInput = document.querySelector('input[placeholder="0.00"]') as HTMLInputElement;
          firstSplitInput?.focus();
        } else {
          amountPaidRef.current?.focus();
        }
      }

      // F9: Void last added cart item
      if (e.key === "F9") {
        e.preventDefault();
        if (cart.length > 0) {
          removeFromCart(cart.length - 1);
        } else {
          toast.error("Cart is empty");
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    cart,
    selectedCartIndex,
    amountPaid,
    useSplitPayment,
    lastTransaction,
    discountOpen,
    customerOpen,
    showShortcutsModal,
    updateQuantity,
    removeFromCart,
    handleCheckout,
    handlePrint,
  ]);

  // Search products
  useEffect(() => {
    if (searchQuery.length < 2) {
      setProducts([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await posApi.searchProducts(searchQuery, selectedWarehouse || undefined);
        setProducts(results);
      } catch (error) {
        toast.error("Failed to search products");
      } finally {
        setSearching(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, selectedWarehouse]);

  // Recalculate discounts when selected discount changes
  useEffect(() => {
    if (cart.length === 0) return;
    
    const updated = cart.map(item => {
      const productForDiscount: POSProduct = {
        id: item.product,
        name: item.product_name,
        sku: item.product_sku,
        selling_price: item.unit_price,
        stock_quantity: item.stock_quantity,
        unit_name: item.unit_name,
        status: 'active'
      };
      
      const discountAmount = calculateProductDiscount(productForDiscount, item.quantity, item.unit_price);
      return {
        ...item,
        discount_amount: discountAmount,
        line_total: (item.quantity * item.unit_price) - discountAmount
      };
    });
    
    setCart(updated);
  }, [selectedDiscount]);

  // Load selected customer loyalty points
  useEffect(() => {
    if (selectedCustomer) {
      const fetchCustomerLoyalty = async () => {
        try {
          const data = await posApi.getCustomerLoyalty(selectedCustomer);
          setCustomerLoyalty(data);
        } catch {
          setCustomerLoyalty(null);
        }
      };
      fetchCustomerLoyalty();
    } else {
      setCustomerLoyalty(null);
      setPointsToRedeem(0);
      setLoyaltyDiscount(0);
    }
  }, [selectedCustomer]);

  // Handle barcode scan from form submission
  const handleBarcodeScan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!barcodeQuery.trim() || scanningBarcode) return;
    await handleBarcodeScanDirect(barcodeQuery);
  };

  // Direct barcode scan handler (used by both form and global listener)
  async function handleBarcodeScanDirect(barcode: string) {
    if (!barcode.trim() || scanningBarcode) return;
    
    setScanningBarcode(true);
    try {
      const product = await posApi.searchByBarcode(barcode, selectedWarehouse || undefined);
      
      // Check stock before adding
      if (product.stock_quantity <= 0) {
        toast.error(`${product.name} is out of stock`);
        setBarcodeQuery("");
        setScanningBarcode(false);
        return;
      }
      
      addToCart(product);
      toast.success(`✓ Added ${product.name} (${product.sku})`);
      setBarcodeQuery("");
      
      // Auto-focus back to barcode input for next scan
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    } catch (error) {
      toast.error(`Product not found: ${barcode}`);
      setBarcodeQuery("");
    } finally {
      setScanningBarcode(false);
    }
  };

  // Calculate applicable discount for a product
  const calculateProductDiscount = (product: POSProduct, quantity: number, unitPrice: number): number => {
    let maxDiscount = 0;
    const lineSubtotal = quantity * unitPrice;

    // If a specific discount is selected, only apply that one
    const applicableDiscounts = selectedDiscount 
      ? discounts.filter(d => d.id === selectedDiscount)
      : discounts;

    for (const discount of applicableDiscounts) {
      // Check if discount is applicable
      if (!discount.is_active) continue;

      // Check date validity
      const now = new Date();
      if (discount.start_date && new Date(discount.start_date) > now) continue;
      if (discount.end_date && new Date(discount.end_date) < now) continue;

      // Check minimum requirements
      if (quantity < discount.min_quantity) continue;
      if (lineSubtotal < discount.min_amount) continue;

      // Check applicability
      let applicable = false;
      if (discount.apply_to === 'item' && discount.product) {
        applicable = String(discount.product) === String(product.id);
      } else if (discount.apply_to === 'category' && discount.category && product.category_id) {
        applicable = String(discount.category) === String(product.category_id);
      } else if (discount.apply_to === 'bill') {
        // Bill-level discounts are handled separately in calculateBillDiscount
        continue;
      }

      if (!applicable) continue;

      // Calculate discount amount
      let discountAmount = 0;
      if (discount.discount_type === 'percentage') {
        discountAmount = lineSubtotal * (discount.discount_value / 100);
      } else {
        discountAmount = discount.discount_value;
      }

      // Keep track of maximum discount
      maxDiscount = Math.max(maxDiscount, discountAmount);
    }

    return maxDiscount;
  };

  // Calculate bill-level discount
  const calculateBillDiscount = (): number => {
    if (!selectedDiscount) return 0;

    const discount = discounts.find(d => d.id === selectedDiscount);
    if (!discount || !discount.is_active || discount.apply_to !== 'bill') return 0;

    // Check date validity
    const now = new Date();
    if (discount.start_date && new Date(discount.start_date) > now) return 0;
    if (discount.end_date && new Date(discount.end_date) < now) return 0;

    // Check minimum requirements
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQuantity < discount.min_quantity) return 0;
    if (subtotal < discount.min_amount) return 0;

    // Calculate discount
    if (discount.discount_type === 'percentage') {
      return subtotal * (discount.discount_value / 100);
    } else {
      return Math.min(discount.discount_value, subtotal);
    }
  };

  // Add product to cart
  const addToCart = (product: POSProduct) => {
    // Check stock availability
    if (product.stock_quantity <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    const existingIndex = cart.findIndex(item => item.product === product.id);
    
    if (existingIndex >= 0) {
      // Check if we can increase quantity
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > product.stock_quantity) {
        toast.error(`Only ${product.stock_quantity} units available`);
        return;
      }
      
      // Increase quantity and recalculate discount
      const updated = [...cart];
      const newQty = currentQty + 1;
      updated[existingIndex].quantity = newQty;
      
      // Recalculate discount for new quantity
      const discountAmount = calculateProductDiscount(product, newQty, updated[existingIndex].unit_price);
      updated[existingIndex].discount_amount = discountAmount;
      updated[existingIndex].line_total = (newQty * updated[existingIndex].unit_price) - discountAmount;
      
      setCart(updated);
    } else {
      // Calculate discount for new item
      const discountAmount = calculateProductDiscount(product, 1, product.selling_price);
      
      // Add new item
      const newItem: CartItem = {
        product: product.id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: 1,
        unit_price: product.selling_price,
        discount_amount: discountAmount,
        line_total: product.selling_price - discountAmount,
        stock_quantity: product.stock_quantity,
        unit_name: product.unit_name
      };
      setCart([...cart, newItem]);
    }
    
    setSearchQuery("");
    setProducts([]);
  };

  // Update cart item quantity
  function updateQuantity(index: number, delta: number) {
    const updated = [...cart];
    const newQty = updated[index].quantity + delta;
    
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    
    if (newQty > updated[index].stock_quantity) {
      toast.error(`Only ${updated[index].stock_quantity} units available`);
      return;
    }
    
    updated[index].quantity = newQty;
    
    // Recalculate discount for new quantity
    // We need to find the product to recalculate discount
    const productForDiscount: POSProduct = {
      id: updated[index].product,
      name: updated[index].product_name,
      sku: updated[index].product_sku,
      selling_price: updated[index].unit_price,
      stock_quantity: updated[index].stock_quantity,
      unit_name: updated[index].unit_name,
      status: 'active'
    };
    
    const discountAmount = calculateProductDiscount(productForDiscount, newQty, updated[index].unit_price);
    updated[index].discount_amount = discountAmount;
    updated[index].line_total = (newQty * updated[index].unit_price) - discountAmount;
    
    setCart(updated);
  };

  // Remove from cart
  function removeFromCart(index: number) {
    const item = cart[index];
    
    // Show custom confirmation toast
    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Remove item?</p>
            <p className="text-sm text-gray-600 mt-1">
              Remove {item.product_name} from cart?
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              setCart(cart.filter((_, i) => i !== index));
              toast.success(`${item.product_name} removed from cart`);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        marginTop: '40vh',
        background: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  // Calculate totals with proper precision (avoiding floating-point errors)
  const roundToTwo = (num: number): number => Math.round(num * 100) / 100;
  
  const subtotal = roundToTwo(cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0));
  const itemLevelDiscount = roundToTwo(cart.reduce((sum, item) => sum + item.discount_amount, 0));
  const billLevelDiscount = roundToTwo(calculateBillDiscount());
  const totalDiscount = roundToTwo(itemLevelDiscount + billLevelDiscount + loyaltyDiscount);
  const taxAmount = roundToTwo(Math.max(0, (subtotal - totalDiscount) * taxRate));
  const total = roundToTwo(Math.max(0, subtotal - totalDiscount + taxAmount));

  // Change calculation: split vs single
  const splitTotal = useSplitPayment
    ? roundToTwo(splitPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0))
    : 0;
  const changeGiven = useSplitPayment
    ? roundToTwo(Math.max(0, splitTotal - total))
    : amountPaid
      ? roundToTwo(Math.max(0, parseFloat(amountPaid) - total))
      : 0;

  // Broadcast state to Customer Display
  useEffect(() => {
    const channel = new BroadcastChannel("pos-customer-display");

    const getStatus = (): 'idle' | 'active' | 'success' => {
      if (cart.length > 0) return 'active';
      if (lastTransaction) return 'success';
      return 'idle';
    };

    const data = {
      status: getStatus(),
      cart: cart.map(item => ({
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total ?? (item.quantity * item.unit_price),
        unit_name: item.unit_name || "",
      })),
      subtotal,
      itemLevelDiscount,
      billLevelDiscount,
      loyaltyDiscount,
      totalDiscount,
      taxAmount,
      total,
      paymentMethod,
      amountPaid: useSplitPayment 
        ? splitPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
        : (parseFloat(amountPaid) || 0),
      changeGiven,
      businessName: companyInfo?.name || "Khata POS",
      logo: companyInfo?.logo || null,
      invoiceNumber: lastTransaction?.transaction_number || "",
    };

    channel.postMessage({ type: "update", data });

    channel.onmessage = (event) => {
      if (event.data?.type === "request-state") {
        channel.postMessage({ type: "update", data });
      }
    };

    return () => {
      channel.close();
    };
  }, [
    cart,
    subtotal,
    itemLevelDiscount,
    billLevelDiscount,
    loyaltyDiscount,
    totalDiscount,
    taxAmount,
    total,
    paymentMethod,
    amountPaid,
    useSplitPayment,
    splitPayments,
    changeGiven,
    companyInfo,
    lastTransaction,
  ]);

  // Clear cart
  const clearCart = () => {
    if (cart.length === 0) return;
    
    // Show custom confirmation toast
    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Clear cart?</p>
            <p className="text-sm text-gray-600 mt-1">All items will be removed from the cart.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              setCart([]);
              toast.success("Cart cleared");
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Clear Cart
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        marginTop: '40vh',
        background: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  // ---- Hold/Park Order ----
  const handleHoldOrder = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty — nothing to hold");
      return;
    }
    if (!openSession) {
      toast.error("Open a POS session first");
      return;
    }
    try {
      await posApi.createHeldOrder({
        session: openSession.id,
        customer: selectedCustomer || null,
        customer_name: customerName || undefined,
        items: cart.map((item) => ({
          product: item.product,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount,
          line_total: item.line_total || 0,
          stock_quantity: item.stock_quantity,
          unit_name: item.unit_name,
        })),
        notes: notes || undefined,
      });
      toast.success("Order parked");
      setCart([]);
      setNotes("");
      fetchHeldOrders(openSession.id);
    } catch {
      toast.error("Failed to park order");
    }
  };

  const handleResumeOrder = async (order: POSHeldOrder) => {
    try {
      await posApi.resumeHeldOrder(order.id);
      // Populate cart from held order items
      setCart(
        order.items.map((item) => ({
          product: item.product,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount,
          line_total: item.line_total,
          stock_quantity: item.stock_quantity,
          unit_name: item.unit_name,
        }))
      );
      if (order.customer) setSelectedCustomer(String(order.customer));
      if (order.customer_name) setCustomerName(order.customer_name);
      if (order.notes) setNotes(order.notes);
      setShowHeldOrders(false);
      toast.success("Order resumed");
      if (openSession) fetchHeldOrders(openSession.id);
    } catch {
      toast.error("Failed to resume order");
    }
  };

  const handleRedeemPoints = async () => {
    if (!selectedCustomer || !customerLoyalty) return;
    if (pointsToRedeem <= 0) {
      toast.error("Please enter a valid points amount to redeem.");
      return;
    }
    if (pointsToRedeem > customerLoyalty.points_balance) {
      toast.error(`Cannot redeem more than available balance of ${customerLoyalty.points_balance} points.`);
      return;
    }
    if (loyaltyProgram && pointsToRedeem < loyaltyProgram.min_redemption_points) {
      toast.error(`Minimum redemption is ${loyaltyProgram.min_redemption_points} points.`);
      return;
    }

    try {
      const res = await posApi.redeemLoyaltyPoints(selectedCustomer, {
        points: pointsToRedeem,
        transaction_number: `REDEM-${Date.now().toString().slice(-6)}`,
      });
      
      setLoyaltyDiscount((prev) => prev + res.discount_amount);
      toast.success(`✓ Redeemed ${pointsToRedeem} points for Rs. ${res.discount_amount} discount!`);
      
      setCustomerLoyalty((prev: any) => prev ? {
        ...prev,
        points_balance: res.remaining_balance
      } : null);
      
      setPointsToRedeem(0);
    } catch (error: any) {
      const err = error.response?.data?.error || "Failed to redeem points";
      toast.error(err);
    }
  };

  // ---- Split payment helpers ----
  const addSplitRow = () => {
    setSplitPayments([...splitPayments, { method: "cash", amount: "", reference: "" }]);
  };

  const removeSplitRow = (index: number) => {
    if (splitPayments.length <= 1) return;
    setSplitPayments(splitPayments.filter((_, i) => i !== index));
  };

  const updateSplitRow = (index: number, field: keyof SplitPaymentEntry, value: string) => {
    const updated = [...splitPayments];
    updated[index] = { ...updated[index], [field]: value };
    setSplitPayments(updated);
  };

  // Process transaction
  async function handleCheckout() {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    
    if (!openSession) {
      toast.error("Open a POS session before completing sales");
      router.push("/dashboard/pos/sessions/new");
      return;
    }

    if (!selectedWarehouse) {
      toast.error("Please select a warehouse");
      return;
    }

    // ---- Split payment validation ----
    if (useSplitPayment) {
      const hasEmpty = splitPayments.some((p) => !p.amount || parseFloat(p.amount) <= 0);
      if (hasEmpty) {
        toast.error("All split payment amounts must be > 0");
        return;
      }
      if (splitTotal < total) {
        toast.error(`Split payment total (Rs. ${splitTotal.toFixed(2)}) must be ≥ total (Rs. ${total.toFixed(2)})`);
        return;
      }
      const hasCredit = splitPayments.some((p) => p.method === "credit");
      if (hasCredit && !selectedCustomer) {
        toast.error("Select a customer for credit split payments");
        return;
      }
    } else {
      if (paymentMethod === "credit" && !selectedCustomer) {
        toast.error("Please select a customer for credit sales");
        return;
      }

      const customer = customers.find((c) => c.id === selectedCustomer);
      if (paymentMethod === "credit" && customer) {
        const available =
          customer.available_credit ??
          Math.max(0, (customer.credit_limit || 0) - (customer.current_balance || 0));
        if (total > available) {
          toast.error(`Credit limit exceeded. Available: Rs. ${available.toFixed(2)}`);
          return;
        }
      }
      
      const paidAmount = roundToTwo(parseFloat(amountPaid) || 0);
      if (paidAmount < total) {
        toast.error(`Amount paid (Rs. ${paidAmount.toFixed(2)}) must be ≥ total (Rs. ${total.toFixed(2)})`);
        return;
      }
    }
    
    setProcessing(true);
    try {
      const paidAmount = useSplitPayment ? splitTotal : roundToTwo(parseFloat(amountPaid) || 0);

      const transactionData: any = {
        customer: selectedCustomer || null,
        customer_name: customerName || undefined,
        subtotal: roundToTwo(subtotal),
        discount_amount: roundToTwo(totalDiscount),
        tax_amount: roundToTwo(taxAmount),
        total: roundToTwo(total),
        payment_method: useSplitPayment ? splitPayments[0].method : paymentMethod,
        amount_paid: paidAmount,
        change_given: roundToTwo(changeGiven),
        warehouse: selectedWarehouse,
        notes: notes || undefined,
        lines: cart.map(item => ({
          product: item.product,
          quantity: roundToTwo(item.quantity),
          unit_price: roundToTwo(item.unit_price),
          discount_amount: roundToTwo(item.discount_amount || 0),
          line_total: roundToTwo(item.line_total || 0)
        })),
      };

      // Include split payment entries
      if (useSplitPayment) {
        transactionData.payments = splitPayments.map((p) => ({
          payment_method: p.method,
          amount: roundToTwo(parseFloat(p.amount) || 0),
          reference: p.reference || "",
        }));
      }
      
      const response = await posApi.createTransaction(transactionData);
      toast.success(`✓ Transaction ${response.transaction_number} completed!`);
      setLastTransaction(response);
      
      // Auto-reset customer display welcome screen after 12 seconds
      setTimeout(() => {
        setLastTransaction(null);
      }, 12000);
      
      // Reset form
      setCart([]);
      setSelectedCustomer("");
      setCustomerName("");
      setSelectedDiscount("");
      setAmountPaid("");
      setNotes("");
      setPaymentMethod("cash");
      setUseSplitPayment(false);
      setSplitPayments([{ method: "cash", amount: "", reference: "" }]);
      fetchTodayTransactions();
      
      // Auto-print if enabled
      if (posSettings?.auto_print_receipt && companyInfo) {
        setTimeout(() => {
          handlePrint();
        }, 500);
      }

      // Auto-focus barcode for next customer
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
      
      // Navigate to transaction detail after a short delay
      setTimeout(() => {
        router.push(`/dashboard/pos/transactions`);
      }, 1500);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        (typeof error.response?.data === 'object' ? JSON.stringify(error.response.data) : null) ||
        "Failed to process transaction";
      toast.error(errorMsg);
      console.error("Transaction error:", error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Point of Sale" subtitle="Loading..." />
        <PageLoading message="Loading…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <DashHeader title="Point of Sale" subtitle="Fast billing interface" />
      
      {!openSession && (
        <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-amber-900">
            No open POS session. Open a session before ringing up sales.
          </p>
          <Link href="/dashboard/pos/sessions/new">
            <Button size="sm" className="bg-[#22C55E] hover:bg-[#16A34A]">
              Open Session
            </Button>
          </Link>
        </div>
      )}

      {openSession && (
        <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center justify-between flex-wrap gap-2">
          <span>
            Session <span className="font-mono font-semibold">{openSession.session_number}</span> is open
            {openSession.warehouse_name ? ` · ${openSession.warehouse_name}` : ""}
          </span>
          <div className="flex items-center gap-2">
            {heldOrders.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => setShowHeldOrders(!showHeldOrders)}
              >
                <Play className="h-3 w-3" />
                Held Orders ({heldOrders.length})
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1"
              onClick={() => setShowShortcutsModal(true)}
            >
              <span className="font-mono bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[10px] border border-gray-300 mr-0.5">?</span>
              Shortcuts
            </Button>
            <Link href="/dashboard/pos/settings">
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                <Settings className="h-3 w-3" />
                Settings
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => window.open("/dashboard/pos/customer-display", "CustomerDisplay", "width=1024,height=768")}
            >
              <Monitor className="h-3 w-3" />
              Customer Display
            </Button>
          </div>
        </div>
      )}

      {/* Held orders panel */}
      {showHeldOrders && heldOrders.length > 0 && (
        <div className="mx-6 mt-2 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1">
            <Pause className="h-3.5 w-3.5" />
            Parked Orders
          </h4>
          <div className="space-y-2">
            {heldOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {order.items.length} items
                    {order.customer_name ? ` · ${order.customer_name}` : ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    Held {new Date(order.held_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    {order.notes ? ` — ${order.notes}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50"
                    onClick={() => handleResumeOrder(order)}
                  >
                    <Play className="h-3 w-3" />
                    Resume
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-red-500 hover:text-red-700"
                    onClick={async () => {
                      await posApi.deleteHeldOrder(order.id);
                      if (openSession) fetchHeldOrders(openSession.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Left: Product Search & Cart */}
          <div className="lg:col-span-2 space-y-4">
            {/* Barcode Scanner */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Barcode className="h-5 w-5 text-[#22C55E]" />
                  <span className="text-sm font-medium text-gray-700">Barcode Scanner</span>
                </div>
                <span className="text-xs text-gray-500">Press F1 to focus</span>
              </div>
              <form onSubmit={handleBarcodeScan} className="flex gap-2">
                <div className="flex-1 relative">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={barcodeInputRef}
                    value={barcodeQuery}
                    onChange={(e) => setBarcodeQuery(e.target.value)}
                    placeholder="Scan barcode or enter SKU and press Enter..."
                    className="pl-10 text-lg font-mono"
                    autoFocus
                    disabled={scanningBarcode}
                  />
                  {scanningBarcode && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      Searching...
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="bg-[#22C55E] hover:bg-[#16A34A]"
                  disabled={scanningBarcode || !barcodeQuery.trim()}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              {barcodeQuery && (
                <div className="mt-2 text-xs text-gray-500">
                  Searching for: <span className="font-mono font-semibold">{barcodeQuery}</span>
                </div>
              )}
            </div>

            {/* Product Search */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-[#22C55E]" />
                  <span className="text-sm font-medium text-gray-700">Product Search</span>
                </div>
                <span className="text-xs text-gray-500">Press F2 to focus | ESC to clear</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name..."
                  className="pl-10"
                />
              </div>
              
              {searching && (
                <div className="mt-2 text-center text-sm text-gray-500">Searching...</div>
              )}
              
              {products.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  {products.map(product => {
                    const isOutOfStock = product.stock_quantity <= 0;
                    const isLowStock = !isOutOfStock && (
                      (product.reorder_level !== undefined && product.reorder_level > 0 && product.stock_quantity <= product.reorder_level) ||
                      (product.stock_quantity > 0 && product.stock_quantity <= 5)
                    );
                    return (
                      <button
                        key={product.id}
                        onClick={() => !isOutOfStock && addToCart(product)}
                        disabled={isOutOfStock}
                        className={`w-full text-left p-2 rounded-lg transition-colors border-2 ${
                          isOutOfStock 
                            ? 'bg-gray-100 border-transparent cursor-not-allowed opacity-60' 
                            : isLowStock
                            ? 'bg-amber-50/20 border-amber-100 hover:bg-amber-50/40'
                            : 'bg-white border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {product.image && (
                            <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-gray-100 border border-gray-100">
                              <Image
                                src={product.image}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          )}
                          <div className="flex-1 flex justify-between items-start">
                            <div>
                              <div className={`font-medium text-sm flex items-center gap-1.5 ${isOutOfStock ? 'text-gray-400' : ''}`}>
                                <span>{product.name}</span>
                                {isOutOfStock ? (
                                  <span className="text-[9px] text-red-650 font-bold bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                    OUT OF STOCK
                                  </span>
                                ) : isLowStock ? (
                                  <span className="text-[9px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                    LOW STOCK
                                  </span>
                                ) : null}
                              </div>
                              <div className={`text-xs ${
                                isOutOfStock 
                                  ? 'text-gray-400' 
                                  : isLowStock 
                                  ? 'text-amber-600 font-medium' 
                                  : 'text-gray-500'
                              }`}>
                                {product.sku} • Stock: {product.stock_quantity}
                                {isLowStock && product.reorder_level && product.reorder_level > 0 && ` (Reorder at: ${product.reorder_level})`}
                              </div>
                            </div>
                            <div className={`text-sm font-semibold ${isOutOfStock ? 'text-gray-400' : 'text-[#22C55E]'}`}>
                              Rs. {product.selling_price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Discount Selection */}
            {discounts.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-5 text-[#22C55E] flex items-center justify-center">%</div>
                  <span className="text-sm font-medium text-gray-700">Apply Discount</span>
                </div>
                <Select open={discountOpen} onOpenChange={setDiscountOpen} value={selectedDiscount} onValueChange={(value) => setSelectedDiscount(value || "")}>
                  <SelectTrigger ref={discountTriggerRef}>
                    <SelectValue placeholder="No discount applied" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No discount</SelectItem>
                    {discounts.filter(d => d.is_active).map(discount => {
                      const now = new Date();
                      const isValid = (!discount.start_date || new Date(discount.start_date) <= now) &&
                                     (!discount.end_date || new Date(discount.end_date) >= now);
                      if (!isValid) return null;
                      
                      return (
                        <SelectItem key={discount.id} value={discount.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{discount.name}</span>
                            <span className="text-xs text-gray-500">
                              {discount.discount_type === 'percentage' 
                                ? `${discount.discount_value}% off` 
                                : `Rs. ${discount.discount_value} off`}
                              {' • '}
                              {discount.apply_to === 'bill' ? 'Bill Level' : 
                               discount.apply_to === 'category' ? 'Category' : 'Item Level'}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedDiscount && (
                  <div className="mt-2 text-xs text-gray-600 bg-green-50 border border-green-200 rounded p-2">
                    {(() => {
                      const discount = discounts.find(d => d.id === selectedDiscount);
                      if (!discount) return null;
                      return (
                        <>
                          <div className="font-medium text-green-700">{discount.name} applied</div>
                          {discount.description && (
                            <div className="mt-1">{discount.description}</div>
                          )}
                          {(discount.min_quantity > 0 || discount.min_amount > 0) && (
                            <div className="mt-1 text-gray-600">
                              Min: {discount.min_quantity > 0 && `${discount.min_quantity} items`}
                              {discount.min_quantity > 0 && discount.min_amount > 0 && ' or '}
                              {discount.min_amount > 0 && `Rs. ${discount.min_amount}`}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Cart */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-[#22C55E]" />
                  <h3 className="font-semibold">Cart ({cart.length} items)</h3>
                </div>
                <div className="flex items-center gap-2">
                  {cart.length > 0 && openSession && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleHoldOrder}
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 gap-1"
                    >
                      <Pause className="h-3.5 w-3.5" />
                      Hold
                    </Button>
                  )}
                  {cart.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearCart}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {cart.map((item, index) => {
                    const isSelected = selectedCartIndex !== null && selectedCartIndex < cart.length
                      ? selectedCartIndex === index
                      : (cart.length > 0 && index === cart.length - 1);
                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedCartIndex(index)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                          isSelected
                            ? "bg-green-50/70 border-[#22C55E] shadow-sm ring-1 ring-[#22C55E]"
                            : "bg-gray-50 border-transparent hover:bg-gray-100/70"
                        }`}
                      >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.product_name}</div>
                        <div className="text-xs text-gray-500">{item.product_sku}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Rs. {item.unit_price.toLocaleString()} × {item.quantity} {item.unit_name}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(index, -1)}
                          className="h-7 w-7 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(index, 1)}
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold">Rs. {item.line_total?.toLocaleString()}</div>
                        {item.discount_amount > 0 && (
                          <div className="text-xs text-green-600">-Rs. {item.discount_amount.toFixed(2)} off</div>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(index)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Checkout */}
          <div className="space-y-4">
            {todayTransactions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Today&apos;s Sales</h3>
                  <Link href="/dashboard/pos/transactions" className="text-xs text-[#22C55E] hover:underline">
                    View all
                  </Link>
                </div>
                <p className="text-2xl font-bold text-[#22C55E] mb-2">
                  Rs. {todayTransactions.reduce((s, t) => s + Number(t.total), 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mb-2">{todayTransactions.length} transactions today</p>
                <ul className="space-y-1 max-h-32 overflow-y-auto text-xs">
                  {todayTransactions.slice(0, 5).map((t) => (
                    <li key={t.id} className="flex justify-between text-gray-600">
                      <span>{t.transaction_number}</span>
                      <span>Rs. {Number(t.total).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
              <h3 className="font-semibold">Checkout</h3>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Warehouse *</Label>
                  <Select value={selectedWarehouse || ""} onValueChange={(value) => setSelectedWarehouse(value || "")}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(w => (
                        <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Payment Method *</Label>
                    <button
                      type="button"
                      onClick={() => setUseSplitPayment(!useSplitPayment)}
                      className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
                        useSplitPayment
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <Split className="h-3 w-3" />
                      Split
                    </button>
                  </div>

                  {useSplitPayment ? (
                    <div className="mt-2 space-y-2">
                      {splitPayments.map((entry, idx) => (
                        <div key={idx} className="flex gap-2 items-end">
                          <div className="flex-1">
                            {idx === 0 && <Label className="text-xs text-gray-500">Method</Label>}
                            <Select
                              value={entry.method}
                              onValueChange={(v) => updateSplitRow(idx, "method", v || "cash")}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {POS_PAYMENT_METHODS.map((m) => (
                                  <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-24">
                            {idx === 0 && <Label className="text-xs text-gray-500">Amount</Label>}
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={entry.amount}
                              onChange={(e) => updateSplitRow(idx, "amount", e.target.value)}
                              placeholder="0.00"
                              className="h-8 text-xs"
                            />
                          </div>
                          {splitPayments.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                              onClick={() => removeSplitRow(idx)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs gap-1"
                        onClick={addSplitRow}
                      >
                        <Plus className="h-3 w-3" />
                        Add Payment
                      </Button>
                      <div className="text-xs text-right text-gray-500">
                        Split Total: Rs. {splitTotal.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod((v || "cash") as PosPaymentMethod)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POS_PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm">Customer {paymentMethod === "credit" ? "*" : "(Optional)"}</Label>
                  <Select open={customerOpen} onOpenChange={setCustomerOpen} value={selectedCustomer || "walk-in"} onValueChange={(value) => setSelectedCustomer((value || "walk-in") === "walk-in" ? "" : (value || ""))}>
                    <SelectTrigger ref={customerTriggerRef} className="mt-1">
                      <SelectValue placeholder="Walk-in Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!selectedCustomer && (
                  <div>
                    <Label className="text-sm">Customer Name (Optional)</Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Walk-in customer"
                      className="mt-1"
                    />
                  </div>
                )}

                {selectedCustomer && customerLoyalty && loyaltyProgram && (
                  <div className="p-3 bg-green-50/50 dark:bg-green-500/5 border border-green-100 dark:border-green-500/10 rounded-lg space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-800 dark:text-green-400">Loyalty Points Balance:</span>
                      <span className="font-bold text-green-700 dark:text-green-400">{customerLoyalty.points_balance} pts</span>
                    </div>
                    {loyaltyProgram.is_active && customerLoyalty.points_balance >= loyaltyProgram.min_redemption_points && (
                      <div className="space-y-1.5 border-t border-green-100/50 dark:border-green-500/10 pt-2">
                        <p className="text-[10px] text-gray-500">
                          Redeem rate: 1 pt = Rs. {loyaltyProgram.rupees_per_point} (Min: {loyaltyProgram.min_redemption_points} pts)
                        </p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min={loyaltyProgram.min_redemption_points}
                            max={customerLoyalty.points_balance}
                            value={pointsToRedeem || ""}
                            onChange={(e) => setPointsToRedeem(Math.max(0, parseInt(e.target.value) || 0))}
                            placeholder="Points"
                            className="h-7 text-xs flex-1 bg-white"
                          />
                          <Button
                            size="sm"
                            type="button"
                            onClick={handleRedeemPoints}
                            className="bg-green-600 hover:bg-green-700 text-white h-7 px-2.5 text-xs"
                          >
                            Redeem
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div>
                  <Label htmlFor="notes" className="text-sm">Notes</Label>
                  <Textarea
                    ref={notesRef}
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="mt-1 resize-none"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
              </div>
              {itemLevelDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Item Discounts</span>
                  <span className="font-medium text-green-600">- Rs. {itemLevelDiscount.toFixed(2)}</span>
                </div>
              )}
              {billLevelDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bill Discount</span>
                  <span className="font-medium text-green-600">- Rs. {billLevelDiscount.toFixed(2)}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Loyalty Discount</span>
                  <span className="font-medium text-green-600">- Rs. {loyaltyDiscount.toFixed(2)}</span>
                </div>
              )}
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700">Total Discount</span>
                  <span className="text-green-600">- Rs. {totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{taxLabel} ({taxPercent}%)</span>
                <span className="font-medium">Rs. {taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-[#22C55E]">Rs. {total.toFixed(2)}</span>
              </div>
              
              {!useSplitPayment && (
                <div>
                  <Label className="text-sm">Amount Paid *</Label>
                  <Input
                    ref={amountPaidRef}
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0.00"
                    className="mt-1 text-lg font-semibold"
                    min={0}
                    step={0.01}
                  />
                </div>
              )}
              
              {changeGiven > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Change</span>
                    <span className="font-semibold text-green-700">Rs. {changeGiven.toFixed(2)}</span>
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleCheckout}
                disabled={processing || cart.length === 0 || !openSession}
                className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white h-12 text-lg font-semibold"
              >
                {processing ? "Processing..." : (
                  "Complete Sale"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden printable receipt for auto-print */}
      <div className="hidden">
        {lastTransaction && companyInfo && (
          <PrintablePosReceipt
            ref={printRef}
            transaction={lastTransaction}
            companyInfo={companyInfo}
            taxLabel={posSettings?.tax_label}
            taxRate={posSettings?.tax_rate}
            footerText={posSettings?.receipt_footer}
          />
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-gray-150 shadow-xl max-w-lg w-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-950 text-lg">Keyboard Shortcuts</h3>
                <p className="text-xs text-gray-500 mt-0.5">Quick billing controls</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowShortcutsModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-600 font-medium">Focus Barcode</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">F1</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-600 font-medium">Focus Search</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">F2</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-600 font-medium">Clear / Escape</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">Esc</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-600 font-medium">Increase Qty</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">+</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-600 font-medium">Decrease Qty</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">-</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-600 font-medium">Delete Item</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">Delete</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-600 font-medium">Discount Selector</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">Ctrl + D</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-600 font-medium">Customer Selector</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">Ctrl + C</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-600 font-medium">Focus Notes</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">Ctrl + N</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-600 font-medium">Focus Payment</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">F8</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-600 font-medium">Void Last Item</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">F9</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-600 font-medium">Print Receipt</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">Ctrl + P</kbd>
                </div>
                <div className="flex items-center justify-between col-span-2 p-2 bg-green-50/50 rounded border border-green-150">
                  <span className="text-green-800 font-semibold">Complete Checkout</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-green-300 rounded shadow-sm text-green-700">Ctrl + Enter</kbd>
                </div>
              </div>
              <p className="text-center text-[11px] text-gray-400 mt-2">
                * Item actions (+, -, Delete) apply to the highlighted item in the cart.
              </p>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
