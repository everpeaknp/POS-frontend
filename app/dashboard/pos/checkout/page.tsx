"use client";

import { POSProductGrid } from "@/components/pos/checkout/POSProductGrid";
import { POSCartPanel } from "@/components/pos/checkout/POSCartPanel";
import { POSCheckoutDialogs } from "@/components/pos/checkout/POSCheckoutDialogs";
import { POSCheckoutDialog } from "@/components/pos/checkout/POSCheckoutDialog";
import { POSQRPaymentDialog } from "@/components/pos/checkout/POSQRPaymentDialog";
import { POSThankYouDialog } from "@/components/pos/checkout/POSThankYouDialog";
import { POSCouponDialog } from "@/components/pos/checkout/POSCouponDialog";
import { POSCustomerDialog } from "@/components/pos/checkout/POSCustomerDialog";
import { POSInvoiceDialog } from "@/components/pos/checkout/POSInvoiceDialog";
import { POSHeader } from "@/components/pos/checkout/POSHeader";
import { POSSessionBanner } from "@/components/pos/checkout/POSSessionBanner";
import { usePOSCheckout } from "@/hooks/usePOSCheckout";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function POSCheckoutPage() {
  const checkout = usePOSCheckout();
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
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

  // Dialog handlers
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
    }
  };

  const handleCustomerFieldChange = (field: 'name' | 'phone' | 'email' | 'address' | 'type', value: string) => {
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
      <POSHeader
        sidebarWidth={sidebarWidth}
        hasOpenSession={!!checkout.openSession}
        hasCartItems={checkout.cart.length > 0}
        heldOrdersCount={checkout.heldOrders.length}
        onHoldOrder={checkout.handleHoldOrder}
        onShowHeldOrders={() => checkout.setShowHeldOrders(true)}
        onShowCashMovement={() => checkout.setShowCashMovement(true)}
      />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden" style={{ paddingRight: `${sidebarWidth}px` }}>
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* No Session Warning Banner */}
          {!checkout.openSession && (
            <POSSessionBanner
              onStartSession={() => checkout.router.push("/dashboard/pos/sessions/new")}
            />
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
            searchInputRef={checkout.searchInputRef as React.RefObject<HTMLInputElement>}
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

      {/* Dialogs - Barcode Scanner, Held Orders, Cash Movement, Split Payment */}
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
      <POSCheckoutDialog
        open={checkout.showCheckoutDialog}
        onOpenChange={(open) => handleDialogChange('checkout', open)}
        subtotal={checkout.subtotal}
        discountValue={checkout.discountValue}
        appliedCoupon={checkout.appliedCoupon}
        taxRate={checkout.taxRate}
        taxAmount={checkout.taxAmount}
        total={checkout.total}
        customers={checkout.customers}
        selectedCustomer={checkout.selectedCustomer}
        onCustomerChange={checkout.setSelectedCustomer}
        onAddCustomerClick={() => {
          checkout.setCameFromCheckout(true);
          checkout.setShowCheckoutDialog(false);
          checkout.setShowCustomerDialog(true);
        }}
        paymentMethod={checkout.paymentMethod}
        onPaymentMethodChange={checkout.setPaymentMethod}
        paymentSettings={checkout.paymentSettings}
        onShowQRCode={checkout.showQRCodeDialog}
        cashAmount={checkout.cashAmount}
        onCashAmountChange={checkout.setCashAmount}
        cashGiven={checkout.cashGiven}
        changeAmount={checkout.changeAmount}
        processing={checkout.processing}
        openSession={checkout.openSession}
        onConfirmSale={checkout.completeSale}
      />

      {/* QR Code Payment Dialog */}
      <POSQRPaymentDialog
        open={checkout.showQRDialog}
        onOpenChange={(open) => handleDialogChange('qr', open)}
        paymentMethod={checkout.qrPaymentMethod}
        paymentNumber={checkout.qrPaymentNumber}
        qrImageUrl={checkout.qrImageUrl}
        total={checkout.subtotal - checkout.discountValue + checkout.taxAmount}
      />

      {/* Thank You Success Dialog */}
      <POSThankYouDialog
        open={checkout.showThankYouDialog}
        onOpenChange={(open) => handleDialogChange('thankYou', open)}
        transaction={checkout.completedTransaction}
        onPrintReceipt={() => {
          handleDialogChange('receipt', true);
        }}
        onViewTransaction={() => {
          if (checkout.completedTransaction) {
            checkout.router.push(`/dashboard/pos/transactions/${checkout.completedTransaction.id}`);
          }
          handleDialogChange('thankYou', false);
        }}
        onViewInvoice={() => {
          if (checkout.completedTransaction) {
            checkout.router.push(`/dashboard/pos/transactions/${checkout.completedTransaction.id}`);
          }
          handleDialogChange('thankYou', false);
        }}
        onNewSale={() => {
          handleDialogChange('thankYou', false);
          checkout.resetForm();
        }}
      />

      {/* Apply Coupon Dialog */}
      <POSCouponDialog
        open={checkout.showCouponDialog}
        onOpenChange={(open) => handleDialogChange('coupon', open)}
        couponCode={checkout.couponCode}
        onCouponCodeChange={checkout.setCouponCode}
        onApplyCouponCode={checkout.applyCouponCode}
        availableDiscounts={checkout.availableDiscounts}
        loadingDiscounts={checkout.loadingDiscounts}
        subtotal={checkout.subtotal}
        onSelectDiscount={handleSelectDiscount}
      />

      {/* Quick Add Customer Dialog */}
      <POSCustomerDialog
        open={checkout.showCustomerDialog}
        onOpenChange={(open) => handleDialogChange('customer', open)}
        customerName={checkout.newCustomerName}
        customerPhone={checkout.newCustomerPhone}
        customerEmail={checkout.newCustomerEmail}
        customerAddress={checkout.newCustomerAddress}
        customerType={checkout.newCustomerType}
        onFieldChange={handleCustomerFieldChange}
        onAddCustomer={checkout.quickAddCustomer}
        cameFromCheckout={checkout.cameFromCheckout}
        onReturnToCheckout={() => {
          checkout.setShowCheckoutDialog(true);
          checkout.setCameFromCheckout(false);
        }}
      />

      {/* Invoice View Dialog */}
      <POSInvoiceDialog
        open={checkout.showReceipt}
        onOpenChange={(open) => handleDialogChange('receipt', open)}
        transaction={checkout.completedTransaction}
        user={checkout.user}
        invoiceRef={checkout.invoiceRef as React.RefObject<HTMLDivElement>}
        onPrint={handlePrintInvoice}
        onDownloadPDF={handleDownloadPDF}
        onCloseAndNewSale={() => {
          handleDialogChange('receipt', false);
          checkout.resetForm();
        }}
      />
    </div>
  );
}
