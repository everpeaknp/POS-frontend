"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashHeader } from "@/components/dashboard/dash-header";
import { NotFoundView } from "@/components/shared/NotFoundView";
import posApi, { POSSession } from "@/lib/api/pos";
import { isValidPosSessionRef } from "@/lib/pos/session-ref";
import { toast } from "sonner";

function useSessionRef(): string | undefined {
  const params = useParams();
  const raw = params.sessionRef;
  const fromParams = Array.isArray(raw) ? raw[0] : raw;
  return isValidPosSessionRef(fromParams) ? fromParams : undefined;
}

export default function CloseSessionPage() {
  const router = useRouter();
  const sessionRef = useSessionRef();
  const [session, setSession] = useState<POSSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [closingCash, setClosingCash] = useState("");
  const [notes, setNotes] = useState("");

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

        if (data.status === "closed") {
          toast.error("This session is already closed");
          router.push(`/dashboard/pos/sessions/${data.id}`);
          return;
        }

        setSession(data);
      } catch (error: unknown) {
        console.error("Failed to fetch session:", error);
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          toast.error("Failed to load session details");
          router.push("/dashboard/pos/sessions");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionRef, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Loading..." />
        <div className="flex-1 p-6">
          <p className="text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="POS Sessions" />
        <NotFoundView
          variant="embedded"
          title="Session not found"
          description="This session does not exist or the link is invalid."
          primaryHref="/dashboard/pos/sessions"
          primaryLabel="Back to Sessions"
        />
      </div>
    );
  }

  const expectedCash = session.expected_cash;
  const variance = closingCash ? parseFloat(closingCash) - expectedCash : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!closingCash || parseFloat(closingCash) < 0) {
      toast.error("Please enter a valid closing cash amount");
      return;
    }

    try {
      setSubmitting(true);
      await posApi.closeSession(String(session.id), parseFloat(closingCash), notes.trim() || undefined);

      toast.success("Session closed successfully");
      router.push(`/dashboard/pos/sessions/${session.id}`);
    } catch (error: unknown) {
      console.error("Failed to close session:", error);
      toast.error("Failed to close session");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`Close Session ${session.session_number}`} subtitle="Complete the session and reconcile cash" />
      <div className="flex-1 p-6 space-y-6">
        <Link href={`/dashboard/pos/sessions/${session.id}`} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to Session
        </Link>

        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Session Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Opening Cash</span>
                  <span className="text-sm font-medium text-gray-900">
                    Rs. {session.opening_cash.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cash Sales</span>
                  <span className="text-sm font-medium text-gray-900">
                    Rs. {session.cash_sales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Sales</span>
                  <span className="text-sm font-medium text-green-600">
                    Rs. {session.total_sales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-900">Expected Closing Cash</span>
                  <span className="text-sm font-bold text-gray-900">
                    Rs. {expectedCash.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div>
                <Label htmlFor="closingCash" className="text-sm font-medium text-gray-700">
                  Actual Closing Cash (Rs.) *
                </Label>
                <Input
                  id="closingCash"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter actual closing cash"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  className="mt-2 h-9 border-gray-200"
                  required
                  disabled={submitting}
                />
                {closingCash && (
                  <div className={`mt-3 p-3 rounded-lg ${variance === 0 ? "bg-green-50 text-green-700" : variance > 0 ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
                    <p className="text-sm font-medium">
                      {variance === 0
                        ? "✓ Cash matches perfectly"
                        : variance > 0
                        ? `+ Rs. ${variance.toLocaleString()} (Overage)`
                        : `- Rs. ${Math.abs(variance).toLocaleString()} (Shortage)`}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this session closure..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 border-gray-200 min-h-[80px]"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
                disabled={submitting}
              >
                {submitting ? "Closing..." : "Close Session"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
