import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { ToastItem } from "../hooks/useStatusToast";

const STYLES: Record<ToastItem["type"], string> = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  error: "bg-rose-50 border-rose-200 text-rose-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  info: "bg-emerald-50 border-blue-200 text-blue-900",
};

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

interface StatusToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export default function StatusToastStack({ toasts, onDismiss }: StatusToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none no-print">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2 p-3 rounded-xl border shadow-lg text-xs font-medium animate-in slide-in-from-right ${STYLES[toast.type]}`}
            role="status"
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="flex-1 leading-relaxed">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer"
              aria-label="關閉通知"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
