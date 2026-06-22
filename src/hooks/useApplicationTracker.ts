import { useCallback, useEffect, useState } from "react";
import type { ApplicationEvent, ApplicationPackage, ApplicationStatus } from "../types";
import {
  listApplicationPackages,
  saveApplicationPackage,
  createApplicationPackage,
  updateApplicationStatus,
  deleteApplicationPackage,
  updateApplicationPackageCoverLetter,
  updateApplicationPackageFields,
  getApplicationPackage,
  type ApplicationPackageFieldUpdate,
} from "../lib/applicationPackageStorage";
import { appendTimelineEvent, createApplicationEvent, ensurePackageTimeline } from "../lib/applicationTimeline";
import { clearNotificationKeysForPackage } from "../lib/followUpReminderEngine";
import {
  buildDraftApplicationPackage,
  type ImportedJobInput,
} from "../lib/createDraftApplicationPackage";

export function useApplicationTracker() {
  const [packages, setPackages] = useState<ApplicationPackage[]>(() => listApplicationPackages());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setPackages(listApplicationPackages());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selected = selectedId ? getApplicationPackage(selectedId) : null;

  const upsertPackage = useCallback(
    (pkg: ApplicationPackage) => {
      const withTimeline = ensurePackageTimeline(pkg);
      const saved = saveApplicationPackage(withTimeline);
      refresh();
      setSelectedId(saved.id);
      return saved;
    },
    [refresh]
  );

  const updateStatus = useCallback(
    (id: string, status: ApplicationStatus, notes?: string) => {
      const existing = getApplicationPackage(id);
      if (!existing) return null;
      let next = updateApplicationStatus(id, status, notes ? { notes } : undefined);
      if (next) {
        next = saveApplicationPackage(
          appendTimelineEvent(
            next,
            createApplicationEvent("status_change", `狀態 → ${status}`, notes)
          )
        );
        if (status === "applied") {
          next = saveApplicationPackage(
            appendTimelineEvent(next, createApplicationEvent("applied", "標記為已投遞"))
          );
        }
        if (status === "interviewing") {
          next = saveApplicationPackage(
            appendTimelineEvent(next, createApplicationEvent("interview_scheduled", "進入面試階段"))
          );
        }
        refresh();
      }
      return next;
    },
    [refresh]
  );

  const removePackage = useCallback(
    (id: string) => {
      const ok = deleteApplicationPackage(id);
      if (ok) {
        clearNotificationKeysForPackage(id);
        refresh();
        setSelectedId((prev) => (prev === id ? null : prev));
      }
      return ok;
    },
    [refresh]
  );

  const saveCoverLetter = useCallback(
    (id: string, coverLetter: ApplicationPackage["coverLetter"]) => {
      const updated = updateApplicationPackageCoverLetter(id, coverLetter);
      refresh();
      return updated;
    },
    [refresh]
  );

  const updateFields = useCallback(
    (id: string, fields: ApplicationPackageFieldUpdate) => {
      const updated = updateApplicationPackageFields(id, fields);
      refresh();
      return updated;
    },
    [refresh]
  );

  const addTimelineEvent = useCallback(
    (id: string, event: ApplicationEvent) => {
      const existing = getApplicationPackage(id);
      if (!existing) return null;
      const updated = saveApplicationPackage(appendTimelineEvent(existing, event));
      refresh();
      return updated;
    },
    [refresh]
  );

  const saveNotesAndDates = useCallback(
    (id: string, data: ApplicationPackageFieldUpdate) => {
      const existing = getApplicationPackage(id);
      if (!existing) return null;

      const dateFieldsChanged =
        (data.followUpDate !== undefined && data.followUpDate !== existing.followUpDate) ||
        (data.interviewDate !== undefined && data.interviewDate !== existing.interviewDate);

      if (dateFieldsChanged) {
        clearNotificationKeysForPackage(id);
      }

      let updated = updateApplicationPackageFields(id, data);

      if (
        updated &&
        data.notes !== undefined &&
        (data.notes ?? "") !== (existing.notes ?? "")
      ) {
        updated = saveApplicationPackage(
          appendTimelineEvent(
            updated,
            createApplicationEvent("note", "更新備註", (data.notes ?? "").slice(0, 120))
          )
        );
      }

      refresh();
      return updated;
    },
    [refresh]
  );

  const createDraftFromImport = useCallback(
    (input: ImportedJobInput) => {
      const saved = createApplicationPackage(buildDraftApplicationPackage(input));
      refresh();
      setSelectedId(saved.id);
      return saved;
    },
    [refresh]
  );

  return {
    packages,
    selected,
    selectedId,
    setSelectedId,
    createApplicationPackage,
    updateStatus,
    removePackage,
    saveCoverLetter,
    upsertPackage,
    updateFields,
    addTimelineEvent,
    saveNotesAndDates,
    createDraftFromImport,
    refresh,
  };
}
