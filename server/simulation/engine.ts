import { deterministicPresent, deterministicRange } from "../lib/aiContext.ts";

export function getSimulatedReadability(resumeData: any): any {
  const isString = typeof resumeData === "string";
  const experienceList = isString ? [] : (resumeData.experience || []);
  const title = isString ? "Software Engineer" : (resumeData.personalInfo?.title || "Professional");

  const suggestions: any[] = [
    {
      section: "Professional Summary",
      original: isString 
        ? "Dynamic leader looking to leverage bleeding-edge paradigms to synergize scalable systems." 
        : (resumeData.summary?.substring(0, 75) || "A passionate Engineer with experience..."),
      suggested: `Results-oriented ${title} with a track record of driving scalable system efficiency and collaborative growth.`,
      reason: "Replaces empty corporate buzzwords ('leveraging bleeding-edge paradigms to synergize') with direct, professional action descriptors.",
      type: "jargon_reduction" as const
    }
  ];

  if (experienceList.length > 0) {
    const mainJob = experienceList[0];
    const mainTitle = mainJob.role || "Developer";
    const firstBullet = (mainJob.bullets && mainJob.bullets[0]) || "Helped build features for the website.";
    
    suggestions.push({
      section: `Experience: ${mainTitle}`,
      original: firstBullet,
      suggested: `Engineered high-performance web components utilizing React and TypeScript, accelerating site loading speed by 25%.`,
      reason: "Simplifies sentence pacing and structure while maintaining vital technical keywords and clear STAR-model metrics.",
      type: "sentence_structure" as const
    });

    if (mainJob.bullets && mainJob.bullets.length > 1) {
      suggestions.push({
        section: `Experience: ${mainTitle}`,
        original: mainJob.bullets[1],
        suggested: `Optimized database API routing parameters to improve system latency performance by 30%.`,
        reason: "Eliminates redundant technical filler terminology, increasing Flesch scanning velocity for AI indices.",
        type: "jargon_reduction" as const
      });
    }
  }

  return {
    readabilityScore: 78,
    complexityLevel: "Medium" as const,
    averageSentenceLength: 15,
    jargonDensity: 14,
    summary: `Your resume demonstrates good structure with a readable sentence average of 15 words per bullet. However, your professional summary contains passive corporate fillers which can easily be simplified for optimal ATS scanning and lower human reviewer fatigue.`,
    suggestions
  };
}

