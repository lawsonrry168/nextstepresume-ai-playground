import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface CollapsiblePanelProps {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

export default function CollapsiblePanel({
  id,
  title,
  subtitle,
  icon,
  defaultOpen = true,
  badge,
  children,
}: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div id={id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-800">{title}</h3>
            {subtitle ? <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open ? (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">{children}</div>
      ) : null}
    </div>
  );
}
