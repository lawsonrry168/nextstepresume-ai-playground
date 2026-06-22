import { useCallback, useEffect, useMemo, useState } from "react";
import { TemplateStyle } from "../lib/resumeTemplateCatalog";
import {
  DEFAULT_THEME_CUSTOMIZATION,
  ResumeThemeCustomization,
  THEME_CUSTOMIZATION_STORAGE_KEY,
  buildGoogleFontsUrl,
  collectGoogleFonts,
  normalizeThemeCustomization,
  resetThemeCustomization,
  resolveResumeTheme,
} from "../lib/resumeThemeCustomization";

function readCustomization(): ResumeThemeCustomization {
  try {
    const raw = localStorage.getItem(THEME_CUSTOMIZATION_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_THEME_CUSTOMIZATION };
    return normalizeThemeCustomization(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_THEME_CUSTOMIZATION };
  }
}

export function useResumeThemeCustomization(templateStyle: TemplateStyle) {
  const [customization, setCustomizationState] = useState<ResumeThemeCustomization>(readCustomization);

  const resolved = useMemo(
    () => resolveResumeTheme(templateStyle, customization),
    [templateStyle, customization],
  );

  useEffect(() => {
    try {
      localStorage.setItem(THEME_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(customization));
    } catch {
      /* ignore */
    }
  }, [customization]);

  useEffect(() => {
    const fonts = collectGoogleFonts(customization);
    const url = buildGoogleFontsUrl(fonts);
    const linkId = "resume-custom-google-fonts";
    const existing = document.getElementById(linkId) as HTMLLinkElement | null;

    if (!url) {
      existing?.remove();
      return;
    }

    if (existing) {
      if (existing.href !== url) existing.href = url;
      return;
    }

    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }, [customization]);

  const setCustomization = useCallback(
    (value: ResumeThemeCustomization | ((prev: ResumeThemeCustomization) => ResumeThemeCustomization)) => {
      setCustomizationState(value);
    },
    [],
  );

  const updateCustomization = useCallback(
    (patch: Partial<ResumeThemeCustomization>) => {
      setCustomizationState((prev) => ({
        ...prev,
        ...patch,
        enabled: patch.enabled ?? (Object.keys(patch).some((k) => k !== "enabled") ? true : prev.enabled),
      }));
    },
    [],
  );

  const resetCustomization = useCallback(() => {
    setCustomizationState(resetThemeCustomization());
  }, []);

  const toggleCustomization = useCallback(() => {
    setCustomizationState((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  return {
    customization,
    setCustomization,
    updateCustomization,
    resetCustomization,
    toggleCustomization,
    resolved,
  };
}

export function clearThemeCustomizationStorage(): void {
  localStorage.removeItem(THEME_CUSTOMIZATION_STORAGE_KEY);
}