export function getSimulatedGeminiReply(message: string, resumeData: any, jobDescription: string): string {
  const msgLower = message.toLowerCase();
  const title = resumeData?.personalInfo?.title || "Professional Developer";
  const name = resumeData?.personalInfo?.name || "Candidate";

  if (msgLower.includes("hello") || msgLower.includes("hi ") || msgLower.includes("greet")) {
    return `Hello **${name}**! 👋 I'm your integrated AI Career Advisor.\n\nI have indexed your resume as a **${title}** and analyzed your match options. How can I help you optimize your resume today? You can ask me to:
- **"Rewrite my summary for this job"**
- **"What skills am I missing?"**
- **"How can I emphasize React inside my bullets?"**`;
  }

  if (msgLower.includes("summary") || msgLower.includes("profile") || msgLower.includes("intro")) {
    return `### 💡 Optimized Professional Summary for You:
"Dynamic, performance-driven **${title}** with proven experience engineering high-performance systems and managing full-cycle software deployments. Highly skilled in leveraging robust technologies to streamline workflow throughput and implement clean, modular, ATS-optimized code. Adept at driving STAR model impacts which result in recorded scalability enhancements."

**Why this works:**
1. Avoids passive phrases like *"Responsible for"* or *"Looking for"*.
2. Elevates technical keywords directly into first-scan focus.
3. Hints at quantifiable business results which catch recruiters' eyes in < 6 seconds!`;
  }

  if (msgLower.includes("skill") || msgLower.includes("missing") || msgLower.includes("gap") || msgLower.includes("keyword")) {
    const jdTech = [];
    if (jobDescription) {
      const terms = ["react", "typescript", "node.js", "next.js", "aws", "docker", "python", "kubernetes", "tailwind", "sql"];
      terms.forEach(t => {
        if (jobDescription.toLowerCase().includes(t)) {
          jdTech.push(t.toUpperCase());
        }
      });
    }
    const displayMissing = jdTech.length > 0 ? jdTech.join(", ") : "TypeScript, Kubernetes, and CI/CD Pipelines";
    return `### 🎯 Technical Keyword Analysis & Optimization:

Recruiting algorithms scanned your profile compared to the job description expectations. Here is how to close the gaps:

1. **Missing Domain Skills:** You should officially list **${displayMissing}** in your Technical Skills ledger.
2. **Contextual Proofing:** Don't just list them in the skills box—integrate them into your employment accomplishments:
   - *Instead of:* "Maintained existing applications."
   - *Write:* "Engineered robust code refactors using **TypeScript**, reducing frontend runtime latency margins by 18%."

Would you like me to rewrite a specific experience bullet to fit these standards?`;
  }

  if (msgLower.includes("rewrite") || msgLower.includes("bullet") || msgLower.includes("experience") || msgLower.includes("work")) {
    return `### 📝 Custom STAR-method Bullet Point Rewrite:

Here is how we can transform a standard passive bullet point into a high-impact, professional, data-driven achievement:

*   **Passive / Low-Agency (Before):**
    > *"Helped design components and fixed website performance bugs."*
*   **Active / Metric-Enriched (After):**
    > **"Architected scale-resilient modular components using React and TypeScript, accelerating DOM paint speed by 28% and resolving critical performance bottlenecks."**

**Benefits of this update:**
- Shift from passive action (*"helped"*, *"worked on"*) to premium impact verb (*"Architected"*, *"Optimized"*).
- Incorporates exact technology attributes to satisfy the ATS criteria.
- Outlines clear business metrics (paint speed percentiles) that humans respect.`;
  }

  // Default helpful career advisor response
  return `### 💡 Advice for your request regarding: "${message}"

Thank you for asking! As your career coach, here are 3 immediate guidelines to raise your profile as a **${title}**:

1. **Assertive Verb Framing:** Replace verbs like *"managed"* with high-agency verbs like *"orchestrated"*, *"spearheaded"*, or *"conceptualized"*.
2. **Quantifiably STAR Proofing:** Always associate your development bullet entries with structured, estimated improvements (e.g. latency reduced, pipeline throughput, client ticket delivery).
3. **Keyword Density Matrix:** Align technical frameworks to matches directly within your experience narrative.

Would you like me to tailor any specific section, suggest custom certification updates, or draft a cover letter outline for this job description?`;
}

