// Quotes and payments: VAT, payment schedules, Moyasar invoice payloads and client e-mails.
// Pure functions shared by the Worker (functions/api/payments.ts) and the pages. Unit tested.
//
// Money is held in halalas (1 SAR = 100 halalas) as integers, the unit Moyasar uses, so no
// floating point ever touches an amount that is charged.

export type Lang = "en" | "ar";
export type Trigger = "acceptance" | "milestone";
export type MilestoneStatus = "scheduled" | "due" | "paid" | "cancelled";
export type QuoteStatus = "sent" | "change_requested" | "superseded" | "accepted" | "paid" | "cancelled";

export const VAT_BP = 1500; // 15% VAT in basis points
export const MAX_MILESTONES = 6;

export interface PlanRow { label: string; percent: number; trigger: Trigger }
export interface ScheduledMilestone extends PlanRow { seq: number; amount: number }
export interface Schedule { subtotal: number; vat: number; total: number; milestones: ScheduledMilestone[] }

/** "12,500.50" or "12500.5" → 1250050 halalas. Returns NaN for anything that is not a plain amount. */
export function sarToHalalas(input: string | number): number {
  const s = String(input).replace(/[,\s٬]/g, "").replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(s)) return NaN;
  const [whole, frac = ""] = s.split(".");
  return Number(whole) * 100 + Number((frac + "00").slice(0, 2));
}

export function vatOf(subtotal: number, vatBp = VAT_BP) {
  return Math.round((subtotal * vatBp) / 10000);
}

export type PlanError = "amount" | "empty" | "too_many" | "label" | "percent" | "sum" | "acceptance_order";

/** Splits the VAT-inclusive total across the plan. The last row absorbs rounding so the parts add up exactly. */
export function buildSchedule(subtotal: number, plan: PlanRow[], vatBp = VAT_BP): { ok: true; schedule: Schedule } | { ok: false; error: PlanError } {
  if (!Number.isInteger(subtotal) || subtotal < 100) return { ok: false, error: "amount" };
  if (!plan.length) return { ok: false, error: "empty" };
  if (plan.length > MAX_MILESTONES) return { ok: false, error: "too_many" };
  for (const [i, row] of plan.entries()) {
    if (!row.label?.trim() || row.label.length > 120) return { ok: false, error: "label" };
    if (!Number.isFinite(row.percent) || row.percent <= 0 || row.percent > 100) return { ok: false, error: "percent" };
    if (row.trigger === "acceptance" && i > 0) return { ok: false, error: "acceptance_order" };
    if (row.trigger !== "acceptance" && row.trigger !== "milestone") return { ok: false, error: "label" };
  }
  const sum = plan.reduce((n, r) => n + r.percent, 0);
  if (Math.abs(sum - 100) > 0.001) return { ok: false, error: "sum" };
  const vat = vatOf(subtotal, vatBp);
  const total = subtotal + vat;
  let used = 0;
  const milestones = plan.map((row, i) => {
    const amount = i === plan.length - 1 ? total - used : Math.round((total * row.percent) / 100);
    used += amount;
    return { seq: i + 1, label: row.label.trim(), percent: row.percent, trigger: row.trigger, amount };
  });
  return { ok: true, schedule: { subtotal, vat, total, milestones } };
}

