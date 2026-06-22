import { describe, it, expect } from 'vitest';
import { initialResumeData, initialJobDescription } from '../data';

describe('NextStepResume.ai Engine - Core Logic Unit Tests', () => {

  // Test Case 1: Validate Integrity of Initial Candidate Fields
  it('should initialize resume data with complete core sections', () => {
    expect(initialResumeData).toBeDefined();
    expect(initialResumeData.personalInfo).toBeDefined();
    expect(initialResumeData.personalInfo.name.length).toBeGreaterThan(0);
    expect(initialResumeData.personalInfo.location).toMatch(/Hong Kong|Chicago/i);
    expect(Array.isArray(initialResumeData.experience)).toBe(true);
    expect(Array.isArray(initialResumeData.skills)).toBe(true);
  });

  // Test Case 2: Validate Job Description Template and Size
  it('should contain a professional default job description for alignment', () => {
    expect(initialJobDescription).toBeDefined();
    expect(initialJobDescription.length).toBeGreaterThan(100);
    expect(initialJobDescription.toLowerCase()).toContain('react');
  });

  // Test Case 3: Simulate ATS Keyword Matching Score Calculation
  it('should correctly calculate simulated ATS keyword match scores', () => {
    const resumeSkills = ['react', 'typescript', 'tailwind css', 'node.js'];
    const requiredKeywords = ['react', 'typescript', 'graphql', 'docker', 'tailwind css'];

    // Simulating matching processor
    const matched = requiredKeywords.filter(keyword => 
      resumeSkills.some(skill => skill.toLowerCase() === keyword.toLowerCase())
    );
    const score = Math.round((matched.length / requiredKeywords.length) * 100);

    expect(matched).toContain('react');
    expect(matched).toContain('typescript');
    expect(matched).not.toContain('graphql');
    expect(score).toBe(60); // 3 out of 5 is 60%
  });

  // Test Case 4: Simulate Dark Mode State Storage Preference
  it('should fallback to default light mode if no value is present in local storage simulation', () => {
    const mockStorage: Record<string, string> = {};
    const getTheme = () => mockStorage['theme'] || 'light';
    
    expect(getTheme()).toBe('light');

    // Setting theme
    mockStorage['theme'] = 'dark';
    expect(getTheme()).toBe('dark');
  });

});
