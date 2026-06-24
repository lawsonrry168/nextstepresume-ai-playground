import { useCallback, useState } from "react";
import { t } from "../i18n/translate";
import { getActiveLocale } from "../i18n/translate";
import { getActiveMarket } from "../lib/market/config";
import { apiResponseLogLevel, apiResponseOutcomeKey } from "../lib/apiLogMessages";
import { getOrCreateClientId } from "../lib/subscription/clientId";
import { withApiAuthHeaders } from "../lib/apiAuthHeaders";
import { getSubscriptionSnapshot } from "../lib/subscriptionSnapshot";
import {
  buildSubscriptionHeaders,
  syncSubscriptionFromResponse,
} from "../lib/subscription/usageLedger";

export type SystemLogType = "info" | "warn" | "error";

export { apiResponseLogLevel, apiResponseOutcomeKey } from "../lib/apiLogMessages";

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  type: SystemLogType;
  message: string;
}

export interface ApiLogEntry {
  url: string;
  latency: number;
  status: number;
  timestamp: string;
}

export function useMeasuredApi(onLog?: (type: SystemLogType, message: string) => void) {
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>(() => [
    {
      id: "init",
      timestamp: new Date().toLocaleTimeString(),
      type: "info",
      message: t("systemLog.engineReady"),
    },
  ]);

  const addSystemLog = useCallback((type: SystemLogType, message: string) => {
    const entry: SystemLogEntry = {
      id: Math.random().toString(36).substring(4),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setSystemLogs((prev) => [...prev, entry]);
    onLog?.(type, message);
  }, [onLog]);

  const measuredFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const startTime = performance.now();
    const urlStr = typeof input === "string" ? input : (input as Request).url || String(input);
    addSystemLog("info", t("systemLog.apiCalling", { url: urlStr }));

    try {
      const headers = withApiAuthHeaders(init?.headers);
      headers.set("X-Locale", getActiveLocale());
      headers.set("X-Market", getActiveMarket().id);
      const clientId = getOrCreateClientId();
      headers.set("X-NSR-Client-Id", clientId);
      const snapshot = getSubscriptionSnapshot();
      const subHeaders = buildSubscriptionHeaders(
        snapshot.plan,
        { month: snapshot.usageMonth, usage: snapshot.usage },
        clientId,
      );
      for (const [key, value] of Object.entries(subHeaders)) {
        headers.set(key, value);
      }
      const response = await fetch(input, { ...init, headers });
      syncSubscriptionFromResponse(response);
      const latencyValue = Math.round(performance.now() - startTime);
      setApiLatency(latencyValue);
      setApiLogs((prev) => [
        { url: urlStr, latency: latencyValue, status: response.status, timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 24),
      ]);
      const outcomeKey = apiResponseOutcomeKey(response.status);
      addSystemLog(
        apiResponseLogLevel(response.status),
        t("systemLog.apiResponse", {
          outcome: t(`systemLog.outcome.${outcomeKey}`),
          url: urlStr,
          latency: latencyValue,
          status: response.status,
        }),
      );
      return response;
    } catch (err: unknown) {
      const latencyValue = Math.round(performance.now() - startTime);
      setApiLatency(latencyValue);
      setApiLogs((prev) => [
        { url: urlStr, latency: latencyValue, status: 0, timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 24),
      ]);
      const message = err instanceof Error ? err.message : String(err);
      addSystemLog("error", t("systemLog.apiError", { url: urlStr, latency: latencyValue, message }));
      throw err;
    }
  }, [addSystemLog]);

  const exportSystemLogs = useCallback(() => {
    addSystemLog("info", t("systemLog.exportLogsStart"));
    const logText = systemLogs.map((log) => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join("\n");
    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = `nextstepresume-system-logs-${Date.now()}.txt`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addSystemLog("info", t("systemLog.exportLogsDone", { filename }));
  }, [addSystemLog, systemLogs]);

  return {
    apiLatency,
    apiLogs,
    systemLogs,
    addSystemLog,
    measuredFetch,
    exportSystemLogs,
  };
}