// High quality simulated match analyzer fallbacks
export function getSimulatedMatchAnalysis(resumeData: any, jobDescription: string): any {
  const isString = typeof resumeData === "string";
  const title = isString ? "Software Engineer" : (resumeData.personalInfo?.title || "Professional").trim();
  const skillsList: string[] = isString ? [] : (resumeData.skills || []);

  const jd = jobDescription || "";
  const jdLower = jd.toLowerCase();

  // Basic parsing of JD to find job title
  let jobTitle = title;
  const titleMatch = jd.match(/(?:title|role|position):\s*([^\n]+)/i) || jd.match(/(?:looking for a|seeking a)\s+([A-Za-z0-9\s-]{3,40})/i);
  if (titleMatch && titleMatch[1]) {
    jobTitle = titleMatch[1].trim();
  } else {
    if (jdLower.includes("product manager")) jobTitle = "Product Manager";
    else if (jdLower.includes("frontend engineer") || jdLower.includes("frontend developer")) jobTitle = "Frontend Engineer";
    else if (jdLower.includes("backend engineer") || jdLower.includes("backend developer")) jobTitle = "Backend Engineer";
    else if (jdLower.includes("full stack") || jdLower.includes("fullstack")) jobTitle = "Full-Stack Software Engineer";
    else if (jdLower.includes("data scientist") || jdLower.includes("data analyst")) jobTitle = "Data Scientist";
  }

  let matchScore = 72;
  const matchedStrengths: string[] = [];
  const gaps: any[] = [];
  const missingKeywords: string[] = [];
  const actionPlan: string[] = [];

  const skillsLower = skillsList.map(s => s.toLowerCase());
  const standardTechTerms = ["react", "typescript", "node.js", "next.js", "docker", "kubernetes", "aws", "python", "sql", "graphql", "tailwind", "express"];
  const jdTechKeywords: string[] = [];
  standardTechTerms.forEach(term => {
    if (jdLower.includes(term)) {
      jdTechKeywords.push(term);
    }
  });

  const matchedTech = jdTechKeywords.filter(k => skillsLower.some(s => s.includes(k)));
  const unmatchedTech = jdTechKeywords.filter(k => !skillsLower.some(s => s.includes(k)));

  if (matchedTech.length > 0) {
    matchedStrengths.push(`Direct alignment on core technology assets including: ${matchedTech.map(t => t.toUpperCase()).join(", ")}`);
    matchScore += matchedTech.length * 4;
  } else {
    matchedStrengths.push("Possesses cross-functional foundational technical competency that transfers well across platforms.");
  }

  if (unmatchedTech.length > 0) {
    unmatchedTech.forEach(term => {
      missingKeywords.push(term.charAt(0).toUpperCase() + term.slice(1));
    });
    gaps.push({
      area: "Core Technologies",
      type: "skills",
      severity: unmatchedTech.length > 3 ? "high" : "medium",
      description: `Target role specifies deep proficiency in ${unmatchedTech.map(t => t.toUpperCase()).join(", ")}, which are currently missing on your resume skills profile.`,
      recommendation: `Incorporate technical descriptors for ${unmatchedTech.slice(0, 3).map(t => t.toUpperCase()).join(", ")} directly into your skills ledger and work history bullets.`
    });
  }

  const expList = isString ? [] : (resumeData.experience || []);
  if (expList.length < 2) {
    gaps.push({
      area: "Professional History Density",
      type: "experience",
      severity: "high",
      description: "The job requirements highlight Senior/Staff levels of accountability. Your profile contains fewer than 2 distinct work experience ledger items.",
      recommendation: "Flesh out previous consulting, freelance, or junior projects to demonstrate professional duration and career progression."
    });
    matchScore -= 15;
  } else {
    matchedStrengths.push(`Strong career duration depth with ${expList.length} distinct professional engagements in senior/mid technical capacities.`);
  }

  let hasMetrics = false;
  expList.forEach((exp: any) => {
    if (exp.bullets) {
      exp.bullets.forEach((b: string) => {
        if (/\b\d+%\b|\b\d+\s*(?:percent|million|usd|developers|users|kpi|mil)\b/i.test(b)) {
          hasMetrics = true;
        }
      });
    }
  });

  if (hasMetrics) {
    matchedStrengths.push("Uses high-agency, metric-driven achievements (STAR method format) demonstrating business impact.");
  } else {
    gaps.push({
      area: "Performance Metrics & KPIs",
      type: "experience",
      severity: "medium",
      description: "The target job values performance optimization. Currently, your career bullets describe static duties rather than dynamic, quantified business impacts.",
      recommendation: "Rework work history bullet statements to include specific metrics (revenue growth, render efficiency, deployment speed or payload reduction percentiles)."
    });
    matchScore -= 8;
  }

  const eduList = isString ? [] : (resumeData.education || []);
  const hasCS = eduList.some((e: any) => e.field && /computer|science|engineering|tech/i.test(e.field));
  if (jdLower.includes("degree") || jdLower.includes("bachelor") || jdLower.includes("b.s") || jdLower.includes("computer science")) {
    if (eduList.length === 0) {
      gaps.push({
        area: "Academic Credentials",
        type: "education",
        severity: "high",
        description: "The targeted role strictly lists a higher-education degree (B.S./M.S. in Computer Science or related) as preferred, but your profile lacks an Academic Background section.",
        recommendation: "Ensure your primary degrees, diplomas, or bootcamp professional certifications are listed with proper major fields."
      });
      matchScore -= 12;
    } else if (!hasCS) {
      gaps.push({
        area: "Formal STEM Alignment",
        type: "education",
        severity: "low",
        description: "Your academic degree is in a non-traditional STEM field. While industry experience makes up for this, ATS machines prioritize explicit technical degrees.",
        recommendation: "Relocate your skills list to the absolute top of the page index to distract algorithms, emphasizing skills over formal majors."
      });
      matchScore -= 4;
    } else {
      matchedStrengths.push("Direct academic alignment with a formal degree listed in Computer Science / Engineering.");
    }
  }

  actionPlan.push(`Integrate the missing key tech terms (${missingKeywords.slice(0, 3).join(", ") || "TypeScript, Next.js, Docker"}) into your skills ledger.`);
  actionPlan.push("Convert at least 3 career bullet points from passive statements to metric-enriched STAR metrics.");
  actionPlan.push("Optimize the Professional Summary paragraph to target specific pain points mentioned in the JD.");

  matchScore = Math.max(40, Math.min(98, matchScore));

  return {
    overallScore: matchScore,
    jobTitle,
    companyName: jd.match(/at\s+([A-Z][A-Za-z0-9\s.]{1,20})/)?.[1]?.trim() || undefined,
    summary: `Your resume matches ${matchScore}% of the requirements listed in the job description. While you possess direct technical mastery in several core sectors, resolving the highlighted gaps around ${missingKeywords.slice(0, 2).join(" and ") || "industry terms"} and integrating quantified metric achievements will dramatically elevate your interview match probability.`,
    matchedStrengths,
    gaps,
    missingKeywords,
    actionPlan
  };
}

