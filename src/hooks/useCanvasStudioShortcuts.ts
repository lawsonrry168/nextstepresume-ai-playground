import { useEffect } from "react";

export interface CanvasShortcutActions {
  onToggleShortcuts?: () => void;
  onSelectLayerUp?: () => void;
  onSelectLayerDown?: () => void;
  onLayerOrderUp?: () => void;
  onLayerOrderDown?: () => void;
  onLayerToFront?: () => void;
  onLayerToBack?: () => void;
  onToggleHide?: () => void;
  onToggleLock?: () => void;
  onToggleLayerPanel?: () => void;
  onToggleRightNav?: () => void;
  onAddPage?: () => void;
  onDuplicatePage?: () => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onFit?: () => void;
  onResetView?: () => void;
  onDeselect?: () => void;
  onToggleGrid?: () => void;
  onToggleMargins?: () => void;
  onZoom100?: () => void;
  onZoom50?: () => void;
  onFocusPage?: () => void;
  onRemovePage?: () => void;
  onShowAllLayers?: () => void;
  onUnlockAllLayers?: () => void;
  onCenter?: () => void;
  onFillWidth?: () => void;
  onMoveToActivePage?: () => void;
  onResetLayout?: () => void;
  onNudge?: (dx: number, dy: number) => void;
  onAlignLeft?: () => void;
  onAlignRight?: () => void;
  onAlignTop?: () => void;
  onAlignBottom?: () => void;
  onSnapToGrid?: () => void;
  onGrowWidth?: () => void;
  onShrinkWidth?: () => void;
  onGrowHeight?: () => void;
  onShrinkHeight?: () => void;
  onResetSection?: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  const tag = (target as HTMLElement | null)?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function useCanvasStudioShortcuts(enabled: boolean, actions: CanvasShortcutActions) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();
      const shift = e.shiftKey;
      const mod = e.ctrlKey || e.metaKey;
      const alt = e.altKey;

      if (key === "?" || (key === "/" && shift)) {
        e.preventDefault();
        actions.onToggleShortcuts?.();
        return;
      }

      if (alt && !mod) {
        const step = shift ? 24 : 1;
        if (key === "arrowleft") {
          e.preventDefault();
          actions.onNudge?.(-step, 0);
          return;
        }
        if (key === "arrowright") {
          e.preventDefault();
          actions.onNudge?.(step, 0);
          return;
        }
        if (key === "arrowup") {
          e.preventDefault();
          actions.onNudge?.(0, -step);
          return;
        }
        if (key === "arrowdown") {
          e.preventDefault();
          actions.onNudge?.(0, step);
          return;
        }
      }

      if (mod && !alt) {
        if (key === "arrowleft") {
          e.preventDefault();
          actions.onAlignLeft?.();
          return;
        }
        if (key === "arrowright") {
          e.preventDefault();
          actions.onAlignRight?.();
          return;
        }
        if (key === "arrowup") {
          e.preventDefault();
          actions.onAlignTop?.();
          return;
        }
        if (key === "arrowdown") {
          e.preventDefault();
          actions.onAlignBottom?.();
          return;
        }
        return;
      }

      if (mod) return;

      if (shift && !alt) {
        if (key === "arrowright") {
          e.preventDefault();
          actions.onGrowWidth?.();
          return;
        }
        if (key === "arrowleft") {
          e.preventDefault();
          actions.onShrinkWidth?.();
          return;
        }
        if (key === "arrowup") {
          e.preventDefault();
          actions.onGrowHeight?.();
          return;
        }
        if (key === "arrowdown") {
          e.preventDefault();
          actions.onShrinkHeight?.();
          return;
        }
      }

      if (key === "arrowup") {
        e.preventDefault();
        actions.onSelectLayerUp?.();
        return;
      }
      if (key === "arrowdown") {
        e.preventDefault();
        actions.onSelectLayerDown?.();
        return;
      }
      if (key === "]" && shift) {
        e.preventDefault();
        actions.onLayerToFront?.();
        return;
      }
      if (key === "[" && shift) {
        e.preventDefault();
        actions.onLayerToBack?.();
        return;
      }
      if (key === "]") {
        e.preventDefault();
        actions.onLayerOrderUp?.();
        return;
      }
      if (key === "[") {
        e.preventDefault();
        actions.onLayerOrderDown?.();
        return;
      }
      if (key === "h" && shift) {
        e.preventDefault();
        actions.onShowAllLayers?.();
        return;
      }
      if (key === "h") {
        e.preventDefault();
        actions.onToggleHide?.();
        return;
      }
      if (key === "u" && shift) {
        e.preventDefault();
        actions.onUnlockAllLayers?.();
        return;
      }
      if (key === "w" && shift) {
        e.preventDefault();
        actions.onFillWidth?.();
        return;
      }
      if (key === "s" && !shift) {
        e.preventDefault();
        actions.onSnapToGrid?.();
        return;
      }
      if (key === "m" && shift) {
        e.preventDefault();
        actions.onMoveToActivePage?.();
        return;
      }
      if (key === "m") {
        e.preventDefault();
        actions.onToggleMargins?.();
        return;
      }
      if (key === "c") {
        e.preventDefault();
        actions.onCenter?.();
        return;
      }
      if (key === "l" && shift) {
        e.preventDefault();
        actions.onToggleLock?.();
        return;
      }
      if (key === "l") {
        e.preventDefault();
        actions.onToggleLayerPanel?.();
        return;
      }
      if (key === "r") {
        e.preventDefault();
        actions.onToggleRightNav?.();
        return;
      }
      if (key === "p" && shift) {
        e.preventDefault();
        actions.onDuplicatePage?.();
        return;
      }
      if (key === "p") {
        e.preventDefault();
        actions.onAddPage?.();
        return;
      }
      if (key === "g") {
        e.preventDefault();
        actions.onToggleGrid?.();
        return;
      }
      if (key === "1") {
        e.preventDefault();
        actions.onZoom100?.();
        return;
      }
      if (key === "5") {
        e.preventDefault();
        actions.onZoom50?.();
        return;
      }
      if (key === "delete") {
        e.preventDefault();
        actions.onRemovePage?.();
        return;
      }
      if (key === "home") {
        e.preventDefault();
        actions.onFocusPage?.();
        return;
      }
      if (key === "tab" && shift) {
        e.preventDefault();
        actions.onPrevPage?.();
        return;
      }
      if (key === "tab") {
        e.preventDefault();
        actions.onNextPage?.();
        return;
      }
      if (key === "f") {
        e.preventDefault();
        actions.onFit?.();
        return;
      }
      if (key === "0") {
        e.preventDefault();
        actions.onResetView?.();
        return;
      }
      if (key === "escape") {
        actions.onDeselect?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actions, enabled]);
}
