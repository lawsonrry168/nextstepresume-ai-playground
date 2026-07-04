import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyLayoutUndoPositions,
  emitLayoutPositions,
  registerLayoutUndoBridge,
  subscribeLayoutPositions,
} from "../lib/undoRegistry";

const POS = { x: 48, y: 48, width: 200, height: 100 };

describe("layout undo registry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-04T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("applies positions through a registered bridge with matching family", () => {
    const applied: unknown[] = [];
    const unregister = registerLayoutUndoBridge({
      family: "modern",
      applyPositions: (p) => applied.push(p),
    });

    expect(applyLayoutUndoPositions({ family: "modern", positions: { header: POS } })).toBe(true);
    expect(applied).toHaveLength(1);

    expect(applyLayoutUndoPositions({ family: "classic", positions: { header: POS } })).toBe(false);
    expect(applied).toHaveLength(1);

    unregister();
    expect(applyLayoutUndoPositions({ family: "modern", positions: { header: POS } })).toBe(false);
  });

  it("suppresses emissions right after an undo apply (no history feedback loop)", () => {
    const received: unknown[] = [];
    const unsubscribe = subscribeLayoutPositions((snapshot) => received.push(snapshot));
    const unregister = registerLayoutUndoBridge({ family: "modern", applyPositions: () => {} });

    applyLayoutUndoPositions({ family: "modern", positions: { header: POS } });
    emitLayoutPositions({ family: "modern", positions: { header: POS } });
    expect(received).toHaveLength(0);

    vi.advanceTimersByTime(1000);
    emitLayoutPositions({ family: "modern", positions: { header: POS } });
    expect(received).toHaveLength(1);

    unsubscribe();
    unregister();
  });

  it("delivers emissions to subscribers until unsubscribed", () => {
    vi.setSystemTime(new Date("2026-07-04T01:00:00Z"));
    const received: unknown[] = [];
    const unsubscribe = subscribeLayoutPositions((snapshot) => received.push(snapshot));
    emitLayoutPositions({ family: "minimalist", positions: {} });
    expect(received).toHaveLength(1);
    unsubscribe();
    emitLayoutPositions({ family: "minimalist", positions: {} });
    expect(received).toHaveLength(1);
  });
});
