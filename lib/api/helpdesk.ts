import apiClient from "./client";

export type TicketCategory = "bug" | "billing" | "feature_request" | "account" | "other";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

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
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface SupportTicketPayload {
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  message: string;
}

export const helpdeskApi = {
  listTickets: async (): Promise<SupportTicket[]> => {
    const response = await apiClient.get("/helpdesk/tickets/");
    return response.data.results ?? response.data;
  },

  createTicket: async (payload: SupportTicketPayload): Promise<SupportTicket> => {
    const response = await apiClient.post("/helpdesk/tickets/", payload);
    return response.data;
  },
};
