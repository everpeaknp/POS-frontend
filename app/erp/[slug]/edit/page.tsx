"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { Button } from "@/components/ui/button";
import { KhataLogo } from "@/components/khata-logo";
import { OrgForm } from "@/components/org-form";
import { tenantApi, Tenant, TenantData } from "@/lib/api/tenant";
import toast from "react-hot-toast";

export default function EditOrganizationPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const slug = params.slug as string;

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    fetchTenant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, slug]);

  const fetchTenant = async () => {
    try {
      setLoading(true);
      const data = await tenantApi.getBySlug(slug);
      setTenant(data);
    } catch (error) {
      console.error("Failed to fetch tenant:", error);
      toast.error("Failed to load organization");
      router.push("/erp");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: TenantData) => {
    try {
      setSubmitting(true);
      await tenantApi.update(slug, data);
      toast.success("Organization updated successfully");
      router.push("/erp");
    } catch (error: any) {
      console.error("Failed to update organization:", error);
      
      // Handle validation errors
      if (error.response?.status === 400 && error.response?.data) {
        const errors = error.response.data;
        Object.keys(errors).forEach((field) => {
          const fieldErrors = errors[field];
          if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach((err) => toast.error(`${field}: ${err}`));
          } else if (typeof fieldErrors === 'string') {
            toast.error(`${field}: ${fieldErrors}`);
          }
        });
      } else {
        toast.error(error.response?.data?.detail || "Failed to update organization");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || loading) {
    return (
      <PageLoading fullScreen message="Loading workspace…" />
    );
  }

  if (!tenant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <KhataLogo size="md" />
          <Button
            variant="ghost"
            onClick={() => router.push("/erp")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Organization</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update your organization details
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <OrgForm
            initialData={{
              name: tenant.name,
              business_type: tenant.business_type,
              owner_name: tenant.owner_name,
              email: tenant.email,
              phone: tenant.phone,
              address: tenant.address }}
            onSubmit={handleSubmit}
            submitLabel={submitting ? "Updating..." : "Update Organization"}
            isSubmitting={submitting}
          />
        </div>
      </div>
    </div>
  );
}
