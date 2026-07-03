"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Barcode, ShoppingCart, Trash2, Plus, Minus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import posApi, { type POSProduct, type POSTransactionLine, type POSDiscount, type POSTransaction } from "@/lib/api/pos";
import { customerAPI, type Customer } from "@/lib/api/sales";
import { inventoryApi, type Warehouse } from "@/lib/api/inventory";
import toast from "react-hot-toast";

interface CartItem extends POSTransactionLine {
  product_name: string;
  product_sku: string;
  stock_quantity: number;
  unit_name?: string;
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
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi" | "credit">("cash");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [notes, setNotes] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanningBarcode, setScanningBarcode] = useState(false);
  const [todayTransactions, setTodayTransactions] = useState<POSTransaction[]>([]);

  const fetchTodayTransactions = async () => {
    try {
      const data = await posApi.getTodayTransactions();
      setTodayTransactions(data);
    } catch {
      // non-blocking
    }
  };

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, warehousesRes, discountsRes] = await Promise.all([
          customerAPI.list({ status: 'active' }),
          inventoryApi.warehouses.list(),
          posApi.getActiveDiscounts()
        ]);
        setCustomers(customersRes.data.results);
        setWarehouses(warehousesRes.data.results);
        setDiscounts(discountsRes);
        
        // Set default warehouse if available
        if (warehousesRes.data.results.length > 0) {
          setSelectedWarehouse(String(warehousesRes.data.results[0].id));
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
      // F1: Focus barcode scanner
      if (e.key === 'F1') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
      // F2: Focus product search
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape: Clear search and focus barcode
      if (e.key === 'Escape') {
        setSearchQuery("");
        setProducts([]);
        setBarcodeQuery("");
        barcodeInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Search products
  useEffect(() => {
    if (searchQuery.length < 2) {
      setProducts([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await posApi.searchProducts(searchQuery);
        setProducts(results);
      } catch (error) {
        toast.error("Failed to search products");
      } finally {
        setSearching(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Handle barcode scan from form submission
  const handleBarcodeScan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!barcodeQuery.trim() || scanningBarcode) return;
    await handleBarcodeScanDirect(barcodeQuery);
  };

  // Direct barcode scan handler (used by both form and global listener)
  const handleBarcodeScanDirect = async (barcode: string) => {
    if (!barcode.trim() || scanningBarcode) return;
    
    setScanningBarcode(true);
    try {
      const product = await posApi.searchByBarcode(barcode);
      
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
      if (discount.apply_to === 'item' && discount.product === product.id) {
        applicable = true;
      } else if (discount.apply_to === 'category' && discount.category && product.category_name) {
        // Note: This is a simplified check. In production, you'd compare category IDs
        applicable = true;
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
  const updateQuantity = (index: number, delta: number) => {
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
  const removeFromCart = (index: number) => {
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
  const totalDiscount = roundToTwo(itemLevelDiscount + billLevelDiscount);
  const taxAmount = roundToTwo((subtotal - totalDiscount) * 0.13); // 13% VAT on discounted amount
  const total = roundToTwo(subtotal - totalDiscount + taxAmount);
  const changeGiven = amountPaid ? roundToTwo(Math.max(0, parseFloat(amountPaid) - total)) : 0;

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

  // Process transaction
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
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
    
    const paidAmount = roundToTwo(parseFloat(amountPaid) || 0);
    if (paidAmount < total) {
      toast.error(`Amount paid (Rs. ${paidAmount.toFixed(2)}) must be ≥ total (Rs. ${total.toFixed(2)})`);
      return;
    }
    
    setProcessing(true);
    try {
      const transactionData = {
        customer: selectedCustomer || null,
        customer_name: customerName || undefined,
        subtotal: roundToTwo(subtotal),
        discount_amount: roundToTwo(totalDiscount),
        tax_amount: roundToTwo(taxAmount),
        total: roundToTwo(total),
        payment_method: paymentMethod,
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
        }))
      };
      
      const response = await posApi.createTransaction(transactionData);
      toast.success(`✓ Transaction ${response.transaction_number} completed!`);
      
      // Reset form
      setCart([]);
      setSelectedCustomer("");
      setCustomerName("");
      setSelectedDiscount("");
      setAmountPaid("");
      setNotes("");
      setPaymentMethod("cash");
      fetchTodayTransactions();
      
      // Auto-focus barcode for next customer
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
      
      // Navigate to transaction detail after a short delay
      setTimeout(() => {
        router.push(`/dashboard/pos/transactions`);
      }, 1500);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to process transaction";
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
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <DashHeader title="Point of Sale" subtitle="Fast billing interface" />
      
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
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#22C55E]" />
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="bg-[#22C55E] hover:bg-[#16A34A]"
                  disabled={scanningBarcode || !barcodeQuery.trim()}
                >
                  {scanningBarcode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
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
                    return (
                      <button
                        key={product.id}
                        onClick={() => !isOutOfStock && addToCart(product)}
                        disabled={isOutOfStock}
                        className={`w-full text-left p-2 rounded-lg transition-colors ${
                          isOutOfStock 
                            ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className={`font-medium text-sm ${isOutOfStock ? 'text-gray-400' : ''}`}>
                              {product.name}
                              {isOutOfStock && <span className="ml-2 text-xs text-red-500 font-semibold">OUT OF STOCK</span>}
                            </div>
                            <div className={`text-xs ${isOutOfStock ? 'text-gray-400' : 'text-gray-500'}`}>
                              {product.sku} • Stock: {product.stock_quantity}
                            </div>
                          </div>
                          <div className={`text-sm font-semibold ${isOutOfStock ? 'text-gray-400' : 'text-[#22C55E]'}`}>
                            Rs. {product.selling_price.toLocaleString()}
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
                <Select value={selectedDiscount} onValueChange={(value) => setSelectedDiscount(value || "")}>
                  <SelectTrigger>
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
              
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
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
                  ))}
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
                  <Select value={selectedWarehouse || undefined} onValueChange={(value) => setSelectedWarehouse(value)}>
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
                  <Label className="text-sm">Payment Method *</Label>
                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "cash" | "card" | "upi" | "credit")}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI/Digital</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {paymentMethod === "credit" ? (
                  <div>
                    <Label className="text-sm">Customer *</Label>
                    <Select value={selectedCustomer || undefined} onValueChange={(value) => setSelectedCustomer(value || "")}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
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
                
                <div>
                  <Label htmlFor="notes" className="text-sm">Notes</Label>
                  <Textarea
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
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700">Total Discount</span>
                  <span className="text-green-600">- Rs. {totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (13%)</span>
                <span className="font-medium">Rs. {taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-[#22C55E]">Rs. {total.toFixed(2)}</span>
              </div>
              
              <div>
                <Label className="text-sm">Amount Paid *</Label>
                <Input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 text-lg font-semibold"
                  min={0}
                  step={0.01}
                />
              </div>
              
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
                disabled={processing || cart.length === 0}
                className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white h-12 text-lg font-semibold"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Complete Sale"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
