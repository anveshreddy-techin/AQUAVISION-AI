import React from "react";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "REVIEW_READY":
    case "COMPLETED":
    case "ACCEPTED":
      return (
        <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800/60 font-medium">
          {status}
        </Badge>
      );
    case "PROCESSING":
    case "INGESTING":
    case "UNDER_REVIEW":
      return (
        <Badge className="bg-cyan-950 text-cyan-300 border-cyan-800/60 animate-pulse font-medium">
          {status}
        </Badge>
      );
    case "QUEUED":
    case "CREATED":
    case "PENDING":
      return (
        <Badge className="bg-slate-800 text-slate-300 border-slate-700 font-normal">
          {status}
        </Badge>
      );
    case "REJECTED":
    case "FAILED":
    case "CANCELLED":
      return (
        <Badge className="bg-red-950 text-red-300 border-red-800/60 font-medium">
          {status}
        </Badge>
      );
    case "CORRECTED":
      return (
        <Badge className="bg-indigo-950 text-indigo-300 border-indigo-800/60 font-medium">
          {status}
        </Badge>
      );
    case "UNCERTAIN":
      return (
        <Badge className="bg-amber-950 text-amber-300 border-amber-800/60 font-medium">
          {status}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
