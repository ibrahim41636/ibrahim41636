// Lead record + sales email formatting. Pure functions (no I/O) so they are unit-testable
// and reusable by any delivery adapter (email, CRM webhook, WhatsApp automation).
import { SERVICES, displayValue, type Field, type FormKind, type Values } from "./forms";

export interface Lead {
  leadId: string;
  kind: FormKind;
  submittedAt: string; // ISO 8601 UTC
  date: string; // YYYY-MM-DD (Asia/Riyadh)
  time: string; // HH:mm (Asia/Riyadh)
  lang: "en" | "ar";
  urgent: boolean;
  service: { slug: string; name: string };
  industry: string;
  company: string;
  contactName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  preferredContact: string;
  message: string;
  details: { field: string; label: string; value: string }[];
  sourcePage: string;
  referrer: string;
  utm: { source: string; medium: string; campaign: string; term: string; content: string };
  attachments: { name: string; size: number; type: string }[];
}

const str = (v: Values[string] | undefined) => (Array.isArray(v) ? v.join(", ") : (v ?? "")).trim();

/** Remove control characters (incl. CR/LF, which would allow header injection in subjects). */
export const clean = (s: string, max = 4000) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, max);
const oneLine = (s: string, max = 200) => clean(s, max).replace(/[\r\n\t]+/g, " ").trim();

export function formatLeadId(year: number, seq: number) {
  return `SEL-${year}-${String(seq).padStart(6, "0")}`;
}

function riyadhParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${g("year")}-${g("month")}-${g("day")}`, time: `${g("hour")}:${g("minute")}` };
}

const CORE = new Set(["service", "industry", "location", "description", "message", "company", "contactName", "jobTitle", "email", "phone", "preferredContact"]);

export function buildLead(args: {
  leadId: string; kind: FormKind; values: Values; fields: Field[]; now: Date;
  attachments: Lead["attachments"];
}): Lead {
  const { values, fields } = args;
  const field = (n: string) => fields.find((f) => f.name === n);
  const slug = str(values.service);
  const label = (n: string) => (field(n) ? displayValue(field(n)!, values[n]) : str(values[n]) || "—");
  const { date, time } = riyadhParts(args.now);
  return {
    leadId: args.leadId,
    kind: args.kind,
    submittedAt: args.now.toISOString(),
    date, time,
    lang: values.lang === "ar" ? "ar" : "en",
    urgent: values.urgent === "yes",
    service: { slug: slug || "unspecified", name: SERVICES[slug]?.en ?? (slug === "other" ? "Other / not sure" : "General inquiry") },
    industry: field("industry") ? label("industry") : "—",
    company: oneLine(str(values.company)),
    contactName: oneLine(str(values.contactName)),
    jobTitle: oneLine(str(values.jobTitle)),
    email: oneLine(str(values.email)),
    phone: oneLine(str(values.phone), 30),
    location: oneLine(str(values.location)),
    preferredContact: field("preferredContact") ? label("preferredContact") : "—",
    message: clean(str(values.description) || str(values.message)),
    details: fields
      .filter((f) => !CORE.has(f.name) && str(values[f.name]))
      .map((f) => ({ field: f.name, label: f.label.en, value: displayValue(f, values[f.name]) })),
    sourcePage: oneLine(str(values.sourcePage), 300),
    referrer: oneLine(str(values.referrer), 300),
    utm: {
      source: oneLine(str(values.utm_source), 120), medium: oneLine(str(values.utm_medium), 120),
      campaign: oneLine(str(values.utm_campaign), 120), term: oneLine(str(values.utm_term), 120), content: oneLine(str(values.utm_content), 120),
    },
    attachments: args.attachments,
  };
}

export function emailSubject(lead: Lead) {
  const tag = lead.kind === "contact" ? "New Inquiry" : "New Service Request";
  const prefix = lead.urgent ? "[URGENT] " : "";
  return oneLine(`${prefix}[${tag}] – ${lead.service.name} – ${lead.company || lead.contactName}`, 180);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function sections(lead: Lead): [string, [string, string][]][] {
  return [
    ["Service Requested", [["Service", lead.service.name], ["Request ID", lead.leadId], ["Priority", lead.urgent ? "URGENT — regulatory notice or inspection date" : "Standard"]]],
    ["Client", [["Company Name", lead.company], ["Contact Person", lead.contactName], ["Job Title", lead.jobTitle || "—"], ["Email", lead.email], ["Phone", lead.phone], ["Preferred Contact", lead.preferredContact]]],
    ["Project", [["Industry", lead.industry], ["Location", lead.location || "—"], ...lead.details.map((d) => [d.label, d.value] as [string, string])]],
    ["Project Details", [["Description", lead.message || "—"]]],
    ["Additional Information", [
      ["Attachments", lead.attachments.length ? lead.attachments.map((a) => `${a.name} (${Math.ceil(a.size / 1024)} KB)`).join(", ") : "None"],
      ["Language", lead.lang === "ar" ? "Arabic" : "English"],
    ]],
    ["Source", [
      ["Submission Date", `${lead.date} ${lead.time} (Riyadh)`], ["Source Page", lead.sourcePage || "—"], ["Referrer", lead.referrer || "—"],
      ["UTM Source", lead.utm.source || "—"], ["UTM Medium", lead.utm.medium || "—"], ["UTM Campaign", lead.utm.campaign || "—"],
    ]],
  ];
}

export function emailText(lead: Lead) {
  return sections(lead)
    .map(([title, rows]) => `${title.toUpperCase()}\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}`)
    .join("\n\n");
}

export function emailHtml(lead: Lead) {
  const block = ([title, rows]: [string, [string, string][]]) => `
    <tr><td colspan="2" style="padding:22px 0 8px;font:600 12px/1.4 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#0B3B2A;border-bottom:1px solid #E3E0D8">${esc(title)}</td></tr>
    ${rows.map(([k, v]) => `<tr><td style="padding:8px 16px 8px 0;width:190px;vertical-align:top;font:13px/1.5 Arial,sans-serif;color:#6B6F6C">${esc(k)}</td><td style="padding:8px 0;font:14px/1.6 Arial,sans-serif;color:#121614;white-space:pre-wrap">${esc(v)}</td></tr>`).join("")}`;
  return `<!doctype html><html><body style="margin:0;background:#F7F6F2;padding:24px">
  <table role="presentation" width="100%" style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #E3E0D8;border-radius:8px;padding:28px 32px">
    <tr><td colspan="2" style="font:600 20px/1.3 Arial,sans-serif;color:#121614;padding-bottom:4px">${esc(emailSubject(lead))}</td></tr>
    <tr><td colspan="2" style="font:13px/1.5 Arial,sans-serif;color:#6B6F6C">Reply directly to this email to respond to ${esc(lead.contactName)}.</td></tr>
    ${sections(lead).map(block).join("")}
  </table></body></html>`;
}

/** Short confirmation sent to the client (no internal data, no attachments). */
export function confirmationEmail(lead: Lead) {
  const ar = lead.lang === "ar";
  const subject = ar ? `استلمنا طلبك — ${lead.leadId}` : `We have received your request — ${lead.leadId}`;
  const text = ar
    ? `مرحباً ${lead.contactName}،\n\nشكراً لتواصلك مع سيلورين. استلمنا طلبك بخصوص «${lead.service.name}»، وسيراجع فريقنا متطلباتك ويتواصل معك قريباً.\n\nرقم الطلب: ${lead.leadId}\n\nسيلورين للاستشارات والخدمات البيئية\nsales@selorin.co · +966 53 430 2332`
    : `Dear ${lead.contactName},\n\nThank you for contacting Selorin. We have received your request regarding "${lead.service.name}". Our team will review your requirements and contact you shortly.\n\nRequest ID: ${lead.leadId}\n\nSelorin Environmental Advisory & Services\nsales@selorin.co · +966 53 430 2332`;
  return { subject, text };
}
