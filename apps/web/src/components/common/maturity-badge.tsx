import React from "react";
import { Badge } from "@/components/ui/badge";
import { ModelMaturity } from "@/lib/types";

export function MaturityBadge({ maturity }: { maturity: ModelMaturity | string }) {
  switch (maturity) {
    case "DEMO":
      return (
        <Badge className="bg-amber-950/90 text-amber-300 border-amber-600/70 font-semibold">
          DEMO
        </Badge>
      );
    case "EXPERIMENTAL":
      return (
        <Badge className="bg-orange-950/90 text-orange-300 border-orange-600/70 font-semibold">
          EXPERIMENTAL
        </Badge>
      );
    case "VALIDATED":
      return (
        <Badge className="bg-emerald-950/90 text-emerald-300 border-emerald-600/70 font-semibold">
          VALIDATED
        </Badge>
      );
    case "BLOCKED":
      return (
        <Badge className="bg-rose-950/90 text-rose-300 border-rose-600/70 font-semibold">
          BLOCKED
        </Badge>
      );
    case "RETIRED":
      return (
        <Badge className="bg-slate-800 text-slate-400 border-slate-700">
          RETIRED
        </Badge>
      );
    default:
      return <Badge variant="outline">{maturity}</Badge>;
  }
}
