"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { User } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/common/loading-state";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Users, Shield, UserCheck, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const list = await api.get<User[]>("/users");
        setUsers(list || []);
      } catch (err: any) {
        setError(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <LoadingState message="Loading Operator Credentials..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" /> User & Role Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authorized marine scientists, sonar operators, and administrative accounts.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-semibold text-slate-200">
                  {u.full_name}
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-300">{u.email}</TableCell>
                <TableCell>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase font-mono">
                    {u.role}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-slate-400">
                  {u.organization || "AquaVision AI"}
                </TableCell>
                <TableCell>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Active
                  </span>
                </TableCell>
                <TableCell className="text-xs text-slate-400 font-mono">
                  {formatDate(u.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
