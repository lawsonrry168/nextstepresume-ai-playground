import type { ResumeLivePreviewPanelProps } from "../components/playground/ResumeLivePreviewPanel";

/** Build preview panel props once for split-pane and fullscreen preview layouts. */
export function collectLivePreviewProps(
  props: ResumeLivePreviewPanelProps,
): ResumeLivePreviewPanelProps {
  return props;
}

export type { ResumeLivePreviewPanelProps };
