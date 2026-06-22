import { useMemo, type ReactNode } from "react";
import type { CanvasNavSectionId } from "../../../lib/canvasStudioTypes";
import CanvasDraggableNavStack from "./CanvasDraggableNavStack";
import { useCanvasToolSections, type CanvasToolsBarProps } from "./CanvasToolsBar";
import CanvasLayoutPanel, { type CanvasLayoutPanelProps } from "./CanvasLayoutPanel";

export interface CanvasRightNavSectionsProps {
  order: CanvasNavSectionId[];
  onReorder: (order: CanvasNavSectionId[]) => void;
  toolsBarProps: CanvasToolsBarProps;
  layoutPanelProps: CanvasLayoutPanelProps;
}

export default function CanvasRightNavSections({
  order,
  onReorder,
  toolsBarProps,
  layoutPanelProps,
}: CanvasRightNavSectionsProps) {
  const toolSections = useCanvasToolSections(toolsBarProps);
  const sections = useMemo(() => {
    return {
      ...toolSections,
      layout: <CanvasLayoutPanel {...layoutPanelProps} />,
    } as Record<CanvasNavSectionId, ReactNode>;
  }, [toolSections, layoutPanelProps]);

  return <CanvasDraggableNavStack order={order} sections={sections} onReorder={onReorder} />;
}
