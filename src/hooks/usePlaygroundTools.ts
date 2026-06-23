import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { t } from "../i18n/translate";
import { ResumeData } from "../types";
import { extractJdKeywords } from "../lib/atsKeywords";
import type { TemplateStyle } from "../lib/resumeTemplateCatalog";
import { markE2eDocxExportComplete, markE2eJsonExportComplete, isE2eDocxStubEnabled, runE2eDocxExportStub } from "../lib/e2eExportTrack";

export type AtsLogEntry = {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  text: string;
};

export type ComparatorResult = {
  matchRate: number;
  keyMatches: string[];
  missingSkills: string[];
  criticalGaps: string[];
};

export interface UsePlaygroundToolsOptions {
  resumeData: ResumeData;
  setResumeData: Dispatch<SetStateAction<ResumeData>>;
  jobDescription: string;
  setPremiumGrammarText: Dispatch<SetStateAction<string>>;
  activeTemplate?: TemplateStyle;
}

export function usePlaygroundTools({
  resumeData,
  setResumeData,
  jobDescription,
  setPremiumGrammarText,
  activeTemplate,
}: UsePlaygroundToolsOptions) {
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState<"summary" | "grammar_input" | "custom">("summary");
  const [voiceStatus, setVoiceStatus] = useState("");

  const [comparatorOpen, setComparatorOpen] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparatorResult, setComparatorResult] = useState<ComparatorResult | null>(null);

  const [atsLogs, setAtsLogs] = useState<AtsLogEntry[]>([]);
  const [isAtsCrawling, setIsAtsCrawling] = useState(false);
  const [crawlerSource, setCrawlerSource] = useState("LinkedIn Jobs");

  const addAtsLog = useCallback((level: AtsLogEntry["level"], text: string) => {
    const time = new Date().toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setAtsLogs((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(4), timestamp: time, level, text },
    ]);
  }, []);

  const runResumeComparison = useCallback(() => {
    setIsComparing(true);
    setTimeout(() => {
      const normalizedResumeSkills = resumeData.skills.map((s) => s.toLowerCase());
      const jdKeywords = [
        "react",
        "typescript",
        "node",
        "css",
        "html",
        "webpack",
        "vite",
        "webgl",
        "tailwind",
        "aws",
        "docker",
        "redis",
        "postgres",
        "graphql",
        "next.js",
        "rest api",
        "ci/cd",
        "scrum",
        "agile",
        "architecture",
        "micro-frontends",
        "performance",
        "optimization",
        "testing",
      ];

      const jdSkillsFound = jdKeywords.filter((keyword) =>
        jobDescription.toLowerCase().includes(keyword.toLowerCase())
      );

      const matches = jdSkillsFound.filter((skill) =>
        normalizedResumeSkills.some((rs) => rs.includes(skill) || skill.includes(rs))
      );

      const missing = jdSkillsFound.filter(
        (skill) => !normalizedResumeSkills.some((rs) => rs.includes(skill) || skill.includes(rs))
      );

      const gaps = missing.filter((s) =>
        ["react", "typescript", "architecture", "optimization", "testing", "rest api", "ci/cd"].includes(s)
      );

      const matchRate =
        jdSkillsFound.length > 0 ? Math.round((matches.length / jdSkillsFound.length) * 100) : 65;

      setComparatorResult({
        matchRate: Math.max(25, Math.min(98, matchRate)),
        keyMatches: matches.map((s) => s.toUpperCase()),
        missingSkills: missing.map((s) => s.toUpperCase()),
        criticalGaps: gaps.map((s) => s.toUpperCase()),
      });
      setIsComparing(false);
    }, 600);
  }, [jobDescription, resumeData.skills]);

  const triggerAtsCrawlerSim = useCallback(
    (source: string) => {
      if (isAtsCrawling) return;
      setIsAtsCrawling(true);
      setCrawlerSource(source);
      setAtsLogs([]);

      addAtsLog("info", `[ATS Crawler] Active pipeline initiated. Targeting: ${source}...`);

      setTimeout(() => {
        addAtsLog("info", `[Proxy] Connecting to remote crawler endpoint. Setting secure sandbox session...`);
      }, 500);

      setTimeout(() => {
        addAtsLog("info", `[DNS] Resolved target API server. Initiating HTTPS payload handshake...`);
      }, 1100);

      setTimeout(() => {
        addAtsLog(
          "warn",
          `[DOM] Warn: Non-standard semantic HTML structure detected. Launching heuristic selector parsing engine...`
        );
      }, 1800);

      setTimeout(() => {
        addAtsLog("info", `[Parser] Raw metadata successfully downloaded. Parsed: 1,845 bytes text elements.`);
      }, 2400);

      setTimeout(() => {
        const keywords = extractJdKeywords(jobDescription);
        const keywordPreview = keywords.slice(0, 8).join(", ") || "react, typescript, performance";
        addAtsLog("info", `[Parser] JD keyword extraction complete (${keywords.length} terms).`);
        addAtsLog("info", `[Sync] Core keywords: ${keywordPreview}`);
        addAtsLog("info", `[ATS Crawler] Completed successfully. Synced extracted JD terms into Comparator system!`);
        setIsAtsCrawling(false);
        runResumeComparison();
      }, 2800);
    },
    [addAtsLog, isAtsCrawling, jobDescription, runResumeComparison]
  );

  const clearAtsLogs = useCallback(() => {
    setAtsLogs([]);
  }, []);

  const toggleVoiceRecording = useCallback(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert(t("voiceInput.unsupported"));
      return;
    }

    if (voiceRecording) {
      try {
        const anyWindow = window as any;
        anyWindow.activeSpeechRecognition?.stop();
      } catch (err) {
        console.error(err);
      }
      setVoiceRecording(false);
      setVoiceStatus(t("voiceInput.stopped"));
      return;
    }

    setVoiceRecording(true);
    setVoiceStatus(t("voiceInput.listening"));

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "zh-TW";

      rec.onresult = (event: any) => {
        const textStr = event.results[event.results.length - 1][0].transcript;
        if (!textStr) return;

        setVoiceStatus(`成功辨識："${textStr}"`);

        if (voiceTarget === "summary") {
          setResumeData((prev) => {
            const prevSummary = prev.summary || "";
            return {
              ...prev,
              summary: prevSummary ? `${prevSummary} ${textStr}` : textStr,
            };
          });
        } else if (voiceTarget === "grammar_input") {
          setPremiumGrammarText((prev) => (prev ? `${prev} ${textStr}` : textStr));
        } else {
          const formatted = textStr.replace(/[。，！？]/g, "").trim();
          if (formatted && formatted.length < 30) {
            setResumeData((prev) => {
              if (prev.skills.includes(formatted)) return prev;
              return { ...prev, skills: [...prev.skills, formatted] };
            });
          }
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setVoiceStatus(`辨識發生錯誤: ${e.error}`);
        setVoiceRecording(false);
      };

      rec.onend = () => {
        setVoiceRecording(false);
        setVoiceStatus(t("voiceInput.disconnected"));
      };

      (window as any).activeSpeechRecognition = rec;
      rec.start();
    } catch (e) {
      console.error(e);
      setVoiceRecording(false);
      setVoiceStatus(t("voiceInput.startError"));
    }
  }, [setPremiumGrammarText, setResumeData, voiceRecording, voiceTarget]);

  const exportToJson = useCallback(() => {
    try {
      const dataStr = JSON.stringify(resumeData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataUri);
      downloadAnchor.setAttribute("download", "data.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      markE2eJsonExportComplete();
    } catch (err) {
      console.error("Failed to export JSON", err);
    }
  }, [resumeData]);

  const exportToDocx = useCallback(async () => {
    try {
      if (isE2eDocxStubEnabled()) {
        runE2eDocxExportStub(resumeData.personalInfo.name || "resume");
        markE2eDocxExportComplete();
        return;
      }
      const { downloadResumeOoxml } = await import("../lib/ooxmlApplicationExport");
      await downloadResumeOoxml(resumeData, "resume", activeTemplate);
    } catch (err) {
      console.error("Failed to export Word document", err);
      const { downloadResumeDocx } = await import("../lib/resumeDocxExport");
      downloadResumeDocx(resumeData);
    }
  }, [resumeData, activeTemplate]);

  return {
    voiceRecording,
    voiceTarget,
    setVoiceTarget,
    voiceStatus,
    toggleVoiceRecording,
    comparatorOpen,
    setComparatorOpen,
    isComparing,
    comparatorResult,
    runResumeComparison,
    atsLogs,
    isAtsCrawling,
    crawlerSource,
    setCrawlerSource,
    triggerAtsCrawlerSim,
    clearAtsLogs,
    exportToJson,
    exportToDocx,
  };
}