// High quality simulated skill consistency checker
export function getSimulatedSkillConsistency(resumeData: any, jobDescription: string): any {
  const isString = typeof resumeData === "string";
  const title = isString ? "Software Engineer" : (resumeData.personalInfo?.title || "Professional").trim();
  const skillsList: string[] = isString ? [] : (resumeData.skills || []);
  
  const titleLower = title.toLowerCase();
  const skillsLower = skillsList.map(s => s.toLowerCase());

  let consistencyScore = 88;
  const missingCrucialSkills: string[] = [];
  const redundantOrMismatchedSkills: string[] = [];
  const issues: any[] = [];

  if (titleLower.includes("engineer") || titleLower.includes("developer") || titleLower.includes("programmer") || titleLower.includes("architect")) {
    const mustHaves = titleLower.includes("frontend") || titleLower.includes("web")
      ? ["React", "TypeScript", "Tailwind CSS", "Next.js"]
      : titleLower.includes("backend")
      ? ["Node.js", "PostgreSQL", "Docker", "REST APIs"]
      : ["Git", "Docker", "TypeScript", "CI/CD"];

    mustHaves.forEach(skill => {
      if (!skillsLower.some(s => s.includes(skill.toLowerCase()))) {
        missingCrucialSkills.push(skill);
      }
    });

    const genericSkills = ["microsoft office", "word", "excel", "powerpoint", "typing"];
    skillsList.forEach(s => {
      if (genericSkills.includes(s.toLowerCase())) {
        redundantOrMismatchedSkills.push(s);
        issues.push({
          skill: s,
          severity: "warning",
          message: `Listed skill "${s}" is considered too basic for an Engineering title "${title}". Consider removing it to save valuable resume real estate.`
        });
      }
    });

    if (missingCrucialSkills.length > 0) {
      consistencyScore -= (missingCrucialSkills.length * 10);
      issues.push({
        skill: missingCrucialSkills[0],
        severity: "critical",
        message: `Missing key tool: "${missingCrucialSkills[0]}" is a fundamental expectation for contemporary "${title}" roles.`
      });
    }
  } else if (titleLower.includes("manager") || titleLower.includes("product") || titleLower.includes("lead")) {
    const mustHaves = ["Agile Methodology", "Product Roadmap", "Scrum", "SQL", "Jira"];
    mustHaves.forEach(skill => {
      if (!skillsLower.some(s => s.includes(skill.toLowerCase()))) {
        missingCrucialSkills.push(skill);
      }
    });

    if (missingCrucialSkills.length > 0) {
      consistencyScore -= (missingCrucialSkills.length * 8);
      issues.push({
        skill: missingCrucialSkills[0],
        severity: "warning",
        message: `Strategic competence missing: Target role candidates heavily rely on "${missingCrucialSkills[0]}" for successful cross-team execution.`
      });
    }
  } else {
    if (!skillsLower.some(s => s.includes("communication") || s.includes("leadership") || s.includes("project management") || s.includes("strategic"))) {
      missingCrucialSkills.push("Project Management");
      missingCrucialSkills.push("Strategic Alignment");
      consistencyScore -= 12;
      issues.push({
        skill: "Project Management",
        severity: "info",
        message: "Consider adding core soft competencies like Strategic Project Management to reinforce senior professional authority."
      });
    }
  }

  consistencyScore = Math.max(35, Math.min(100, consistencyScore));

  const level = consistencyScore >= 80 ? "outstanding" : consistencyScore >= 60 ? "moderate" : "deficient";
  const summary = `Your listed skills demonstrate ${level} alignment in industry standard taxonomy for a "${title}" profile. We detected ${missingCrucialSkills.length} missing industry standard skillsets and successfully audited your skills metadata against the core requirements.`;

  return {
    consistencyScore,
    jobTitleAnalyzed: title,
    missingCrucialSkills,
    redundantOrMismatchedSkills,
    issues,
    summary
  };
}


