import { useCallback, useState } from "react";
import { ResumeData } from "../types";
import { parseAskGeminiReply } from "../lib/apiResponse";
import { t } from "../i18n/translate";
import { useSubscription } from "../context/SubscriptionProvider";
import { AI_CREDIT_COSTS } from "../lib/subscription/creditCosts";

export type ChatMessage = { role: "user" | "assistant"; content: string };

type MeasuredFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type ToastFn = (type: "success" | "error" | "warning" | "info", message: string) => void;

const createInitialMessage = (): ChatMessage => ({
  role: "assistant",
  content: t("geminiChatInitial.message"),
});

function getSimulatedCoachReply(
  msg: string,
  resumeData: ResumeData,
  detectedKeywords: string[],
  activeKeywordsList: string[]
): string {
  const textLower = msg.toLowerCase();
  const title = resumeData?.personalInfo?.title || "Professional Developer";
  const name = resumeData?.personalInfo?.name || "Candidate";

  if (textLower.includes("hello") || textLower.includes("hi ") || textLower.includes("greet")) {
    return `Welcome, **${name}**! I'm ready to help you target your applications. Ask me questions like:
*   *"What key skills am I missing from the job description?"*
*   *"Draft a streamlined career summary for a ${title} position"*
*   *"Help me improve my experiences with metrics!"*`;
  }

  if (textLower.includes("summary") || textLower.includes("profile") || textLower.includes("intro")) {
    return `### 💡 High-Converting ATS Summary Recommendation:
"Strategic, metrics-focused **${title}** with proven experience engineering high-speed systems. Expert in leading full-lifecycle software deployments, integrating robust secure APIs, and maintaining low-latency database queries. Possesses a deep aptitude for aligning architecture with target organizational milestones to yield maximum product uptime."

**Coaching Tip:** Adding active metrics like *"reduced delivery latency by 12%"* or *"migrated 25+ microservices"* immediately catches technical recruiters' attention.`;
  }

  if (
    textLower.includes("skill") ||
    textLower.includes("missing") ||
    textLower.includes("gap") ||
    textLower.includes("keyword")
  ) {
    const matchedList =
      detectedKeywords.length > 0 ? detectedKeywords.join(", ").toUpperCase() : "REACT, TYPESCRIPT, GIT";
    const missingList =
      activeKeywordsList
        ?.filter((word) => !detectedKeywords.includes(word))
        .slice(0, 4)
        .join(", ")
        .toUpperCase() || "DOCKER, KUBERNETES, CI/CD PIPELINES";
    return `### 🎯 ATS Keyword Gaps & Match Report:
*   **Matches Detected:** \`${matchedList}\` 
*   **Critical Gaps Found:** \`${missingList}\`

**Action Plan:**
1. Grab some of these **Critical Gaps** badges from our auto-tag clouds below and **drag & drop them** onto your *Skills ledger dropzone*!
2. Weave at least two of these missing platforms directly into your core accomplishments under your recent employer entries using active verbs.`;
  }

  if (
    textLower.includes("rewrite") ||
    textLower.includes("bullet") ||
    textLower.includes("experience") ||
    textLower.includes("work")
  ) {
    return `### 📝 Custom STAR Bullet point Revitalization:
To make your employment history resonate, rewrite passive bullet lists to enforce the **Action-Impact** archetype:

*   **Standard (Passive):** *"Maintained core systems and fixed performance issues."*
*   **Optimized (STAR-Driven):** **"Refactored critical core APIs and optimized legacy index queries using TypeScript, achieving a 24% reduction in peak-hour latency and mitigating key system drop-offs."**

Would you like me to custom-rewrite one of your specific experience bullets? Simply paste the bullet line here!`;
  }

  return `### 💡 Career Coach Response regarding: "${msg}"

Here are the optimal strategies for this request:

1. **Leverage Active Verbs:** Instead of *"worked on"*, utilize *"spearheaded"*, *"modularized"*, or *"orchestrated"*.
2. **Quantified Business Value:** Estimate scale or cost-savings even if exact data is private.
3. **Keyword Proximity:** Keep technology terms close to their corresponding action verbs to satisfies parsing filters.

What segment of your resume can I assist you in optimizing next?`;
}

export interface UseGeminiChatOptions {
  resumeData: ResumeData;
  jobDescription: string;
  detectedKeywords: string[];
  activeKeywordsList: string[];
  measuredFetch: MeasuredFetch;
  onNotifyServerStatus: (reachable: boolean) => void;
  pushToast: ToastFn;
}

export function useGeminiChat({
  resumeData,
  jobDescription,
  detectedKeywords,
  activeKeywordsList,
  measuredFetch,
  onNotifyServerStatus,
  pushToast,
}: UseGeminiChatOptions) {
  const subscription = useSubscription();
  const [chatOpen, setChatOpen] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [createInitialMessage()]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const executeSendChatMessage = useCallback(
    async (presetText?: string) => {
      const text = (presetText || chatInput).trim();
      if (!text) return;

      if (!subscription.canUseFeature("ai.geminiChat")) {
        subscription.openUpgrade("ai.geminiChat");
        return;
      }
      if (thinkingMode && !subscription.canUseFeature("ai.geminiThinking")) {
        subscription.openUpgrade("ai.geminiThinking");
        return;
      }
      const action = thinkingMode ? "geminiThinking" : "geminiFlash";
      if (!subscription.canConsume("aiCredits", AI_CREDIT_COSTS[action])) {
        subscription.openUpgrade("aiCredits");
        return;
      }

      if (!presetText) setChatInput("");

      const uMsg: ChatMessage = { role: "user", content: text };
      setChatMessages((prev) => [...prev, uMsg]);
      setChatLoading(true);

      try {
        const response = await measuredFetch("/api/ask-gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            resumeData,
            jobDescription,
            history: chatMessages.slice(-10),
            thinkingMode,
          }),
        });

        const { reply, usedFallback } = await parseAskGeminiReply(response);
        onNotifyServerStatus(true);
        if (usedFallback) {
          pushToast("warning", t("toast.geminiChat.aiOfflineCoachReply"));
        }
        setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : t("toast.geminiChat.coachApiConnectionFailed");
        console.error("Ask Gemini API client failure, running fallback advice simulation...", e);
        onNotifyServerStatus(false);
        pushToast("error", message);
        const serverFallback = getSimulatedCoachReply(
          text,
          resumeData,
          detectedKeywords,
          activeKeywordsList
        );
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `💡 **(Coaching Insight - Offline Fallback):**\n\n${serverFallback}`,
          },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [
      activeKeywordsList,
      chatInput,
      chatMessages,
      detectedKeywords,
      jobDescription,
      measuredFetch,
      onNotifyServerStatus,
      pushToast,
      resumeData,
      subscription,
      thinkingMode,
    ]
  );

  const guardedSetChatOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof value === "function" ? value(chatOpen) : value;
      if (next && !subscription.canUseFeature("ai.geminiChat")) {
        subscription.openUpgrade("ai.geminiChat");
        return;
      }
      setChatOpen(next);
    },
    [chatOpen, subscription],
  );

  const guardedSetThinkingMode = useCallback(
    (value: boolean) => {
      if (value && !subscription.canUseFeature("ai.geminiThinking")) {
        subscription.openUpgrade("ai.geminiThinking");
        return;
      }
      setThinkingMode(value);
    },
    [subscription],
  );

  return {
    chatOpen,
    setChatOpen: guardedSetChatOpen,
    thinkingMode,
    setThinkingMode: guardedSetThinkingMode,
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    executeSendChatMessage,
  };
}
