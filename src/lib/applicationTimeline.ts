import type {
  ApplicationEvent,
  ApplicationEventType,
  ApplicationPackage,
} from "../types";
import { t } from "../i18n/translate";

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
  const key = `applicationTimeline.${type}` as const;
  return t(key);
}

export function ensurePackageTimeline(pkg: ApplicationPackage): ApplicationPackage {
  if (pkg.timeline?.length) return pkg;
  return appendTimelineEvent(
    pkg,
    createApplicationEvent(
      "created",
      t("applicationDraft.createdPackage"),
      t("applicationDraft.createdDetail", { company: pkg.companyName, jobTitle: pkg.jobTitle }),
    ),
  );
}
