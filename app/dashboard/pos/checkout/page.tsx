"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Minus, Trash2, Wallet, CreditCard, Receipt, X, Printer, Download, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { inventoryApi, type Product, type Warehouse } from "@/lib/api/inventory";
import { customerAPI, type Customer } from "@/lib/api/sales";
import posApi, { type POSSession, type POSTransaction } from "@/lib/api/pos";
import { paymentMethodsAPI, bankAccountsAPI, type PaymentMethod, type BankAccount } from "@/lib/api/accounting";
import { downloadReceiptPDF, preparePrint, cleanupPrint } from "@/lib/utils/receipt-generator";
import { BarcodeScannerModal } from "@/components/pos/BarcodeScannerModal";
import { ConfirmSaleModal, type SaleConfirmationData } from "@/components/pos/ConfirmSaleModal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POSCheckoutPage() {
  const router = useRouter();
  
  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [openSession, setOpenSession] = useState<POSSession | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [taxRate, setTaxRate] = useState<number>(0.13); // Default 13%, will be overridden
  
  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Search & Selection
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "digital" | "credit">("cash");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [cashAmount, setCashAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  
  // Receipt
  const [completedTransaction, setCompletedTransaction] = useState<POSTransaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  
  // Barcode Scanner
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  
  // Confirm Sale Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, warehousesRes, customersRes, sessionRes, settingsRes, paymentMethodsRes, bankAccountsRes] = await Promise.all([
          inventoryApi.products.list({ limit: 1000, status: "active" }),
          inventoryApi.warehouses.list({ limit: 100 }),
          customerAPI.list({ status: "active", page_size: 500 }),
          posApi.getOpenSession(),
          posApi.getSettings(),
          paymentMethodsAPI.list({ is_active: true }).catch(() => ({ data: { results: [] } })),
          bankAccountsAPI.list({ status: "active" }).catch(() => []),
        ]);
        
        const allProducts = productsRes.data?.results || [];
        setProducts(allProducts);
        setFilteredProducts(allProducts);
        setWarehouses(warehousesRes.data?.results || []);
        setCustomers(customersRes.data?.results || []);
        setOpenSession(sessionRes);
        
        // Set payment methods (filter active ones)
        const activeMethods = (paymentMethodsRes.data?.results || []).filter(
          (pm: PaymentMethod) => pm.is_active
        );
        setPaymentMethods(activeMethods);
        
        // Set bank accounts
        const activeAccounts = Array.isArray(bankAccountsRes) ? bankAccountsRes : [];
        setBankAccounts(activeAccounts);
        
        // Set tax rate from settings (convert from percentage to decimal)
        if (settingsRes && settingsRes.tax_rate !== undefined) {
          setTaxRate(settingsRes.tax_rate / 100);
        }

        // Auto-select first warehouse or session warehouse
        if (sessionRes?.warehouse) {
          setSelectedWarehouse(String(sessionRes.warehouse));
        } else if (warehousesRes.data?.results && warehousesRes.data.results.length > 0) {
          setSelectedWarehouse(String(warehousesRes.data.results[0].id));
        }
      } catch (error) {
        console.error("[Checkout] Failed to load data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter products by search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.category_name?.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  // Add to cart
  const addToCart = useCallback((product: Product) => {
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

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * Number(item.product.selling_price),
    0
  );
  const discountValue = discountAmount ? parseFloat(discountAmount) || 0 : 0;
  const netAmount = Math.max(0, subtotal - discountValue);
  const taxAmount = netAmount * taxRate;
  const total = netAmount + taxAmount;
  const cashGiven = cashAmount ? parseFloat(cashAmount) || 0 : 0;
  const changeAmount = Math.max(0, cashGiven - total);

  // Reset form for next sale
  const resetForm = () => {
    setCart([]);
    setSelectedCustomer("");
    setPaymentMethod("cash");
    setSelectedPaymentMethodId(null);
    setCashAmount("");
    setDiscountAmount("");
    setSearchQuery("");
    setCompletedTransaction(null);
    setShowReceipt(false);
  };

  // Handle barcode scan - add product to cart when "Sold" is clicked
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
      // Look up product by SKU (barcode)
      const response = await inventoryApi.products.list({ search: barcode });
      const productsFound = response.data?.results || [];
      const product = productsFound.find((p: Product) => p.sku === barcode);

      if (product) {
        // Product exists - add to cart (deduct stock)
        addToCart(product);
        toast.success(`${product.name} added to cart`);
        setBarcodeInput(""); // Clear input for next scan
      } else {
        // Product doesn't exist
        toast.error("Product doesn't exist");
      }
    } catch (error) {
      console.error("Barcode lookup error:", error);
      toast.error("Error looking up product");
    }
  };

  // Handle confirm sale modal - Save Only
  const handleConfirmSave = async (data: SaleConfirmationData) => {
    console.log("Save with confirmation data:", data);
    
    // Update state with confirmation data before completing sale
    if (data.paymentMethodId) {
      setSelectedPaymentMethodId(data.paymentMethodId);
    }
    if (data.bankAccountId) {
      // Store bank account ID to pass to transaction
      (window as any).__selectedBankAccountId = data.bankAccountId;
    }
    
    await completeSale();
    setShowConfirmModal(false);
  };

  // Handle confirm sale modal - Save & Print
  const handleConfirmSaveAndPrint = async (data: SaleConfirmationData) => {
    console.log("Save and print with confirmation data:", data);
    
    // Update state with confirmation data before completing sale
    if (data.paymentMethodId) {
      setSelectedPaymentMethodId(data.paymentMethodId);
    }
    if (data.bankAccountId) {
      // Store bank account ID to pass to transaction
      (window as any).__selectedBankAccountId = data.bankAccountId;
    }
    
    await completeSale();
    setShowConfirmModal(false);
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

    setProcessing(true);

    try {
      const transactionData = {
        warehouse: selectedWarehouse,
        customer: paymentMethod === "credit" ? selectedCustomer : null,
        payment_method: paymentMethod === "digital" ? "card" : paymentMethod,
        payment_method_ref: selectedPaymentMethodId,
        bank_account: (window as any).__selectedBankAccountId || null,
        amount_paid: paymentMethod === "cash" ? cashGiven : total,
        change_given: paymentMethod === "cash" ? changeAmount : 0,
        subtotal: subtotal,
        discount_amount: discountValue,
        tax_amount: taxAmount,
        total: total,
        lines: cart.map((item) => ({
          product: item.product.id,
          quantity: item.quantity,
          unit_price: Number(item.product.selling_price),
          discount_amount: 0,
          line_total: item.quantity * Number(item.product.selling_price),
        })),
      };

      const response = await posApi.createTransaction(transactionData);
      
      // Clear the temporary bank account ID
      (window as any).__selectedBankAccountId = null;
      
      // Store transaction data for receipt viewing
      setCompletedTransaction(response);

      // Show success message with change if cash payment
      if (paymentMethod === "cash" && changeAmount > 0) {
        toast.success(
          <div className="space-y-1">
            <div className="font-bold text-lg">Sale Complete!</div>
            <div className="text-sm">Receipt #{response.transaction_number}</div>
            <div className="text-lg font-bold text-green-600">Change: Rs. {changeAmount.toFixed(2)}</div>
          </div>,
          { duration: 3000 }
        );
      } else {
        toast.success(
          <div>
            <div className="font-semibold">Sale Complete!</div>
            <div className="text-sm">Receipt #{response.transaction_number}</div>
          </div>,
          { duration: 2000 }
        );
      }

      // Reset form immediately for next customer
      resetForm();
      
    } catch (error: any) {
      console.error("Transaction error:", error);
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.lines ||
        error.response?.data?.message ||
        "Failed to complete sale";
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading products and settings...</p>
          <p className="mt-2 text-xs text-gray-400">(times out after 5 seconds if API is slow)</p>
          <div className="mt-6 text-xs text-gray-400 space-y-1">
            <p>Tip: Check browser console for errors if this persists</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col">
        {/* No Session Warning Banner */}
        {!openSession && (
          <div className="bg-amber-50 border-b border-amber-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <Receipt className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="font-semibold text-amber-900">No Active POS Session</div>
                  <div className="text-sm text-amber-700">You need to start a POS session before making sales</div>
                </div>
              </div>
              <Button
                onClick={() => router.push("/dashboard/pos/sessions/new")}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Start Session
              </Button>
            </div>
          </div>
        )}

        {/* Header with Search */}
        <div className="bg-white border-b p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">POS Checkout</h1>
            <Button
              onClick={() => setShowBarcodeScanner(true)}
              disabled={!selectedWarehouse}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-2"
              size="sm"
            >
              <Scan className="h-4 w-4" />
              Scan Barcode
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
              autoFocus
            />
          </div>

          {/* Barcode Input Field */}
          <div className="relative">
            <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#22C55E]" />
            <Input
              type="text"
              placeholder="Scan barcode here..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeInputSubmit}
              className="pl-10 h-11 border-[#22C55E] focus:ring-[#22C55E]"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map((product) => {
              const stock = product.total_stock || 0;
              const isOutOfStock = stock <= 0;
              const inCart = cart.find(item => item.product.id === product.id);

              return (
                <button
                  key={product.id}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  disabled={isOutOfStock}
                  className={`
                    relative text-left p-3 rounded-lg border-2 transition-all
                    ${
                      isOutOfStock
                        ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"
                        : inCart
                          ? "bg-green-50 border-green-500 hover:shadow-md"
                          : "bg-white border-gray-200 hover:border-green-400 hover:shadow-md active:scale-95"
                    }
                  `}
                >
                  {inCart && (
                    <div className="absolute top-1 right-1 bg-green-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {inCart.quantity}
                    </div>
                  )}
                  <div className="font-semibold text-sm truncate">{product.name}</div>
                  <div className="text-lg font-bold text-green-600 mt-1">
                    Rs. {Number(product.selling_price).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isOutOfStock ? "Out of stock" : `Stock: ${stock}`}
                  </div>
                </button>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                {searchQuery ? "No products found" : "No products available"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 bg-white border-l flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Cart</h2>
            {cart.length > 0 && (
              <button
                onClick={resetForm}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {item.product.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Rs. {Number(item.product.selling_price).toFixed(2)} × {item.quantity}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.product.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.product.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="text-sm font-bold w-16 text-right">
                  Rs. {(item.quantity * Number(item.product.selling_price)).toFixed(0)}
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => removeFromCart(item.product.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer - Payment */}
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              
              {/* Discount Input */}
              <div className="flex justify-between items-center text-sm">
                <label className="font-medium">Discount</label>
                <div className="flex items-center gap-2">
                  <span>Rs.</span>
                  <Input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="0"
                    className="w-20 h-8 text-right text-sm"
                    min="0"
                    step="10"
                  />
                </div>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
                <span>Rs. {taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-green-600">Rs. {total.toFixed(0)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment</label>
              
              {/* Show PaymentMethod options if available, otherwise fallback to simple buttons */}
              {paymentMethods.length > 0 ? (
                <Select 
                  value={selectedPaymentMethodId || ""} 
                  onValueChange={(value) => {
                    setSelectedPaymentMethodId(value || null);
                    
                    // Map PaymentMethod to legacy payment_method string
                    const pm = paymentMethods.find(m => m.id === value);
                    if (pm) {
                      if (pm.method_type === 'cash') setPaymentMethod('cash');
                      else if (pm.method_type === 'credit') setPaymentMethod('credit');
                      else setPaymentMethod('digital'); // card/bank/other
                    }
                  }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id}>
                        {pm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                /* Fallback to simple cash/card/credit buttons if no PaymentMethods */
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={paymentMethod === "cash" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setPaymentMethod("cash"); setSelectedPaymentMethodId(null); }}
                    className={paymentMethod === "cash" ? "bg-green-600" : ""}
                  >
                    <Wallet className="h-4 w-4 mr-1" />
                    Cash
                  </Button>
                  <Button
                    variant={paymentMethod === "digital" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setPaymentMethod("digital"); setSelectedPaymentMethodId(null); }}
                    className={paymentMethod === "digital" ? "bg-green-600" : ""}
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Card
                  </Button>
                  <Button
                    variant={paymentMethod === "credit" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setPaymentMethod("credit"); setSelectedPaymentMethodId(null); }}
                    className={paymentMethod === "credit" ? "bg-green-600" : ""}
                  >
                    Credit
                  </Button>
                </div>
              )}
            </div>

            {/* Credit Customer Selection */}
            {paymentMethod === "credit" && (
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Cash Amount */}
            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <Input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="Cash received"
                  className="h-11 text-lg text-right font-semibold"
                  min={total}
                  step="10"
                  autoFocus
                />
                {cashGiven >= total && changeAmount > 0 && (
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-sm text-gray-600">Change</div>
                    <div className="text-xl font-bold text-green-600">
                      Rs. {changeAmount.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Complete Sale Button */}
            <Button
              onClick={() => setShowConfirmModal(true)}
              disabled={
                processing ||
                !openSession ||
                cart.length === 0
              }
              className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                `Complete Sale`
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceipt && completedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div id="receipt-modal" className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Receipt Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Receipt #{completedTransaction.transaction_number}</h2>
              <button
                onClick={() => setShowReceipt(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt Content */}
            <div id="receipt-content" className="p-6 space-y-4 print:p-10">
              {/* Store & Date Info */}
              <div className="text-center border-b pb-4">
                <div className="text-sm font-semibold">📋 RECEIPT</div>
                <div className="text-xs text-gray-600 mt-2">
                  {new Date(completedTransaction.created_at || new Date()).toLocaleString()}
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-600 uppercase">Items</div>
                {completedTransaction.lines && completedTransaction.lines.length > 0 ? (
                  completedTransaction.lines.map((line, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1 border-b">
                      <div className="flex-1">
                        <div className="font-medium">{line.product_name || 'Product'}</div>
                        <div className="text-xs text-gray-600">
                          {line.quantity} × Rs. {Number(line.unit_price).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right font-medium">
                        Rs. {Number(line.line_total || line.quantity * line.unit_price).toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500">No items</div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>Rs. {Number(completedTransaction.subtotal).toFixed(2)}</span>
                </div>
                {completedTransaction.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount</span>
                    <span>-Rs. {Number(completedTransaction.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>Rs. {Number(completedTransaction.tax_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>Rs. {Number(completedTransaction.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <span className="font-medium capitalize">{completedTransaction.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid</span>
                  <span className="font-medium">Rs. {Number(completedTransaction.amount_paid).toFixed(2)}</span>
                </div>
                {completedTransaction.change_given > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Change</span>
                    <span>Rs. {Number(completedTransaction.change_given).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Cashier Info */}
              {completedTransaction.cashier_name && (
                <div className="text-xs text-gray-600 text-center border-t pt-3">
                  Cashier: {completedTransaction.cashier_name}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div id="receipt-print-actions" className="border-t p-4 flex gap-2 justify-end print:hidden bg-gray-50">
              <Button
                onClick={() => {
                  preparePrint();
                  window.print();
                  cleanupPrint();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await downloadReceiptPDF("receipt-content", completedTransaction.transaction_number);
                    toast.success("Receipt downloaded successfully");
                  } catch (error) {
                    console.error("PDF generation error:", error);
                    toast.error("Failed to download receipt PDF");
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                onClick={() => setShowReceipt(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Button - shown after transaction completes */}
      {completedTransaction && !showReceipt && (
        <div id="receipt-floating-button" className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={() => setShowReceipt(true)}
            className="bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg"
            size="lg"
          >
            <Receipt className="h-5 w-5 mr-2" />
            View Receipt
          </Button>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        open={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        warehouseId={Number(selectedWarehouse)}
        onProductScanned={handleBarcodeProductScanned}
      />

      {/* Confirm Sale Modal */}
      <ConfirmSaleModal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onSave={handleConfirmSave}
        onSaveAndPrint={handleConfirmSaveAndPrint}
        totalAmount={total}
        customers={customers}
        paymentMethods={paymentMethods}
        bankAccounts={bankAccounts}
      />
    </div>
  );
}
