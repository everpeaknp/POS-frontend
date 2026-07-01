import { accountsAPI, type Account } from "@/lib/api/accounting";

const BANK_GL_SUB_TYPES = new Set(["Bank", "Cash", "Current Asset", "Other Asset"]);

/** Active COA accounts suitable for linking a bank account (Assets preferred). */
export async function loadBankGlAccounts(): Promise<Account[]> {
  const data = await accountsAPI.list({ status: "active", ordering: "code" });
  const list = Array.isArray(data) ? data : [];

  const bankLike = list.filter((a) => a.type === "Assets" && BANK_GL_SUB_TYPES.has(a.sub_type));
  if (bankLike.length > 0) return bankLike;

  const assets = list.filter((a) => a.type === "Assets");
  if (assets.length > 0) return assets;

  return list;
}
