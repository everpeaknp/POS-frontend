"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import SiteForm from "@/components/construction/SiteForm";
import {
  ConstructionPageShell,
  constructionCardClass,
} from "@/components/dashboard/ConstructionPageShell";
import { constructionApi, Site } from "@/lib/api/construction";
import toast from "react-hot-toast";

export default function EditSitePage() {
  const router = useRouter();
  const params = useParams();
  const siteId = params.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (siteId) fetchSite();
  }, [siteId]);

  const fetchSite = async () => {
    try {
      setLoading(true);
      const siteData = await constructionApi.sites.get(siteId);
      setSite(siteData);
    } catch (error: unknown) {
      console.error("Failed to fetch site:", error);
      toast.error("Failed to load site details");
      router.push("/dashboard/construction/sites");
    } finally {
      setLoading(false);
    }
  };

  if (!loading && !site) {
    return (
      <ConstructionPageShell
        title="Edit Site"
        subtitle="Site not found"
        variant="fullscreen"
        showBack
        backHref="/dashboard/construction/sites"
        backLabel="Back to Sites"
      >
        <div className={`${constructionCardClass} p-8 text-center w-full min-h-full`}>
          <p className="text-gray-500 mb-4">This site could not be loaded.</p>
        </div>
      </ConstructionPageShell>
    );
  }

  return (
    <ConstructionPageShell
      title="Edit Site"
      subtitle={site ? `Update details for ${site.name}` : "Loading site..."}
      variant="fullscreen"
      showBack
      backHref={`/dashboard/construction/sites/${siteId}`}
      backLabel="Back to Site"
      loading={loading}
    >
      {site && (
        <div className={`${constructionCardClass} p-6 lg:p-8 w-full min-h-full`}>
          <SiteForm
            siteId={siteId}
            initialData={{
              name: site.name,
              location: site.location,
              client_name: site.client_name || "",
              allocated_budget: site.allocated_budget.toString(),
              start_date: site.start_date,
              estimated_end_date: site.estimated_end_date || "",
              manager: site.manager,
              warehouse: site.warehouse,
              status: site.status,
              description: site.description || "",
            }}
            onSuccess={() => router.push(`/dashboard/construction/sites/${siteId}`)}
            onCancel={() => router.push(`/dashboard/construction/sites/${siteId}`)}
          />
        </div>
      )}
    </ConstructionPageShell>
  );
}
