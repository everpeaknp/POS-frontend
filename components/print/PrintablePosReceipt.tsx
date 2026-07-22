"use client";

import React from "react";
import type { CompanyPrintInfo } from "@/lib/print/company-info";
import type { POSTransaction, POSPayment } from "@/lib/api/pos";
import { formatCurrency } from "@/lib/utils";

interface PrintablePosReceiptProps {
  transaction: POSTransaction;
  companyInfo: CompanyPrintInfo;
  taxLabel?: string;
  taxRate?: number;
  footerText?: string;
}

/**
 * Thermal-receipt optimised POS receipt (80 mm width).
 * Uses `React.forwardRef` so it works with `useReactToPrint`.
 */
export const PrintablePosReceipt = React.forwardRef<
  HTMLDivElement,
  PrintablePosReceiptProps
>(({ transaction, companyInfo, taxLabel = "VAT", taxRate, footerText }, ref) => {
  const panLabel = companyInfo.vatRegistered ? "PAN/VAT" : "PAN";
  const payments: POSPayment[] = transaction.payments ?? [];
  const isSplit = payments.length > 1;
  const customerLabel =
    transaction.customer_display ||
    transaction.customer_name ||
    "Walk-in Customer";

  const taxRateLabel =
    taxRate != null ? `${taxLabel} ${taxRate}%` : taxLabel;

  return (
    <div
      ref={ref}
      style={{
        width: "80mm",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "12px",
        lineHeight: "1.4",
        color: "#000",
        background: "#fff",
        padding: "4mm",
      }}
    >
      {/* ---- Company Header ---- */}
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <div style={{ fontSize: "16px", fontWeight: "bold" }}>
          {companyInfo.name}
        </div>
        {companyInfo.address && (
          <div style={{ fontSize: "10px" }}>{companyInfo.address}</div>
        )}
        {companyInfo.phone && (
          <div style={{ fontSize: "10px" }}>Tel: {companyInfo.phone}</div>
        )}
        {companyInfo.pan && (
          <div style={{ fontSize: "10px" }}>
            {panLabel}: {companyInfo.pan}
          </div>
        )}
      </div>

      {/* dashed separator */}
      <div
        style={{
          borderTop: "1px dashed #000",
          margin: "4px 0",
        }}
      />

      {/* ---- Transaction Info ---- */}
      <div style={{ fontSize: "11px", marginBottom: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Receipt #</span>
          <span style={{ fontWeight: "bold" }}>
            {transaction.transaction_number}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Date</span>
          <span>
            {transaction.date
              ? new Date(transaction.date).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Cashier</span>
          <span>{transaction.cashier_name || "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Customer</span>
          <span>{customerLabel}</span>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

      {/* ---- Items ---- */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "11px",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid #000" }}>
            <th style={{ textAlign: "left", padding: "2px 0" }}>Item</th>
            <th style={{ textAlign: "right", padding: "2px 0", width: "30px" }}>
              Qty
            </th>
            <th style={{ textAlign: "right", padding: "2px 0", width: "50px" }}>
              Price
            </th>
            <th style={{ textAlign: "right", padding: "2px 0", width: "55px" }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {transaction.lines.map((line, idx) => (
            <tr key={idx} style={{ borderBottom: "1px dotted #ccc" }}>
              <td style={{ padding: "2px 0", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {line.product_name}
              </td>
              <td style={{ textAlign: "right", padding: "2px 0" }}>
                {line.quantity}
              </td>
              <td style={{ textAlign: "right", padding: "2px 0" }}>
                {Number(line.unit_price).toFixed(2)}
              </td>
              <td style={{ textAlign: "right", padding: "2px 0" }}>
                {Number(line.line_total || 0).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

      {/* ---- Totals ---- */}
      <div style={{ fontSize: "11px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal</span>
          <span>{formatCurrency(transaction.subtotal)}</span>
        </div>
        {transaction.discount_amount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Discount</span>
            <span>-{formatCurrency(transaction.discount_amount)}</span>
          </div>
        )}
        {transaction.tax_amount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{taxRateLabel}</span>
            <span>{formatCurrency(transaction.tax_amount)}</span>
          </div>
        )}
      </div>

      <div
        style={{
          borderTop: "2px solid #000",
          margin: "4px 0",
          paddingTop: "4px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        <span>TOTAL</span>
        <span>{formatCurrency(transaction.total)}</span>
      </div>

      {/* ---- Payment ---- */}
      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

      {isSplit ? (
        <div style={{ fontSize: "11px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
            Payments:
          </div>
          {payments.map((p, i) => (
            <div
              key={i}
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <span style={{ textTransform: "capitalize" }}>
                {p.payment_method}
                {p.reference ? ` (${p.reference})` : ""}
              </span>
              <span>{formatCurrency(p.amount)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: "11px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>
              Paid ({transaction.payment_method?.toUpperCase()})
            </span>
            <span>{formatCurrency(transaction.amount_paid)}</span>
          </div>
        </div>
      )}

      {(transaction.change_given ?? 0) > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            fontWeight: "bold",
          }}
        >
          <span>Change</span>
          <span>{formatCurrency(transaction.change_given!)}</span>
        </div>
      )}

      {/* ---- Footer ---- */}
      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      <div style={{ textAlign: "center", fontSize: "10px" }}>
        <div>{footerText || "Thank you for your purchase!"}</div>
        <div style={{ marginTop: "4px", color: "#666" }}>
          Printed: {new Date().toLocaleString("en-GB")}
        </div>
        {transaction.status === "cancelled" && (
          <div
            style={{
              marginTop: "4px",
              fontWeight: "bold",
              fontSize: "14px",
              color: "#c00",
            }}
          >
            *** CANCELLED ***
          </div>
        )}
      </div>
    </div>
  );
});

PrintablePosReceipt.displayName = "PrintablePosReceipt";