export function formatSar(halalas: number, lang: Lang) {
  const n = (halalas / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return lang === "ar" ? `${n} ريال` : `SAR ${n}`;
}

/** Unguessable token for the client's quote link (192 bits, base64url). */
export function newToken(bytes = 24) {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const TOKEN = /^[A-Za-z0-9_-]{24,64}$/;

// Moyasar: amounts in halalas, Basic auth with the secret key as the user name.
export const MOYASAR_API = "https://api.moyasar.com/v1";

export interface MoyasarInvoice { id: string; status: string; amount: number; currency: string; url?: string; payments?: { id: string; status: string; source?: { type?: string } }[] }

export function invoicePayload(input: { amount: number; description: string; callbackUrl: string; successUrl: string; backUrl: string; expiresAt: Date; metadata: Record<string, string> }) {
  return {
    amount: input.amount,
    currency: "SAR",
    description: input.description.slice(0, 255),
    callback_url: input.callbackUrl,
    success_url: input.successUrl,
    back_url: input.backUrl,
    expired_at: input.expiresAt.toISOString(),
    metadata: input.metadata,
  };
}

/** A milestone counts as paid only when Moyasar itself reports the invoice paid, in SAR, for the exact amount. */
export function isPaidInvoice(inv: Pick<MoyasarInvoice, "status" | "amount" | "currency"> | null | undefined, expectedAmount: number) {
  return !!inv && inv.status === "paid" && inv.currency === "SAR" && inv.amount === expectedAmount;
}

/** Invoices that can no longer be paid and need replacing before the client can pay again. */
export const isDeadInvoice = (status: string) => ["expired", "canceled", "voided", "failed"].includes(status);

/** Live keys only where the deployment explicitly allows them (production), never in previews. */
export function keyAllowed(key: string | undefined, allowLive: string | undefined) {
  if (!key) return false;
  if (key.startsWith("sk_test_")) return true;
  return key.startsWith("sk_live_") && allowLive === "true";
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, Record<Lang, string>> = {
  sent: { en: "Awaiting your approval", ar: "بانتظار موافقتك" },
  change_requested: { en: "Revision requested", ar: "طلبتَ مراجعة العرض" },
  superseded: { en: "Replaced by a revised proposal", ar: "استُبدل بعرض محدّث" },
  accepted: { en: "Approved", ar: "تمت الموافقة" },
  paid: { en: "Paid in full", ar: "مدفوع بالكامل" },
  cancelled: { en: "Cancelled", ar: "ملغى" },
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, Record<Lang, string>> = {
  scheduled: { en: "Scheduled", ar: "مجدولة" },
  due: { en: "Due now", ar: "مستحقة الآن" },
  paid: { en: "Paid", ar: "مدفوعة" },
  cancelled: { en: "Cancelled", ar: "ملغاة" },
};

export const TRIGGER_LABELS: Record<Trigger, Record<Lang, string>> = {
  acceptance: { en: "On approval", ar: "عند الموافقة" },
  milestone: { en: "When the stage is complete", ar: "عند إنجاز المرحلة" },
};

export const quoteUrl = (origin: string, lang: Lang, token: string) => `${origin}${lang === "ar" ? "/ar" : ""}/quote/?t=${encodeURIComponent(token)}`;

const SIGN_AR = "سيلورين للاستشارات والخدمات البيئية\nsales@selorin.co · +966 55 015 6887";
const SIGN_EN = "Selorin Environmental Advisory & Services\nsales@selorin.co · +966 55 015 6887";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Minimal branded HTML with one call-to-action button; the text version carries the same content. */
export function mailHtml(lang: Lang, paragraphs: string[], cta: { label: string; url: string }) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;font:15px/1.7 Arial,sans-serif;color:#121614">${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  return `<!doctype html><html lang="${lang}" dir="${dir}"><body style="margin:0;background:#f7f6f2;padding:24px">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e3e0d8;border-radius:12px" dir="${dir}"><tr><td style="padding:28px">
  <p style="margin:0 0 18px;font:600 20px Arial,sans-serif;color:#0b3b2a">Selorin</p>${body}
  <p style="margin:22px 0"><a href="${esc(cta.url)}" style="display:inline-block;background:#0b3b2a;color:#fff;text-decoration:none;font:600 15px Arial,sans-serif;padding:13px 22px;border-radius:8px">${esc(cta.label)}</a></p>
  <p style="margin:0;font:12px/1.6 Arial,sans-serif;color:#5d625f">${esc(lang === "ar" ? SIGN_AR : SIGN_EN).replace(/\n/g, "<br>")}</p>
  </td></tr></table></body></html>`;
}

export interface MailInput { lang: Lang; name: string; leadId: string; title: string; url: string }

export function quoteEmail(i: MailInput & { total: number; milestones: { label: string; amount: number; trigger: Trigger }[]; validUntil: string; files: string[]; negotiable?: boolean; revised?: boolean }) {
  const lines = i.milestones.map((m, n) => `${n + 1}. ${m.label}: ${formatSar(m.amount, i.lang)} (${TRIGGER_LABELS[m.trigger][i.lang]})`).join("\n");
  const first = i.milestones[0];
  const negotiable = i.negotiable !== false;
  if (i.lang === "ar") {
    const p = [
      `مرحباً ${i.name}،`,
      i.revised
        ? `نرسل لك العرض الفني والمالي المحدّث لطلبك رقم ${i.leadId}: ${i.title}، بعد مراجعة طلبك.${i.files.length ? ` تجد المستندات مرفقة بهذه الرسالة (${i.files.join("، ")}).` : ""}`
        : `يسعدنا أن نرسل لك العرض الفني والمالي لطلبك رقم ${i.leadId}: ${i.title}.${i.files.length ? ` تجد المستندات مرفقة بهذه الرسالة (${i.files.join("، ")}).` : ""}`,
      `الإجمالي شامل ضريبة القيمة المضافة: ${formatSar(i.total, "ar")}\nجدول الدفعات:\n${lines}`,
      first.trigger === "acceptance"
        ? `للموافقة على العرض وسداد الدفعة الأولى (${formatSar(first.amount, "ar")}) بمدى أو Apple Pay أو البطاقة الائتمانية، اضغط الزر أدناه. العرض ساري حتى ${i.validUntil}.`
        : `للموافقة على العرض اضغط الزر أدناه. العرض ساري حتى ${i.validUntil}، وتصلك رسالة بكل دفعة عند استحقاقها.`,
      negotiable
        ? "إن احتجت خصماً أو تقسيماً للدفعات يناسبكم، يمكنك طلب ذلك مرة واحدة من صفحة العرض، ونرسل لك بعدها عرضاً محدّثاً نهائياً."
        : "هذا العرض نهائي، والخيار المتاح عليه هو الموافقة والدفع.",
    ];
    return { subject: `${i.revised ? "العرض المحدّث" : "العرض الفني والمالي"} لطلبك ${i.leadId}`, text: `${p.join("\n\n")}\n\n${i.url}\n\n${SIGN_AR}`, html: mailHtml("ar", p, { label: first.trigger === "acceptance" ? "الموافقة والدفع" : "مراجعة العرض والموافقة", url: i.url }) };
  }
  const p = [
    `Dear ${i.name},`,
    i.revised
      ? `Following your request, please find our revised technical and financial proposal for request ${i.leadId}: ${i.title}.${i.files.length ? ` The documents are attached to this e-mail (${i.files.join(", ")}).` : ""}`
      : `Please find our technical and financial proposal for your request ${i.leadId}: ${i.title}.${i.files.length ? ` The documents are attached to this e-mail (${i.files.join(", ")}).` : ""}`,
    `Total including VAT: ${formatSar(i.total, "en")}\nPayment schedule:\n${lines}`,
    first.trigger === "acceptance"
      ? `To approve the proposal and pay the first instalment (${formatSar(first.amount, "en")}) by mada, Apple Pay or credit card, use the button below. The proposal is valid until ${i.validUntil}.`
      : `To approve the proposal, use the button below. It is valid until ${i.validUntil}, and you will receive an e-mail for each payment when it falls due.`,
    negotiable
      ? "If you need a discount or a payment schedule that suits you better, you can ask once from the proposal page, and we will send you a final revised proposal."
      : "This proposal is final: the option available is to approve and pay.",
  ];
  return { subject: `${i.revised ? "Revised proposal" : "Proposal"} for your request ${i.leadId}`, text: `${p.join("\n\n")}\n\n${i.url}\n\n${SIGN_EN}`, html: mailHtml("en", p, { label: first.trigger === "acceptance" ? "Approve and pay" : "Review and approve", url: i.url }) };
}

export interface ChangeRequest { discount: boolean; schedule: boolean; note: string }

/** The client's one revision request: a discount, a different schedule, or both, with a short note. */
export function parseChangeRequest(body: unknown): { ok: true; request: ChangeRequest } | { ok: false; error: "empty" | "note" } {
  const b = (body ?? {}) as Record<string, unknown>;
  const discount = b.discount === true;
  const schedule = b.schedule === true;
  const note = String(b.note ?? "").replace(/\s+\n/g, "\n").trim();
  if (!discount && !schedule) return { ok: false, error: "empty" };
  if (note.length > 1000) return { ok: false, error: "note" };
  return { ok: true, request: { discount, schedule, note } };
}

export function dueEmail(i: MailInput & { label: string; amount: number; reminder?: boolean }) {
  if (i.lang === "ar") {
    const p = [
      `مرحباً ${i.name}،`,
      i.reminder
        ? `نذكّرك بأن دفعة «${i.label}» على طلبك رقم ${i.leadId} (${i.title}) ما زالت مستحقة.`
        : `أنجزنا مرحلة «${i.label}» في طلبك رقم ${i.leadId} (${i.title})، وأصبحت دفعتها مستحقة.`,
      `المبلغ شامل ضريبة القيمة المضافة: ${formatSar(i.amount, "ar")}. يمكنك السداد بمدى أو Apple Pay أو البطاقة الائتمانية من الزر أدناه.`,
    ];
    return { subject: `${i.reminder ? "تذكير: " : ""}دفعة مستحقة على طلبك ${i.leadId}`, text: `${p.join("\n\n")}\n\n${i.url}\n\n${SIGN_AR}`, html: mailHtml("ar", p, { label: "سداد الدفعة", url: i.url }) };
  }
  const p = [
    `Dear ${i.name},`,
    i.reminder
      ? `This is a reminder that the "${i.label}" payment on your request ${i.leadId} (${i.title}) is still due.`
      : `We have completed the "${i.label}" stage of your request ${i.leadId} (${i.title}), and its payment is now due.`,
    `Amount including VAT: ${formatSar(i.amount, "en")}. You can pay by mada, Apple Pay or credit card using the button below.`,
  ];
  return { subject: `${i.reminder ? "Reminder: " : ""}Payment due on your request ${i.leadId}`, text: `${p.join("\n\n")}\n\n${i.url}\n\n${SIGN_EN}`, html: mailHtml("en", p, { label: "Pay now", url: i.url }) };
}

export function receiptEmail(i: MailInput & { label: string; amount: number; paymentId: string; remaining: number }) {
  if (i.lang === "ar") {
    const p = [
      `مرحباً ${i.name}،`,
      `استلمنا دفعتك «${i.label}» بمبلغ ${formatSar(i.amount, "ar")} على طلبك رقم ${i.leadId}. شكراً لك.`,
      `مرجع العملية: ${i.paymentId}${i.remaining > 0 ? `\nالمتبقي من قيمة العرض: ${formatSar(i.remaining, "ar")}` : "\nتم سداد قيمة العرض بالكامل."}`,
      "تصلك الفاتورة الضريبية من فريقنا.",
    ];
    return { subject: `تم استلام دفعتك على طلبك ${i.leadId}`, text: `${p.join("\n\n")}\n\n${i.url}\n\n${SIGN_AR}`, html: mailHtml("ar", p, { label: "عرض تفاصيل العرض والدفعات", url: i.url }) };
  }
  const p = [
    `Dear ${i.name},`,
    `We have received your "${i.label}" payment of ${formatSar(i.amount, "en")} for request ${i.leadId}. Thank you.`,
    `Payment reference: ${i.paymentId}${i.remaining > 0 ? `\nRemaining on the proposal: ${formatSar(i.remaining, "en")}` : "\nThe proposal is now paid in full."}`,
    "Our team will send you the tax invoice.",
  ];
  return { subject: `Payment received for your request ${i.leadId}`, text: `${p.join("\n\n")}\n\n${i.url}\n\n${SIGN_EN}`, html: mailHtml("en", p, { label: "View proposal and payments", url: i.url }) };
}

/** Short note to the sales inbox when a client approves or pays. */
export function staffEmail(event: "accepted" | "paid" | "change", i: { leadId: string; quoteId: string; company: string; title: string; label?: string; amount?: number; paymentId?: string; change?: ChangeRequest; adminUrl?: string }) {
  if (event === "change") {
    const what = [i.change?.discount ? "discount" : "", i.change?.schedule ? "payment schedule" : ""].filter(Boolean).join(" and ");
    return {
      subject: `[Proposal revision requested] ${i.leadId} | ${what}`,
      text: `The client asked to revise quote ${i.quoteId} for ${i.leadId} (${i.title}): ${what}.\n\nClient note:\n${i.change?.note || "(none)"}\n\nThis was their one revision. Send the revised proposal from ${i.adminUrl ?? "/ar/admin/quotes/"}; it will be final, with approve and pay as the only option.`,
    };
  }
  if (event === "accepted") {
    return { subject: `[Quote approved] ${i.leadId} | ${i.company || i.title}`, text: `The client approved quote ${i.quoteId} for ${i.leadId} (${i.title}).` };
  }
  return {
    subject: `[Payment received] ${i.leadId} | ${formatSar(i.amount ?? 0, "en")}`,
    text: `Payment for "${i.label}" on quote ${i.quoteId} (${i.leadId}, ${i.title}): ${formatSar(i.amount ?? 0, "en")}.\nMoyasar payment: ${i.paymentId || "manual"}\nIssue the tax invoice from the accounting system.`,
  };
}
