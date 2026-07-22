"use client";

import React from "react";
import type { CompanyPrintInfo } from "@/lib/print/company-info";
import type { POSRefund } from "@/lib/api/pos";
import { formatCurrency } from "@/lib/utils";

interface PrintableRefundReceiptProps {
  refund: POSRefund;
  companyInfo: CompanyPrintInfo;
  footerText?: string;
}

export const PrintableRefundReceipt = React.forwardRef<
  HTMLDivElement,
  PrintableRefundReceiptProps
>(({ refund, companyInfo, footerText }, ref) => {
  const panLabel = companyInfo.vatRegistered ? "PAN/VAT" : "PAN";

  // Calculate total refund amount
  const totalRefundAmount = refund.lines.reduce(
    (sum, line) => sum + Number(line.refund_amount),
    0
  );

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
        <div
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            marginTop: "6px",
            color: "#000",
            border: "1px solid #000",
            padding: "2px",
            display: "inline-block",
          }}
        >
          REFUND RECEIPT
        </div>
      </div>

      {/* dashed separator */}
      <div
        style={{
          borderTop: "1px dashed #000",
          margin: "4px 0",
        }}
      />

      {/* ---- Refund Transaction Info ---- */}
      <div style={{ fontSize: "11px", marginBottom: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Refund ID</span>
          <span style={{ fontWeight: "bold" }}>#{refund.id}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Orig Invoice</span>
          <span style={{ fontWeight: "bold" }}>
            {refund.original_transaction_number}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Refund Date</span>
          <span>
            {refund.refunded_at
              ? new Date(refund.refunded_at).toLocaleString("en-GB", {
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
          <span>Refunded By</span>
          <span>{refund.refunded_by_name || "—"}</span>
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
            <th style={{ textAlign: "right", padding: "2px 0", width: "55px" }}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {refund.lines.map((line, idx) => (
            <tr key={idx} style={{ borderBottom: "1px dotted #ccc" }}>
              <td
                style={{
                  padding: "2px 0",
                  maxWidth: "150px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {line.product_name}
              </td>
              <td style={{ textAlign: "right", padding: "2px 0" }}>
                {line.quantity}
              </td>
              <td style={{ textAlign: "right", padding: "2px 0" }}>
                {Number(line.refund_amount).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

      {/* ---- Totals ---- */}
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
        <span>TOTAL REFUND</span>
        <span>{formatCurrency(totalRefundAmount)}</span>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

      <div style={{ fontSize: "11px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Refund Method</span>
          <span style={{ textTransform: "capitalize", fontWeight: "bold" }}>
            {refund.refund_method}
          </span>
        </div>
        {refund.reason && (
          <div style={{ marginTop: "4px" }}>
            <span style={{ color: "#666" }}>Reason:</span>{" "}
            <span>{refund.reason}</span>
          </div>
        )}
      </div>

      {/* ---- Footer ---- */}
      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      <div style={{ textAlign: "center", fontSize: "10px" }}>
        <div>{footerText || "Refund processed successfully."}</div>
        <div style={{ marginTop: "4px", color: "#666" }}>
          Printed: {new Date().toLocaleString("en-GB")}
        </div>
      </div>
    </div>
  );
});

PrintableRefundReceipt.displayName = "PrintableRefundReceipt";
