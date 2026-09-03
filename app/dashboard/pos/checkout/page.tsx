"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Receipt, Wallet, CreditCard, Smartphone, Eye, Plus, CheckCircle, FileText, Printer, Download, Tags, X, Pause, Play, DollarSign } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { POSProductGrid } from "@/components/pos/checkout/POSProductGrid";
import { POSCartPanel } from "@/components/pos/checkout/POSCartPanel";
import { POSCheckoutDialogs } from "@/components/pos/checkout/POSCheckoutDialogs";
import POSInvoice from "@/components/pos/POSInvoice";
import { usePOSCheckout } from "@/hooks/usePOSCheckout";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";

export default function POSCheckoutPage() {
  const checkout = usePOSCheckout();
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      // Constrain between 280px and 600px
      if (newWidth >= 280 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Print invoice handler
  const handlePrintInvoice = useReactToPrint({
    contentRef: checkout.invoiceRef,
    documentTitle: `Invoice_${checkout.completedTransaction?.transaction_number || 'Receipt'}`,
  });

  // Download PDF handler
  const handleDownloadPDF = async () => {
    if (!checkout.invoiceRef.current || !checkout.completedTransaction) return;

    try {
      toast.loading("Generating PDF...");
      
      const canvas = await html2canvas(checkout.invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice_${checkout.completedTransaction.transaction_number}.pdf`);
      
      toast.dismiss();
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.dismiss();
      toast.error("Failed to generate PDF");
    }
  };

  // Dialog change handler
  const handleDialogChange = (dialog: string, open: boolean) => {
    switch (dialog) {
      case 'checkout':
        checkout.setShowCheckoutDialog(open);
        break;
      case 'qr':
        checkout.setShowQRDialog(open);
        break;
      case 'thankYou':
        checkout.setShowThankYouDialog(open);
        break;
      case 'receipt':
        checkout.setShowReceipt(open);
        break;
      case 'coupon':
        checkout.setShowCouponDialog(open);
        if (open) {
          checkout.loadActiveDiscounts();
        }
        break;
      case 'customer':
        checkout.setShowCustomerDialog(open);
        if (!open) {
          checkout.setNewCustomerName("");
          checkout.setNewCustomerPhone("");
          checkout.setNewCustomerEmail("");
          checkout.setNewCustomerAddress("");
          checkout.setNewCustomerType("Individual");
        }
        break;
      case 'barcodeScanner':
        checkout.setShowBarcodeScanner(open);
        break;
      case 'heldOrders':
        checkout.setShowHeldOrders(open);
        break;
      case 'cashMovement':
        checkout.setShowCashMovement(open);
        break;
      case 'splitPayment':
        checkout.setShowSplitPayment(open);
        break;
      case 'cameFromCheckout':
        checkout.setCameFromCheckout(open);
        break;
    }
  };

  // Customer field change handler
  const handleCustomerFieldChange = (field: string, value: string) => {
    switch (field) {
      case 'name':
        checkout.setNewCustomerName(value);
        break;
      case 'phone':
        checkout.setNewCustomerPhone(value);
        break;
      case 'email':
        checkout.setNewCustomerEmail(value);
        break;
      case 'address':
        checkout.setNewCustomerAddress(value);
        break;
      case 'type':
        checkout.setNewCustomerType(value as "Individual" | "Business");
        break;
    }
  };

  // Select discount handler
  const handleSelectDiscount = (discount: any) => {
    checkout.setAppliedCoupon(discount);
    checkout.setDiscountAmount('');
    checkout.setShowCouponDialog(false);
    toast.success(`Coupon "${discount.name}" applied!`);
  };

  if (checkout.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Dashboard Header with Action Buttons */}
      <div style={{ paddingRight: `${sidebarWidth}px` }}>
        <DashHeader 
          title="Point of Sale" 
          subtitle="Scan or search products to add to cart"
          actions={
            checkout.openSession && checkout.cart.length > 0 ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={checkout.handleHoldOrder}
                  className="gap-1 h-9"
                >
                  <Pause className="h-4 w-4" />
                  Hold Order
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => checkout.setShowHeldOrders(true)}
                  className="gap-1 h-9"
                >
                  <Play className="h-4 w-4" />
                  Held Orders
                  {checkout.heldOrders.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      {checkout.heldOrders.length}
                    </span>
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => checkout.setShowCashMovement(true)}
                  className="gap-1 h-9"
                >
                  <DollarSign className="h-4 w-4" />
                  Cash In/Out
                </Button>
              </div>
            ) : null
          }
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden" style={{ paddingRight: `${sidebarWidth}px` }}>
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* No Session Warning Banner */}
          {!checkout.openSession && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 p-4 shadow-sm">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500 p-2.5 rounded-xl shadow-md">
                    <Receipt className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-amber-900">No Active POS Session</div>
                    <div className="text-sm text-amber-700">Start a session to begin making sales</div>
                  </div>
                </div>
                <Button
                  onClick={() => checkout.router.push("/dashboard/pos/sessions/new")}
                  className="bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                  Start Session
                </Button>
              </div>
            </div>
          )}

          {/* Product Grid with Search and Categories */}
          <POSProductGrid
            products={checkout.products}
            filteredProducts={checkout.filteredProducts}
            cart={checkout.cart}
            searchQuery={checkout.searchQuery}
            selectedCategory={checkout.selectedCategory}
            showOnlyAvailable={checkout.showOnlyAvailable}
            selectedWarehouse={checkout.selectedWarehouse}
            onSearchChange={checkout.setSearchQuery}
            onCategoryChange={checkout.setSelectedCategory}
            onToggleAvailable={() => checkout.setShowOnlyAvailable(!checkout.showOnlyAvailable)}
            onAddToCart={checkout.addToCart}
            onShowBarcodeScanner={() => checkout.setShowBarcodeScanner(true)}
            searchInputRef={checkout.searchInputRef}
          />
        </div>

        {/* Right Panel - Cart */}
        <POSCartPanel
          cart={checkout.cart}
          subtotal={checkout.subtotal}
          discountValue={checkout.discountValue}
          taxAmount={checkout.taxAmount}
          taxRate={checkout.taxRate}
          total={checkout.total}
          appliedCoupon={checkout.appliedCoupon}
          discountAmount={checkout.discountAmount}
          openSession={checkout.openSession}
          width={sidebarWidth}
          onUpdateQuantity={checkout.updateQuantity}
          onRemoveFromCart={checkout.removeFromCart}
          onResetForm={checkout.resetForm}
          onShowCouponDialog={() => {
            checkout.setShowCouponDialog(true);
            checkout.loadActiveDiscounts();
          }}
          onRemoveCoupon={checkout.removeCoupon}
          onDiscountAmountChange={checkout.setDiscountAmount}
          onShowCheckoutDialog={() => checkout.setShowCheckoutDialog(true)}
          onResizeStart={() => setIsResizing(true)}
        />
      </div>

      {/* Dialogs */}
      <POSCheckoutDialogs
        showBarcodeScanner={checkout.showBarcodeScanner}
        showHeldOrders={checkout.showHeldOrders}
        showCashMovement={checkout.showCashMovement}
        showSplitPayment={checkout.showSplitPayment}
        selectedWarehouse={checkout.selectedWarehouse}
        heldOrders={checkout.heldOrders}
        total={checkout.total}
        onDialogChange={handleDialogChange}
        onResumeOrder={checkout.handleResumeOrder}
        onDeleteHeldOrder={checkout.handleDeleteHeldOrder}
        onSplitPaymentConfirm={checkout.handleSplitPaymentConfirm}
        onBarcodeProductScanned={checkout.handleBarcodeProductScanned}
      />

      {/* Checkout Confirmation Dialog */}
      <Dialog open={checkout.showCheckoutDialog} onOpenChange={(open) => handleDialogChange('checkout', open)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Complete Sale</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Order Summary */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 space-y-2.5 border border-green-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">Subtotal</span>
                <span className="font-semibold text-gray-900">Rs. {checkout.subtotal.toFixed(2)}</span>
              </div>
              {checkout.discountValue > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">
                    Discount {checkout.appliedCoupon && `(${checkout.appliedCoupon.code})`}
                  </span>
                  <span className="font-semibold text-red-600">- Rs. {Number(checkout.discountValue).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">Tax ({(checkout.taxRate * 100).toFixed(1)}%)</span>
                <span className="font-semibold text-gray-900">Rs. {checkout.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2.5 border-t-2 border-green-300">
                <span className="text-gray-900">Total</span>
                <span className="text-green-600">Rs. {checkout.total.toFixed(0)}</span>
              </div>
            </div>

            {/* Customer Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">
                Customer 
                {checkout.paymentMethod === "credit" ? (
                  <span className="text-red-500 ml-1">*</span>
                ) : (
                  <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                )}
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Combobox
                    options={checkout.customers.map((customer) => ({
                      value: customer.id,
                      label: customer.name,
                      subtitle: [
                        customer.phone,
                        customer.email,
                        customer.type
                      ].filter(Boolean).join(' • ')
                    }))}
                    value={checkout.selectedCustomer}
                    onValueChange={checkout.setSelectedCustomer}
                    placeholder="Search by name, phone, email..."
                    searchPlaceholder="Search customers..."
                    emptyText="No customer found."
                    className="h-11 text-sm w-full"
                    dropdownWidth={600}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleDialogChange('cameFromCheckout', true);
                    handleDialogChange('checkout', false);
                    handleDialogChange('customer', true);
                  }}
                  className="h-11 w-11 p-0 border flex-shrink-0"
                  title="Add new customer"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">
                Payment Method <span className="text-red-500">*</span>
              </label>
              
              {/* Row 1: Cash, eSewa, FonePay, Khalti */}
              <div className="grid grid-cols-4 gap-2">
                {/* Cash */}
                <button
                  type="button"
                  onClick={() => checkout.setPaymentMethod("cash")}
                  className={`flex flex-col items-center justify-center gap-1 h-16 rounded-lg border-2 font-medium text-xs transition-all ${
                    checkout.paymentMethod === "cash"
                      ? "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Wallet className="h-5 w-5" />
                  <span>Cash</span>
                </button>
                
                {/* eSewa */}
                {checkout.paymentSettings.esewa_enabled ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => checkout.setPaymentMethod("esewa")}
                      className={`flex flex-col items-center justify-center gap-1 h-16 w-full rounded-lg border-2 font-medium text-xs transition-all ${
                        checkout.paymentMethod === "esewa"
                          ? "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Smartphone className="h-5 w-5" />
                      <span>eSewa</span>
                    </button>
                    <button
                      type="button"
                      className="absolute right-1 top-1 p-1 rounded-full hover:bg-black/10 transition-colors z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        checkout.showQRCodeDialog("esewa");
                      }}
                      title="View QR Code"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                    <span className="text-xs text-gray-400">eSewa</span>
                  </div>
                )}

                {/* FonePay */}
                {checkout.paymentSettings.fonepay_enabled ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => checkout.setPaymentMethod("fonepay")}
                      className={`flex flex-col items-center justify-center gap-1 h-16 w-full rounded-lg border-2 font-medium text-xs transition-all ${
                        checkout.paymentMethod === "fonepay"
                          ? "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <CreditCard className="h-5 w-5" />
                      <span>FonePay</span>
                    </button>
                    <button
                      type="button"
                      className="absolute right-1 top-1 p-1 rounded-full hover:bg-black/10 transition-colors z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        checkout.showQRCodeDialog("fonepay");
                      }}
                      title="View QR Code"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                    <span className="text-xs text-gray-400">FonePay</span>
                  </div>
                )}

                {/* Khalti */}
                {checkout.paymentSettings.khalti_enabled ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => checkout.setPaymentMethod("khalti")}
                      className={`flex flex-col items-center justify-center gap-1 h-16 w-full rounded-lg border-2 font-medium text-xs transition-all ${
                        checkout.paymentMethod === "khalti"
                          ? "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Wallet className="h-5 w-5" />
                      <span>Khalti</span>
                    </button>
                    <button
                      type="button"
                      className="absolute right-1 top-1 p-1 rounded-full hover:bg-black/10 transition-colors z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        checkout.showQRCodeDialog("khalti");
                      }}
                      title="View QR Code"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                    <span className="text-xs text-gray-400">Khalti</span>
                  </div>
                )}
              </div>

              {/* Row 2: Bank, Card, Credit */}
              <div className="grid grid-cols-3 gap-2">
                {/* Bank Transfer */}
                {checkout.paymentSettings.bank_transfer_enabled ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => checkout.setPaymentMethod("bank_transfer")}
                      className={`flex flex-col items-center justify-center gap-1 h-16 w-full rounded-lg border-2 font-medium text-xs transition-all ${
                        checkout.paymentMethod === "bank_transfer"
                          ? "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <CreditCard className="h-5 w-5" />
                      <span>Bank</span>
                    </button>
                    <button
                      type="button"
                      className="absolute right-1 top-1 p-1 rounded-full hover:bg-black/10 transition-colors z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        checkout.showQRCodeDialog("bank_transfer");
                      }}
                      title="View Bank Details"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                    <span className="text-xs text-gray-400">Bank</span>
                  </div>
                )}

                {/* Card */}
                <button
                  type="button"
                  onClick={() => checkout.setPaymentMethod("card")}
                  className={`flex flex-col items-center justify-center gap-1 h-16 rounded-lg border-2 font-medium text-xs transition-all ${
                    checkout.paymentMethod === "card"
                      ? "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Card</span>
                </button>

                {/* Credit */}
                <button
                  type="button"
                  onClick={() => checkout.setPaymentMethod("credit")}
                  className={`flex flex-col items-center justify-center gap-1 h-16 rounded-lg border-2 font-medium text-xs transition-all ${
                    checkout.paymentMethod === "credit"
                      ? "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Wallet className="h-5 w-5" />
                  <span>Credit</span>
                </button>
              </div>
            </div>

            {/* Cash Amount Input */}
            {checkout.paymentMethod === "cash" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Cash Received <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                    Rs.
                  </span>
                  <Input
                    type="number"
                    value={checkout.cashAmount}
                    onChange={(e) => checkout.setCashAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-9 h-12 text-lg text-right font-semibold"
                    min={checkout.total}
                    step="10"
                    autoFocus
                  />
                </div>
                {checkout.cashGiven >= checkout.total && checkout.changeAmount > 0 && (
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-300">
                    <div className="text-sm font-semibold text-gray-700">Change to Return</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                      Rs. {checkout.changeAmount.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange('checkout', false)}
                className="flex-1 h-11"
                disabled={checkout.processing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  handleDialogChange('checkout', false);
                  checkout.completeSale();
                }}
                disabled={
                  checkout.processing ||
                  !checkout.openSession ||
                  (checkout.paymentMethod === "cash" && checkout.cashGiven < checkout.total) ||
                  (checkout.paymentMethod === "credit" && !checkout.selectedCustomer)
                }
                className="flex-1 h-11 bg-green-600 hover:bg-green-700"
              >
                {checkout.processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Receipt className="h-4 w-4 mr-2" />
                    Confirm Sale
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Payment Dialog */}
      <Dialog open={checkout.showQRDialog} onOpenChange={(open) => handleDialogChange('qr', open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {checkout.qrPaymentMethod} Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="text-center bg-emerald-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-emerald-600">
                Rs. {(checkout.subtotal - checkout.discountValue + checkout.taxAmount).toFixed(2)}
              </p>
            </div>

            {checkout.qrPaymentNumber === "Not configured" ? (
              <div className="text-center p-8 bg-amber-50 rounded-lg border-2 border-amber-200">
                <p className="text-amber-800 font-medium mb-2">Payment method not configured</p>
                <p className="text-sm text-amber-600">
                  Please configure {checkout.qrPaymentMethod} in POS Settings
                </p>
              </div>
            ) : (
              <>
                {checkout.qrImageUrl ? (
                  <div className="flex justify-center bg-white p-6 rounded-lg border-2 border-gray-200">
                    <img 
                      src={checkout.qrImageUrl} 
                      alt={`${checkout.qrPaymentMethod} QR Code`}
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex justify-center bg-white p-6 rounded-lg border-2 border-amber-200">
                    <div className="text-center">
                      <p className="text-amber-700 font-medium mb-2">No QR Code Uploaded</p>
                      <p className="text-sm text-amber-600">
                        Upload a QR code in POS Settings for easier payments
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {checkout.qrPaymentMethod === "Bank Transfer" ? "Bank Details" : "Merchant Information"}
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    {checkout.qrPaymentMethod === "Bank Transfer" ? (
                      <div className="space-y-1 text-sm">
                        {checkout.qrPaymentNumber.split('|').map((info, idx) => {
                          const labels = ['Bank Name:', 'Account Number:', 'Account Name:'];
                          return info ? (
                            <p key={idx} className="text-gray-900">
                              <span className="font-semibold">{labels[idx]}</span> {info}
                            </p>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-lg font-mono text-gray-900">
                        {checkout.qrPaymentNumber}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {checkout.qrPaymentMethod === "Bank Transfer" 
                      ? "Use these details for bank transfer"
                      : checkout.qrImageUrl 
                        ? "Scan QR code with payment app" 
                        : "Enter merchant ID in payment app"}
                  </p>
                </div>
              </>
            )}

            <Button
              onClick={() => handleDialogChange('qr', false)}
              className="w-full bg-[#22C55E] hover:bg-[#22C55E]/90"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thank You Success Dialog */}
      <Dialog open={checkout.showThankYouDialog} onOpenChange={(open) => handleDialogChange('thankYou', open)}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center space-y-6 py-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
              <p className="text-gray-600">Your transaction was completed successfully</p>
              {checkout.completedTransaction && (
                <div className="bg-gray-50 rounded-lg p-3 mt-3">
                  <p className="text-sm text-gray-600">Receipt Number</p>
                  <p className="text-lg font-bold text-gray-900">#{checkout.completedTransaction.transaction_number}</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    Rs. {Number(checkout.completedTransaction.total).toFixed(2)}
                  </p>
                  {checkout.completedTransaction.change_given > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-sm text-gray-600">Change Given</p>
                      <p className="text-lg font-bold text-green-600">
                        Rs. {Number(checkout.completedTransaction.change_given).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  handleDialogChange('receipt', true);
                }}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                <Printer className="h-5 w-5 mr-2" />
                Print Receipt
              </Button>

              <Button
                onClick={() => {
                  if (checkout.completedTransaction) {
                    checkout.router.push(`/dashboard/pos/transactions/${checkout.completedTransaction.id}`);
                  }
                  handleDialogChange('thankYou', false);
                }}
                variant="outline"
                className="w-full h-12 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 font-semibold"
              >
                <Eye className="h-5 w-5 mr-2" />
                View Transaction
              </Button>

              <Button
                onClick={() => {
                  if (checkout.completedTransaction) {
                    checkout.router.push(`/dashboard/pos/transactions/${checkout.completedTransaction.id}`);
                  }
                  handleDialogChange('thankYou', false);
                }}
                variant="outline"
                className="w-full h-12 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 font-semibold"
              >
                <FileText className="h-5 w-5 mr-2" />
                View Invoice
              </Button>

              <Button
                onClick={() => {
                  handleDialogChange('thankYou', false);
                  checkout.resetForm();
                }}
                variant="ghost"
                className="w-full h-12 text-gray-600 hover:text-gray-900 font-semibold"
              >
                New Sale
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Apply Coupon Dialog */}
      <Dialog open={checkout.showCouponDialog} onOpenChange={(open) => handleDialogChange('coupon', open)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Apply Coupon</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Enter a coupon code or select from available offers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900">Enter Coupon Code</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={checkout.couponCode}
                  onChange={(e) => checkout.setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter code (e.g., SAVE10)"
                  className="flex-1 h-12 text-base font-mono uppercase"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      checkout.applyCouponCode();
                    }
                  }}
                />
                <Button
                  onClick={checkout.applyCouponCode}
                  className="h-12 px-6 bg-green-600 hover:bg-green-700"
                >
                  Apply
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">OR CHOOSE FROM AVAILABLE COUPONS</span>
              </div>
            </div>

            <div className="space-y-3">
              {checkout.loadingDiscounts ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                  Loading coupons...
                </div>
              ) : checkout.availableDiscounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Tags className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="font-medium">No active coupons available</p>
                  <p className="text-sm">Check back later for offers</p>
                </div>
              ) : (
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {checkout.availableDiscounts.map((discount) => {
                    const isExpired = discount.valid_until && new Date(discount.valid_until) < new Date();
                    const isNotYetValid = discount.valid_from && new Date(discount.valid_from) > new Date();
                    const isBelowMinimum = discount.min_order_amount && checkout.subtotal < discount.min_order_amount;
                    const isDisabled = isExpired || isNotYetValid || isBelowMinimum;

                    return (
                      <button
                        key={discount.id}
                        onClick={() => !isDisabled && handleSelectDiscount(discount)}
                        disabled={isDisabled}
                        className={`text-left p-4 rounded-lg border-2 transition-all ${
                          isDisabled
                            ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                            : 'border-green-200 bg-green-50 hover:border-green-400 hover:shadow-md cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Tags className={`h-4 w-4 ${isDisabled ? 'text-gray-400' : 'text-green-600'}`} />
                              <span className="font-bold text-base text-gray-900">{discount.name}</span>
                            </div>
                            
                            {discount.description && (
                              <p className="text-sm text-gray-600 mb-2">{discount.description}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <Badge variant="outline" className="bg-white">
                                Code: <span className="font-mono font-bold ml-1">{discount.code}</span>
                              </Badge>
                              
                              {discount.min_order_amount && (
                                <Badge variant="outline" className={isBelowMinimum ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white'}>
                                  Min: Rs. {discount.min_order_amount}
                                </Badge>
                              )}
                              
                              {discount.valid_until && (
                                <Badge variant="outline" className={isExpired ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white'}>
                                  {isExpired ? 'Expired' : `Valid until ${new Date(discount.valid_until).toLocaleDateString()}`}
                                </Badge>
                              )}
                            </div>

                            {isDisabled && (
                              <div className="mt-2 text-xs text-red-600 font-medium">
                                {isExpired && '⚠️ This coupon has expired'}
                                {isNotYetValid && '⚠️ This coupon is not yet valid'}
                                {isBelowMinimum && `⚠️ Minimum order of Rs. ${discount.min_order_amount} required (Current: Rs. ${checkout.subtotal.toFixed(2)})`}
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <div className={`text-2xl font-bold ${isDisabled ? 'text-gray-400' : 'text-green-600'}`}>
                              {discount.discount_type === 'percentage' 
                                ? `${discount.discount_value}%` 
                                : `Rs. ${discount.discount_value}`}
                            </div>
                            <div className="text-xs text-gray-500">OFF</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {checkout.availableDiscounts.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Current Order</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">Rs. {checkout.subtotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogChange('coupon', false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Add Customer Dialog */}
      <Dialog open={checkout.showCustomerDialog} onOpenChange={(open) => {
        handleDialogChange('customer', open);
        if (!open && checkout.cameFromCheckout) {
          handleDialogChange('checkout', true);
          handleDialogChange('cameFromCheckout', false);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="customer-name"
                type="text"
                value={checkout.newCustomerName}
                onChange={(e) => handleCustomerFieldChange('name', e.target.value)}
                placeholder="Customer name"
                className="h-9"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && checkout.newCustomerName.trim() && checkout.newCustomerPhone.trim()) {
                    checkout.quickAddCustomer();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="customer-phone" className="block text-sm font-medium text-gray-700">
                Phone <span className="text-red-500">*</span>
              </label>
              <Input
                id="customer-phone"
                type="text"
                value={checkout.newCustomerPhone}
                onChange={(e) => handleCustomerFieldChange('phone', e.target.value)}
                placeholder="Phone number"
                className="h-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && checkout.newCustomerName.trim() && checkout.newCustomerPhone.trim()) {
                    checkout.quickAddCustomer();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="customer-email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="customer-email"
                type="email"
                value={checkout.newCustomerEmail}
                onChange={(e) => handleCustomerFieldChange('email', e.target.value)}
                placeholder="email@example.com"
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="customer-address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <Input
                id="customer-address"
                type="text"
                value={checkout.newCustomerAddress}
                onChange={(e) => handleCustomerFieldChange('address', e.target.value)}
                placeholder="Customer address"
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="customer-type" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <Select
                value={checkout.newCustomerType}
                onValueChange={(v) => handleCustomerFieldChange('type', v)}
              >
                <SelectTrigger id="customer-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => handleDialogChange('customer', false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={checkout.quickAddCustomer}
                disabled={!checkout.newCustomerName.trim() || !checkout.newCustomerPhone.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice View Dialog */}
      <Dialog open={checkout.showReceipt} onOpenChange={(open) => handleDialogChange('receipt', open)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Invoice: {checkout.completedTransaction?.transaction_number}</span>
              <div className="flex gap-2">
                <Button
                  onClick={handlePrintInvoice}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {checkout.completedTransaction && (
            <div className="mt-4">
              <POSInvoice
                ref={checkout.invoiceRef}
                transaction={checkout.completedTransaction}
                businessName={checkout.user?.tenant?.name || "Your Business"}
                businessAddress={checkout.user?.tenant?.address || ""}
                businessPhone={checkout.user?.tenant?.phone || ""}
                businessEmail={checkout.user?.tenant?.email || ""}
                businessPAN={checkout.user?.tenant?.pan || ""}
              />
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button
              onClick={() => {
                handleDialogChange('receipt', false);
                checkout.resetForm();
              }}
              variant="outline"
            >
              Close & New Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
