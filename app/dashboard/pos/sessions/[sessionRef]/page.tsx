"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, User, Warehouse, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PosPageShell, posCardClass } from "@/components/dashboard/PosPageShell";
import { PosStatusBadge } from "@/components/pos/PosStatusBadge";
import { NotFoundView } from "@/components/shared/NotFoundView";
import posApi, { POSSession } from "@/lib/api/pos";
import { isValidPosSessionRef } from "@/lib/pos/session-ref";
import { formatNPR } from "@/lib/utils";
import { toast } from "sonner";

function useSessionRef(): string | undefined {
  const params = useParams();
  const raw = params.sessionRef;
  const fromParams = Array.isArray(raw) ? raw[0] : raw;
  return isValidPosSessionRef(fromParams) ? fromParams : undefined;
}

export default function PosSessionDetailPage() {
  const sessionRef = useSessionRef();
  const [session, setSession] = useState<POSSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!sessionRef) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const fetchSession = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const data = await posApi.getSession(sessionRef);
        setSession(data);
      } catch (error: unknown) {
        console.error("Failed to fetch session:", error);
        const err = error as { response?: { status?: number; data?: { detail?: string } } };
        if (err.response?.status === 404) {
          setNotFound(true);
          setSession(null);
        } else {
          toast.error(err.response?.data?.detail || "Failed to load session details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionRef]);

  if (loading) {
    return (
      <PosPageShell title="Session Details" subtitle="Loading..." variant="fullscreen" loading />
    );
  }

  if (notFound || !session) {
    return (
      <PosPageShell title="POS Sessions" variant="fullscreen">
        <NotFoundView
          variant="embedded"
          title="Session not found"
          description="This session does not exist or the link is invalid."
          primaryHref="/dashboard/pos/sessions"
          primaryLabel="Back to Sessions"
        />
      </PosPageShell>
    );
  }

  const digitalSales = session.card_sales + session.upi_sales;
  const closeHref = `/dashboard/pos/sessions/${sessionRef}/close`;

  return (
    <PosPageShell
      title={`Session ${session.session_number}`}
      subtitle={`Opened by ${session.cashier_name}`}
      variant="fullscreen"
    >
      <div className="w-full min-h-full space-y-6">
        <div className="flex flex-wrap items-center gap-2 sticky top-0 z-10 bg-[#F3F4F6] dark:bg-background py-2 -mx-1 px-1">
          <Link href="/dashboard/pos/sessions">
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          </Link>
          <PosStatusBadge status={session.status} />
          <div className="flex-1" />
          {session.status === "open" && (
            <Link href={closeHref}>
              <Button size="sm" className="bg-[#22C55E] hover:bg-[#16A34A] text-white h-8">
                Close Session
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Sales", value: formatNPR(session.total_sales), accent: "text-[#22C55E]" },
            { label: "Transactions", value: String(session.total_transactions), accent: "text-gray-900 dark:text-foreground" },
            { label: "Cash Sales", value: formatNPR(session.cash_sales), accent: "text-gray-900 dark:text-foreground" },
            { label: "Digital Sales", value: formatNPR(digitalSales), accent: "text-gray-900 dark:text-foreground" },
          ].map((stat) => (
            <div key={stat.label} className={`${posCardClass} p-4`}>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">{stat.label}</p>
              <p className={`text-xl font-bold mt-1 ${stat.accent}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${posCardClass} p-6`}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-4">
              Session Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Session #
                </span>
                <span className="font-medium text-gray-900 dark:text-foreground">
                  {session.session_number}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Cashier
                </span>
                <span className="font-medium text-gray-900 dark:text-foreground">
                  {session.cashier_name}
                </span>
              </div>
              {session.warehouse_name && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-muted-foreground flex items-center gap-1.5">
                    <Warehouse className="h-3.5 w-3.5" />
                    Warehouse
                  </span>
                  <span className="font-medium text-gray-900 dark:text-foreground">
                    {session.warehouse_name}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-4 items-center">
                <span className="text-gray-500 dark:text-muted-foreground">Status</span>
                <PosStatusBadge status={session.status} />
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-muted-foreground">Opened At</span>
                <span className="font-medium text-gray-900 dark:text-foreground">
                  {new Date(session.opened_at).toLocaleString("en-GB")}
                </span>
              </div>
              {session.closed_at && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-muted-foreground">Closed At</span>
                  <span className="font-medium text-gray-900 dark:text-foreground">
                    {new Date(session.closed_at).toLocaleString("en-GB")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={`${posCardClass} p-6`}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-4 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-[#22C55E]" />
              Cash Reconciliation
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-muted-foreground">Opening Cash</span>
                <span className="font-medium">{formatNPR(session.opening_cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-muted-foreground">Cash Sales</span>
                <span className="font-medium text-green-600">{formatNPR(session.cash_sales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-muted-foreground">Card Sales</span>
                <span className="font-medium">{formatNPR(session.card_sales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-muted-foreground">UPI Sales</span>
                <span className="font-medium">{formatNPR(session.upi_sales)}</span>
              </div>
              {session.closing_cash != null && (
                <>
                  <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-border">
                    <span className="font-medium text-gray-900 dark:text-foreground">Expected Cash</span>
                    <span className="font-medium">{formatNPR(session.expected_cash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-foreground">Closing Cash</span>
                    <span className="font-bold">{formatNPR(session.closing_cash)}</span>
                  </div>
                  {session.cash_variance !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-muted-foreground">Variance</span>
                      <span
                        className={`font-medium ${
                          session.cash_variance > 0 ? "text-blue-600" : "text-red-600"
                        }`}
                      >
                        {session.cash_variance > 0 ? "+" : ""}
                        {formatNPR(session.cash_variance)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className={`${posCardClass} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">
              Transactions ({session.total_transactions})
            </h3>
            <Link
              href="/dashboard/pos/transactions"
              className="text-xs text-[#22C55E] hover:underline"
            >
              View all transactions
            </Link>
          </div>
          <p className="text-sm text-gray-500 dark:text-muted-foreground">
            Open the transactions list to review sales recorded during this session.
          </p>
        </div>
      </div>
    </PosPageShell>
  );
}
