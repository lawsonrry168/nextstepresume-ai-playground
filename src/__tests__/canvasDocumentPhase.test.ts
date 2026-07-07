import { describe, expect, it } from "vitest";
import { loadCanvasDocument, __resetCanvasDocumentStoreForTests } from "../lib/canvasDocument";
import {
  addCanvasElement,
  duplicateCanvasElement,
  __resetCanvasElementsForTests,
} from "../lib/canvasElements";

describe("canvas document store", () => {
  it("loads default document for a template family", () => {
    __resetCanvasDocumentStoreForTests();
    const doc = loadCanvasDocument("modern", ["header", "summary"]);
    expect(doc.pages.pages.length).toBeGreaterThan(0);
    expect(doc.layers.order).toContain("header");
  });
});

describe("canvas element duplicate", () => {
  it("clones element with a new id", () => {
    __resetCanvasElementsForTests();
    const source = addCanvasElement("text");
    expect(source).toBeTruthy();
    const clone = duplicateCanvasElement(source!);
    expect(clone?.id).not.toBe(source?.id);
    expect(clone?.kind).toBe("text");
  });
});
