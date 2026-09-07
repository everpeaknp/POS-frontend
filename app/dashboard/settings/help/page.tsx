"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  RefreshCw,
  ArrowRight,
  Zap,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SettingsCard,
  SettingsCardBody,
  SettingsCardHeader,
  SettingsField,
  SettingsPageContent,
} from "@/components/settings/settings-ui";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import { useOnboarding } from "@/lib/context/OnboardingContext";
import {
  helpdeskApi,
  type SupportTicket,
  type TicketCategory,
  type TicketPriority,
} from "@/lib/api/helpdesk";
import toast from "react-hot-toast";

const CATEGORY_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: "bug", label: "Bug report" },
  { value: "billing", label: "Billing" },
  { value: "feature_request", label: "Feature request" },
  { value: "account", label: "Account & access" },
  { value: "other", label: "Other" },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  resolved: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  closed: "bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground",
};

const FAQ_ITEMS = [
  {
    q: "How do I invite a teammate to my workspace?",
    a: "Go to Settings → Users & Roles and click Invite. They'll receive an email invitation to join with the role you assign.",
  },
  {
    q: "Can I change which modules are enabled for my workspace?",
    a: "Yes — go to Settings → Modules. Core modules and the module matching your workplace type (e.g. Construction, Hardware) are always on; everything else can be toggled freely.",
  },
  {
    q: "How do I switch between light and dark mode, or customize colors?",
    a: "Open Settings → Appearance to switch theme, pick an accent color, and adjust density, animations, and border radius.",
  },
  {
    q: "Where can I see a history of changes made in my workspace?",
    a: "Settings → Audit Logs records every create/update/delete action, logins, and module changes, with filters by user, action, module, and date range.",
  },
  {
    q: "I found a bug or have a feature request — what should I do?",
    a: "Submit a ticket below with as much detail as you can (steps to reproduce, what you expected). An admin can track its status right here.",
  },
];

export default function HelpDeskPage() {
  const { replayWizard, startTour } = useOnboarding();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("bug");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [message, setMessage] = useState("");

  const loadTickets = async () => {
    try {
      setTicketsLoading(true);
      const data = await helpdeskApi.listTickets();
      setTickets(data);
    } catch {
      toast.error("Failed to load support tickets");
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || message.trim().length < 10) {
      toast.error("Add a subject and at least 10 characters describing your issue");
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await helpdeskApi.createTicket({ subject: subject.trim(), category, priority, message: message.trim() });
      setTickets((prev) => [ticket, ...prev]);
      setSubject("");
      setMessage("");
      setCategory("bug");
      setPriority("medium");
      toast.success("Support ticket submitted");
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, string[]> & { detail?: string } } };
      const msg =
        err.response?.data?.subject?.[0] ||
        err.response?.data?.message?.[0] ||
        err.response?.data?.detail ||
        "Failed to submit ticket";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  return (
    <SettingsPageShell title="Help Desk" subtitle="Get help, contact support, and browse FAQs">
      <SettingsPageContent>
        <SettingsCard>
          <SettingsCardHeader
            icon={Zap}
            title="Getting Started"
            description="Replay the setup guide and product tour anytime"
          />
          <SettingsCardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent-custom,#22C55E)]/10 text-[var(--color-accent-custom,#22C55E)] mb-4">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-medium text-foreground">Setup wizard</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Walk through the full first-time guide again — organization tips, modules,
                  and getting started — then continue into the product tour.
                </p>
                <Button
                  type="button"
                  className="mt-5 bg-gradient-to-r from-[var(--color-accent-custom-600,#16A34A)] to-[var(--color-accent-custom,#22C55E)] hover:from-[var(--color-accent-custom-700,#15803d)] hover:to-[var(--color-accent-custom-600,#16A34A)] text-white border-transparent rounded-xl"
                  onClick={replayWizard}
                >
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  Replay full wizard
                </Button>
              </div>

              <div className="rounded-xl border border-border p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent-custom,#22C55E)]/10 text-[var(--color-accent-custom,#22C55E)] mb-4">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-base font-medium text-foreground">Product tour</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Interactive walkthrough of the dashboard sidebar main menu and top
                  navbar — organization, modules, notifications, and your account menu.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 rounded-xl"
                  onClick={startTour}
                >
                  <ArrowRight className="h-4 w-4 mr-1.5" />
                  Start product tour
                </Button>
              </div>
            </div>
          </SettingsCardBody>
        </SettingsCard>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:items-start">
          <SettingsCard>
            <SettingsCardHeader
              icon={MessageCircle}
              title="Contact Support"
              description="Submit a ticket and track its status"
            />
            <SettingsCardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <SettingsField label="Subject">
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Briefly describe the issue"
                    maxLength={255}
                    required
                  />
                </SettingsField>

                <div className="grid grid-cols-2 gap-3">
                  <SettingsField label="Category">
                    <Select value={category} onValueChange={(v) => setCategory((v as TicketCategory) ?? "other")}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </SettingsField>
                  <SettingsField label="Priority">
                    <Select value={priority} onValueChange={(v) => setPriority((v as TicketPriority) ?? "medium")}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </SettingsField>
                </div>

                <SettingsField label="Message" hint="At least 10 characters">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's going on? Include steps to reproduce if it's a bug."
                    rows={4}
                    required
                  />
                </SettingsField>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-600,#16A34A)] text-white gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit ticket"}
                </Button>
              </form>
            </SettingsCardBody>
          </SettingsCard>

          <SettingsCard>
            <SettingsCardHeader
              icon={MessageCircle}
              title="Your Tickets"
              description={ticketsLoading ? "Loading..." : `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}`}
            />
            <SettingsCardBody className="p-0">
              {ticketsLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No tickets yet. Submitted tickets will appear here.
                </div>
              ) : (
                <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="px-6 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {ticket.category_display} · {ticket.priority_display} priority · {ticket.user_name}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[ticket.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {ticket.status_display}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground/80 mt-1.5">{formatDate(ticket.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </SettingsCardBody>
          </SettingsCard>
        </div>

        <SettingsCard>
          <SettingsCardHeader
            icon={HelpCircle}
            title="Frequently Asked Questions"
          />
          <SettingsCardBody className="p-0">
            <div className="divide-y divide-border">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={item.q}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full flex items-center justify-between gap-3 px-6 py-3.5 text-left hover:bg-accent/40 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm font-medium text-foreground">{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <p className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </SettingsCardBody>
        </SettingsCard>
      </SettingsPageContent>
    </SettingsPageShell>
  );
}