// High quality simulated grammar and tone checker
export function getSimulatedGrammarTone(resumeData: any): any {
  const isString = typeof resumeData === "string";
  const experienceList = isString ? [] : (resumeData.experience || []);
  const currentTitle = isString ? "Software Engineer" : (resumeData.personalInfo?.title || "Professional");

  const fallbackSuggestions: any[] = [
    {
      section: "Professional Summary",
      original: isString ? "I am looking for a job" : (resumeData.summary?.substring(0, 75) || "A passionate Engineer with experience..."),
      suggested: `Results-driven ${currentTitle} with a documented history of engineering premium web systems and accelerating deployment velocity.`,
      explanation: "Shifts the emphasis from basic desire to high-impact achievements. Replaced generic claims with robust metrics-ready phrases.",
      severity: "medium" as const
    }
  ];

  if (experienceList.length > 0) {
    const mainJob = experienceList[0];
    const mainTitle = mainJob.role || "Developer";
    const firstBullet = (mainJob.bullets && mainJob.bullets[0]) || "Helped build features for the website.";
    
    fallbackSuggestions.push({
      section: `Experience: ${mainTitle}`,
      original: firstBullet,
      suggested: `Architected high-performance responsive components using typescript and modern React, increasing workflow throughput by 22%.`,
      explanation: "Converted low-agency verb ('helped build') to an assertive engineering term ('architected') and specified standard stack tooling with a KPI marker.",
      severity: "high" as const
    });

    if (mainJob.bullets && mainJob.bullets.length > 1) {
      fallbackSuggestions.push({
        section: `Experience: ${mainTitle}`,
        original: mainJob.bullets[1],
        suggested: `Orchestrated diagnostic debug audits, reducing average latency bottlenecks by 31% across API gateway routes.`,
        explanation: "Action-oriented phrasing emphasizing proactive problem resolution and measurable performance gains.",
        severity: "low" as const
      });
    }
  }

  return {
    score: 82,
    summary: `The resume for ${isString ? "Applicant" : (resumeData.personalInfo?.name || "Jane Doe")} possesses modern technical coordinates, but would benefit from a proactive tense alignment. Several segments lean on non-committal support keywords ('worked on', 'helped') rather than direct executive action indicators.`,
    suggestions: fallbackSuggestions
  };
}

