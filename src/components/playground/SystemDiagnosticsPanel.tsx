import { LayoutGrid, Download } from "lucide-react";
import type { ApiLogEntry } from "../../hooks/useMeasuredApi";
import { useI18n } from "../../i18n";

export interface SystemDiagnosticsPanelProps {
  apiLatency: number | null;
  apiLogs: ApiLogEntry[];
  onExportLogs: () => void;
  onOpenShortcutsGuide: () => void;
  /** 嵌入摺疊面板時省略外層卡片 */
  embedded?: boolean;
}

export default function SystemDiagnosticsPanel({
  apiLatency,
  apiLogs,
  onExportLogs,
  onOpenShortcutsGuide,
  embedded = false,
}: SystemDiagnosticsPanelProps) {
  const { t } = useI18n();

  const content = (
    <>
      {!embedded && (
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-slate-50 text-emerald-600 border border-slate-100">
              <LayoutGrid className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest font-sans">
                {t("diagnostics.title")}
              </h3>
              <p className="text-[9px] text-slate-400 font-medium font-sans">{t("diagnostics.subtitle")}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenShortcutsGuide}
            className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
            title={t("diagnostics.shortcutsTitle")}
          >
            <span className="text-xs font-black px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">
              ?
            </span>
          </button>
        </div>
      )}

      <div className="space-y-1.5 font-sans">
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
          {t("diagnostics.latencyLabel")}
        </span>
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                apiLatency === null
                  ? "bg-slate-300"
                  : apiLatency < 300
                    ? "bg-emerald-500 animate-pulse"
                    : apiLatency <= 1000
                      ? "bg-amber-500"
                      : "bg-rose-500 animate-ping"
              }`}
            />
            <span className="text-xs font-bold text-slate-700">
              {apiLatency === null ? t("diagnostics.idle") : t("diagnostics.latestLatency")}
            </span>
          </div>

          <span
            className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
              apiLatency === null
                ? "bg-slate-200 text-slate-600"
                : apiLatency < 300
                  ? "bg-emerald-100 text-emerald-800"
                  : apiLatency <= 1000
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
            }`}
          >
            {apiLatency === null ? "-- ms" : `${apiLatency}ms`}
          </span>
        </div>
      </div>

      <div className="pt-1 font-sans">
        <button
          type="button"
          onClick={onExportLogs}
          className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          title={t("diagnostics.exportLogsTitle")}
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span>{t("diagnostics.exportLogs")}</span>
        </button>
      </div>

      {apiLogs.length > 0 && (
        <div className="bg-slate-50 p-2 border border-slate-200 rounded-xl space-y-1">
          <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-wider font-sans">
            <span>{t("diagnostics.trace")}</span>
            <span>{t("diagnostics.duration")}</span>
          </div>
          <div className="space-y-1 max-h-14 overflow-y-auto font-mono text-[8px] pr-1">
            {apiLogs.slice(0, 3).map((log, idx) => (
              <div key={idx} className="flex justify-between text-slate-500">
                <span className="truncate max-w-[120px]" title={log.url}>
                  [{log.timestamp}] {log.url.split("/").pop()}
                </span>
                <span
                  className={
                    log.latency < 300
                      ? "text-emerald-600 font-bold"
                      : log.latency <= 1500
                        ? "text-amber-600 font-bold"
                        : "text-rose-600 font-bold"
                  }
                >
                  {log.status === 0 ? t("diagnostics.failed") : `${log.latency}ms`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (embedded) {
    return <div className="space-y-3" id="system-diagnostic-panel">{content}</div>;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm" id="system-diagnostic-panel">
      {content}
    </div>
  );
}
