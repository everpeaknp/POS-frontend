import { invitationApi } from "@/lib/api/tenant";

export const INVITE_REDIRECT_PREFIX = "/invite/";

export function getInviteTokenFromRedirect(redirectTo?: string): string | null {
  if (!redirectTo?.startsWith(INVITE_REDIRECT_PREFIX)) return null;
  const token = redirectTo.slice(INVITE_REDIRECT_PREFIX.length).split("/")[0]?.trim();
  return token || null;
}

export function buildInviteRedirect(token: string): string {
  return `${INVITE_REDIRECT_PREFIX}${token}`;
}

export async function acceptInviteToken(token: string) {
  return invitationApi.acceptByToken(token);
}

export function inviteErrorMessage(error: unknown, fallback = "Failed to accept invitation"): string {
  const data = (error as { response?: { data?: { detail?: string; error?: string } } })?.response
    ?.data;
  return data?.detail || data?.error || fallback;
}
