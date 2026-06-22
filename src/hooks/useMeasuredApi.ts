import { useCallback, useState } from "react";
import { getActiveLocale } from "../i18n/translate";
import { getActiveMarket } from "../lib/market/config";
import { getOrCreateClientId } from "../lib/subscription/clientId";
import { getSubscriptionSnapshot } from "../lib/subscriptionSnapshot";
import {
  buildSubscriptionHeaders,
  syncSubscriptionFromResponse,
} from "../lib/subscription/usageLedger";

export type SystemLogType = "info" | "warn" | "error";

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
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>([
    {
      id: "init",
      timestamp: new Date().toLocaleTimeString(),
      type: "info",
      message: "NextStepResume.ai Engine 核心引擎就緒：工作區已載入基礎模組。",
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
    addSystemLog("info", `正在呼叫 API 請求: ${urlStr}`);

    try {
      const headers = new Headers(init?.headers);
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
      addSystemLog("info", `API 回應成功 ← ${urlStr} 耗時 ${latencyValue}ms (狀態碼: ${response.status})`);
      return response;
    } catch (err: unknown) {
      const latencyValue = Math.round(performance.now() - startTime);
      setApiLatency(latencyValue);
      setApiLogs((prev) => [
        { url: urlStr, latency: latencyValue, status: 0, timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 24),
      ]);
      const message = err instanceof Error ? err.message : String(err);
      addSystemLog("error", `API 異常 ❌ ${urlStr} 耗時 ${latencyValue}ms: ${message}`);
      throw err;
    }
  }, [addSystemLog]);

  const exportSystemLogs = useCallback(() => {
    addSystemLog("info", "開始匯出系統效能及操作日誌。");
    const timestampString = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `system_logs_${timestampString}.log`;
    const logContent =
      `=====================================================\nNEXTSTEPRESUME.AI SYSTEM DIAGNOSTIC LOGS\nExported: ${new Date().toLocaleString()}\n=====================================================\n\n` +
      systemLogs.map((log) => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join("\n");

    const blob = new Blob([logContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addSystemLog("info", `日誌備份完成 💾 檔案名: ${filename}`);
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
