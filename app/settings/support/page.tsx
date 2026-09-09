"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  ArrowRight,
  Send,
  CornerDownRight,
  Paperclip,
  X,
  FileText,
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

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("bug");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
      toast.error("Please attach an image (JPG, PNG, GIF, WEBP) or PDF file");
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("File size must be less than 10MB");
      return;
    }
    setAttachment(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => setAttachmentPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview("pdf");
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    setAttachmentPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || message.trim().length < 10) {
      toast.error("Add a subject and at least 10 characters describing your issue");
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await helpdeskApi.createTicket({
        subject: subject.trim(),
        category,
        priority,
        message: message.trim(),
        attachment,
      });
      setTickets((prev) => [ticket, ...prev]);
      setSubject("");
      setMessage("");
      setCategory("bug");
      setPriority("medium");
      clearAttachment();
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
    <SettingsPageShell title="Support" subtitle="Contact support and track your tickets">
      <SettingsPageContent>
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

                <SettingsField label="Attachment (optional)">
                  {!attachment ? (
                    <label className="flex items-center justify-center gap-2 w-full px-3 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/5 transition">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to attach an image or PDF</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleAttachmentChange}
                        accept="image/png,image/jpeg,image/gif,image/webp,.pdf"
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                      {attachmentPreview && attachmentPreview !== "pdf" ? (
                        <img src={attachmentPreview} alt="Attachment preview" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-red-100 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-red-600" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearAttachment}
                        className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
                        aria-label="Remove attachment"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
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
                    <Link
                      key={ticket.id}
                      href={`/settings/support/${ticket.id}`}
                      className="block px-6 py-3.5 hover:bg-muted/40 transition-colors"
                    >
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
                      {ticket.last_message && (
                        <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
                          <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground">
                              {ticket.last_message.is_staff ? "Support reply" : "Your latest message"}
                            </p>
                            <p className="text-sm text-foreground/90 truncate mt-0.5">{ticket.last_message.body}</p>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-[var(--color-accent-custom,#22C55E)] font-medium mt-2.5 flex items-center gap-1">
                        {ticket.message_count} message{ticket.message_count !== 1 ? "s" : ""} · View conversation
                        <ArrowRight className="h-3 w-3" />
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </SettingsCardBody>
          </SettingsCard>
        </div>
      </SettingsPageContent>
    </SettingsPageShell>
  );
}
