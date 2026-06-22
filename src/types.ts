/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TemplateStyle } from "./lib/resumeTemplateCatalog";

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  linkedin: string;
  /** Hong Kong: right to work / visa status */
  rightToWork?: string;
  /** Hong Kong: notice period e.g. "1 month" */
  noticePeriod?: string;
  /** Expected monthly salary e.g. "HK$35,000" */
  expectedSalary?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  location: string;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  gradDate: string;
  location: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  techStack: string;
  url: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  skills: string[];
  certifications?: string[];
  volunteerWork?: string[];
  languages?: string[];
}

export interface KeywordAnalysis {
  word: string;
  importance: 'high' | 'medium' | 'low';
  present: boolean;
}

export interface ScoreCategory {
  name: string;
  score: number;
  max: number;
  feedback: string;
}

export interface AnalysisResult {
  atsScore: number;
  categories: ScoreCategory[];
  keywords: KeywordAnalysis[];
  weakPhrases: { original: string; replacement: string; reason: string }[];
  tailoredSummary: string;
  tailoredBulletPoints: { experienceId: string; originalBullets: string[]; optimizedBullets: string[] }[];
}

export interface GrammarSuggestion {
  section: string;
  original: string;
  suggested: string;
  explanation: string;
  severity: 'high' | 'medium' | 'low';
}

export interface GrammarToneResult {
  score: number;
  summary: string;
  suggestions: GrammarSuggestion[];
}

export type { TemplateStyle, TemplateFamily } from "./lib/resumeTemplateCatalog";
export type { ResumeThemeCustomization, ResolvedResumeTheme } from "./lib/resumeThemeCustomization";

export type TailorIntensity = 'balanced' | 'aggressive';

export interface ApiResponseMeta {
  source: 'gemini' | 'simulation' | 'parser';
  simulated?: boolean;
}

export interface ReadabilitySuggestion {
  section: string;
  original: string;
  suggested: string;
  reason: string;
  type: 'sentence_structure' | 'jargon_reduction';
}

export interface ReadabilityComplexityResult {
  readabilityScore: number;
  complexityLevel: 'High' | 'Medium' | 'Low';
  averageSentenceLength: number;
  jargonDensity: number;
  summary: string;
  suggestions: ReadabilitySuggestion[];
}

export interface SkillConsistencyIssue {
  skill: string;
  severity: "critical" | "warning" | "info";
  message: string;
}

export interface SkillConsistencyResult {
  consistencyScore: number;
  jobTitleAnalyzed: string;
  missingCrucialSkills: string[];
  redundantOrMismatchedSkills: string[];
  issues: SkillConsistencyIssue[];
  summary: string;
}

export interface MatchGapSeverityIssue {
  area: string;
  type: "skills" | "experience" | "education" | "credentials";
  severity: "high" | "medium" | "low";
  description: string;
  recommendation: string;
}

export interface AIMatchAnalysisResult {
  overallScore: number;
  jobTitle: string;
  companyName?: string;
  summary: string;
  matchedStrengths: string[];
  gaps: MatchGapSeverityIssue[];
  missingKeywords: string[];
  actionPlan: string[];
}

export type ApplicationStatus =
  | "draft"
  | "ready"
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected"
  | "archived";

export type CoverLetterTone = "professional" | "enthusiastic" | "concise";

export interface CoverLetterResult {
  salutation: string;
  opening: string;
  bodyParagraphs: string[];
  closing: string;
  signature: string;
  fullText: string;
  tone: CoverLetterTone;
}

export interface ApplicationPackage {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: ApplicationStatus;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  resumeSnapshot: ResumeData;
  templateStyle: TemplateStyle;
  tailorAnalysis: AnalysisResult | null;
  matchAnalysis: AIMatchAnalysisResult | null;
  coverLetter: CoverLetterResult | null;
  interviewPrep?: InterviewPrepResult | null;
  companyResearch?: CompanyResearchResult | null;
  timeline?: ApplicationEvent[];
  notes?: string;
  appliedAt?: string;
  followUpDate?: string;
  interviewDate?: string;
}

export type ApplicationEventType =
  | "created"
  | "status_change"
  | "applied"
  | "interview_scheduled"
  | "follow_up"
  | "note";

export interface ApplicationEvent {
  id: string;
  type: ApplicationEventType;
  timestamp: string;
  title: string;
  detail?: string;
}

export interface InterviewQuestion {
  question: string;
  tips: string;
  sampleAnswerOutline: string;
}

export interface InterviewQuestionCategory {
  type: "technical" | "behavioral" | "company" | "role";
  label: string;
  questions: InterviewQuestion[];
}

export interface InterviewPrepResult {
  jobTitle: string;
  companyName: string;
  focusAreas: string[];
  categories: InterviewQuestionCategory[];
  preparationChecklist: string[];
}

export interface CompanyResearchResult {
  companyName: string;
  overview: string;
  mission: string;
  products: string[];
  culture: string[];
  recentNews: string[];
  interviewTips: string[];
  talkingPoints: string[];
}

export type WizardPipelineStep =
  | "tailor"
  | "match"
  | "cover-letter"
  | "interview-prep"
  | "company-research"
  | "save";

export interface WizardProgressState {
  currentStep: WizardPipelineStep | null;
  completedSteps: WizardPipelineStep[];
  error: string | null;
}