// High quality localized simulated response generator
export function getSimulatedAnalysis(resumeData: any, jobDescription: string, intensity: "balanced" | "aggressive" = "balanced"): any {
  const isString = typeof resumeData === "string";
  const name = isString ? "Professional Applicant" : (resumeData.personalInfo?.name || "Jane Doe");
  const currentTitle = isString ? "Software Engineer" : (resumeData.personalInfo?.title || "Professional");
  
  const seedBase = `${name}|${currentTitle}|${jobDescription || ""}`;

  // Custom keyword generation based on JD or default
  const targetKeywords = [
    { word: "ATS Optimization", importance: "high", present: true },
    { word: "STAR Method Metrics", importance: "high", present: false },
    { word: "Full-Stack Development", importance: "high", present: true },
    { word: "System Architecture", importance: "medium", present: false },
    { word: "TypeScript & React", importance: "high", present: true },
    { word: "Cloud Deployment", importance: "medium", present: true },
    { word: "Quantitative Results", importance: "high", present: false },
    { word: "Enterprise Architecture", importance: "low", present: false }
  ];

  if (jobDescription && jobDescription.length > 5) {
    const jdWords = jobDescription.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const uniqueWords = Array.from(new Set(jdWords)).slice(0, 8);
    uniqueWords.forEach((word, idx) => {
      if (idx < targetKeywords.length) {
        targetKeywords[idx].word = word.charAt(0).toUpperCase() + word.slice(1);
        targetKeywords[idx].present = deterministicPresent(`${seedBase}|keyword|${word}`);
      }
    });
  }

  const score1 = deterministicRange(`${seedBase}|cat1`, intensity === "aggressive" ? 14 : 12, intensity === "aggressive" ? 18 : 16);
  const score2 = deterministicRange(`${seedBase}|cat2`, intensity === "aggressive" ? 12 : 10, intensity === "aggressive" ? 16 : 14);
  const score3 = deterministicRange(`${seedBase}|cat3`, intensity === "aggressive" ? 16 : 14, intensity === "aggressive" ? 20 : 18);
  const score4 = deterministicRange(`${seedBase}|cat4`, intensity === "aggressive" ? 13 : 11, intensity === "aggressive" ? 17 : 15);
  const totalScore = Math.min(98, score1 + score2 + score3 + score4);

  const experienceList = isString ? [] : (resumeData.experience || []);
  const tailoredBullets = experienceList.map((exp: any) => {
    const originalBullets = exp.bullets || ["Responsible for coding and fixing bugs.", "Helped design components."];
    const optimized = originalBullets.map((b: string) => {
      if (b.includes("Responsible for") || b.includes("Worked on") || b.includes("Helped")) {
        return intensity === "aggressive"
          ? `Spearheaded enterprise-scale architecture initiatives, accelerating deployment pipeline velocity by 38% via Docker/Kubernetes orchestration.`
          : `Orchestrated scale-resilient architecture, accelerating deployment pipeline velocity by 34% using Docker container workflows.`;
      }
      return intensity === "aggressive"
        ? `Engineered metric-driven state handlers; boosted rendering KPIs by 45% through React virtualization and TypeScript strict-mode refactors.`
        : `Engineered metric-driven state-management handlers; enhanced rendering KPIs by 42% through aggressive React virtual list optimization.`;
    });
    return {
      experienceId: exp.id || "1",
      originalBullets,
      optimizedBullets: optimized
    };
  });

  return {
    atsScore: totalScore,
    categories: [
      { name: "Keyword Alignment", score: score1, max: 25, feedback: "Several key technical terms from the JD match your engineering background. Adding explicit metric-driven phrases will bridge remaining holes." },
      { name: "Experience Impact", score: score2, max: 25, feedback: "Work experience statements lack sufficient numerical data. Shift bullets from standard responsibilities to quantitative STAR-format achievements." },
      { name: "Format & ATS Scan", score: score3, max: 25, feedback: "Excellent parsing eligibility. Clean headings and simplified modular dividers ensure faultless modern ATS machine readings." },
      { name: "Skill Relevancy", score: score4, max: 25, feedback: "Skills listed are solid but we recommend re-ordering high importance technologies such as Tailwind CSS near the top of the category." }
    ],
    keywords: targetKeywords,
    weakPhrases: [
      { original: "Responsible for managing products", replacement: "Spearheaded lifecycle execution of 3 product pipelines", reason: "Avoid passive ownership markers. Show leadership, numeric achievements, and quantifiable business scale." },
      { original: "Helped team build features", replacement: "Architected modern modular components with full TypeScript typing", reason: "Strengthen low-agency claims like 'helped' with affirmative developer traits like 'architected' or 'engineered'." }
    ],
    tailoredSummary: `Premium, tech-resilient ${currentTitle} with a documented history of driving user engagement up by 25% and delivering high-quality, ATS-scanned products. Leverages profound systems mastery (TypeScript, React, Cloud Environments) to optimize application delivery, establish unified team protocols, and convert business requirements into optimized, low-latency software assets.`,
    tailoredBulletPoints: tailoredBullets
  };
}

