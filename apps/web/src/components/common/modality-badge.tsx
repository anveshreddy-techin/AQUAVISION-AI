import React from "react";
import { Badge } from "@/components/ui/badge";
import { SonarModality } from "@/lib/types";

export function ModalityBadge({ modality }: { modality: SonarModality | string }) {
  switch (modality) {
    case "SSS":
      return (
        <Badge className="bg-sky-950/90 text-sky-300 border-sky-600/60 font-bold px-2 py-0.5 tracking-wide">
          SSS
        </Badge>
      );
    case "FLS":
      return (
        <Badge className="bg-purple-950/90 text-purple-300 border-purple-600/60 font-semibold px-2 py-0.5">
          FLS
        </Badge>
      );
    case "SAS":
      return (
        <Badge className="bg-teal-950/90 text-teal-300 border-teal-600/60 font-semibold px-2 py-0.5">
          SAS
        </Badge>
      );
    default:
      return (
        <Badge className="bg-slate-800 text-slate-400 border-slate-700">
          {modality || "OTHER"}
        </Badge>
      );
  }
}
