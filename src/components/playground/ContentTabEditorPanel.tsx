import React from "react";
import { motion } from "motion/react";
import {
  FileText, Briefcase, GraduationCap, Code, Sparkles, Check,
  RefreshCw, AlertCircle, Plus, Trash2, CheckCircle, Info,
  ChevronDown, Award, HeartHandshake, Languages, Bold, Italic, List,
  User, Cloud, Target, Edit3, GripVertical, FileUp, TrendingUp,
} from "lucide-react";
import { ResumeData } from "../../types";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "../../i18n";
import { isHongKongMarket } from "../../lib/market/config";

type VerbCategory = {
  key: string;
  name: string;
  icon: LucideIcon;
  badgeColor: string;
  activeColor: string;
  verbs: string[];
};

export interface ContentTabEditorPanelProps {
  jobDescription: string;
  setJobDescription: (value: string) => void;
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  activeInputId: string | null;
  handleElementSelectOrFocus: (e: React.SyntheticEvent<HTMLElement>) => void;
  applyFormatToActiveField: (format: "bold" | "italic" | "bullet") => void;
  dropdownOpen: boolean;
  setDropdownOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  editSection: string | null;
  setEditSection: (value: string | null) => void;
  setImportModalOpen: (value: boolean) => void;
  verbsPanelOpen: boolean;
  setVerbsPanelOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  selectedVerbCategory: string;
  setSelectedVerbCategory: (value: string) => void;
  grammarChecking: boolean;
  runGrammarToneCheck: () => void;
  readabilityChecking: boolean;
  runReadabilityComplexityCheck: () => void;
  skillConsistencyChecking: boolean;
  runSkillConsistencyCheck: () => void;
  saveImmediateSnapshot: () => void;
  isDragOverSkillsDropzone: boolean;
  handleDragStart: (e: React.DragEvent, skillName: string) => void;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  updatePersonalInfo: (field: string, value: string) => void;
  updateSummary: (value: string) => void;
  updateExperienceBullet: (expId: string, bulletIdx: number, value: string) => void;
  addExperienceBullet: (expId: string) => void;
  removeExperienceBullet: (expId: string, bulletIdx: number) => void;
  addSkill: (skillName: string) => void;
  removeSkill: (skillIndex: number) => void;
  insertPreformattedSection: (type: "certifications" | "volunteerWork" | "languages") => void;
  addCertification: (name: string) => void;
  removeCertification: (idx: number) => void;
  addVolunteerWork: (name: string) => void;
  removeVolunteerWork: (idx: number) => void;
  addLanguage: (name: string) => void;
  removeLanguage: (idx: number) => void;
  getRecommendedVerbCategory: () => string;
  insertActionVerb: (verb: string) => void;
  actionVerbsCategories: VerbCategory[];
  activeVerbCategoryKey: string;
  detectedKeywords: string[];
}

