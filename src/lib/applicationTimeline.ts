import type {
  ApplicationEvent,
  ApplicationEventType,
  ApplicationPackage,
} from "../types";

export function createApplicationEvent(
  type: ApplicationEventType,
  title: string,
  detail?: string
): ApplicationEvent {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    title,
    detail,
  };
}

export function appendTimelineEvent(
  pkg: ApplicationPackage,
  event: ApplicationEvent
): ApplicationPackage {
  const timeline = [...(pkg.timeline ?? []), event].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return { ...pkg, timeline };
}

export function timelineLabel(type: ApplicationEventType): string {
  const map: Record<ApplicationEventType, string> = {
    created: "建立套件",
    status_change: "狀態更新",
    applied: "已投遞",
    interview_scheduled: "面試排程",
    follow_up: "追蹤提醒",
    note: "備註",
  };
  return map[type];
}

export function ensurePackageTimeline(pkg: ApplicationPackage): ApplicationPackage {
  if (pkg.timeline?.length) return pkg;
  return appendTimelineEvent(
    pkg,
    createApplicationEvent("created", "建立應徵套件", `${pkg.companyName} · ${pkg.jobTitle}`)
  );
}
