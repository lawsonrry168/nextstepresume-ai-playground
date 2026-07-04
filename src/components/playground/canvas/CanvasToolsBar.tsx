import { useMemo, type ReactNode } from "react";
import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Copy,
  Crosshair,
  Eye,
  EyeOff,
  Focus,
  Grid3x3,
  ImagePlus,
  Lock,
  LockOpen,
  Magnet,
  Maximize2,
  MoveDown,
  MoveRight,
  Minus,
  MoveUp,
  Plus,
  RotateCcw,
  Square,
  Trash2,
  Type,
  Unlock,
  Wand2,
} from "lucide-react";
import type { CanvasAlignHorizontal, CanvasAlignVertical } from "../../../lib/canvasAlignTools";
import type { CanvasNavSectionId } from "../../../lib/canvasStudioTypes";
import { useI18n } from "../../../i18n";

export interface CanvasToolsBarProps {
  hasSelection: boolean;
  isHidden: boolean;
  isLocked: boolean;
  showGrid: boolean;
  gridStrength: number;
  onGridStrengthChange: (value: number) => void;
  showMargins: boolean;
  snapEnabled: boolean;
  livePreview: boolean;
  pageCount: number;
  onToggleGrid: () => void;
  onToggleMargins: () => void;
  onToggleSnap: () => void;
  onToggleLivePreview: () => void;
  onToggleHide: () => void;
  onToggleLock: () => void;
  onLayerUp: () => void;
  onLayerDown: () => void;
  onLayerFront: () => void;
  onLayerBack: () => void;
  onAlign: (h?: CanvasAlignHorizontal, v?: CanvasAlignVertical) => void;
  onCenter: () => void;
  onFillWidth: () => void;
  onMoveToActivePage: () => void;
  onSnapToGrid: () => void;
  onGrowWidth: () => void;
  onShrinkWidth: () => void;
  onGrowHeight: () => void;
  onShrinkHeight: () => void;
  onResetSection: () => void;
  onShowAllLayers: () => void;
  onUnlockAllLayers: () => void;
  onResetLayout: () => void;
  onAddPage: () => void;
  onDuplicatePage: () => void;
  onRemovePage: () => void;
  onFocusPage: () => void;
  onFit: () => void;
  onZoom100: () => void;
  onZoom50: () => void;
  /** Custom element insertion (phase 8) */
  onAddElement?: (kind: "text" | "photo" | "divider") => void;
  /** One-click engine tidy (phase 9) */
  onAutoTidy?: () => void;
}

function ToolBtn({
  active,
  disabled,
  title,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  title: string;
  label?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`canvas-nav-tool-btn ${active ? "canvas-nav-tool-btn--active" : ""}`}
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {children}
      {label ? <span className="canvas-nav-tool-label">{label}</span> : null}
    </button>
  );
}

function ToolGrid({ children }: { children: ReactNode }) {
  return <div className="canvas-nav-tool-grid">{children}</div>;
}

