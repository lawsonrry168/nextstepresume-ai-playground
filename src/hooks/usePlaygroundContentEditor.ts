import { useCallback, useMemo, useState, type Dispatch, type DragEvent, type SetStateAction, type SyntheticEvent } from "react";
import {
  ACTION_VERB_CATEGORIES,
  getRecommendedVerbCategory,
} from "../lib/actionVerbsCatalog";
import type { ResumeData } from "../types";

export type ContentEditSection =
  | "personal"
  | "summary"
  | "experience"
  | "skills"
  | "certifications"
  | "volunteerWork"
  | "languages";

export interface UsePlaygroundContentEditorOptions {
  resumeData: ResumeData;
  setResumeData: Dispatch<SetStateAction<ResumeData>>;
  setJobDescription: (value: string) => void;
  saveImmediateSnapshot: () => void;
}

export function usePlaygroundContentEditor({
  resumeData,
  setResumeData,
  setJobDescription,
  saveImmediateSnapshot,
}: UsePlaygroundContentEditorOptions) {
  const [editSection, setEditSection] = useState<ContentEditSection>("personal");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDragOverSkillsDropzone, setIsDragOverSkillsDropzone] = useState(false);
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const [selectedVerbCategory, setSelectedVerbCategory] = useState<string | null>(null);
  const [verbsPanelOpen, setVerbsPanelOpen] = useState(false);

  const actionVerbsCategories = useMemo(() => ACTION_VERB_CATEGORIES, []);
  const getRecommendedVerbCategoryForResume = useCallback(
    () => getRecommendedVerbCategory(resumeData.personalInfo?.title || ""),
    [resumeData.personalInfo?.title],
  );
  const activeVerbCategoryKey = selectedVerbCategory || getRecommendedVerbCategoryForResume();

  const updatePersonalInfo = useCallback(
    (field: string, value: string) => {
      setResumeData((prev) => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, [field]: value },
      }));
    },
    [setResumeData],
  );

  const updateSummary = useCallback(
    (value: string) => {
      setResumeData((prev) => ({ ...prev, summary: value }));
    },
    [setResumeData],
  );

  const updateExperienceBullet = useCallback(
    (expId: string, bulletIdx: number, value: string) => {
      setResumeData((prev) => ({
        ...prev,
        experience: prev.experience.map((exp) => {
          if (exp.id !== expId) return exp;
          const newBullets = [...exp.bullets];
          newBullets[bulletIdx] = value;
          return { ...exp, bullets: newBullets };
        }),
      }));
    },
    [setResumeData],
  );

  const addExperienceBullet = useCallback(
    (expId: string) => {
      setResumeData((prev) => ({
        ...prev,
        experience: prev.experience.map((exp) =>
          exp.id === expId ? { ...exp, bullets: [...exp.bullets, "New achievement statement..."] } : exp,
        ),
      }));
    },
    [setResumeData],
  );

  const removeExperienceBullet = useCallback(
    (expId: string, bulletIdx: number) => {
      setResumeData((prev) => ({
        ...prev,
        experience: prev.experience.map((exp) =>
          exp.id === expId ? { ...exp, bullets: exp.bullets.filter((_, idx) => idx !== bulletIdx) } : exp,
        ),
      }));
    },
    [setResumeData],
  );

  const addSkill = useCallback(
    (skillName: string) => {
      const trimmed = skillName.trim();
      if (!trimmed) return;
      setResumeData((prev) => {
        if (prev.skills.includes(trimmed)) return prev;
        return { ...prev, skills: [...prev.skills, trimmed] };
      });
    },
    [setResumeData],
  );

  const removeSkill = useCallback(
    (skillIndex: number) => {
      setResumeData((prev) => ({
        ...prev,
        skills: prev.skills.filter((_, idx) => idx !== skillIndex),
      }));
    },
    [setResumeData],
  );

  const insertPreformattedSection = useCallback(
    (type: "certifications" | "volunteerWork" | "languages") => {
      const defaultValues: Record<typeof type, string[]> = {
        certifications: [
          "AWS Certified Solutions Architect – Associate",
          "Meta Front-End Developer Professional Certification (Coursera)",
        ],
        volunteerWork: [
          "Volunteer Technical Mentor – Austin Youth Coding Initiative (taught HTML5/CSS3 basics to high schoolers)",
          "Open Source Contributor – Assisted with documentation & bug-fixes on modern React router layouts",
        ],
        languages: ["English (Native)", "Spanish (Professional / Technical)", "German (Conversational)"],
      };
      setResumeData((prev) => ({ ...prev, [type]: defaultValues[type] }));
      setEditSection(type);
      setDropdownOpen(false);
    },
    [setResumeData],
  );

  const addLanguage = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setResumeData((prev) => {
        const current = prev.languages || [];
        if (current.includes(trimmed)) return prev;
        return { ...prev, languages: [...current, trimmed] };
      });
    },
    [setResumeData],
  );

  const removeLanguage = useCallback(
    (idx: number) => {
      setResumeData((prev) => ({
        ...prev,
        languages: (prev.languages || []).filter((_, i) => i !== idx),
      }));
    },
    [setResumeData],
  );

  const addCertification = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setResumeData((prev) => {
        const current = prev.certifications || [];
        if (current.includes(trimmed)) return prev;
        return { ...prev, certifications: [...current, trimmed] };
      });
    },
    [setResumeData],
  );

  const removeCertification = useCallback(
    (idx: number) => {
      setResumeData((prev) => ({
        ...prev,
        certifications: (prev.certifications || []).filter((_, i) => i !== idx),
      }));
    },
    [setResumeData],
  );

  const addVolunteerWork = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setResumeData((prev) => {
        const current = prev.volunteerWork || [];
        if (current.includes(trimmed)) return prev;
        return { ...prev, volunteerWork: [...current, trimmed] };
      });
    },
    [setResumeData],
  );

  const removeVolunteerWork = useCallback(
    (idx: number) => {
      setResumeData((prev) => ({
        ...prev,
        volunteerWork: (prev.volunteerWork || []).filter((_, i) => i !== idx),
      }));
    },
    [setResumeData],
  );

  const applyFieldUpdate = useCallback(
    (inputId: string, updatedValue: string) => {
      if (inputId === "textarea-summary") {
        updateSummary(updatedValue);
      } else if (inputId.startsWith("input-bullet-")) {
        const parts = inputId.replace("input-bullet-", "").split("___");
        updateExperienceBullet(parts[0], parseInt(parts[1], 10), updatedValue);
      } else if (inputId === "input-name") {
        updatePersonalInfo("name", updatedValue);
      } else if (inputId === "input-job-title") {
        updatePersonalInfo("title", updatedValue);
      } else if (inputId === "input-email") {
        updatePersonalInfo("email", updatedValue);
      } else if (inputId === "input-phone") {
        updatePersonalInfo("phone", updatedValue);
      } else if (inputId === "input-location") {
        updatePersonalInfo("location", updatedValue);
      } else if (inputId === "input-website") {
        updatePersonalInfo("website", updatedValue);
      } else if (inputId === "jd-textarea") {
        setJobDescription(updatedValue);
      }
    },
    [setJobDescription, updateExperienceBullet, updatePersonalInfo, updateSummary],
  );

  const insertActionVerb = useCallback(
    (verb: string) => {
      if (!activeInputId) return;
      const element = document.getElementById(activeInputId) as HTMLInputElement | HTMLTextAreaElement | null;
      if (!element) return;

      const start = element.selectionStart ?? 0;
      const end = element.selectionEnd ?? 0;
      const textToInsert = `${verb} `;
      const updatedValue = element.value.substring(0, start) + textToInsert + element.value.substring(end);
      applyFieldUpdate(activeInputId, updatedValue);

      setTimeout(() => {
        element.focus();
        const newCursorPos = start + textToInsert.length;
        element.setSelectionRange(newCursorPos, newCursorPos);
      }, 10);
    },
    [activeInputId, applyFieldUpdate],
  );

  const handleElementSelectOrFocus = useCallback((e: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setActiveInputId(e.currentTarget.id);
  }, []);

  const applyFormatToActiveField = useCallback(
    (formatType: "bold" | "italic" | "bullet") => {
      if (!activeInputId) return;
      const element = document.getElementById(activeInputId) as HTMLInputElement | HTMLTextAreaElement | null;
      if (!element) return;

      const start = element.selectionStart ?? 0;
      const end = element.selectionEnd ?? 0;
      const value = element.value;
      const selectedText = value.substring(start, end);
      let newText = "";

      if (formatType === "bold") {
        newText = selectedText.startsWith("**") && selectedText.endsWith("**")
          ? selectedText.slice(2, -2)
          : `**${selectedText}**`;
      } else if (formatType === "italic") {
        newText = selectedText.startsWith("*") && selectedText.endsWith("*")
          ? selectedText.slice(1, -1)
          : `*${selectedText}*`;
      } else if (formatType === "bullet") {
        newText = selectedText.startsWith("• ") ? selectedText.replace(/^•\s*/, "") : `• ${selectedText}`;
      }

      const updatedValue = value.substring(0, start) + newText + value.substring(end);
      applyFieldUpdate(activeInputId, updatedValue);

      setTimeout(() => {
        element.focus();
        const newCursorPos = start + newText.length;
        element.setSelectionRange(newCursorPos, newCursorPos);
      }, 10);
    },
    [activeInputId, applyFieldUpdate],
  );

  const handleDragStart = useCallback((e: DragEvent, skillName: string) => {
    e.dataTransfer.setData("text/plain", skillName);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOverSkillsDropzone(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOverSkillsDropzone(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragOverSkillsDropzone(false);
      const skillName = e.dataTransfer.getData("text/plain").trim();
      if (!skillName) return;
      const alreadyHas = resumeData.skills.some((s) => s.toLowerCase() === skillName.toLowerCase());
      if (alreadyHas) return;
      saveImmediateSnapshot();
      setResumeData((prev) => ({ ...prev, skills: [...prev.skills, skillName] }));
    },
    [resumeData.skills, saveImmediateSnapshot, setResumeData],
  );

  return {
    editSection,
    setEditSection,
    dropdownOpen,
    setDropdownOpen,
    isDragOverSkillsDropzone,
    activeInputId,
    selectedVerbCategory,
    setSelectedVerbCategory,
    verbsPanelOpen,
    setVerbsPanelOpen,
    actionVerbsCategories,
    activeVerbCategoryKey,
    getRecommendedVerbCategory: getRecommendedVerbCategoryForResume,
    updatePersonalInfo,
    updateSummary,
    updateExperienceBullet,
    addExperienceBullet,
    removeExperienceBullet,
    addSkill,
    removeSkill,
    insertPreformattedSection,
    addLanguage,
    removeLanguage,
    addCertification,
    removeCertification,
    addVolunteerWork,
    removeVolunteerWork,
    insertActionVerb,
    handleElementSelectOrFocus,
    applyFormatToActiveField,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
}
