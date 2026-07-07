import { useEffect, useRef } from "react";
import { useI18n } from "../../i18n";

export interface CanvasContextMenuState {
  sectionId: string;
  x: number;
  y: number;
}

export interface CanvasContextMenuActions {
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onToggleLock?: () => void;
  onToggleHide?: () => void;
  onBringFront?: () => void;
  onSendBack?: () => void;
  onFitContent?: () => void;
  onMoveToActivePage?: () => void;
  canPaste?: boolean;
  isCanvasElement?: boolean;
  isLocked?: boolean;
  isHidden?: boolean;
}

interface CanvasContextMenuProps {
  menu: CanvasContextMenuState | null;
  actions: CanvasContextMenuActions;
  onClose: () => void;
}

export default function CanvasContextMenu({ menu, actions, onClose }: CanvasContextMenuProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current?.contains(e.target as Node)) return;
      onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  const itemClass =
    "w-full text-left text-[11px] px-2.5 py-1.5 hover:bg-sky-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none";

  return (
    <div
      ref={ref}
      className="fixed z-[200] min-w-[168px] bg-white border border-slate-200 rounded-lg shadow-xl py-1"
      style={{ left: menu.x, top: menu.y }}
      data-canvas-chrome
      role="menu"
    >
      <button type="button" className={itemClass} onClick={() => { actions.onCopy?.(); onClose(); }}>
        {t("canvas.context.copy")}
      </button>
      <button
        type="button"
        className={itemClass}
        disabled={!actions.canPaste}
        onClick={() => { actions.onPaste?.(); onClose(); }}
      >
        {t("canvas.context.paste")}
      </button>
      <button type="button" className={itemClass} onClick={() => { actions.onDuplicate?.(); onClose(); }}>
        {t("canvas.context.duplicate")}
      </button>
      <div className="my-1 border-t border-slate-100" />
      {actions.isCanvasElement ? (
        <button type="button" className={`${itemClass} text-red-600 hover:bg-red-50`} onClick={() => { actions.onDelete?.(); onClose(); }}>
          {t("canvas.context.delete")}
        </button>
      ) : null}
      <button type="button" className={itemClass} onClick={() => { actions.onFitContent?.(); onClose(); }}>
        {t("canvas.context.fitContent")}
      </button>
      <button type="button" className={itemClass} onClick={() => { actions.onMoveToActivePage?.(); onClose(); }}>
        {t("canvas.context.moveToPage")}
      </button>
      <div className="my-1 border-t border-slate-100" />
      <button type="button" className={itemClass} onClick={() => { actions.onBringFront?.(); onClose(); }}>
        {t("canvas.context.bringFront")}
      </button>
      <button type="button" className={itemClass} onClick={() => { actions.onSendBack?.(); onClose(); }}>
        {t("canvas.context.sendBack")}
      </button>
      <button type="button" className={itemClass} onClick={() => { actions.onToggleLock?.(); onClose(); }}>
        {actions.isLocked ? t("canvas.context.unlock") : t("canvas.context.lock")}
      </button>
      <button type="button" className={itemClass} onClick={() => { actions.onToggleHide?.(); onClose(); }}>
        {actions.isHidden ? t("canvas.context.show") : t("canvas.context.hide")}
      </button>
    </div>
  );
}