export function getSimulatedCoverLetter(
  resumeData: unknown,
  jobDescription: string,
  companyName?: string,
  jobTitle?: string,
  tone: "professional" | "enthusiastic" | "concise" = "professional"
): {
  salutation: string;
  opening: string;
  bodyParagraphs: string[];
  closing: string;
  signature: string;
  fullText: string;
  tone: "professional" | "enthusiastic" | "concise";
} {
  const isString = typeof resumeData === "string";
  const data = isString ? null : (resumeData as Record<string, unknown>);
  const personalInfo = (data?.personalInfo as Record<string, string>) || {};
  const name = personalInfo.name || "Alex Mercer";
  const currentTitle = jobTitle || personalInfo.title || "Software Engineer";
  const company =
    companyName?.trim() ||
    jobDescription.match(/at\s+([A-Z][A-Za-z0-9\s.&]{2,30})/)?.[1]?.trim() ||
    "your organization";

  const salutation = companyName ? `Dear ${company} Hiring Team,` : "Dear Hiring Manager,";

  const opening =
    tone === "enthusiastic"
      ? `I am excited to apply for the ${currentTitle} role at ${company}. Your team's focus on high-impact engineering aligns perfectly with the measurable outcomes I have delivered throughout my career.`
      : tone === "concise"
      ? `I am applying for the ${currentTitle} position at ${company}. My background maps directly to your core requirements.`
      : `I am writing to express my interest in the ${currentTitle} position at ${company}. With a track record of delivering scalable, user-focused solutions, I am confident I can contribute meaningfully to your team from day one.`;

  const body1 =
    tone === "concise"
      ? `My experience includes building production-grade applications, collaborating with cross-functional stakeholders, and translating business goals into shippable features with measurable impact.`
      : `In my recent roles, I have engineered modern web applications, optimized performance-critical workflows, and partnered with product and design teams to ship features that improve engagement and reliability. The responsibilities outlined in your job description closely mirror the strengths I have demonstrated—particularly in technical execution, ownership, and outcome-driven delivery.`;

  const body2 =
    tone === "enthusiastic"
      ? `What draws me most to ${company} is the opportunity to solve meaningful problems at scale while continuing to grow as a builder. I would love to bring my energy, craftsmanship, and collaborative mindset to your team.`
      : `I am particularly interested in this opportunity because of ${company}'s reputation for thoughtful product development. I would welcome the chance to discuss how my skills can support your immediate roadmap and longer-term engineering goals.`;

  const closing =
    tone === "concise"
      ? `Thank you for your time. I am available for an interview at your convenience.`
      : `Thank you for considering my application. I look forward to the opportunity to discuss how my experience can support ${company}'s objectives, and I am available for an interview at your convenience.`;

  const signature = `Sincerely,\n${name}`;
  const fullText = [salutation, "", opening, "", body1, "", body2, "", closing, "", signature].join(
    "\n"
  );

  return {
    salutation,
    opening,
    bodyParagraphs: [body1, body2],
    closing,
    signature,
    fullText,
    tone,
  };
}

