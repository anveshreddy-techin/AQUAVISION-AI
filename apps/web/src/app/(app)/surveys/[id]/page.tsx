import { SurveyDetailClient } from "./survey-detail-client";

export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }];
}

export default function SurveyDetailPage() {
  return <SurveyDetailClient />;
}
