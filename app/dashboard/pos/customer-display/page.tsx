"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ShoppingBag, CheckCircle, Clock, ShoppingCart } from "lucide-react";

export default function CustomerDisplayPage() {
  const [state, setState] = useState<any>({
    status: 'idle',
    cart: [],
    subtotal: 0,
    itemLevelDiscount: 0,
    billLevelDiscount: 0,
    loyaltyDiscount: 0,
    totalDiscount: 0,
    taxAmount: 0,
    total: 0,
    paymentMethod: 'cash',
    amountPaid: 0,
    changeGiven: 0,
    businessName: 'Khata POS',
    logo: null,
    invoiceNumber: '',
  });

  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel("pos-customer-display");
    
    // Request initial state from cashier page if it is open
    channel.postMessage({ type: "request-state" });

    channel.onmessage = (event) => {
      const { type, data } = event.data;
      if (type === "update") {
        setState(data);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  // Format money helper
  const formatNPR = (amount: number) => {
    return `Rs. ${amount.toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const isIdle = state.status === 'idle';
  const isActive = state.status === 'active';
  const isSuccess = state.status === 'success';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-800 antialiased font-sans select-none">
      {/* Header bar */}
      <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          {state.logo ? (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Image
                src={state.logo}
                alt={state.businessName}
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-[#22C55E] text-white flex items-center justify-center font-bold text-xl">
              {state.businessName.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{state.businessName}</h1>
            <p className="text-xs text-slate-500 font-medium">Customer Information Display</p>
          </div>
        </div>
        
        <div className="text-right flex items-center gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-700">{currentDate}</p>
            <p className="text-2xl font-black text-[#22C55E] flex items-center gap-2 justify-end">
              <Clock className="h-5 w-5" />
              {currentTime}
            </p>
          </div>
        </div>
      </header>

      {/* Main body content */}
      <main className="flex-1 flex flex-col justify-center p-8">
        
        {/* WELCOME / IDLE SCREEN */}
        {isIdle && (
          <div className="flex flex-col items-center justify-center text-center space-y-8 py-12 max-w-4xl mx-auto">
            <div className="w-32 h-32 rounded-full bg-green-50 flex items-center justify-center text-[#22C55E] animate-bounce">
              <ShoppingBag className="w-16 h-16" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-5xl font-black tracking-tight text-slate-900">
                Welcome to {state.businessName}
              </h2>
              <p className="text-xl text-slate-500 font-medium max-w-lg mx-auto">
                We are ready to assist you. Please wait while the cashier opens your order.
              </p>
            </div>

            <div className="bg-white border border-slate-100 shadow-xl rounded-2xl p-6 w-full max-w-md flex items-center justify-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-ping" />
              <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">
                Waiting for next customer
              </span>
            </div>
          </div>
        )}

        {/* ACTIVE CHECKOUT SCREEN */}
        {isActive && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch h-full max-w-7xl w-full mx-auto">
            {/* Left side: Cart Items List */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-lg p-6 flex flex-col h-[70vh]">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-4 mb-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-[#22C55E]" />
                Scanned Items
              </h3>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {state.cart.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                    <div>
                      <h4 className="font-extrabold text-lg text-slate-800">{item.product_name}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{item.product_sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500 font-semibold">
                        {formatNPR(item.unit_price)} × {item.quantity} {item.unit_name || ''}
                      </p>
                      <p className="text-xl font-black text-slate-900 mt-0.5">
                        {formatNPR(item.line_total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: Summary Column */}
            <div className="bg-slate-900 text-white rounded-3xl shadow-2xl p-8 flex flex-col justify-between h-[70vh]">
              <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-4">
                  Order Summary
                </h3>

                <div className="space-y-3 text-base">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="font-semibold">{formatNPR(state.subtotal)}</span>
                  </div>
                  
                  {state.totalDiscount > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Total Discounts</span>
                      <span className="font-semibold">- {formatNPR(state.totalDiscount)}</span>
                    </div>
                  )}

                  {state.taxAmount > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Tax (VAT)</span>
                      <span className="font-semibold">{formatNPR(state.taxAmount)}</span>
                    </div>
                  )}

                  {state.loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-green-400 font-medium">
                      <span>Loyalty Reward</span>
                      <span>- {formatNPR(state.loyaltyDiscount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Grand Total panel */}
              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-800 flex justify-between items-center">
                  <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Total Amount</span>
                  <span className="text-3xl font-black text-[#22C55E]">{formatNPR(state.total)}</span>
                </div>

                {state.amountPaid > 0 && (
                  <div className="space-y-3 p-4 bg-slate-800 rounded-xl">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Amount Paid ({state.paymentMethod.toUpperCase()})</span>
                      <span className="font-semibold">{formatNPR(state.amountPaid)}</span>
                    </div>
                    {state.changeGiven > 0 && (
                      <div className="flex justify-between border-t border-slate-700 pt-2 text-base font-bold text-green-400">
                        <span>Change Due</span>
                        <span>{formatNPR(state.changeGiven)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT SUCCESS CONFIRMATION SCREEN */}
        {isSuccess && (
          <div className="flex flex-col items-center justify-center text-center space-y-8 py-12 max-w-2xl mx-auto bg-white border border-slate-100 shadow-2xl rounded-3xl p-12">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-[#22C55E] animate-pulse">
              <CheckCircle className="w-16 h-16" />
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tight text-slate-900">
                Payment Successful
              </h2>
              {state.invoiceNumber && (
                <p className="text-lg font-mono font-bold text-[#22C55E] bg-green-50 px-4 py-1.5 rounded-full inline-block">
                  Invoice #: {state.invoiceNumber}
                </p>
              )}
            </div>

            <div className="w-full border-t border-b border-slate-100 py-6 my-4 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Amount Paid</span>
              <span className="text-3xl font-black text-slate-800">{formatNPR(state.total)}</span>
            </div>

            <div className="space-y-2">
              <p className="text-2xl font-black text-[#22C55E]">Thank you for shopping with us!</p>
              <p className="text-sm text-slate-400">Have a wonderful day ahead.</p>
            </div>
          </div>
        )}

      </main>

      {/* Footer copyright */}
      <footer className="text-center py-4 bg-white border-t border-slate-100 text-xs text-slate-400 font-medium">
        Powered by {state.businessName} &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
