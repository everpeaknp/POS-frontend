"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Paperclip,
  X,
  FileText,
  Clock,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import {
  helpdeskApi,
  type SupportTicketDetail,
  type SupportTicketMessage,
} from "@/lib/api/helpdesk";

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  resolved: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  closed: "bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground",
};

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isImageAttachment(name: string | null) {
  if (!name) return false;
  return /\.(png|jpe?g|gif|webp)$/i.test(name);
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = Number(params.id);

  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string>("");
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number>(0);
  const lastStatusRef = useRef<string>("");

  const syncTicket = (data: SupportTicketDetail) => {
    setTicket(data);
    lastMessageIdRef.current = data.messages.length ? data.messages[data.messages.length - 1].id : 0;
    lastStatusRef.current = data.status;
  };

  const load = async () => {
    if (!Number.isFinite(ticketId)) {
      setError(true);
      setLoading(false);
      return;
    }
    try {
      const data = await helpdeskApi.getTicket(ticketId);
      syncTicket(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages.length]);

  // Poll for new messages / status changes (e.g. an admin reply from
  // /admin) so the thread updates without a manual page refresh.
  useEffect(() => {
    if (!Number.isFinite(ticketId)) return;
    const interval = setInterval(async () => {
      try {
        const data = await helpdeskApi.getTicket(ticketId);
        const newLastId = data.messages.length ? data.messages[data.messages.length - 1].id : 0;
        if (newLastId !== lastMessageIdRef.current || data.status !== lastStatusRef.current) {
          // Always scroll to the latest message — the `[ticket?.messages.length]`
          // effect below fires on this update and scrolls unconditionally.
          syncTicket(data);
        }
      } catch {
        // silent — a failed poll shouldn't disrupt the page
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [ticketId]);

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

  const handleSend = async () => {
    if (!body.trim() && !attachment) {
      toast.error("Write a message or attach a file");
      return;
    }
    setSending(true);
    try {
      const msg = await helpdeskApi.sendMessage(ticketId, { body: body.trim(), attachment });
      setTicket((prev) => (prev ? { ...prev, messages: [...prev.messages, msg] } : prev));
      setBody("");
      clearAttachment();
      // status may have auto-reopened server-side; refetch to stay in sync
      load();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { non_field_errors?: string[]; detail?: string } } };
      toast.error(err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return <SettingsPageShell title="Ticket" loading loadingMessage="Loading ticket..." />;
  }

  if (error || !ticket) {
    return (
      <SettingsPageShell
        title="Ticket not found"
        action={
          <Link href="/settings/support">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Support
            </Button>
          </Link>
        }
      >
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          This ticket doesn&apos;t exist or you don&apos;t have access to it.
        </div>
      </SettingsPageShell>
    );
  }

  const timelineEvents = ticket.messages.filter((m) => m.message_type !== "message");
  const isClosed = ticket.status === "closed";

  return (
    <SettingsPageShell title={`Ticket #${ticket.id}`} subtitle={ticket.subject}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 flex-1 min-h-0">
        {/* Chat thread */}
        <div className="flex flex-col min-h-0 rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ticket.category_display} · {ticket.priority_display} priority
              </p>
            </div>
            <span
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                statusColors[ticket.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {ticket.status_display}
            </span>
          </div>

          <div ref={threadScrollRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
            {ticket.messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            <div ref={threadEndRef} />
          </div>

          <div className="border-t border-border p-3.5">
            {isClosed ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                This ticket is closed and no longer accepts new messages.
              </p>
            ) : (
            <>
            {attachment && (
              <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
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
            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleAttachmentChange}
                accept="image/png,image/jpeg,image/gif,image/webp,.pdf"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach a file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                rows={2}
                className="flex-1 resize-none"
              />
              <Button
                type="button"
                onClick={handleSend}
                disabled={sending || (!body.trim() && !attachment)}
                className="shrink-0 bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-600,#16A34A)] text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            </>
            )}
          </div>
        </div>

        {/* Timeline / details sidebar */}
        <div className="flex flex-col gap-4 min-h-0">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Ticket details</h3>
            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium text-foreground">{ticket.status_display}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium text-foreground">{ticket.category_display}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Priority</dt>
                <dd className="font-medium text-foreground">{ticket.priority_display}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Opened</dt>
                <dd className="font-medium text-foreground text-right">{formatDateTime(ticket.created_at)}</dd>
              </div>
              {ticket.resolved_at && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Resolved</dt>
                  <dd className="font-medium text-foreground text-right">{formatDateTime(ticket.resolved_at)}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 flex-1 min-h-0 overflow-y-auto">
            <h3 className="text-sm font-medium text-foreground mb-3">Timeline</h3>
            <div className="space-y-3">
              <TimelineEvent icon={Clock} label="Ticket opened" timestamp={ticket.created_at} />
              {timelineEvents.map((event) => (
                <TimelineEvent
                  key={event.id}
                  icon={Clock}
                  label={event.body || `Status changed to ${event.new_status}`}
                  timestamp={event.created_at}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </SettingsPageShell>
  );
}

function TimelineEvent({
  icon: Icon,
  label,
  timestamp,
}: {
  icon: typeof Clock;
  label: string;
  timestamp: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-foreground leading-snug">{label}</p>
        <p className="text-xs text-muted-foreground/80 mt-0.5">{formatDateTime(timestamp)}</p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: SupportTicketMessage }) {
  if (message.message_type !== "message") {
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
          {message.body} · {formatDateTime(message.created_at)}
        </span>
      </div>
    );
  }

  const isStaff = message.is_staff;

  return (
    <div className={`flex ${isStaff ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[75%] ${isStaff ? "" : "items-end"} flex flex-col`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
            isStaff
              ? "bg-muted text-foreground rounded-tl-sm"
              : "bg-[var(--color-accent-custom,#22C55E)] text-white rounded-tr-sm"
          }`}
        >
          {message.body && <p>{message.body}</p>}
          {message.attachment_url && (
            <a
              href={message.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-1.5 flex items-center gap-2 rounded-lg px-2.5 py-2 ${
                isStaff ? "bg-background/60" : "bg-white/15"
              }`}
            >
              {isImageAttachment(message.attachment_name) ? (
                <img
                  src={message.attachment_url}
                  alt={message.attachment_name ?? "Attachment"}
                  className="h-16 w-16 rounded object-cover shrink-0"
                />
              ) : (
                <div className={`h-9 w-9 rounded flex items-center justify-center shrink-0 ${isStaff ? "bg-red-100" : "bg-white/20"}`}>
                  <FileText className={`h-4 w-4 ${isStaff ? "text-red-600" : "text-white"}`} />
                </div>
              )}
              <span className="text-xs truncate flex-1">{message.attachment_name}</span>
              <Download className="h-3.5 w-3.5 shrink-0" />
            </a>
          )}
        </div>
        <p className="text-xs text-muted-foreground/80 mt-1 px-1">
          {isStaff ? message.author_name : "You"} · {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
