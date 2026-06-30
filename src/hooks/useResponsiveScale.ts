import { useEffect, useRef, useState } from "react";

export function computeResponsiveFitScale(
  containerWidth: number,
  contentWidth: number,
  padding = 32,
  maxScale = 1,
): number {
  if (
    !Number.isFinite(containerWidth) ||
    !Number.isFinite(contentWidth) ||
    containerWidth <= 0 ||
    contentWidth <= 0
  ) {
    return 1;
  }

  const availableWidth = Math.max(0, containerWidth - padding * 2);
  if (availableWidth <= 0) return 1;

  return Math.min(maxScale, availableWidth / contentWidth);
}

export function useResponsiveScale(options: {
  enabled: boolean;
  contentWidth: number;
  padding?: number;
  maxScale?: number;
}) {
  const {
    enabled,
    contentWidth,
    padding = 32,
    maxScale = 1,
  } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    if (!enabled) {
      setFitScale(1);
      return;
    }

    const node = containerRef.current;
    if (!node) return;

    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setFitScale(
          computeResponsiveFitScale(node.clientWidth, contentWidth, padding, maxScale),
        );
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [contentWidth, enabled, maxScale, padding]);

  return { containerRef, fitScale };
}
