import { Bell, BellOff, BellRing, Loader2, MessageCircle } from "lucide-react";
import type { FollowUpReminder } from "../../lib/followUpReminderEngine";
import { buildWhatsAppFollowUpUrl } from "../../lib/market/whatsappFollowUp";
import { isHongKongMarket } from "../../lib/market/config";
import { useI18n } from "../../i18n";

interface FollowUpNotificationBarProps {
  supported: boolean;
  enabled: boolean;
  enabling: boolean;
  pendingCount: number;
  pendingReminders: FollowUpReminder[];
  onEnable: () => void;
  onDisable: () => void;
  onSelectPackage?: (packageId: string) => void;
}

export default function FollowUpNotificationBar({
  supported,
  enabled,
  enabling,
  pendingCount,
  pendingReminders,
  onEnable,
  onDisable,
  onSelectPackage,
}: FollowUpNotificationBarProps) {
  const { t } = useI18n();
  const showWhatsApp = isHongKongMarket();

  if (!supported) {
    return (
      <div className="panel-muted px-3 py-2 text-[11px] text-slate-500">
        {t("followUp.unsupported")}
      </div>
    );
  }

  return (
    <div className="notebook-callout space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {enabled ? (
            <BellRing className="w-4 h-4 text-[var(--m-margin,#c0392b)] shrink-0" />
          ) : (
            <Bell className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <div>
            <p className="text-xs font-bold text-slate-900">{t("followUp.title")}</p>
            <p className="text-[10px] text-slate-500">
              {enabled ? t("followUp.enabledHint") : t("followUp.disabledHint")}
            </p>
            {showWhatsApp ? (
              <p className="text-[10px] text-emerald-700 mt-0.5">{t("followUp.whatsappHint")}</p>
            ) : null}
          </div>
        </div>
        {enabled ? (
          <button
            type="button"
            onClick={onDisable}
            className="notebook-chip inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg cursor-pointer"
          >
            <BellOff className="w-3 h-3" />
            {t("followUp.disable")}
          </button>
        ) : (
          <button
            type="button"
            disabled={enabling}
            onClick={onEnable}
            className="btn-accent inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] disabled:opacity-50 cursor-pointer"
          >
            {enabling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
            {t("followUp.enable")}
          </button>
        )}
      </div>

      {pendingCount > 0 ? (
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase text-[var(--m-graphite,#535c68)]">
            {t("followUp.pending", { count: pendingCount })}
          </p>
          {pendingReminders.slice(0, 3).map((r) => (
            <div key={r.notifyKey} className="notebook-item px-2 py-1.5 space-y-1.5">
              <button
                type="button"
                onClick={() => onSelectPackage?.(r.packageId)}
                className="w-full text-left cursor-pointer"
              >
                <p className="text-[11px] font-bold text-slate-800">{r.title}</p>
                <p className="text-[10px] text-slate-500 line-clamp-1">{r.body}</p>
              </button>
              {showWhatsApp ? (
                <a
                  href={buildWhatsAppFollowUpUrl({
                    companyName: r.companyName,
                    jobTitle: r.jobTitle,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900"
                >
                  <MessageCircle className="w-3 h-3" />
                  {t("followUp.whatsappOpen")}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : enabled ? (
        <p className="text-[10px] text-[var(--m-rule,#5b8fb9)]">{t("followUp.noPending")}</p>
      ) : null}
    </div>
  );
}