export function getSimulatedInterviewPrep(
  resumeData: unknown,
  jobDescription: string,
  companyName: string,
  jobTitle: string,
  matchAnalysis?: { gaps?: Array<{ area: string; recommendation: string }>; missingKeywords?: string[] }
): Record<string, unknown> {
  const isString = typeof resumeData === "string";
  const data = isString ? null : (resumeData as Record<string, unknown>);
  const personalInfo = (data?.personalInfo as Record<string, string>) || {};
  const name = personalInfo.name || "the candidate";
  const gaps = matchAnalysis?.gaps?.slice(0, 2).map((g) => g.area) || ["System Design", "Metrics"];
  const keywords = matchAnalysis?.missingKeywords?.slice(0, 3) || ["TypeScript", "React", "CI/CD"];

  return {
    jobTitle,
    companyName,
    focusAreas: [
      `Demonstrate ownership in ${jobTitle} responsibilities`,
      `Address gaps around ${gaps.join(" and ")}`,
      `Weave in keywords: ${keywords.join(", ")}`,
    ],
    categories: [
      {
        type: "behavioral",
        label: "Behavioral (STAR)",
        questions: [
          {
            question: `Tell me about a time you delivered impact relevant to this ${jobTitle} role.`,
            tips: "Use STAR: Situation, Task, Action, Result. Quantify the outcome.",
            sampleAnswerOutline: `${name} led a cross-functional initiative, reduced delivery time by 20%, and aligned stakeholders on measurable KPIs.`,
          },
          {
            question: "Describe a challenging technical decision you made under ambiguity.",
            tips: "Show trade-off analysis, not perfection. Mention collaboration.",
            sampleAnswerOutline:
              "Chose architecture X over Y due to latency constraints; documented ADR; validated with A/B metrics.",
          },
        ],
      },
      {
        type: "technical",
        label: "Technical Depth",
        questions: [
          {
            question: `How would you approach a core responsibility listed in the ${companyName} JD?`,
            tips: "Map JD requirements to your stack experience; mention testing and observability.",
            sampleAnswerOutline:
              "Break problem into components → define interfaces → ship iteratively → monitor with dashboards.",
          },
          {
            question: "Walk through debugging a production incident you resolved.",
            tips: "Emphasize calm triage, root cause, prevention.",
            sampleAnswerOutline: "Detected via alerts → isolated regression → hotfix → postmortem → added guardrails.",
          },
        ],
      },
      {
        type: "company",
        label: "Company Fit",
        questions: [
          {
            question: `Why ${companyName} and why this role now?`,
            tips: "Connect company mission/products to your career narrative.",
            sampleAnswerOutline: `Excited by ${companyName}'s product direction; role matches my strength in shipping user-facing systems.`,
          },
        ],
      },
    ],
    preparationChecklist: [
      "Review JD and map each requirement to 1 resume bullet",
      "Prepare 3 STAR stories with metrics",
      "Research company products and recent initiatives",
      `Prepare thoughtful questions for ${companyName} interviewers`,
      "Practice 60-second intro pitch",
      "Prepare talking points for identified skill gaps",
      "Test video/audio setup if remote interview",
    ],
  };
}

export function getSimulatedCompanyResearch(
  jobDescription: string,
  companyName: string,
  jobTitle: string
): Record<string, unknown> {
  const jdLower = jobDescription.toLowerCase();
  const isTech =
    jdLower.includes("engineer") ||
    jdLower.includes("developer") ||
    jdLower.includes("software");
  const products = isTech
    ? ["Core platform product", "Developer tooling", "Customer-facing web applications"]
    : ["Primary service offering", "Enterprise solutions", "Customer success programs"];

  return {
    companyName,
    overview: `${companyName} operates in a competitive market, hiring for ${jobTitle} to scale delivery, improve product quality, and drive measurable business outcomes. Candidates should emphasize alignment with team velocity and customer impact.`,
    mission: "Deliver reliable, user-centric solutions while fostering innovation and cross-functional collaboration.",
    products,
    culture: [
      "Ownership and accountability",
      "Data-informed decision making",
      "Collaborative engineering culture",
      jdLower.includes("remote") ? "Remote-friendly async communication" : "In-office collaboration",
      "Continuous learning mindset",
    ],
    recentNews: [
      "Expanded hiring in core product engineering",
      "Focus on performance, reliability, and AI-assisted workflows",
      "Emphasis on customer retention and product-led growth",
    ],
    interviewTips: [
      `Research ${companyName}'s primary product and who uses it`,
      "Prepare examples showing measurable impact, not just responsibilities",
      "Ask about team structure, on-call expectations, and success metrics for the role",
      "Be ready to discuss trade-offs in recent projects",
      "Show curiosity about roadmap and how this role contributes",
    ],
    talkingPoints: [
      `Excited about ${companyName}'s product direction and user base`,
      `My experience maps to the ${jobTitle} requirements around delivery and quality`,
      "Comfortable collaborating with product, design, and stakeholders",
      "Track record of improving reliability and developer experience",
      "Interested in growing with a team that values ownership",
    ],
  };
}