export default function ContentTabEditorPanel({
  jobDescription,
  setJobDescription,
  resumeData,
  setResumeData,
  activeInputId,
  handleElementSelectOrFocus,
  applyFormatToActiveField,
  dropdownOpen,
  setDropdownOpen,
  editSection,
  setEditSection,
  setImportModalOpen,
  verbsPanelOpen,
  setVerbsPanelOpen,
  selectedVerbCategory,
  setSelectedVerbCategory,
  grammarChecking,
  runGrammarToneCheck,
  readabilityChecking,
  runReadabilityComplexityCheck,
  skillConsistencyChecking,
  runSkillConsistencyCheck,
  saveImmediateSnapshot,
  isDragOverSkillsDropzone,
  handleDragStart,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  updatePersonalInfo,
  updateSummary,
  updateExperienceBullet,
  addExperienceBullet,
  removeExperienceBullet,
  addSkill,
  removeSkill,
  insertPreformattedSection,
  addCertification,
  removeCertification,
  addVolunteerWork,
  removeVolunteerWork,
  addLanguage,
  removeLanguage,
  getRecommendedVerbCategory,
  insertActionVerb,
  actionVerbsCategories,
  activeVerbCategoryKey,
  detectedKeywords,
}: ContentTabEditorPanelProps) {
  const { t } = useI18n();

  const currentFieldLabel =
    activeInputId === "textarea-summary"
      ? t("editor.currentField.summary")
      : activeInputId?.includes("bullet")
        ? t("editor.currentField.bullet")
        : activeInputId === "jd-textarea"
          ? t("editor.currentField.jd")
          : activeInputId
            ? t("editor.currentField.selected")
            : t("editor.currentField.none");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
      id="content-tab-view"
    >
      <div className="panel-surface p-4 space-y-3" id="resume-fields-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="space-y-1.5">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 font-sans block">{t("editor.editSections")}</span>
            {/* Quick Add Section Dropdown */}
            <div className="relative inline-block text-left" id="quick-add-dropdown-wrapper">
              <button
                id="btn-quick-add-dropdown"
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="notebook-chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                <Plus className="w-3 h-3" /> {t("editor.quickAddSection")} <ChevronDown className="w-3 h-3" />
              </button>
    
              {dropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-48 rounded-xl bg-white shadow-lg border border-slate-200 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden animate-fade-in" id="quick-add-menu">
                  <div className="py-1" role="menu">
                    <button
                      type="button"
                      onClick={() => insertPreformattedSection('certifications')}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <Award className="w-3.5 h-3.5 text-blue-500" />
                      <span>{t("editor.sections.certifications")}</span>
                      {resumeData.certifications && <span className="ml-auto text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded font-mono">{t("editor.added")}</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertPreformattedSection('volunteerWork')}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                      <span>{t("editor.sections.volunteer")}</span>
                      {resumeData.volunteerWork && <span className="ml-auto text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded font-mono">{t("editor.added")}</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertPreformattedSection('languages')}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <Languages className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t("editor.sections.languages")}</span>
                      {resumeData.languages && <span className="ml-auto text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded font-mono">{t("editor.added")}</span>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            id="btn-import-resume"
            onClick={() => setImportModalOpen(true)}
            className="notebook-chip inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer shrink-0"
          >
            <FileUp className="w-3.5 h-3.5" /> {t("editor.importResumeText")}
          </button>
          <div className="flex flex-wrap gap-1" id="field-selector-btns">
            <button
              id="btn-edit-personal"
              type="button"
              onClick={() => setEditSection('personal')}
              className={`p-1.5 rounded cursor-pointer ${editSection === 'personal' ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-700"}`}
              title={t("editor.editTooltips.personal")}
            >
              <User className="w-4 h-4" />
            </button>
            <button
              id="btn-edit-summary"
              type="button"
              onClick={() => setEditSection('summary')}
              className={`p-1.5 rounded cursor-pointer ${editSection === 'summary' ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-700"}`}
              title={t("editor.editTooltips.summary")}
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              id="btn-edit-experience"
              type="button"
              onClick={() => setEditSection('experience')}
              className={`p-1.5 rounded cursor-pointer ${editSection === 'experience' ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-700"}`}
              title={t("editor.editTooltips.experience")}
            >
              <Briefcase className="w-4 h-4" />
            </button>
            <button
              id="btn-edit-skills"
              type="button"
              onClick={() => setEditSection('skills')}
              className={`p-1.5 rounded cursor-pointer ${editSection === 'skills' ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-700"}`}
              title={t("editor.editTooltips.skills")}
            >
              <Code className="w-4 h-4" />
            </button>
    
            {/* Certifications tab */}
            {resumeData.certifications && (
              <button
                id="btn-edit-certifications"
                type="button"
                onClick={() => setEditSection('certifications')}
                className={`p-1.5 rounded cursor-pointer ${editSection === 'certifications' ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-700"}`}
                title={t("editor.editTooltips.certifications")}
              >
                <Award className="w-4 h-4" />
              </button>
            )}
    
            {/* Volunteer tab */}
            {resumeData.volunteerWork && (
              <button
                id="btn-edit-volunteer"
                type="button"
                onClick={() => setEditSection('volunteerWork')}
                className={`p-1.5 rounded cursor-pointer ${editSection === 'volunteerWork' ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-700"}`}
                title={t("editor.editTooltips.volunteer")}
              >
                <HeartHandshake className="w-4 h-4" />
              </button>
            )}
    
            {/* Languages tab */}
            {resumeData.languages && (
              <button
                id="btn-edit-languages"
                type="button"
                onClick={() => setEditSection('languages')}
                className={`p-1.5 rounded cursor-pointer ${editSection === 'languages' ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-700"}`}
                title={t("editor.editTooltips.languages")}
              >
                <Languages className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
    
        {/* Section Content: Personal Coordinates */}
        {editSection === 'personal' && (
          <div className="space-y-3" id="personal-inputs">
            <div className="grid grid-cols-2 gap-3 pb-1">
              <div className="space-y-1">
                <label htmlFor="input-name" className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">{t("editor.fields.name")}</label>
                <input
                  id="input-name"
                  type="text"
                  value={resumeData.personalInfo.name}
                  onChange={(e) => updatePersonalInfo('name', e.target.value)}
                  onFocus={handleElementSelectOrFocus}
                  onSelect={handleElementSelectOrFocus}
                  onKeyUp={handleElementSelectOrFocus}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs rounded-lg p-2 text-slate-800 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="input-job-title" className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">{t("editor.fields.title")}</label>
                <input
                  id="input-job-title"
                  type="text"
                  value={resumeData.personalInfo.title}
                  onChange={(e) => updatePersonalInfo('title', e.target.value)}
                  onFocus={handleElementSelectOrFocus}
                  onSelect={handleElementSelectOrFocus}
                  onKeyUp={handleElementSelectOrFocus}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs rounded-lg p-2 text-slate-800 font-medium"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pb-1">
              <div className="space-y-1">
                <label htmlFor="input-email" className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">{t("editor.fields.email")}</label>
                <input
                  id="input-email"
                  type="email"
                  value={resumeData.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  onFocus={handleElementSelectOrFocus}
                  onSelect={handleElementSelectOrFocus}
                  onKeyUp={handleElementSelectOrFocus}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs rounded-lg p-2 text-slate-800 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="input-phone" className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">{t("editor.fields.phone")}</label>
                <input
                  id="input-phone"
                  type="text"
                  value={resumeData.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  onFocus={handleElementSelectOrFocus}
                  onSelect={handleElementSelectOrFocus}
                  onKeyUp={handleElementSelectOrFocus}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs rounded-lg p-2 text-slate-800 font-medium"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="input-location" className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">{t("editor.fields.location")}</label>
                <input
                  id="input-location"
                  type="text"
                  value={resumeData.personalInfo.location}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  onFocus={handleElementSelectOrFocus}
                  onSelect={handleElementSelectOrFocus}
                  onKeyUp={handleElementSelectOrFocus}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs rounded-lg p-2 text-slate-800 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="input-website" className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">{t("editor.fields.website")}</label>
                <input
                  id="input-website"
                  type="text"
                  value={resumeData.personalInfo.website}
                  onChange={(e) => updatePersonalInfo('website', e.target.value)}
                  onFocus={handleElementSelectOrFocus}
                  onSelect={handleElementSelectOrFocus}
                  onKeyUp={handleElementSelectOrFocus}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs rounded-lg p-2 text-slate-800 font-medium"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="input-linkedin" className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">{t("editor.fields.linkedin")}</label>
              <input
                id="input-linkedin"
                type="text"
                value={resumeData.personalInfo.linkedin || ""}
                onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                onFocus={handleElementSelectOrFocus}
                onSelect={handleElementSelectOrFocus}
                onKeyUp={handleElementSelectOrFocus}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs rounded-lg p-2 text-slate-800 font-medium"
              />
            </div>
            {isHongKongMarket() ? (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3 space-y-3">
                <div>
                  <p className="text-[10px] font-black uppercase text-emerald-800">{t("editor.hkSection.title")}</p>
                  <p className="text-[10px] text-emerald-700/80">{t("editor.hkSection.hint")}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label htmlFor="input-right-to-work" className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">{t("editor.fields.rightToWork")}</label>
                    <input
                      id="input-right-to-work"
                      type="text"
                      placeholder={t("editor.fields.rightToWorkPlaceholder")}
                      value={resumeData.personalInfo.rightToWork || ""}
                      onChange={(e) => updatePersonalInfo('rightToWork', e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs rounded-lg p-2 text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="input-notice-period" className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">{t("editor.fields.noticePeriod")}</label>
                    <input
                      id="input-notice-period"
                      type="text"
                      placeholder={t("editor.fields.noticePeriodPlaceholder")}
                      value={resumeData.personalInfo.noticePeriod || ""}
                      onChange={(e) => updatePersonalInfo('noticePeriod', e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs rounded-lg p-2 text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="input-expected-salary" className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">{t("editor.fields.expectedSalary")}</label>
                    <input
                      id="input-expected-salary"
                      type="text"
                      placeholder={t("editor.fields.expectedSalaryPlaceholder")}
                      value={resumeData.personalInfo.expectedSalary || ""}
                      onChange={(e) => updatePersonalInfo('expectedSalary', e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs rounded-lg p-2 text-slate-800"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
    
        {/* Section Content: Summary */}
        {editSection === 'summary' && (
          <div className="space-y-1" id="summary-inputs">
            <label htmlFor="textarea-summary" className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">{t("editor.fields.summaryOutline")}</label>
            <textarea
              id="textarea-summary"
              rows={4}
              value={resumeData.summary}
              onChange={(e) => updateSummary(e.target.value)}
              onFocus={handleElementSelectOrFocus}
              onSelect={handleElementSelectOrFocus}
              onKeyUp={handleElementSelectOrFocus}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs rounded-lg p-2.5 text-slate-800 font-medium resize-none font-sans leading-relaxed"
            />
          </div>
        )}
    
        {/* Section Content: Experience */}
        {editSection === 'experience' && (
          <div className="space-y-5" id="experience-inputs">
            {resumeData.experience.map((exp) => (
              <div key={exp.id} className="border border-slate-200 p-3 rounded-lg space-y-3 bg-slate-50/50">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800">{exp.role} <span className="text-slate-400 font-normal">at</span> {exp.company}</span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{exp.startDate} - {exp.endDate}</span>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">{t("editor.fields.starBullets")}</label>
                  {exp.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex gap-2">
                      <input
                        id={`input-bullet-${exp.id}___${bIdx}`}
                        type="text"
                        value={bullet}
                        onChange={(e) => updateExperienceBullet(exp.id, bIdx, e.target.value)}
                        onFocus={handleElementSelectOrFocus}
                        onSelect={handleElementSelectOrFocus}
                        onKeyUp={handleElementSelectOrFocus}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs rounded p-1.5 text-slate-800 font-medium"
                      />
                      <button
                        id={`btn-del-bullet-${exp.id}-${bIdx}`}
                        type="button"
                        onClick={() => removeExperienceBullet(exp.id, bIdx)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 transition-all self-center cursor-pointer"
                        title={t("editor.fields.deleteBullet")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    id={`btn-add-bullet-${exp.id}`}
                    type="button"
                    onClick={() => addExperienceBullet(exp.id)}
                    className="flex items-center gap-1 text-[10px] font-sans font-bold text-emerald-600 hover:text-emerald-700 mt-2 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" /> Add Bullet Statement
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    
        {/* Section Content: Skills Tech Stack */}
        {editSection === 'skills' && (
          <div className="space-y-4" id="skills-inputs">
            <div>
              <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-2">Add Custom Skill</label>
              <div className="flex gap-2">
                <input
                  id="input-new-skill"
                  type="text"
                  placeholder="e.g., Next.js, Docker, Webpack..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addSkill((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs rounded-lg p-2.5 text-slate-800 font-medium"
                />
                <button
                  id="btn-add-skill"
                  type="button"
                  onClick={() => {
                    const ele = document.getElementById("input-new-skill") as HTMLInputElement;
                    if (ele) {
                      addSkill(ele.value);
                      ele.value = '';
                    }
                  }}
                  className="bg-emerald-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
    
            <div>
              <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1.5">Official Skills List ({resumeData.skills.length})</label>
              <div 
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-wrap gap-1.5 p-3.5 rounded-xl min-h-[75px] transition-all duration-200 border ${
                  isDragOverSkillsDropzone 
                    ? "bg-emerald-50 border-2 border-dashed border-emerald-500 scale-[1.01] shadow-emerald-100 shadow-md" 
                    : "bg-slate-50 border border-slate-150"
                }`}
              >
                {resumeData.skills.length === 0 ? (
                  <span className="text-slate-400 text-xs italic flex flex-col items-center justify-center w-full py-2">
                    <span>{t("editor.fields.noSkills")}</span>
                  </span>
                ) : (
                  resumeData.skills.map((skill, idx) => (
                    <span key={idx} className="bg-white hover:bg-slate-100 px-2.5 py-1 rounded-md text-xs text-slate-700 font-semibold border border-slate-200 flex items-center gap-1.5 transition-all shadow-sm">
                      {skill}
                      <button
                        id={`btn-del-skill-${idx}`}
                        type="button"
                        onClick={() => {
                          saveImmediateSnapshot(); // track action in Undo history stack
                          removeSkill(idx);
                        }}
                        className="text-slate-500 hover:text-rose-600 self-center text-xs pl-0.5 cursor-pointer font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
    
              {/* Highly responsive dashed Target Skill Locker Dropzone visualizer widget */}
              <div 
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mt-3 border-2 border-dashed p-4 rounded-xl text-center transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
                  isDragOverSkillsDropzone 
                    ? "border-emerald-500 bg-emerald-50/70 scale-[1.02] shadow-emerald-100 shadow-md text-emerald-800" 
                    : "border-slate-300 bg-slate-50 hover:bg-slate-100/50 text-slate-500"
                }`}
              >
                <div className="p-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
                  <Target className={`w-4 h-4 ${isDragOverSkillsDropzone ? "text-emerald-500 animate-ping" : "text-blue-500"}`} />
                </div>
                <div>
                  <span className="text-xs font-bold block text-slate-750">🎯 ATS Skill Locker (Dropzone)</span>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    {isDragOverSkillsDropzone 
                      ? "Release mouse button to embed this dynamic keyword!" 
                      : "Drag any recommended badge from the AI tag cloud below and DROP HERE to weave it instantly into your CV profile!"}
                  </p>
                </div>
              </div>
            </div>
    
            {/* ATS-Optimized Tag Cloud (Auto-Generated from Resume) */}
            <div className="border border-emerald-100 bg-emerald-50/20 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-50 pb-2">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span>AI Auto-Generated ATS Tag Cloud (Draggable)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                    Drag badges or click to toggle sync to your active Skills ledger.
                  </p>
                </div>
                {detectedKeywords.some(word => !resumeData.skills.some(s => s.toLowerCase() === word.toLowerCase())) && (
                  <button
                    type="button"
                    onClick={() => {
                      saveImmediateSnapshot(); // log undo snapshot
                      detectedKeywords.forEach(word => {
                        const formatKeyword = (w: string) => {
                          const customMap: Record<string, string> = {
                            react: "React",
                            typescript: "TypeScript",
                            javascript: "JavaScript",
                            tailwind: "Tailwind CSS",
                            css: "CSS",
                            html: "HTML",
                            vite: "Vite",
                            docker: "Docker",
                            kubernetes: "Kubernetes",
                            node: "Node.js",
                            mongodb: "MongoDB",
                            graphql: "GraphQL",
                            aws: "AWS",
                            ci: "CI/CD",
                            cd: "CI/CD"
                          };
                          return customMap[w.toLowerCase()] || (w.charAt(0).toUpperCase() + w.slice(1));
                        };
                        const formatted = formatKeyword(word);
                        if (!resumeData.skills.some(s => s.toLowerCase() === formatted.toLowerCase())) {
                          addSkill(formatted);
                        }
                      });
                    }}
                    className="text-[10px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded transition whitespace-nowrap cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3 h-3" /> Sync All Detected
                  </button>
                )}
              </div>
    
              {detectedKeywords.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-xs italic">
                  No target keywords detected in your content yet. Edit your professional summary or experience description to detect relevant ATS tech keywords!
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-white/70 rounded-xl border border-dashed border-emerald-100">
                  {detectedKeywords.map((word, idx) => {
                    const isAdded = resumeData.skills.some(s => s.toLowerCase() === word.toLowerCase());
                    const formatKeyword = (w: string) => {
                      const customMap: Record<string, string> = {
                        react: "React",
                        typescript: "TypeScript",
                        javascript: "JavaScript",
                        tailwind: "Tailwind CSS",
                        css: "CSS",
                        html: "HTML",
                        vite: "Vite",
                        docker: "Docker",
                        kubernetes: "Kubernetes",
                        node: "Node.js",
                        mongodb: "MongoDB",
                        graphql: "GraphQL",
                        aws: "AWS",
                        ci: "CI/CD",
                        cd: "CI/CD"
                      };
                      return customMap[w.toLowerCase()] || (w.charAt(0).toUpperCase() + w.slice(1));
                    };
                    const formatted = formatKeyword(word);
                    
                    // Dynamic sizing for nice cloud representation
                    const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const sizeClass = hash % 3 === 0 ? 'text-[11px]' : hash % 3 === 1 ? 'text-xs font-semibold' : 'text-sm font-bold';
                    const rotationClass = hash % 5 === 0 ? 'hover:rotate-1' : hash % 5 === 1 ? 'hover:-rotate-1' : '';
    
                    return (
                      <button
                        key={idx}
                        type="button"
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, formatted)}
                        onClick={() => {
                          saveImmediateSnapshot(); // log undo snapshot
                          if (isAdded) {
                            const index = resumeData.skills.findIndex(s => s.toLowerCase() === word.toLowerCase());
                            if (index !== -1) removeSkill(index);
                          } else {
                            addSkill(formatted);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full transition-all duration-200 border flex items-center gap-1.5 cursor-grab active:cursor-grabbing transform ${rotationClass} hover:scale-105 active:scale-[0.98] ${sizeClass} ${
                          isAdded
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : "bg-emerald-50/50 text-emerald-900 hover:bg-emerald-50 border-emerald-100 hover:border-emerald-300"
                        }`}
                        title={isAdded ? "Drag-drop to import, or click to remove" : "Drag-drop or click to weave this keyword inside your CV!"}
                      >
                        <span className="select-none pointer-events-none">{formatted}</span>
                        {isAdded ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 inline shrink-0 select-none pointer-events-none" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-emerald-500 inline shrink-0 select-none pointer-events-none" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
    
        {/* Section Content: Certifications */}
        {editSection === 'certifications' && (
          <div className="space-y-3 animate-fade-in" id="certifications-inputs">
            <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Add Certifications & Accreditations</label>
            <div className="flex gap-2">
              <input
                id="input-new-cert"
                type="text"
                placeholder="e.g., AWS Certified Solutions Architect, PMP..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addCertification((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs rounded-lg p-2.5 text-slate-800 font-medium"
              />
              <button
                id="btn-add-cert"
                type="button"
                onClick={() => {
                  const ele = document.getElementById("input-new-cert") as HTMLInputElement;
                  if (ele && ele.value.trim()) {
                    addCertification(ele.value);
                    ele.value = '';
                  }
                }}
                className="bg-emerald-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg cursor-pointer shrink-0"
              >
                Add
              </button>
            </div>
            <div className="space-y-1.5 pt-2">
              {resumeData.certifications?.map((cert, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-100 px-3 py-2 rounded-lg text-xs text-slate-800 font-medium border border-slate-200 animate-fade-in">
                  <span>{cert}</span>
                  <button
                    id={`btn-del-cert-${idx}`}
                    type="button"
                    onClick={() => removeCertification(idx)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5 ml-2 shrink-0"
                    title={t("editor.fields.removeCertification")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {(!resumeData.certifications || resumeData.certifications.length === 0) && (
                <p className="text-[10px] text-slate-400 italic">No certifications added. Use the input above to add credentials.</p>
              )}
            </div>
          </div>
        )}
    
        {/* Section Content: Volunteer Work */}
        {editSection === 'volunteerWork' && (
          <div className="space-y-3 animate-fade-in" id="volunteer-inputs">
            <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Add Volunteer experience & Community Service</label>
            <div className="flex gap-2">
              <input
                id="input-new-volunteer"
                type="text"
                placeholder="e.g., Volunteer Coordinator - Austin Food Bank..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addVolunteerWork((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs rounded-lg p-2.5 text-slate-800 font-medium"
              />
              <button
                id="btn-add-volunteer"
                type="button"
                onClick={() => {
                  const ele = document.getElementById("input-new-volunteer") as HTMLInputElement;
                  if (ele && ele.value.trim()) {
                    addVolunteerWork(ele.value);
                    ele.value = '';
                  }
                }}
                className="bg-emerald-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg cursor-pointer shrink-0"
              >
                Add
              </button>
            </div>
            <div className="space-y-1.5 pt-2">
              {resumeData.volunteerWork?.map((vol, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-100 px-3 py-2 rounded-lg text-xs text-slate-800 font-medium border border-slate-200 animate-fade-in">
                  <span>{vol}</span>
                  <button
                    id={`btn-del-volunteer-${idx}`}
                    type="button"
                    onClick={() => removeVolunteerWork(idx)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5 ml-2 shrink-0"
                    title="Remove Volunteer Work"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {(!resumeData.volunteerWork || resumeData.volunteerWork.length === 0) && (
                <p className="text-[10px] text-slate-400 italic">No volunteer experience added. Use the input above to add outreach points.</p>
              )}
            </div>
          </div>
        )}
    
        {/* Section Content: Languages */}
        {editSection === 'languages' && (
          <div className="space-y-3 animate-fade-in" id="languages-inputs">
            <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Add Spoken / Technical Languages</label>
            <div className="flex gap-2">
              <input
                id="input-new-language"
                type="text"
                placeholder="e.g., Spanish (Fluent), Japanese (Basic)..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addLanguage((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs rounded-lg p-2.5 text-slate-800 font-medium"
              />
              <button
                id="btn-add-language"
                type="button"
                onClick={() => {
                  const ele = document.getElementById("input-new-language") as HTMLInputElement;
                  if (ele && ele.value.trim()) {
                    addLanguage(ele.value);
                    ele.value = '';
                  }
                }}
                className="bg-emerald-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg cursor-pointer shrink-0"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {resumeData.languages?.map((lang, idx) => (
                <span key={idx} className="bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md text-xs text-slate-700 font-semibold border border-slate-200 flex items-center gap-1 pb-1 animate-fade-in">
                  {lang}
                  <button
                    id={`btn-del-lang-${idx}`}
                    type="button"
                    onClick={() => removeLanguage(idx)}
                    className="text-slate-400 hover:text-rose-600 self-center text-[10px] pl-0.5 cursor-pointer font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
              {(!resumeData.languages || resumeData.languages.length === 0) && (
                <p className="text-[10px] text-slate-400 italic">No languages added. Use the input above to add languages.</p>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 pt-4 space-y-3">
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 block">{t("editor.editingTools")}</span>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-slate-500">
                {activeInputId
                  ? t("editor.currentField.label", { field: currentFieldLabel })
                  : currentFieldLabel}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" disabled={!activeInputId} onClick={() => applyFormatToActiveField("bold")} className={`p-1.5 rounded-lg border ${activeInputId ? "bg-white border-slate-200" : "opacity-40"}`} title={t("editor.formatBold")}><Bold className="w-3.5 h-3.5" /></button>
                <button type="button" disabled={!activeInputId} onClick={() => applyFormatToActiveField("italic")} className={`p-1.5 rounded-lg border ${activeInputId ? "bg-white border-slate-200" : "opacity-40"}`} title={t("editor.formatItalic")}><Italic className="w-3.5 h-3.5" /></button>
                <button type="button" disabled={!activeInputId} onClick={() => applyFormatToActiveField("bullet")} className={`p-1.5 rounded-lg border ${activeInputId ? "bg-white border-slate-200" : "opacity-40"}`} title={t("editor.formatBullet")}><List className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button type="button" onClick={runGrammarToneCheck} disabled={grammarChecking} className="py-2 px-2 rounded-lg text-[10px] font-bold bg-emerald-600 text-white disabled:opacity-50 flex items-center justify-center gap-1">
                {grammarChecking ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {t("editor.grammarShort")}
              </button>
              <button type="button" onClick={runReadabilityComplexityCheck} disabled={readabilityChecking} className="py-2 px-2 rounded-lg text-[10px] font-bold bg-amber-600 text-white disabled:opacity-50 flex items-center justify-center gap-1">
                {readabilityChecking ? <RefreshCw className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                {t("editor.readabilityShort")}
              </button>
              <button type="button" onClick={runSkillConsistencyCheck} disabled={skillConsistencyChecking} className="py-2 px-2 rounded-lg text-[10px] font-bold bg-emerald-600 text-white disabled:opacity-50 flex items-center justify-center gap-1">
                {skillConsistencyChecking ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Award className="w-3 h-3" />}
                {t("editor.skillConsistencyShort")}
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl bg-white/70 overflow-hidden shadow-xs">
            <div
              className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/70"
              onClick={() => setVerbsPanelOpen(!verbsPanelOpen)}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{t("editor.verbSuggestions")}</h4>
                  <p className="text-[10px] text-slate-400">{t("editor.verbSuggestionsHint")}</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${verbsPanelOpen ? "rotate-180" : ""}`} />
            </div>
            {verbsPanelOpen && (
              <div className="p-3 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {actionVerbsCategories.map((cat) => {
                    const IconComponent = cat.icon;
                    const isActive = activeVerbCategoryKey === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setSelectedVerbCategory(cat.key)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-full border flex items-center gap-1 ${isActive ? cat.activeColor : "bg-white text-slate-600 border-slate-200"}`}
                      >
                        <IconComponent className="w-3 h-3" />
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(actionVerbsCategories.find((c) => c.key === activeVerbCategoryKey) || actionVerbsCategories[0]).verbs.map((verb, vIdx) => (
                    <button
                      key={vIdx}
                      type="button"
                      disabled={!activeInputId}
                      onClick={() => insertActionVerb(verb)}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-semibold ${activeInputId ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "opacity-50"}`}
                    >
                      {verb}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" id="jd-editor-panel">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="jd-textarea" className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">{t("editor.jobDescription")}</label>
          <span className="text-[10px] text-slate-400 font-bold">{t("editor.jobDescriptionHint")}</span>
        </div>
        <textarea
          id="jd-textarea"
          rows={4}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          onFocus={handleElementSelectOrFocus}
          onSelect={handleElementSelectOrFocus}
          onKeyUp={handleElementSelectOrFocus}
          placeholder={t("editor.jobDescriptionPlaceholder")}
          className="w-full text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-y"
        />
      </div>
    </motion.div>
  );
}
