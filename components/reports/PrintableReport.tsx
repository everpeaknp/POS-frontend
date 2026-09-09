"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { format } from "date-fns";

interface PrintableReportProps {
  reportTitle: string;
  children: React.ReactNode;
}

/**
 * Wrapper component for printable reports
 * Shows the printable version on print, hidden on screen
 */
export function PrintableReport({ reportTitle, children }: PrintableReportProps) {
  const { user } = useAuth();
  
  const companyName = user?.tenant?.workspace_name || user?.tenant?.name || "Business Report";
  const printDateTime = format(new Date(), "PPpp");

  return (
    <>
      <style>{`
        @media print {
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body, html {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: white;
          }

          /* Hide EVERYTHING on print */
          body > * {
            display: none;
          }

          /* Show ONLY the print-report */
          #print-report {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0.5in;
            background: white;
            border: none;
            z-index: 10000;
          }

          /* Ensure content is visible */
          #print-report,
          #print-report * {
            display: block;
            visibility: visible;
            opacity: 1;
            color: black;
            background: inherit;
            page-break-inside: avoid;
          }

          /* Header */
          .print-header {
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #000;
            display: block;
          }

          .print-header-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }

          .print-header-company {
            font-size: 18px;
            font-weight: bold;
            color: #000;
          }

          .print-header-date {
            font-size: 12px;
            color: #333;
          }

          .print-header-title {
            font-size: 16px;
            font-weight: 600;
            text-align: center;
            color: #000;
            display: block;
          }

          /* Content */
          .print-content {
            margin-top: 16px;
            display: block;
          }

          .print-content h3 {
            font-size: 14px;
            font-weight: 600;
            margin: 16px 0 12px 0;
            color: #000;
            display: block;
          }

          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            page-break-inside: avoid;
            display: table;
          }

          thead {
            display: table-header-group;
          }

          tbody {
            display: table-row-group;
          }

          tr {
            display: table-row;
            page-break-inside: avoid;
          }

          th, td {
            display: table-cell;
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
            color: #000;
            background: white;
          }

          th {
            font-weight: 600;
            background-color: #f3f4f6;
          }

          tbody tr:nth-child(even) {
            background-color: #f9fafb;
          }

          @page {
            margin: 0.5in;
            size: A4;
          }
        }

        @media screen {
          #print-report {
            display: none;
          }
        }
      `}</style>

      <div id="print-report">
        <div className="print-header">
          <div className="print-header-info">
            <div className="print-header-company">{companyName}</div>
            <div className="print-header-date">{printDateTime}</div>
          </div>
          <div className="print-header-title">{reportTitle}</div>
        </div>

        <div className="print-content">
          {children}
        </div>
      </div>
    </>
  );
}
