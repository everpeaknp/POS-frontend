/**
 * Optional OpenAI-compatible chat completions.
 * Never required — command center works with local intents alone.
 */

export type AiChatMessage = { role: "system" | "user" | "assistant"; content: string };

function config() {
  const base = (process.env.NEXT_PUBLIC_KHATA_AI_URL || "").replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_KHATA_AI_KEY || "";
  const model = process.env.NEXT_PUBLIC_KHATA_AI_MODEL || "gpt-4o-mini";
  return { base, key, model, enabled: Boolean(base && key) };
}

export function isCloudAiConfigured() {
  return config().enabled;
}

export async function completeChat(
  messages: AiChatMessage[],
  opts?: { temperature?: number }
): Promise<string> {
  const { base, key, model, enabled } = config();
  if (!enabled) {
    return localDraftFallback(messages);
  }

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: opts?.temperature ?? 0.4,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() || "(No response)";
}

function localDraftFallback(messages: AiChatMessage[]): string {
  const user = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const lower = user.toLowerCase();

  if (lower.includes("email")) {
    return [
      "Subject: Follow-up from Khata",
      "",
      "Dear Customer,",
      "",
      "I hope you are well. I am writing regarding your recent account activity.",
      "",
      "Please let us know a convenient time to connect.",
      "",
      "Best regards,",
      "[Your Name]",
      "[Organization]",
    ].join("\n");
  }

  if (lower.includes("quotation") || lower.includes("quote")) {
    return [
      "QUOTATION",
      "",
      "Thank you for your interest. Please find our indicative offer below.",
      "",
      "• Item / Service: [describe]",
      "• Quantity: [qty]",
      "• Unit price: NPR [amount]",
      "• Validity: 15 days",
      "",
      "We look forward to your confirmation.",
    ].join("\n");
  }

  if (lower.includes("purchase")) {
    return [
      "PURCHASE ORDER REQUEST",
      "",
      "Supplier: [name]",
      "Items needed:",
      "1. [SKU] × [qty]",
      "",
      "Required by: [date]",
      "Notes: Please confirm availability and lead time.",
    ].join("\n");
  }

  if (lower.includes("meeting")) {
    return [
      "Meeting notes",
      "",
      "Attendees: ",
      "Agenda: ",
      "Decisions: ",
      "Action items:",
      "- [ ] Owner — due date",
    ].join("\n");
  }

  return [
    "Khata Assistant (local mode)",
    "",
    "Cloud AI is not configured. I can still:",
    "• Open modules (e.g. “Open Inventory”)",
    "• Create records (e.g. “Create Invoice”)",
    "• Search (e.g. “Search customer Ram”)",
    "• Sync data (“Sync Data”)",
    "",
    "To enable advanced drafting, set NEXT_PUBLIC_KHATA_AI_URL and NEXT_PUBLIC_KHATA_AI_KEY.",
    "",
    `You asked: ${user.slice(0, 400)}`,
  ].join("\n");
}

export async function runDraft(
  kind: string,
  prompt: string,
  orgHint?: string
): Promise<string> {
  const system = [
    "You are Khata Assistant inside a Nepal-focused ERP desktop app.",
    "Be concise, professional, and actionable.",
    "Do not invent account balances or invoice numbers.",
    "Prefer NPR when discussing money unless told otherwise.",
    orgHint ? `Organization context: ${orgHint}` : "",
    `Task kind: ${kind}`,
  ]
    .filter(Boolean)
    .join(" ");

  return completeChat([
    { role: "system", content: system },
    { role: "user", content: prompt },
  ]);
}
