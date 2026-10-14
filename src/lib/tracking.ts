// Request tracking: the statuses a request moves through, their labels, and the client e-mail
// sent when the team updates a status. Shared by the API (functions/api) and the track/admin pages.

export const STATUSES = ["received", "reviewing", "quoted", "in_progress", "completed", "closed"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, { en: string; ar: string }> = {
  received: { en: "Received", ar: "تم الاستلام" },
  reviewing: { en: "Under review", ar: "قيد المراجعة" },
  quoted: { en: "Proposal sent", ar: "تم إرسال العرض" },
  in_progress: { en: "In progress", ar: "قيد التنفيذ" },
  completed: { en: "Completed", ar: "مكتمل" },
  closed: { en: "Closed", ar: "مغلق" },
};

export const isStatus = (v: unknown): v is Status => typeof v === "string" && (STATUSES as readonly string[]).includes(v);

export const LEAD_ID = /^SEL-\d{4}-\d{6}$/;

export const normalizeEmail = (v: string) => v.trim().toLowerCase();

/** Constant-time string comparison (for the admin token). */
export function safeEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function statusEmail(input: { lang: "en" | "ar"; name: string; leadId: string; status: Status; note?: string; trackUrl: string }) {
  const { lang, name, leadId, status, note, trackUrl } = input;
  const label = STATUS_LABELS[status][lang];
  if (lang === "ar") {
    return {
      subject: `تحديث على طلبك ${leadId}: ${label}`,
      text: `مرحباً ${name}،\n\nتم تحديث حالة طلبك رقم ${leadId} إلى: ${label}.${note ? `\n\n${note}` : ""}\n\nتابع طلبك: ${trackUrl}\n\nسيلورين للاستشارات والخدمات البيئية\nsales@selorin.co · +966 55 015 6887`,
    };
  }
  return {
    subject: `Update on your request ${leadId}: ${label}`,
    text: `Dear ${name},\n\nThe status of your request ${leadId} is now: ${label}.${note ? `\n\n${note}` : ""}\n\nTrack your request: ${trackUrl}\n\nSelorin Environmental Advisory & Services\nsales@selorin.co · +966 55 015 6887`,
  };
}
