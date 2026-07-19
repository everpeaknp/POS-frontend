/**
 * Universal smart search — reuse existing list APIs (same contracts).
 * Desktop productivity only; does not add new endpoints.
 */
import { customerAPI } from "@/lib/api/sales";
import { inventoryApi } from "@/lib/api/inventory";
import { getEmployees } from "@/lib/api/hr";
import { DESKTOP_NAV_CATALOG, type NavCatalogItem } from "@/lib/desktop/navigation-catalog";

export type SmartHit = {
  id: string;
  kind: "page" | "customer" | "product" | "employee";
  title: string;
  subtitle?: string;
  href: string;
};

function fuzzyScore(q: string, text: string): number {
  const a = q.toLowerCase().trim();
  const b = text.toLowerCase();
  if (!a) return 0;
  if (b.startsWith(a)) return 100;
  if (b.includes(a)) return 80;
  let i = 0;
  for (const ch of b) {
    if (ch === a[i]) i++;
    if (i >= a.length) return 40;
  }
  return 0;
}

function pageHits(q: string): SmartHit[] {
  return DESKTOP_NAV_CATALOG.map((p: NavCatalogItem) => {
    const score = Math.max(
      fuzzyScore(q, p.label),
      fuzzyScore(q, p.group),
      ...(p.keywords || []).map((k) => fuzzyScore(q, k))
    );
    return {
      score,
      hit: {
        id: `page-${p.id}`,
        kind: "page" as const,
        title: p.label,
        subtitle: p.group,
        href: p.href,
      },
    };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.hit);
}

export async function smartSearch(
  query: string,
  scope?: string
): Promise<SmartHit[]> {
  const q = query.trim();
  if (!q) return [];

  const scopeNorm = (scope || "").toLowerCase();
  const want = (k: string) => !scopeNorm || scopeNorm.includes(k);

  const tasks: Promise<SmartHit[]>[] = [];

  if (!scopeNorm || scopeNorm === "page") {
    tasks.push(Promise.resolve(pageHits(q)));
  }

  if (want("customer")) {
    tasks.push(
      customerAPI
        .list({ search: q, page_size: 8 })
        .then((res) =>
          (res.data.results || []).map((c) => ({
            id: `customer-${c.id}`,
            kind: "customer" as const,
            title: c.name,
            subtitle: c.phone || c.email || "Customer",
            href: `/dashboard/sales/customers/${c.id}`,
          }))
        )
        .catch(() => [] as SmartHit[])
    );
  }

  if (want("product")) {
    tasks.push(
      inventoryApi.products
        .list({ search: q, page_size: 8 })
        .then((res) =>
          (res.data.results || []).map((p) => ({
            id: `product-${p.id}`,
            kind: "product" as const,
            title: p.name,
            subtitle: p.sku || "Product",
            href: `/dashboard/inventory/products/${p.id}`,
          }))
        )
        .catch(() => [] as SmartHit[])
    );
  }

  if (want("employee")) {
    tasks.push(
      getEmployees({ search: q, page_size: 8 })
        .then((res) =>
          (res.results || []).map((e) => ({
            id: `employee-${e.id}`,
            kind: "employee" as const,
            title: e.name,
            subtitle: e.designation || e.department_name || "Employee",
            href: `/dashboard/hr/employees/${e.id}`,
          }))
        )
        .catch(() => [] as SmartHit[])
    );
  }

  const chunks = await Promise.all(tasks);
  return chunks.flat().slice(0, 24);
}
