import { CANVAS_PAGE_HEIGHT, CANVAS_PAGE_WIDTH } from "../../../lib/canvasStudioTypes";
import { CANVAS_PAGE_MARGIN } from "../../../lib/canvasAlignTools";
import { useI18n } from "../../../i18n";

export interface CanvasPageMarginGuidesProps {
  pageWidth?: number;
  pageHeight?: number;
  margin?: number;
}

/** Printable safe-zone overlay for A4 canvas pages */
export default function CanvasPageMarginGuides({
  pageWidth = CANVAS_PAGE_WIDTH,
  pageHeight = CANVAS_PAGE_HEIGHT,
  margin = CANVAS_PAGE_MARGIN,
}: CanvasPageMarginGuidesProps) {
  const { t } = useI18n();
  const innerW = pageWidth - margin * 2;
  const innerH = pageHeight - margin * 2;

  return (
    <div
      className="canvas-page-margin-guides pointer-events-none absolute inset-0 z-[5]"
      data-canvas-chrome
      aria-hidden
    >
      <div
        className="canvas-page-margin-guide-box absolute border border-dashed border-amber-500/45 rounded-sm"
        style={{ left: margin, top: margin, width: innerW, height: innerH }}
      />
      <span
        className="canvas-page-margin-label absolute text-[9px] font-bold font-mono text-amber-600/70"
        style={{ left: margin + 4, top: margin + 2 }}
      >
        {t("canvasMargin.safeZone", { margin })}
      </span>
    </div>
  );
}
