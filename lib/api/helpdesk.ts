import apiClient from "./client";

export type TicketCategory = "bug" | "billing" | "feature_request" | "account" | "other";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketMessageType = "message" | "status_change" | "system";

export interface SupportTicketMessage {
  id: number;
  ticket: number;
  author: number | null;
  author_name: string;
  is_staff: boolean;
  message_type: TicketMessageType;
  message_type_display: string;
  body: string;
  attachment: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  old_status: string;
  new_status: string;
  created_at: string;
}

export interface SupportTicketLastMessage {
  body: string;
  is_staff: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  user: number | null;
  user_name: string;
  subject: string;
  category: TicketCategory;
  category_display: string;
  priority: TicketPriority;
  priority_display: string;
  status: TicketStatus;
  status_display: string;
  message: string;
  message_count: number;
  last_message: SupportTicketLastMessage | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface SupportTicketDetail extends SupportTicket {
  messages: SupportTicketMessage[];
}

export interface SupportTicketPayload {
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  message: string;
  attachment?: File | null;
}

export const helpdeskApi = {
  listTickets: async (): Promise<SupportTicket[]> => {
    const response = await apiClient.get("/helpdesk/tickets/");
    return response.data.results ?? response.data;
  },

  getTicket: async (id: number): Promise<SupportTicketDetail> => {
    const response = await apiClient.get(`/helpdesk/tickets/${id}/`);
    return response.data;
  },

  createTicket: async (payload: SupportTicketPayload): Promise<SupportTicket> => {
    const { attachment, ...rest } = payload;
    const formData = new FormData();
    Object.entries(rest).forEach(([key, value]) => formData.append(key, value));
    if (attachment) formData.append("attachment", attachment);
    const response = await apiClient.post("/helpdesk/tickets/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  listMessages: async (ticketId: number): Promise<SupportTicketMessage[]> => {
    const response = await apiClient.get(`/helpdesk/tickets/${ticketId}/messages/`);
    return response.data;
  },

  sendMessage: async (
    ticketId: number,
    payload: { body: string; attachment?: File | null }
  ): Promise<SupportTicketMessage> => {
    const formData = new FormData();
    formData.append("body", payload.body);
    if (payload.attachment) formData.append("attachment", payload.attachment);
    const response = await apiClient.post(`/helpdesk/tickets/${ticketId}/messages/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
