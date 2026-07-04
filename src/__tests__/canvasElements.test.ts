// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { ensureLocaleLoaded } from "../i18n/translate";
import {
  __resetCanvasElementsForTests,
  addCanvasElement,
  canvasElementKindFromId,
  getCanvasElement,
  getCanvasElements,
  isCanvasElementId,
  removeCanvasElement,
  subscribeCanvasElements,
  updateCanvasElement,
} from "../lib/canvasElements";
import { getSectionLabel } from "../lib/sectionLabels";

beforeAll(async () => {
  await ensureLocaleLoaded("en");
  await ensureLocaleLoaded("zh-TW");
});

afterEach(() => {
  __resetCanvasElementsForTests();
});

describe("custom canvas elements store", () => {
  it("adds elements with kind-encoded ids", () => {
    const text = addCanvasElement("text");
    const photo = addCanvasElement("photo");
    const divider = addCanvasElement("divider");
    expect(text?.id.startsWith("el-text-")).toBe(true);
    expect(photo?.circle).toBe(true);
    expect(divider?.kind).toBe("divider");
    expect(getCanvasElements()).toHaveLength(3);
    expect(isCanvasElementId(text!.id)).toBe(true);
    expect(canvasElementKindFromId(photo!.id)).toBe("photo");
    expect(canvasElementKindFromId("experience")).toBe(null);
  });

  it("updates and removes elements with persistence", () => {
    const el = addCanvasElement("text")!;
    updateCanvasElement(el.id, { text: "Hello HK" });
    expect(getCanvasElement(el.id)?.text).toBe("Hello HK");
    removeCanvasElement(el.id);
    expect(getCanvasElement(el.id)).toBeUndefined();
    expect(JSON.parse(localStorage.getItem("nsr_canvas_elements_v1") ?? "[]")).toHaveLength(0);
  });

  it("notifies subscribers on changes", () => {
    let calls = 0;
    const unsubscribe = subscribeCanvasElements(() => {
      calls += 1;
    });
    const el = addCanvasElement("divider")!;
    updateCanvasElement(el.id, {});
    removeCanvasElement(el.id);
    unsubscribe();
    addCanvasElement("text");
    expect(calls).toBe(3);
  });

  it("rejects oversized photo payloads", () => {
    const el = addCanvasElement("photo")!;
    updateCanvasElement(el.id, { imageDataUrl: "x".repeat(900_000) });
    expect(getCanvasElement(el.id)?.imageDataUrl).toBeUndefined();
    updateCanvasElement(el.id, { imageDataUrl: "data:image/png;base64,ok" });
    expect(getCanvasElement(el.id)?.imageDataUrl).toContain("base64");
  });

  it("labels element sections by kind", () => {
    expect(getSectionLabel("el-text-abc", "en")).toBe("Text box");
    expect(getSectionLabel("el-photo-abc", "zh-TW")).toBe("照片");
    expect(getSectionLabel("el-unknown-abc", "en")).toBe("el-unknown-abc");
  });
});
