"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Building2, CheckCircle2, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KhataLogo } from "@/components/khata-logo";
import { KhataSpinner } from "@/components/shared/KhataSpinner";
import { invitationApi, type InvitationPreview } from "@/lib/api/tenant";
import { acceptInviteToken, inviteErrorMessage } from "@/lib/invitations/accept";
import { useAuth } from "@/lib/context/AuthContext";

const B = "#22C55E";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, switchOrganization } = useAuth();
  const token = String(params.token || "");

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoAcceptAttempted = useRef(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const data = await invitationApi.previewByToken(token);
        if (!cancelled) {
          setPreview(data);
          setError(null);
        }
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number; data?: { detail?: string } } })
          ?.response;
        if (!cancelled) {
          setError(status?.data?.detail || "Invitation not found or no longer valid.");
          setPreview(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const emailMatches =
    !!user?.email &&
    !!preview?.invited_email &&
    user.email.trim().toLowerCase() === preview.invited_email.trim().toLowerCase();

  const canAccept =
    !!user &&
    !!preview &&
    preview.status === "pending" &&
    !preview.is_expired &&
    emailMatches;

  const handleAccept = useCallback(async () => {
    if (!token || !canAccept) return;
    setAccepting(true);
    try {
      const result = await acceptInviteToken(token);
      toast.success(result.message || "Invitation accepted");
      if (result.tenant_slug) {
        try {
          await switchOrganization(result.tenant_slug, "/dashboard");
          return;
        } catch {
          // fall through
        }
      }
      router.push("/erp?tab=invitation");
    } catch (err: unknown) {
      toast.error(inviteErrorMessage(err));
    } finally {
      setAccepting(false);
    }
  }, [token, canAccept, switchOrganization, router]);

  useEffect(() => {
    if (loading || authLoading || !canAccept || autoAcceptAttempted.current) return;
    autoAcceptAttempted.current = true;
    void handleAccept();
  }, [loading, authLoading, canAccept, handleAccept]);

  const signupHref = `/auth/signup?invite=${encodeURIComponent(token)}${
    preview?.invited_email ? `&email=${encodeURIComponent(preview.invited_email)}` : ""
  }`;
  const loginHref = `/auth/login?invite=${encodeURIComponent(token)}${
    preview?.invited_email ? `&email=${encodeURIComponent(preview.invited_email)}` : ""
  }`;

  const showJoining = canAccept && (accepting || autoAcceptAttempted.current);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-background dark:to-background flex flex-col">
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2">
          <KhataLogo size="md" />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <Card className="w-full max-w-lg border-border shadow-lg">
          <CardContent className="p-6 sm:p-8">
            {loading || authLoading ? (
              <div className="py-16 flex justify-center">
                <KhataSpinner />
              </div>
            ) : error || !preview ? (
              <div className="text-center space-y-4 py-8">
                <Shield className="h-10 w-10 text-muted-foreground mx-auto" />
                <h1 className="text-xl font-semibold text-foreground">Invitation unavailable</h1>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Link href="/auth/login">
                  <Button variant="outline">Go to login</Button>
                </Link>
              </div>
            ) : showJoining ? (
              <div className="text-center space-y-4 py-12">
                <KhataSpinner />
                <h1 className="text-lg font-semibold text-foreground">
                  Joining {preview.tenant_name}...
                </h1>
                <p className="text-sm text-muted-foreground">
                  Setting up your workspace access.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#16A34A]">
                    Organization invite
                  </p>
                  <h1 className="text-2xl font-semibold text-foreground">
                    Join {preview.tenant_name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    <strong>{preview.invited_by_name}</strong> invited{" "}
                    <strong>{preview.invited_email}</strong> as{" "}
                    <span className="capitalize">{preview.role_display || preview.role}</span>.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="h-4 w-4 text-[#22C55E]" />
                    <span>{preview.tenant_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-[#22C55E]" />
                    <span>{preview.invited_email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                    <span className="capitalize">Role: {preview.role_display || preview.role}</span>
                  </div>
                  {preview.message ? (
                    <p className="text-sm text-muted-foreground border-t border-border pt-3 mt-1">
                      {preview.message}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    Expires {new Date(preview.expires_at).toLocaleDateString()}
                  </p>
                </div>

                {preview.status !== "pending" || preview.is_expired ? (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                    This invitation is {preview.is_expired ? "expired" : preview.status}. Ask an
                    admin to send a new one.
                  </div>
                ) : user ? (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                      You&apos;re signed in as <strong>{user.email}</strong>, but this invite is for{" "}
                      <strong>{preview.invited_email}</strong>. Sign in with the invited email to
                      continue.
                    </div>
                    <Link href={loginHref} className="block">
                      <Button variant="outline" className="w-full">
                        Switch account
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {preview.requires_signup
                        ? "Create a Khata account with this email — you'll join automatically after signup."
                        : "Sign in with the invited email — you'll join automatically after login."}
                    </p>
                    <Link href={signupHref} className="block">
                      <Button className="w-full text-white" style={{ backgroundColor: B }}>
                        Create account & join
                      </Button>
                    </Link>
                    <Link href={loginHref} className="block">
                      <Button variant="outline" className="w-full">
                        I already have an account
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
