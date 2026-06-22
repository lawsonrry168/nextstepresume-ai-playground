import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { ResumeData } from "../../types";
import type { ChatMessage } from "../../hooks/useGeminiChat";
import { useI18n } from "../../i18n";

export interface GeminiChatSidebarProps {
  open: boolean;
  onClose: () => void;
  thinkingMode: boolean;
  onThinkingModeChange: (value: boolean) => void;
  chatMessages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  chatLoading: boolean;
  onSendMessage: (presetText?: string) => void;
  resumeData: ResumeData;
}

export default function GeminiChatSidebar({
  open,
  onClose,
  thinkingMode,
  onThinkingModeChange,
  chatMessages,
  chatInput,
  onChatInputChange,
  chatLoading,
  onSendMessage,
  resumeData,
}: GeminiChatSidebarProps) {
  const { t } = useI18n();

  if (!open) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-[100] font-sans no-print"
      id="gemini-chat-sidebar-drawer"
    >
      <div className="p-4 bg-gradient-to-r from-purple-700 via-emerald-600 to-emerald-700 text-white flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-white/10 rounded-lg text-amber-300">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <h3 className="text-sm font-black tracking-wide uppercase">{t("geminiChatSidebar.title")}</h3>
            <p className="text-[10px] text-purple-200">{t("geminiChatSidebar.subtitle")}</p>
          </div>
        </div>

        <button
          id="gemini-chat-btn-close"
          type="button"
          onClick={onClose}
          className="text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer font-bold"
        >
          {t("geminiChatSidebar.close")}
        </button>
      </div>

      <div className="bg-slate-50 border-b border-slate-100 p-3 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">{t("geminiChatSidebar.contextReady")}</span>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <span
              className={`text-[10px] font-bold transition-all ${thinkingMode ? "text-purple-700 font-extrabold animate-pulse" : "text-slate-400"}`}
            >
              {thinkingMode ? t("geminiChatSidebar.thinkingOn") : t("geminiChatSidebar.thinkingOff")}
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={thinkingMode}
                onChange={(e) => onThinkingModeChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600" />
            </div>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-600 font-sans">
          <div
            className="bg-white p-1.5 rounded border border-slate-200 truncate"
            title={resumeData.personalInfo.title}
          >
            💼 {t("geminiChatSidebar.titleLabel")} <strong className="text-slate-800">{resumeData.personalInfo.title || t("geminiChatSidebar.defaultTitle")}</strong>
          </div>
          <div
            className={`p-1.5 rounded border transition-all truncate ${thinkingMode ? "bg-purple-50/50 border-purple-200 text-purple-950 font-bold animate-pulse" : "bg-white border-slate-200"}`}
            title={thinkingMode ? "Gemini 3.1 Pro (Thinking High)" : "Gemini 3.5 Flash"}
          >
            ✨ {t("geminiChatSidebar.engine")} <strong>{thinkingMode ? "Gemini 3.1 Pro" : "Gemini 3.5 Flash"}</strong>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 scrollbar-thin" id="gemini-chat-scroll-area">
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
          >
            <span className="text-[9px] font-mono font-bold text-slate-450 uppercase mb-0.5 px-1">
              {msg.role === "user" ? resumeData.personalInfo.name || t("geminiChatSidebar.candidate") : t("geminiChatSidebar.coach")}
            </span>
            <div
              className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm border ${
                msg.role === "user"
                  ? "bg-emerald-600 text-white border-emerald-500 rounded-tr-none"
                  : "bg-white text-slate-800 border-slate-205 rounded-tl-none border-slate-200"
              }`}
            >
              <div className="space-y-2 whitespace-pre-wrap font-sans">
                {msg.content.split("\n\n").map((para, paraIdx) => {
                  const isBullet = para.trim().startsWith("*") || para.trim().startsWith("-");

                  const parts = para.split("`");
                  const contentElements = parts.map((part, partIdx) => {
                    const isCode = partIdx % 2 === 1;
                    if (isCode) {
                      return (
                        <code
                          key={partIdx}
                          className="bg-slate-100 text-purple-750 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-slate-200"
                        >
                          {part}
                        </code>
                      );
                    }

                    const bParts = part.split("**");
                    return bParts.map((bPart, bPartIdx) => {
                      const isBold = bPartIdx % 2 === 1;
                      return isBold ? (
                        <strong key={bPartIdx} className="font-extrabold text-emerald-600 font-sans">
                          {bPart}
                        </strong>
                      ) : (
                        bPart
                      );
                    });
                  });

                  if (isBullet) {
                    return (
                      <div key={paraIdx} className="pl-3.5 relative text-xs">
                        <span className="absolute left-0 text-purple-500">•</span>
                        <div>{contentElements}</div>
                      </div>
                    );
                  }

                  if (para.trim().startsWith("###")) {
                    return (
                      <h4
                        key={paraIdx}
                        className="text-xs font-black text-slate-850 mt-2 hover:text-slate-900 border-b border-slate-100 pb-0.5 flex items-center gap-1 uppercase tracking-tight text-slate-800"
                      >
                        {para.replace("###", "").trim()}
                      </h4>
                    );
                  }

                  return <p key={paraIdx}>{contentElements}</p>;
                })}
              </div>
            </div>
          </div>
        ))}

        {chatLoading && (
          <div className="flex flex-col text-left max-w-[85%] mr-auto items-start animate-pulse">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase mb-0.5 px-1">
              {t("geminiChatSidebar.coach")}
            </span>
            <div className="p-3 bg-white text-slate-400 border border-slate-200 rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
              <span
                className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              />
              <span>{t("geminiChatSidebar.compiling")}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 space-y-1.5">
        <span className="text-[9px] font-mono font-bold text-slate-450 block uppercase">{t("geminiChatSidebar.suggestedPrompts")}</span>
        <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto">
          <button
            type="button"
            onClick={() => onSendMessage(t("geminiChatSidebar.promptGapsMessage"))}
            className="text-[10px] text-slate-700 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 px-2 py-1.5 rounded-lg border border-slate-200 transition-all text-left truncate max-w-full cursor-pointer shadow-sm font-semibold"
          >
            {t("geminiChatSidebar.promptGaps")}
          </button>
          <button
            type="button"
            onClick={() => onSendMessage(t("geminiChatSidebar.promptSummaryMessage"))}
            className="text-[10px] text-slate-700 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 px-2 py-1.5 rounded-lg border border-slate-200 transition-all text-left truncate max-w-full cursor-pointer shadow-sm font-semibold"
          >
            {t("geminiChatSidebar.promptSummary")}
          </button>
          <button
            type="button"
            onClick={() => onSendMessage(t("geminiChatSidebar.promptStarMessage"))}
            className="text-[10px] text-slate-700 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 px-2 py-1.5 rounded-lg border border-slate-200 transition-all text-left truncate max-w-full cursor-pointer shadow-sm font-semibold"
          >
            {t("geminiChatSidebar.promptStar")}
          </button>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-slate-200 shrink-0 flex gap-2">
        <input
          id="gemini-chat-txt-input"
          type="text"
          value={chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSendMessage();
          }}
          placeholder={t("geminiChatSidebar.inputPlaceholder")}
          className="w-full bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 border border-slate-200 p-2.5 text-xs rounded-xl font-semibold text-slate-800 shadow-inner"
        />
        <button
          id="gemini-chat-btn-submit"
          type="button"
          onClick={() => onSendMessage()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-md transition-all shrink-0 flex items-center gap-1"
        >
          <span>{t("geminiChatSidebar.send")}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
