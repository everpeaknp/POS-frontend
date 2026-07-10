"use client";

import React from "react";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { PrintCompanyHeader } from "@/components/print/PrintCompanyHeader";
import type { CompanyPrintInfo } from "@/lib/print/company-info";
import type { Equipment } from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";

interface PrintableEquipmentProps {
  equipment: Equipment;
  companyInfo: CompanyPrintInfo;
}

function formatStatusLabel(status: string) {
  return status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const PrintableEquipment = React.forwardRef<HTMLDivElement, PrintableEquipmentProps>(
  ({ equipment, companyInfo }, ref) => {
    const documentDate = equipment.purchase_date ? (
      <FormattedDate value={equipment.purchase_date} />
    ) : (
      <FormattedDate value={equipment.created_at} />
    );

    return (
      <div ref={ref} className="p-8 bg-white text-gray-900" style={{ width: "210mm", minHeight: "297mm" }}>
        <PrintCompanyHeader
          company={companyInfo}
          documentTitle="EQUIPMENT RECORD"
          documentNumber={equipment.name}
          documentDate={documentDate}
          secondaryDate={
            equipment.registration_number
              ? { label: "Registration", value: equipment.registration_number }
              : undefined
          }
        />

        <div className="mb-8 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p>
              <span className="text-gray-500">Type:</span> {equipment.equipment_type}
            </p>
            <p>
              <span className="text-gray-500">Ownership:</span>{" "}
              {equipment.ownership_type.charAt(0).toUpperCase() + equipment.ownership_type.slice(1)}
            </p>
            <p>
              <span className="text-gray-500">Status:</span> {formatStatusLabel(equipment.status)}
            </p>
          </div>
          <div>
            <p>
              <span className="text-gray-500">Assigned Site:</span>{" "}
              {equipment.assigned_site_name || "Unassigned"}
            </p>
            {equipment.purchase_date && (
              <p>
                <span className="text-gray-500">Purchase Date:</span>{" "}
                <FormattedDate value={equipment.purchase_date} />
              </p>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Equipment Details
          </h3>
          <table className="w-full text-sm border border-gray-200">
            <tbody>
              {[
                ["Equipment Name", equipment.name],
                ["Type", equipment.equipment_type],
                ["Ownership", equipment.ownership_type],
                ["Status", formatStatusLabel(equipment.status)],
                ["Registration Number", equipment.registration_number || "—"],
                [
                  "Purchase Date",
                  equipment.purchase_date ? (
                    <FormattedDate key="pd" value={equipment.purchase_date} />
                  ) : (
                    "—"
                  ),
                ],
                ["Assigned Site", equipment.assigned_site_name || "—"],
              ].map(([label, value]) => (
                <tr key={String(label)} className="border-b border-gray-100">
                  <td className="py-2.5 px-3 text-gray-500 font-medium w-2/5 bg-gray-50">{label}</td>
                  <td className="py-2.5 px-3 text-gray-900 capitalize">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Financial Information
          </h3>
          <div className="w-72 ml-auto space-y-2 text-sm border border-gray-200 rounded-lg p-4">
            {equipment.ownership_type === "owned" ? (
              <div className="flex justify-between">
                <span className="text-gray-600">Purchase Cost</span>
                <span className="font-semibold">
                  {equipment.purchase_cost ? formatNPR(equipment.purchase_cost) : "—"}
                </span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-gray-600">Rental Cost / Day</span>
                <span className="font-semibold">
                  {equipment.rental_cost_per_day ? formatNPR(equipment.rental_cost_per_day) : "—"}
                </span>
              </div>
            )}
          </div>
        </div>

        {equipment.notes && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Notes</h3>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-200 rounded-lg p-4">
              {equipment.notes}
            </p>
          </div>
        )}

        <div className="mb-8 text-sm text-gray-600 border-t border-gray-200 pt-4">
          <p>
            <span className="text-gray-500">Created:</span>{" "}
            <FormattedDate value={equipment.created_at} />
          </p>
          <p className="mt-1">
            <span className="text-gray-500">Last Updated:</span>{" "}
            <FormattedDate value={equipment.updated_at} />
          </p>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
          Generated from Khata Construction · Equipment #{equipment.id}
        </div>
      </div>
    );
  },
);

PrintableEquipment.displayName = "PrintableEquipment";
