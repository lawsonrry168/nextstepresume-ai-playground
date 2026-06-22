import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { NSR_STORAGE_KEYS } from "../../lib/storageKeys";
import { useI18n } from "../../i18n";

interface ResizableSplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  storageKey?: string;
  /** 左側佔可用寬度比例（0–1） */
  defaultRatio?: number;
  minLeftPx?: number;
  minRightPx?: number;
  className?: string;
}

function readStoredRatio(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) {
      const n = parseFloat(raw);
      if (!Number.isNaN(n) && n > 0.2 && n < 0.85) return n;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export default function ResizableSplitPane({
  left,
  right,
  storageKey = NSR_STORAGE_KEYS.editorPreviewSplit,
  defaultRatio = 0.48,
  minLeftPx = 260,
  minRightPx = 240,
  className = "",
}: ResizableSplitPaneProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftRatio, setLeftRatio] = useState(() => readStoredRatio(storageKey, defaultRatio));
  const [dragging, setDragging] = useState(false);

  const persistRatio = useCallback(
    (ratio: number) => {
      try {
        localStorage.setItem(storageKey, String(ratio));
      } catch {
        // ignore
      }
    },
    [storageKey]
  );

  const clampRatio = useCallback(
    (ratio: number, containerWidth: number) => {
      const divider = 6;
      const available = containerWidth - divider;
      if (available <= 0) return ratio;
      const minLeftRatio = minLeftPx / available;
      const maxLeftRatio = (available - minRightPx) / available;
      return Math.min(maxLeftRatio, Math.max(minLeftRatio, ratio));
    },
    [minLeftPx, minRightPx]
  );

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const divider = 6;
      const x = e.clientX - rect.left;
      const rawRatio = x / (rect.width - divider);
      setLeftRatio(clampRatio(rawRatio, rect.width));
    };

    const onUp = () => {
      setDragging(false);
      setLeftRatio((current) => {
        persistRatio(current);
        return current;
      });
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, clampRatio, persistRatio]);

  const handleDividerMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDividerDoubleClick = () => {
    setLeftRatio(defaultRatio);
    persistRatio(defaultRatio);
  };

  const leftPercent = `${leftRatio * 100}%`;

  return (
    <div
      ref={containerRef}
      className={`flex flex-1 min-w-0 min-h-0 h-full overflow-hidden ${className}`}
      id="playground-split-pane"
      data-dragging={dragging ? "true" : "false"}
    >
      <div
        className="min-h-0 min-w-0 overflow-hidden flex flex-col shrink-0"
        style={{ width: leftPercent }}
        id="config-col-wrap"
      >
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={t("splitPane.ariaLabel")}
        title={t("splitPane.title")}
        onMouseDown={handleDividerMouseDown}
        onDoubleClick={handleDividerDoubleClick}
        className={`split-divider group relative w-[6px] shrink-0 cursor-col-resize flex items-center justify-center z-10 transition-colors ${
          dragging ? "split-divider--active" : ""
        }`}
        data-dragging={dragging ? "true" : "false"}
        id="playground-split-divider"
      >
        <div
          className={`split-divider-handle flex items-center justify-center w-4 h-10 rounded-full border shadow-sm transition-colors ${
            dragging ? "split-divider-handle--active" : ""
          }`}
        >
          <GripVertical className="w-3 h-3" />
        </div>
      </div>

      <div className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col" id="preview-col-wrap">
        {right}
      </div>
    </div>
  );
}
