import { memo, useCallback, useRef, useSyncExternalStore } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import {
  canvasElementKindFromId,
  getCanvasElement,
  getCanvasElements,
  removeCanvasElement,
  subscribeCanvasElements,
  updateCanvasElement,
} from "../../lib/canvasElements";
import { t as translate } from "../../i18n/translate";

function useCanvasElement(id: string) {
  useSyncExternalStore(subscribeCanvasElements, getCanvasElements, getCanvasElements);
  return getCanvasElement(id);
}

/**
 * Renders a custom canvas element (text box / photo / divider) inside the
 * free-layout studio. `editable` is true on the edit canvas only — preview
 * and export surfaces render static content.
 */
function CanvasElementContent({ id, editable = false }: { id: string; editable?: boolean }) {
  const element = useCanvasElement(id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kind = element?.kind ?? canvasElementKindFromId(id);

  const handlePhotoFile = useCallback(
    (file: File | undefined) => {
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          updateCanvasElement(id, { imageDataUrl: reader.result });
        }
      };
      reader.readAsDataURL(file);
    },
    [id],
  );

  if (!kind) return null;

  if (kind === "divider") {
    return (
      <div className="w-full h-full flex items-center">
        <hr className="w-full border-t-2" style={{ borderColor: "var(--tpl-accent, #C0392B)" }} />
      </div>
    );
  }

  if (kind === "photo") {
    const radiusClass = element?.circle === false ? "rounded-lg" : "rounded-full";
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        {element?.imageDataUrl ? (
          <img
            src={element.imageDataUrl}
            alt=""
            className={`w-full h-full object-cover ${radiusClass}`}
            draggable={false}
          />
        ) : editable ? (
          <button
            type="button"
            data-canvas-chrome
            className={`w-full h-full flex flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-300 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 ${radiusClass}`}
            onClick={() => fileInputRef.current?.click()}
            onPointerDown={(e) => e.stopPropagation()}
            title={translate("canvas.elements.uploadPhoto")}
          >
            <ImagePlus className="w-5 h-5" />
            <span className="text-[9px] font-medium">{translate("canvas.elements.uploadPhoto")}</span>
          </button>
        ) : null}
        {editable ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePhotoFile(e.target.files?.[0])}
            />
            {element?.imageDataUrl ? (
              <div className="absolute -bottom-1 right-0 flex gap-1" data-canvas-chrome>
                <button
                  type="button"
                  className="text-[8px] bg-white/90 border border-slate-200 rounded px-1 py-0.5 text-slate-600 hover:bg-slate-50"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => updateCanvasElement(id, { circle: !(element?.circle ?? true) })}
                >
                  {element?.circle === false
                    ? translate("canvas.elements.cropCircle")
                    : translate("canvas.elements.cropSquare")}
                </button>
                <button
                  type="button"
                  className="text-[8px] bg-white/90 border border-slate-200 rounded px-1 py-0.5 text-slate-600 hover:bg-slate-50"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {translate("canvas.elements.replacePhoto")}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    );
  }

  // text element
  if (editable) {
    return (
      <textarea
        data-canvas-chrome
        className="w-full h-full resize-none bg-transparent text-xs leading-relaxed outline-none placeholder:text-slate-300"
        style={{ color: "var(--tpl-ink, #1A2438)", fontFamily: "var(--tpl-font-body, inherit)" }}
        placeholder={translate("canvas.elements.textPlaceholder")}
        defaultValue={element?.text ?? ""}
        onPointerDown={(e) => e.stopPropagation()}
        onBlur={(e) => updateCanvasElement(id, { text: e.target.value })}
      />
    );
  }
  return (
    <div
      className="w-full h-full text-xs leading-relaxed whitespace-pre-wrap"
      style={{ color: "var(--tpl-ink, #1A2438)", fontFamily: "var(--tpl-font-body, inherit)" }}
    >
      {element?.text ?? ""}
    </div>
  );
}

export function CanvasElementDeleteButton({ id }: { id: string }) {
  return (
    <button
      type="button"
      data-canvas-chrome
      className="text-[8px] text-red-500 hover:text-red-700 flex items-center gap-0.5"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => removeCanvasElement(id)}
      title={translate("canvas.elements.remove")}
    >
      <Trash2 className="w-3 h-3" />
    </button>
  );
}

export default memo(CanvasElementContent);
