/**
 * WhatsApp deep-link helpers for HK follow-up workflows (no API key required).
 */

export function defaultFollowUpMessage(companyName: string, jobTitle: string): string {
  return (
    `Hi, I hope this message finds you well. ` +
    `I am following up on my application for the ${jobTitle} role at ${companyName}. ` +
    `Please let me know if you need any further information. Thank you for your time.`
  );
}

export function buildWhatsAppFollowUpUrl(params: {
  companyName: string;
  jobTitle: string;
  phoneE164?: string;
  message?: string;
}): string {
  const text = params.message ?? defaultFollowUpMessage(params.companyName, params.jobTitle);
  const encoded = encodeURIComponent(text);
  if (params.phoneE164) {
    const digits = params.phoneE164.replace(/\D/g, "");
    return `https://wa.me/${digits}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}
