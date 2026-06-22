import type { ApplicationEvent } from "../../types";
import { useI18n } from "../../i18n";

interface ApplicationTimelineProps {
  events: ApplicationEvent[];
}

export default function ApplicationTimeline({ events }: ApplicationTimelineProps) {
  const { t, locale } = useI18n();

  if (!events.length) {
    return (
      <p className="text-xs text-slate-500 py-4 text-center">{t("applicationsTimeline.empty")}</p>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const dateLocale = locale === "zh-TW" ? "zh-TW" : "en-US";

  return (
    <ol className="relative border-l border-slate-200 ml-2 space-y-3 py-1 pl-0 list-none">
      {sorted.map((event) => (
        <li key={event.id} className="ml-4">
          <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
          <p className="text-[10px] font-bold uppercase text-slate-400">
            {t(`applicationsTimeline.events.${event.type}`)} · {new Date(event.timestamp).toLocaleString(dateLocale)}
          </p>
          <p className="text-xs font-bold text-slate-800">{event.title}</p>
          {event.detail ? (
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{event.detail}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
