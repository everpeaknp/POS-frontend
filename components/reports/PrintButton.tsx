"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface PrintButtonProps {
  disabled?: boolean;
}

export function PrintButton({ disabled }: PrintButtonProps) {
  const handlePrint = () => {
    try {
      window.print();
      toast.success("Print dialog opened");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to open print dialog";
      toast.error(message);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={disabled}
      onClick={handlePrint}
    >
      <Printer className="h-4 w-4" /> Print
    </Button>
  );
}
