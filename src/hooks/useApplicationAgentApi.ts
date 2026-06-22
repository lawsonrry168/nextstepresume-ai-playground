import { useCallback, useState } from "react";
import { parseApiJson } from "../lib/apiResponse";
import { useSubscription } from "../context/SubscriptionProvider";
import type {
  ApplicationPackage,
  CompanyResearchResult,
  InterviewPrepResult,
} from "../types";

type MeasuredFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export function useApplicationAgentApi(measuredFetch: MeasuredFetch) {
  const subscription = useSubscription();
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);

  const fetchInterviewPrep = useCallback(
    async (pkg: ApplicationPackage): Promise<InterviewPrepResult> => {
      if (!subscription.canUseFeature("ai.interviewPrep")) {
        subscription.openUpgrade("ai.interviewPrep");
        throw new Error("Interview prep requires Pro or above.");
      }
      setInterviewLoading(true);
      try {
        const response = await measuredFetch("/api/interview-prep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeData: pkg.resumeSnapshot,
            jobDescription: pkg.jobDescription,
            companyName: pkg.companyName,
            jobTitle: pkg.jobTitle,
            matchAnalysis: pkg.matchAnalysis,
          }),
        });
        const { data } = await parseApiJson<InterviewPrepResult>(response);
        return data;
      } finally {
        setInterviewLoading(false);
      }
    },
    [measuredFetch, subscription],
  );

  const fetchCompanyResearch = useCallback(
    async (pkg: ApplicationPackage): Promise<CompanyResearchResult> => {
      if (!subscription.canUseFeature("ai.companyResearch")) {
        subscription.openUpgrade("ai.companyResearch");
        throw new Error("Company research requires Pro or above.");
      }
      setCompanyLoading(true);
      try {
        const response = await measuredFetch("/api/company-research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobDescription: pkg.jobDescription,
            companyName: pkg.companyName,
            jobTitle: pkg.jobTitle,
          }),
        });
        const { data } = await parseApiJson<CompanyResearchResult>(response);
        return data;
      } finally {
        setCompanyLoading(false);
      }
    },
    [measuredFetch, subscription],
  );

  return {
    interviewLoading,
    companyLoading,
    fetchInterviewPrep,
    fetchCompanyResearch,
  };
}