export function buildCanvasToolSections(
  props: CanvasToolsBarProps,
  t: (key: string) => string,
): Partial<Record<CanvasNavSectionId, ReactNode>> {
  const {
    hasSelection,
    isHidden,
    isLocked,
    showGrid,
    gridStrength,
    onGridStrengthChange,
    showMargins,
    snapEnabled,
    livePreview,
    pageCount,
    onToggleGrid,
    onToggleMargins,
    onToggleSnap,
    onToggleLivePreview,
    onToggleHide,
    onToggleLock,
    onLayerUp,
    onLayerDown,
    onLayerFront,
    onLayerBack,
    onAlign,
    onCenter,
    onFillWidth,
    onMoveToActivePage,
    onSnapToGrid,
    onGrowWidth,
    onShrinkWidth,
    onGrowHeight,
    onShrinkHeight,
    onResetSection,
    onShowAllLayers,
    onUnlockAllLayers,
    onResetLayout,
    onAddPage,
    onDuplicatePage,
    onRemovePage,
    onFocusPage,
    onFit,
    onZoom100,
    onZoom50,
    onAddElement,
    onAutoTidy,
  } = props;

  return {
    view: (
      <>
        <ToolGrid>
          <ToolBtn active={showGrid} title={`${t("canvas.tools.grid")} (G)`} label={t("canvas.tools.grid")} onClick={onToggleGrid}>
            <Grid3x3 className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn active={showMargins} title={`${t("canvas.tools.margins")} (M)`} label={t("canvas.tools.margins")} onClick={onToggleMargins}>
            <Square className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn active={snapEnabled} title={t("canvas.tools.snapMagnet")} label={t("canvas.tools.snap")} onClick={onToggleSnap}>
            <Magnet className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn active={livePreview} title={t("canvas.tools.preview")} label={t("canvas.tools.preview")} onClick={onToggleLivePreview}>
            <Eye className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn title={t("canvas.dock.fitView")} label={t("canvas.tools.fit")} onClick={onFit}>
            <Maximize2 className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn title={t("canvas.shortcuts.zoom50")} label="50%" onClick={onZoom50}>
            <span className="text-[10px] font-bold font-mono">50</span>
          </ToolBtn>
          <ToolBtn title={t("canvas.shortcuts.zoom100")} label="100%" onClick={onZoom100}>
            <span className="text-[10px] font-bold font-mono">100</span>
          </ToolBtn>
        </ToolGrid>
        {showGrid ? (
          <div className="canvas-grid-strength-control">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="canvas-grid-strength-label">{t("canvas.tools.gridStrength")}</span>
              <span className="canvas-grid-strength-value">{gridStrength}%</span>
            </div>
            <input
              type="range"
              className="canvas-grid-strength-slider w-full"
              min={10}
              max={100}
              step={5}
              value={gridStrength}
              onChange={(e) => onGridStrengthChange(Number(e.target.value))}
              aria-label={t("canvas.tools.gridStrength")}
              title={t("canvas.tools.adjustGridStrength")}
            />
          </div>
        ) : null}
      </>
    ),
    layers: (
      <ToolGrid>
        <ToolBtn disabled={!hasSelection} title={`${t("canvas.layers.hide")} (H)`} label={t("canvas.layers.hide")} onClick={onToggleHide}>
          <EyeOff className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={`${t("canvas.layers.lock")} (Shift+L)`} label={t("canvas.layers.lock")} onClick={onToggleLock}>
          {isLocked ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={`${t("canvas.layers.moveUp")} (])`} label={t("canvas.layers.moveUp")} onClick={onLayerUp}>
          <ChevronUp className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={`${t("canvas.layers.moveDown")} ([)`} label={t("canvas.layers.moveDown")} onClick={onLayerDown}>
          <ChevronDown className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={`${t("canvas.layers.moveFront")} (Shift+])`} label={t("canvas.layers.moveFront")} onClick={onLayerFront}>
          <MoveUp className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={`${t("canvas.layers.moveBack")} (Shift+[)`} label={t("canvas.layers.moveBack")} onClick={onLayerBack}>
          <MoveDown className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title={`${t("canvas.shortcuts.show-all")} (Shift+H)`} label={t("canvas.tools.showAll")} onClick={onShowAllLayers}>
          <Eye className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title={`${t("canvas.shortcuts.unlock-all")} (Shift+U)`} label={t("canvas.tools.unlockAll")} onClick={onUnlockAllLayers}>
          <Unlock className="w-4 h-4" />
        </ToolBtn>
      </ToolGrid>
    ),
    align: (
      <ToolGrid>
        <ToolBtn disabled={!hasSelection} title={t("canvas.tools.alignLeft")} label={t("canvas.tools.alignLeft")} onClick={() => onAlign("left", undefined)}>
          <AlignHorizontalJustifyStart className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={t("canvas.tools.alignCenter")} label={t("canvas.tools.alignCenter")} onClick={() => onAlign("center", undefined)}>
          <AlignHorizontalJustifyCenter className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={t("canvas.tools.alignRight")} label={t("canvas.tools.alignRight")} onClick={() => onAlign("right", undefined)}>
          <AlignHorizontalJustifyEnd className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={t("canvas.tools.alignTop")} label={t("canvas.tools.alignTop")} onClick={() => onAlign(undefined, "top")}>
          <AlignVerticalJustifyStart className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={t("canvas.tools.alignMiddle")} label={t("canvas.tools.alignMiddle")} onClick={() => onAlign(undefined, "middle")}>
          <AlignVerticalJustifyCenter className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={t("canvas.tools.alignBottom")} label={t("canvas.tools.alignBottom")} onClick={() => onAlign(undefined, "bottom")}>
          <AlignVerticalJustifyEnd className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={`${t("canvas.shortcuts.center")} (C)`} label={t("canvas.tools.pageCenter")} onClick={onCenter}>
          <Crosshair className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={`${t("canvas.shortcuts.fill-width")} (Shift+W)`} label={t("canvas.tools.fillWidth")} onClick={onFillWidth}>
          <ArrowDownToLine className="w-4 h-4 rotate-90" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={`${t("canvas.shortcuts.move-page")} (Shift+M)`} label={t("canvas.tools.moveToPage")} onClick={onMoveToActivePage}>
          <MoveRight className="w-4 h-4" />
        </ToolBtn>
      </ToolGrid>
    ),
    size: (
      <ToolGrid>
        <ToolBtn disabled={!hasSelection} title={`${t("canvas.tools.growWidth")} (Shift+→)`} label={t("canvas.tools.growWidth")} onClick={onGrowWidth}>
          <ArrowLeftRight className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={`${t("canvas.tools.shrinkWidth")} (Shift+←)`} label={t("canvas.tools.shrinkWidth")} onClick={onShrinkWidth}>
          <ArrowLeftRight className="w-4 h-4 scale-x-[-1]" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={`${t("canvas.tools.growHeight")} (Shift+↑)`} label={t("canvas.tools.growHeight")} onClick={onGrowHeight}>
          <ArrowUpDown className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={`${t("canvas.tools.shrinkHeight")} (Shift+↓)`} label={t("canvas.tools.shrinkHeight")} onClick={onShrinkHeight}>
          <ArrowUpDown className="w-4 h-4 scale-y-[-1]" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={`${t("canvas.tools.snapToGrid")} (S)`} label={t("canvas.tools.snapToGrid")} onClick={onSnapToGrid}>
          <Grid3x3 className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn disabled={!hasSelection} title={t("canvas.tools.resetSection")} label={t("canvas.tools.resetSection")} onClick={onResetSection}>
          <RotateCcw className="w-4 h-4" />
        </ToolBtn>
      </ToolGrid>
    ),
    page: (
      <ToolGrid>
        <ToolBtn title={`${t("canvas.tools.addPage")} (P)`} label={t("canvas.tools.addPage")} onClick={onAddPage}>
          <Plus className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title={`${t("canvas.tools.duplicatePage")} (Shift+P)`} label={t("canvas.tools.duplicatePage")} onClick={onDuplicatePage}>
          <Copy className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn disabled={pageCount <= 1} title={`${t("canvas.tools.removePage")} (Delete)`} label={t("canvas.tools.removePage")} onClick={onRemovePage}>
          <Trash2 className="w-4 h-4" />
        </ToolBtn>
        {pageCount > 1 ? (
          <ToolBtn title={`${t("canvas.tools.focusPage")} (Home)`} label={t("canvas.tools.focusPage")} onClick={onFocusPage}>
            <Focus className="w-4 h-4" />
          </ToolBtn>
        ) : null}
        <ToolBtn title={t("canvas.tools.resetLayout")} label={t("canvas.tools.resetLayout")} onClick={onResetLayout}>
          <RotateCcw className="w-4 h-4" />
        </ToolBtn>
        {onAutoTidy ? (
          <ToolBtn title={t("canvas.tools.autoTidy")} label={t("canvas.tools.autoTidy")} onClick={onAutoTidy}>
            <Wand2 className="w-4 h-4" />
          </ToolBtn>
        ) : null}
        {onAddElement ? (
          <>
            <ToolBtn title={t("canvas.elements.addText")} label={t("canvas.elements.text")} onClick={() => onAddElement("text")}>
              <Type className="w-4 h-4" />
            </ToolBtn>
            <ToolBtn title={t("canvas.elements.addPhoto")} label={t("canvas.elements.photo")} onClick={() => onAddElement("photo")}>
              <ImagePlus className="w-4 h-4" />
            </ToolBtn>
            <ToolBtn title={t("canvas.elements.addDivider")} label={t("canvas.elements.divider")} onClick={() => onAddElement("divider")}>
              <Minus className="w-4 h-4" />
            </ToolBtn>
          </>
        ) : null}
      </ToolGrid>
    ),
  };
}

export function useCanvasToolSections(props: CanvasToolsBarProps) {
  const { t } = useI18n();
  return useMemo(() => buildCanvasToolSections(props, t), [props, t]);
}
