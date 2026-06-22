/** Extract job title and company hints from pasted job description text. */
export function extractJobMeta(jobDescription: string): {
  jobTitle: string;
  companyName: string;
} {
  const jd = jobDescription.trim();
  if (!jd) {
    return { jobTitle: "", companyName: "" };
  }

  const titlePatterns = [
    /(?:job title|position|role|職務名稱|職缺名稱|職稱|工作內容)\s*[：:\-]\s*([^\n]{2,80})/i,
    /^([A-Z\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff\s/&\-().]{2,60})\s*(?:\(|（|–|—|-|\|)/m,
    /(?:hiring|seeking|looking for|誠徵|招募)\s*(?:a\s+)?([A-Za-z0-9\u4e00-\u9fff\s/&\-().]{2,60})/i,
    /【([^】\n]{2,40})】/,
  ];

  let jobTitle = "";
  for (const pattern of titlePatterns) {
    const match = jd.match(pattern);
    if (match?.[1]?.trim()) {
      jobTitle = match[1].trim().replace(/\s{2,}/g, " ");
      break;
    }
  }

  const companyPatterns = [
    /(?:company|employer|organization|公司名稱|雇主|企業)\s*[：:\-]\s*([^\n]{2,60})/i,
    /(?:at|@|於)\s+([A-Z\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff\s.&]{2,40})(?:\s|,|\.|\n|，)/,
    /^([A-Z\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff\s.&]{2,40})\s+(?:is\s+(?:hiring|seeking|looking)|誠徵|招募)/m,
  ];

  let companyName = "";
  for (const pattern of companyPatterns) {
    const match = jd.match(pattern);
    if (match?.[1]?.trim()) {
      companyName = match[1].trim().replace(/\s{2,}/g, " ");
      break;
    }
  }

  return { jobTitle, companyName };
}
