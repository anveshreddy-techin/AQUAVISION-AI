"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AuditLogItem } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/common/loading-state";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Shield, Activity, Lock } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const list = await api.get<AuditLogItem[]>("/audit/logs");
        setLogs(list || []);
      } catch (err: any) {
        setError(err.message || "Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <LoadingState message="Querying System Audit Trail..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-cyan-400" /> Immutable Mission Audit Trail
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Full traceability log of operator decisions, survey ingestions, and AI executions.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Log ID</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target Entity</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-mono text-xs text-slate-400">#{l.id}</TableCell>
                <TableCell>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700 font-mono">
                    {l.action}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-300">
                  {l.entity_type} {l.entity_id ? `(#${l.entity_id})` : ""}
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-400">
                  {l.user_id ? `User #${l.user_id}` : "SYSTEM"}
                </TableCell>
                <TableCell className="text-xs text-slate-400 font-mono max-w-sm truncate">
                  {l.details_json || "—"}
                </TableCell>
                <TableCell className="text-xs text-slate-400 font-mono">
                  {formatDate(l.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
