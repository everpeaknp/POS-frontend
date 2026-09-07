"use client";

import { useState, useEffect } from "react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchAllPages } from "@/lib/api/settings-helpers";
import { downloadCsv } from "@/lib/utils/csv";
import { authApi, type User } from "@/lib/api/auth";
import toast from "react-hot-toast";

interface AuditLog {
  id: number;
  user: number | null;
  user_name: string;
  action: string;
  action_display: string;
  module: string;
  description: string;
  ip_address: string | null;
  user_agent: string;
  metadata: any;
  created_at: string;
}

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  update: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  delete: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  view: "bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground",
  login: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  logout: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  export: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  import: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
  post: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400",
  reverse: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  copy: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400",
  close: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400",
  approve: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  reject: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  refund: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  adjust: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-400",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    authApi.getUsers().then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, moduleFilter, userFilter, dateFrom, dateTo]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await fetchAllPages<AuditLog>("/auth/audit-logs/", {
        ...(actionFilter !== "All" ? { action: actionFilter } : {}),
        ...(moduleFilter !== "All" ? { module: moduleFilter } : {}),
        ...(userFilter !== "All" ? { user: userFilter } : {}),
        ...(dateFrom ? { date_from: `${dateFrom}T00:00:00` } : {}),
        ...(dateTo ? { date_to: `${dateTo}T23:59:59` } : {}),
      });
      setLogs(data);
    } catch (error: any) {
      console.error("Failed to fetch audit logs:", error);
      if (error.response?.status === 403) {
        toast.error("You don't have permission to view audit logs");
      } else {
        toast.error("Failed to load audit logs");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasActiveFilters =
    searchTerm ||
    actionFilter !== "All" ||
    moduleFilter !== "All" ||
    userFilter !== "All" ||
    dateFrom ||
    dateTo;

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      toast.error("No logs to export");
      return;
    }
    downloadCsv(
      `audit-logs-${new Date().toISOString().split("T")[0]}.csv`,
      ["Date", "User", "Action", "Module", "Description", "IP"],
      filteredLogs.map((log) => [
        log.created_at,
        log.user_name,
        log.action_display || log.action,
        log.module,
        log.description,
        log.ip_address || "",
      ])
    );
    toast.success("Audit log exported");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader
        title="Audit Log"
        subtitle={
          loading
            ? "Loading activity..."
            : `${filteredLogs.length} log${filteredLogs.length !== 1 ? "s" : ""}`
        }
      />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white dark:bg-card dark:border-border"
              />
            </div>
            <Select
              value={actionFilter}
              onValueChange={(v) => setActionFilter(v ?? "All")}
            >
              <SelectTrigger className="h-9 w-40 text-sm border-gray-200 bg-white dark:bg-card dark:border-border">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="import">Import</SelectItem>
                <SelectItem value="post">Post</SelectItem>
                <SelectItem value="reverse">Reverse</SelectItem>
                <SelectItem value="copy">Copy</SelectItem>
                <SelectItem value="close">Close</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="adjust">Adjust</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={moduleFilter}
              onValueChange={(v) => setModuleFilter(v ?? "All")}
            >
              <SelectTrigger className="h-9 w-40 text-sm border-gray-200 bg-white dark:bg-card dark:border-border">
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Modules</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="pos">POS</SelectItem>
                <SelectItem value="accounting">Accounting</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="customers">Customers</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={userFilter}
              onValueChange={(v) => setUserFilter(v ?? "All")}
            >
              <SelectTrigger className="h-9 w-40 text-sm border-gray-200 bg-white dark:bg-card dark:border-border">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Users</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {`${u.first_name} ${u.last_name}`.trim() || u.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              className="h-9 w-36 text-sm border-gray-200 bg-white dark:bg-card dark:border-border"
              aria-label="From date"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="h-9 w-36 text-sm border-gray-200 bg-white dark:bg-card dark:border-border"
              aria-label="To date"
            />
          </div>
          <Button
            size="sm"
            onClick={handleExport}
            className="h-9 bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-600,#16A34A)] text-white gap-1.5"
          >
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-foreground mb-2">
              No audit logs found
            </h3>
            <p className="text-gray-500 dark:text-muted-foreground">
              {hasActiveFilters
                ? "Try a different search or filter"
                : "System activities will appear here"}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
                <tr>
                  {["Timestamp", "User", "Action", "Module", "Description", "IP Address"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-border">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-muted/30">
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-foreground font-medium">
                      {log.user_name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          actionColors[log.action] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {log.action_display}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground capitalize">
                      {log.module}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                      {log.description}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-muted-foreground text-xs">
                      {log.ip_address || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
